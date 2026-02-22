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
            $query = "SELECT * FROM {$this->table} WHERE 1=1";
            $params = [];

            if (!empty($filters['active'])) {
                $query .= " AND start_date <= :today AND end_date >= :today";
                $params['today'] = date('Y-m-d');
            }

            if (!empty($filters['type'])) {
                // type could be FIXED or PERCENT
                $query .= " AND discount_type = :type";
                $params['type'] = $filters['type'];
            }

            $query .= " ORDER BY created_at DESC";

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
            $query = "INSERT INTO {$this->table} (code, description, discount_amount, discount_type, min_order_value, start_date, end_date, is_auto_apply, usage_limit) VALUES (:code, :description, :discount_amount, :discount_type, :min_order_value, :start_date, :end_date, :is_auto_apply, :usage_limit)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':code', $data['code']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':discount_amount', $data['discount_amount']);
            $stmt->bindParam(':discount_type', $data['discount_type']);
            $stmt->bindParam(':min_order_value', $data['min_order_value']);
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
            $fields = [];
            $params = ['id' => $id];
            foreach ($data as $k => $v) {
                $fields[] = "$k = :$k";
                $params[$k] = $v;
            }
            $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($query);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log('Promotion Update Error: '.$e->getMessage());
            return false;
        }
    }

    public function getActive() {
        return $this->getAll(['active' => true]);
    }
}
