<?php
require_once __DIR__ . '/../config/Database.php';

class Promotion {
    private $db;
    private $table = 'promotions';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll($filters = []) {
        try {
            $query = "SELECT p.*,
                (SELECT COUNT(*) FROM user_vouchers uv WHERE uv.promotion_id = p.id AND uv.status = 'USED') as used_count,
                (SELECT COALESCE(SUM(b.discount_amount), 0) FROM bookings b INNER JOIN user_vouchers uv ON b.user_voucher_id = uv.id WHERE uv.promotion_id = p.id AND uv.status = 'USED') as total_discount
                FROM {$this->table} p WHERE p.is_auto_apply = 0";
            $params = [];

            if (!empty($filters['active'])) {
                $query .= " AND p.start_date <= :today1 AND p.end_date >= :today2";
                $today = date('Y-m-d');
                $params['today1'] = $today;
                $params['today2'] = $today;
            }

            if (!empty($filters['type'])) {
                // type could be FIXED or PERCENT
                $query .= " AND p.discount_type = :type";
                $params['type'] = $filters['type'];
            }

            $query .= " ORDER BY p.created_at DESC";

            $stmt = $this->db->prepare($query);
            foreach ($params as $k => $v) {
                $stmt->bindValue(':' . $k, $v);
            }
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Promotion GetAll Error: '.$e->getMessage());
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
            error_log('Promotion GetById Error: '.$e->getMessage());
            return false;
        }
    }

    public function create($data) {
        try {
            $query = "INSERT INTO {$this->table} (code, description, discount_amount, discount_type, min_order_value, max_discount, start_date, end_date, is_auto_apply, usage_limit) VALUES (:code, :description, :discount_amount, :discount_type, :min_order_value, :max_discount, :start_date, :end_date, :is_auto_apply, :usage_limit)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':code', $data['code']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':discount_amount', $data['discount_amount']);
            $stmt->bindParam(':discount_type', $data['discount_type']);
            $stmt->bindParam(':min_order_value', $data['min_order_value']);
            $maxDiscount = $data['max_discount'] ?? null;
            $stmt->bindParam(':max_discount', $maxDiscount);
            $stmt->bindParam(':start_date', $data['start_date']);
            $stmt->bindParam(':end_date', $data['end_date']);
            $stmt->bindParam(':is_auto_apply', $data['is_auto_apply']);
            $stmt->bindParam(':usage_limit', $data['usage_limit']);
            if ($stmt->execute()) return $this->db->lastInsertId();
            return false;
        } catch (PDOException $e) {
            error_log('Promotion Create Error: '.$e->getMessage());
            return false;
        }
    }

    public function update($id, $data) {
        try {
            $allowed = ['code', 'description', 'discount_amount', 'discount_type', 'min_order_value', 'max_discount', 'start_date', 'end_date', 'is_auto_apply', 'usage_limit'];
            $fields = [];
            $params = ['id' => $id];
            foreach ($data as $k => $v) {
                if (!in_array($k, $allowed, true)) continue;
                $fields[] = "$k = :$k";
                $params[$k] = $v;
            }
            if (empty($fields)) return false;
            $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($query);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log('Promotion Update Error: '.$e->getMessage());
            return false;
        }
    }

    public function delete($id) {
        try {
            $query = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log('Promotion Delete Error: '.$e->getMessage());
            return false;
        }
    }

    public function getActive() {
        // Exclude is_auto_apply = 1 (system vouchers: REWARD_*, TIER_*, WELCOME_*, BIRTHDAY)
        try {
            $today = date('Y-m-d');
            $query = "SELECT * FROM {$this->table} WHERE start_date <= :today1 AND end_date >= :today2 AND is_auto_apply = 0 ORDER BY created_at DESC";
            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':today1', $today);
            $stmt->bindValue(':today2', $today);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('Promotion GetActive Error: '.$e->getMessage());
            return [];
        }
    }
}
