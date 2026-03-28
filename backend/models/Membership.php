<?php
require_once __DIR__ . '/../config/Database.php';

class Membership {
    private $db;
    private $table = 'memberships';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll() {
        try {
            $query = "SELECT * FROM {$this->table} ORDER BY min_points_required ASC";
            $stmt = $this->db->query($query);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Membership GetAll Error: '.$e->getMessage());
            return [];
        }
    }

    public function getById($id) {
        try {
            $query = "SELECT * FROM {$this->table} WHERE id = :id LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Membership GetById Error: '.$e->getMessage());
            return false;
        }
    }

    public function getTierByPoints($points) {
        try {
            $query = "SELECT * FROM {$this->table} WHERE min_points_required <= :points ORDER BY min_points_required DESC LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':points', $points, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Membership GetTierByPoints Error: '.$e->getMessage());
            return null;
        }
    }

    public function getDiscountRate($tierId) {
        $tier = $this->getById($tierId);
        if ($tier) {
            return (float)$tier['discount_rate'];
        }
        return 0.0;
    }

    /**
     * Bulk update membership tiers (by id)
     * @param array $tiers - [{id, min_points_required, discount_rate}, ...]
     * @return bool
     */
    public function updateAll($tiers) {
        try {
            $stmt = $this->db->prepare(
                "UPDATE {$this->table} SET min_points_required = :points, discount_rate = :discount WHERE id = :id"
            );
            foreach ($tiers as $tier) {
                $stmt->execute([
                    ':points'   => (int) ($tier['min_points_required'] ?? 0),
                    ':discount' => (float) ($tier['discount_rate'] ?? 0),
                    ':id'       => (int) $tier['id'],
                ]);
            }
            return true;
        } catch (PDOException $e) {
            error_log('Membership UpdateAll Error: ' . $e->getMessage());
            return false;
        }
    }
}
