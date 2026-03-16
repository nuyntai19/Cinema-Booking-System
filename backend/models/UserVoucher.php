<?php
require_once __DIR__ . '/../config/Database.php';

class UserVoucher {
    private $db;
    private $table = 'user_vouchers';
    private $hasMaxDiscountColumn = null;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function assignToUser($userId, $promotionId, $code = null) {
        try {
            $query = "INSERT INTO {$this->table} (user_id, promotion_id, code) VALUES (:user_id, :promotion_id, :code)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':promotion_id', $promotionId, PDO::PARAM_INT);
            $stmt->bindParam(':code', $code);
            if ($stmt->execute()) return $this->db->lastInsertId();
            return false;
        } catch (PDOException $e) {
            error_log('UserVoucher AssignToUser Error: '.$e->getMessage());
            return false;
        }
    }

    public function getByUser($userId, $status = 'ACTIVE') {
        try {
            $maxDiscountSelect = $this->hasPromotionColumn('max_discount') ? ', p.max_discount' : '';
            $query = "SELECT uv.id, uv.user_id, uv.promotion_id, uv.code as voucher_code, uv.status, uv.assigned_at, uv.used_at,
                p.code as promo_code, p.description, p.discount_amount, p.discount_type,
                p.min_order_value{$maxDiscountSelect}, p.start_date, p.end_date, p.is_auto_apply, p.usage_limit,
                (SELECT COUNT(*) FROM user_vouchers WHERE promotion_id = p.id AND status = 'USED') as used_count
                FROM {$this->table} uv
                LEFT JOIN promotions p ON uv.promotion_id = p.id
                WHERE uv.user_id = :user_id";
            if ($status) {
                $query .= " AND uv.status = :status";
                // Only filter by date validity when explicitly fetching ACTIVE vouchers
                if ($status === 'ACTIVE') {
                    $query .= " AND CURDATE() BETWEEN p.start_date AND p.end_date";
                }
            }
            $query .= " ORDER BY uv.assigned_at DESC";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            if ($status) $stmt->bindParam(':status', $status);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('UserVoucher GetByUser Error: '.$e->getMessage());
            return [];
        }
    }

    private function hasPromotionColumn($columnName) {
        if ($columnName === 'max_discount' && $this->hasMaxDiscountColumn !== null) {
            return $this->hasMaxDiscountColumn;
        }

        try {
            $stmt = $this->db->prepare("SHOW COLUMNS FROM promotions LIKE :column_name");
            $stmt->execute([':column_name' => $columnName]);
            $exists = (bool)$stmt->fetch(PDO::FETCH_ASSOC);

            if ($columnName === 'max_discount') {
                $this->hasMaxDiscountColumn = $exists;
            }

            return $exists;
        } catch (Exception $e) {
            if ($columnName === 'max_discount') {
                $this->hasMaxDiscountColumn = false;
            }
            return false;
        }
    }

    public function markAsUsed($id) {
        try {
            $query = "UPDATE {$this->table} SET status = 'USED', used_at = NOW() WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('UserVoucher MarkAsUsed Error: '.$e->getMessage());
            return false;
        }
    }

    public function checkExpired() {
        try {
            $query = "UPDATE {$this->table} uv JOIN promotions p ON uv.promotion_id = p.id SET uv.status = 'EXPIRED' WHERE uv.status = 'ACTIVE' AND p.end_date < CURDATE()";
            $stmt = $this->db->prepare($query);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('UserVoucher CheckExpired Error: '.$e->getMessage());
            return false;
        }
    }

    public function checkBirthdayUsers() {
        try {
            $query = "SELECT u.id, up.full_name, up.dob FROM users u JOIN user_profiles up ON u.id = up.user_id WHERE MONTH(up.dob) = MONTH(CURDATE()) AND DAY(up.dob) = DAY(CURDATE()) AND u.status = 'Active'";
            $stmt = $this->db->query($query);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('UserVoucher CheckBirthdayUsers Error: '.$e->getMessage());
            return [];
        }
    }
}
