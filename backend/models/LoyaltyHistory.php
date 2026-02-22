<?php
require_once __DIR__ . '/../config/Database.php';

class LoyaltyHistory {
    private $db;
    private $table = 'loyalty_history';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create($userId, $points, $type = 'PURCHASE', $description = null, $relatedBookingId = null) {
        try {
            $query = "INSERT INTO {$this->table} (user_id, points_change, type, description, related_booking_id) VALUES (:user_id, :points, :type, :description, :related_booking_id)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':points', $points, PDO::PARAM_INT);
            $stmt->bindParam(':type', $type);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':related_booking_id', $relatedBookingId);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('LoyaltyHistory Create Error: '.$e->getMessage());
            return false;
        }
    }

    public function getByUser($userId, $limit = 100) {
        try {
            $query = "SELECT * FROM {$this->table} WHERE user_id = :user_id ORDER BY created_at DESC LIMIT :limit";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('LoyaltyHistory GetByUser Error: '.$e->getMessage());
            return [];
        }
    }

    public static function calculatePoints($amount) {
        // amount / 10000 = 1 point (round down)
        return (int)floor($amount / 10000);
    }

    public function getTotalPoints($userId) {
        try {
            $query = "SELECT COALESCE(SUM(points_change), 0) as total FROM {$this->table} WHERE user_id = :user_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            $res = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)$res['total'];
        } catch (PDOException $e) {
            error_log('LoyaltyHistory GetTotalPoints Error: '.$e->getMessage());
            return 0;
        }
    }
}
