<?php
require_once __DIR__ . '/../config/Database.php';

class Notification {
    private $db;
    private $table = 'notifications';
    private $readTable = 'notification_reads';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function publishDueNotifications() {
        $sql = "UPDATE {$this->table}
                SET status = 'SENT',
                    is_active = 1,
                    sent_at = NOW()
                WHERE status = 'SCHEDULED'
                  AND scheduled_at IS NOT NULL
                  AND scheduled_at <= NOW()";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->rowCount();
    }

    private function getAudienceForRoleId($roleId) {
        $roleId = (int)$roleId;
        if ($roleId === 5) {
            return 'ADMIN';
        }
        if ($roleId === 3 || $roleId === 4) {
            return 'STAFF';
        }
        return 'USER';
    }

    private function countRecipientsByAudience($audience) {
        $audience = strtoupper((string)$audience);
        if ($audience === 'GUEST') {
            // Public notification: guest + logged-in users.
            $audience = 'ALL';
        }

        $where = ["status = 'Active'"];
        if ($audience === 'USER') {
            $where[] = 'role_id = 2';
        } elseif ($audience === 'STAFF') {
            $where[] = 'role_id IN (3,4)';
        } elseif ($audience === 'ADMIN') {
            $where[] = 'role_id = 5';
        }

        $sql = 'SELECT COUNT(*) AS total FROM users WHERE ' . implode(' AND ', $where);
        $stmt = $this->db->query($sql);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($row['total'] ?? 0);
    }

    private function countReadsByNotification($notificationId, $audience) {
        $audience = strtoupper((string)$audience);
        if ($audience === 'GUEST') {
            // Public notification: count reads from all active users.
            $audience = 'ALL';
        }

        $whereRole = '';
        if ($audience === 'USER') {
            $whereRole = ' AND u.role_id = 2';
        } elseif ($audience === 'STAFF') {
            $whereRole = ' AND u.role_id IN (3,4)';
        } elseif ($audience === 'ADMIN') {
            $whereRole = ' AND u.role_id = 5';
        }

        $sql = "SELECT COUNT(*) AS total
                FROM {$this->readTable} nr
                INNER JOIN users u ON u.id = nr.user_id
                WHERE nr.notification_id = :notification_id
                  AND u.status = 'Active'" . $whereRole;

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':notification_id' => (int)$notificationId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($row['total'] ?? 0);
    }

    public function getUserNotifications($userId, $roleId, $limit = 30) {
        $this->publishDueNotifications();

        $audience = $this->getAudienceForRoleId($roleId);
        $sql = "SELECT n.id, n.title, n.message, n.type, n.target_audience,
                   n.status, n.scheduled_at, n.sent_at,
                       CASE WHEN nr.id IS NULL THEN 0 ELSE 1 END AS is_read,
                       n.created_at
                FROM {$this->table} n
                LEFT JOIN {$this->readTable} nr
                    ON nr.notification_id = n.id
                   AND nr.user_id = :user_id
                WHERE n.is_active = 1
              AND n.status = 'SENT'
              AND n.target_audience IN ('ALL', 'GUEST', :audience)
                ORDER BY n.created_at DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':user_id', (int)$userId, PDO::PARAM_INT);
        $stmt->bindValue(':audience', $audience, PDO::PARAM_STR);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPublicNotifications($limit = 20) {
        $this->publishDueNotifications();

        $sql = "SELECT n.id, n.title, n.message, n.type, n.target_audience,
                       n.status, n.scheduled_at, n.sent_at,
                       0 AS is_read,
                       n.created_at
                FROM {$this->table} n
                WHERE n.is_active = 1
                  AND n.status = 'SENT'
                  AND n.target_audience IN ('ALL', 'GUEST')
                ORDER BY n.created_at DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function markAsRead($id, $userId) {
        $sql = "INSERT INTO {$this->readTable} (notification_id, user_id, is_read, read_at)
                VALUES (:notification_id, :user_id, 1, NOW())
                ON DUPLICATE KEY UPDATE is_read = 1, read_at = NOW()";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':notification_id' => (int)$id,
            ':user_id' => (int)$userId,
        ]);
    }

    public function listCampaigns($search = '', $type = 'all') {
        $this->publishDueNotifications();

        $where = [];
        $params = [];

        if ($search !== '') {
            $where[] = '(title LIKE :search_title OR message LIKE :search_message)';
            $params[':search_title'] = '%' . $search . '%';
            $params[':search_message'] = '%' . $search . '%';
        }

        if ($type !== '' && $type !== 'all') {
            $where[] = 'type = :type';
            $params[':type'] = strtoupper($type);
        }

        $whereSql = empty($where) ? '' : ('WHERE ' . implode(' AND ', $where));

        $sql = "SELECT id, title, message, COALESCE(type, 'SYSTEM') AS type,
               target_audience, status, scheduled_at, sent_at, created_at
            FROM {$this->table}
            {$whereSql}
            ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $result = [];
        foreach ($rows as $row) {
            $recipientCount = $this->countRecipientsByAudience($row['target_audience']);
            $readCount = $this->countReadsByNotification($row['id'], $row['target_audience']);
            $row['recipient_count'] = $recipientCount;
            $row['read_count'] = $readCount;
            $result[] = $row;
        }

        return $result;
    }

    public function createCampaign($title, $message, $type, $targetAudience, $createdBy = null, $scheduledAt = null) {
        $scheduledAt = $scheduledAt ? trim((string)$scheduledAt) : null;
        $isScheduled = !empty($scheduledAt);
        $status = $isScheduled ? 'SCHEDULED' : 'SENT';

        $sql = "INSERT INTO {$this->table}
                    (title, message, type, target_audience, status, scheduled_at, sent_at, created_by, is_active)
                VALUES
                    (:title, :message, :type, :target_audience, :status, :scheduled_at, :sent_at, :created_by, :is_active)";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':title', $title, PDO::PARAM_STR);
        $stmt->bindValue(':message', $message, PDO::PARAM_STR);
        $stmt->bindValue(':type', strtoupper((string)$type ?: 'SYSTEM'), PDO::PARAM_STR);
        $stmt->bindValue(':target_audience', strtoupper((string)$targetAudience ?: 'ALL'), PDO::PARAM_STR);
        $stmt->bindValue(':status', $status, PDO::PARAM_STR);
        if ($scheduledAt === null) {
            $stmt->bindValue(':scheduled_at', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':scheduled_at', $scheduledAt, PDO::PARAM_STR);
        }
        if ($isScheduled) {
            $stmt->bindValue(':sent_at', null, PDO::PARAM_NULL);
            $stmt->bindValue(':is_active', 0, PDO::PARAM_INT);
        } else {
            $stmt->bindValue(':sent_at', date('Y-m-d H:i:s'), PDO::PARAM_STR);
            $stmt->bindValue(':is_active', 1, PDO::PARAM_INT);
        }
        if ($createdBy === null) {
            $stmt->bindValue(':created_by', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':created_by', (int)$createdBy, PDO::PARAM_INT);
        }

        $stmt->execute();

        $id = (int)$this->db->lastInsertId();
        return [
            'id' => $id,
            'recipient_count' => $this->countRecipientsByAudience(strtoupper((string)$targetAudience ?: 'ALL')),
            'status' => $status,
        ];
    }

    public function deleteCampaignBySeedId($seedId) {
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => (int)$seedId]);
        return $stmt->rowCount();
    }
}
