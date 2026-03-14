<?php
require_once __DIR__ . '/../config/Database.php';

class UserVoucher {
    private $db;
    private $table = 'user_vouchers';

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
            $query = "SELECT uv.*, p.* FROM {$this->table} uv LEFT JOIN promotions p ON uv.promotion_id = p.id WHERE uv.user_id = :user_id";
            if ($status) {
                $query .= " AND uv.status = :status";
            }
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
