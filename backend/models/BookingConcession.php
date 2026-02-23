<?php

/**
 * BookingConcession Model - Junction table giữa Booking và Concession
 */
require_once __DIR__ . '/../config/Database.php';

class BookingConcession
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Thêm bắp nước vào booking
     * @param int $bookingId
     * @param array $items - [['concession_id' => 1, 'quantity' => 2], ...]
     * @return bool
     */
    public function addToBooking($bookingId, $items)
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO booking_concessions (booking_id, concession_id, quantity, price)
                VALUES (?, ?, ?, ?)
            ");

            foreach ($items as $item) {
                // Lấy giá hiện tại của concession
                $priceStmt = $this->db->prepare("SELECT price FROM concessions WHERE id = ?");
                $priceStmt->execute([$item['concession_id']]);
                $concession = $priceStmt->fetch();

                if (!$concession) {
                    throw new Exception("Concession ID {$item['concession_id']} không tồn tại");
                }

                $stmt->execute([
                    $bookingId,
                    $item['concession_id'],
                    $item['quantity'],
                    $concession['price'] // Lưu giá tại thời điểm đặt
                ]);
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Lấy danh sách concessions của một booking
     * @param int $bookingId
     * @return array
     */
    public function getByBooking($bookingId)
    {
        $stmt = $this->db->prepare("
            SELECT 
                bc.*,
                c.name AS concession_name,
                c.category,
                c.image_url,
                (bc.price * bc.quantity) AS subtotal
            FROM booking_concessions bc
            JOIN concessions c ON bc.concession_id = c.id
            WHERE bc.booking_id = ?
            ORDER BY c.category, c.name
        ");

        $stmt->execute([$bookingId]);
        return $stmt->fetchAll();
    }

    /**
     * Tính tổng tiền bắp nước
     * @param array $items - [['concession_id' => 1, 'quantity' => 2], ...]
     * @return float
     */
    public function calculateTotal($items)
    {
        $total = 0;

        foreach ($items as $item) {
            $stmt = $this->db->prepare("SELECT price FROM concessions WHERE id = ?");
            $stmt->execute([$item['concession_id']]);
            $concession = $stmt->fetch();

            if ($concession) {
                $total += $concession['price'] * $item['quantity'];
            }
        }

        return $total;
    }

    /**
     * Xóa concession khỏi booking
     * @param int $id - booking_concessions.id
     * @return bool
     */
    public function remove($id)
    {
        $stmt = $this->db->prepare("DELETE FROM booking_concessions WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Xóa tất cả concessions của một booking
     * @param int $bookingId
     * @return bool
     */
    public function removeAllByBooking($bookingId)
    {
        $stmt = $this->db->prepare("DELETE FROM booking_concessions WHERE booking_id = ?");
        return $stmt->execute([$bookingId]);
    }

    /**
     * Cập nhật số lượng concession trong booking
     * @param int $id
     * @param int $quantity
     * @return bool
     */
    public function updateQuantity($id, $quantity)
    {
        if ($quantity <= 0) {
            return $this->remove($id);
        }

        $stmt = $this->db->prepare("
            UPDATE booking_concessions
            SET quantity = ?
            WHERE id = ?
        ");

        return $stmt->execute([$quantity, $id]);
    }

    /**
     * Lấy tổng doanh thu từ concessions
     * @param string $startDate
     * @param string $endDate
     * @return float
     */
    public function getTotalRevenue($startDate = null, $endDate = null)
    {
        $sql = "
            SELECT SUM(price * quantity) AS total_revenue
            FROM booking_concessions
        ";

        $params = [];

        if ($startDate && $endDate) {
            $sql .= " WHERE created_at BETWEEN ? AND ?";
            $params[] = $startDate;
            $params[] = $endDate;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();

        return $result['total_revenue'] ?? 0;
    }

    /**
     * Kiểm tra xem concession có trong booking không
     * @param int $bookingId
     * @param int $concessionId
     * @return array|null
     */
    public function findInBooking($bookingId, $concessionId)
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM booking_concessions
            WHERE booking_id = ? AND concession_id = ?
        ");

        $stmt->execute([$bookingId, $concessionId]);
        return $stmt->fetch();
    }

    /**
     * Thêm hoặc cập nhật concession trong booking
     * @param int $bookingId
     * @param int $concessionId
     * @param int $quantity
     * @return bool
     */
    public function addOrUpdate($bookingId, $concessionId, $quantity)
    {
        $existing = $this->findInBooking($bookingId, $concessionId);

        if ($existing) {
            // Update quantity
            $newQuantity = $existing['quantity'] + $quantity;
            return $this->updateQuantity($existing['id'], $newQuantity);
        } else {
            // Add new
            return $this->addToBooking($bookingId, [
                ['concession_id' => $concessionId, 'quantity' => $quantity]
            ]);
        }
    }

    /**
     * Lấy thống kê concessions theo khoảng thời gian
     * @param string $startDate
     * @param string $endDate
     * @return array
     */
    public function getStatistics($startDate = null, $endDate = null)
    {
        $sql = "
            SELECT 
                c.name AS concession_name,
                c.category,
                SUM(bc.quantity) AS total_quantity,
                SUM(bc.price * bc.quantity) AS total_revenue,
                COUNT(DISTINCT bc.booking_id) AS total_bookings
            FROM booking_concessions bc
            JOIN concessions c ON bc.concession_id = c.id
        ";

        $params = [];

        if ($startDate && $endDate) {
            $sql .= " WHERE bc.created_at BETWEEN ? AND ?";
            $params[] = $startDate;
            $params[] = $endDate;
        }

        $sql .= "
            GROUP BY bc.concession_id
            ORDER BY total_revenue DESC
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }
}
