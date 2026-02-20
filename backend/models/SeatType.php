<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * SeatType Model
 * Quản lý loại ghế (Standard, VIP, Sweetbox)
 * Phụ trách: SƠN
 */
class SeatType
{
    private $db;
    private $table = 'seat_types';

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Lấy tất cả loại ghế
     * @return array
     */
    public function getAll()
    {
        try {
            $sql = "SELECT * FROM {$this->table} ORDER BY price_multiplier ASC";
            $stmt = $this->db->query($sql);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("SeatType getAll Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Lấy loại ghế theo ID
     * @param int $id
     * @return array|null
     */
    public function getById($id)
    {
        try {
            $sql = "SELECT * FROM {$this->table} WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            error_log("SeatType getById Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Lấy hệ số giá của loại ghế
     * @param int $id
     * @return float
     */
    public function getPriceMultiplier($id)
    {
        try {
            $sql = "SELECT price_multiplier FROM {$this->table} WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? (float) $result['price_multiplier'] : 1.00;
        } catch (PDOException $e) {
            error_log("SeatType getPriceMultiplier Error: " . $e->getMessage());
            return 1.00;
        }
    }
}
