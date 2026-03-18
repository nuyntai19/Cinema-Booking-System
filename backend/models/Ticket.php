<?php

/**
 * Ticket Model - Quản lý vé xem phim
 */
require_once __DIR__ . '/../config/Database.php';

class Ticket
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Tạo nhiều vé cùng lúc khi booking
     * @param int $bookingId
     * @param int $showtimeId
     * @param array $seats - Array of seat IDs
     * @return bool
     */
    public function createBatch($bookingId, $showtimeId, $seats)
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO tickets (booking_id, seat_id, price, ticket_code, status, hold_expires_at)
                VALUES (?, ?, ?, ?, 'HOLDING', DATE_ADD(NOW(), INTERVAL 10 MINUTE))
            ");

            foreach ($seats as $seat) {
                $ticketCode = $this->generateTicketCode();
                $price = $this->getSeatPrice($seat['id'], $showtimeId);

                $stmt->execute([
                    $bookingId,
                    $seat['id'],
                    $price,
                    $ticketCode
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
     * Lấy chi tiết vé theo ID
     * @param int $id
     * @return array|null
     */
    public function getById($id)
    {
        $stmt = $this->db->prepare("
            SELECT 
                t.*,
                s.seat_number,
                s.row_number,
                st.price AS seat_type_price,
                st.name AS seat_type_name,
                sh.start_time AS showtime_start,
                sh.end_time AS showtime_end,
                m.title AS movie_title,
                m.duration_minutes,
                r.name AS room_name,
                c.name AS cinema_name,
                b.user_id,
                u.email AS user_email
            FROM tickets t
            JOIN seats s ON t.seat_id = s.id
            JOIN seat_types st ON s.seat_type_id = st.id
            JOIN bookings b ON t.booking_id = b.id
            JOIN showtimes sh ON b.showtime_id = sh.id
            JOIN movies m ON sh.movie_id = m.id
            JOIN rooms r ON sh.room_id = r.id
            JOIN cinemas c ON r.cinema_id = c.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE t.id = ?
        ");

        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Tìm vé theo ticket code (QR code)
     * @param string $code
     * @return array|null
     */
    public function getByCode($code)
    {
        $stmt = $this->db->prepare("
            SELECT 
                t.*,
                s.seat_number,
                s.row_number,
                st.name AS seat_type_name,
                sh.start_time AS showtime_start,
                sh.end_time AS showtime_end,
                m.title AS movie_title,
                m.age_rating,
                r.name AS room_name,
                c.name AS cinema_name,
                c.address AS cinema_address,
                b.user_id,
                u.email AS user_email
            FROM tickets t
            JOIN seats s ON t.seat_id = s.id
            JOIN seat_types st ON s.seat_type_id = st.id
            JOIN bookings b ON t.booking_id = b.id
            JOIN showtimes sh ON b.showtime_id = sh.id
            JOIN movies m ON sh.movie_id = m.id
            JOIN rooms r ON sh.room_id = r.id
            JOIN cinemas c ON r.cinema_id = c.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE t.ticket_code = ?
        ");

        $stmt->execute([$code]);
        return $stmt->fetch();
    }

    /**
     * Lấy tất cả vé của một booking
     * @param int $bookingId
     * @return array
     */
    public function getByBooking($bookingId)
    {
        $stmt = $this->db->prepare("
            SELECT 
                t.*,
                s.`number` AS seat_number,
                s.row_code AS `row_number`,
                st.name AS seat_type_name,
                st.price_multiplier AS seat_type_price
            FROM tickets t
            JOIN seats s ON t.seat_id = s.id
            JOIN seat_types st ON s.seat_type_id = st.id
            WHERE t.booking_id = ?
            ORDER BY s.row_code, s.`number`
        ");

        $stmt->execute([$bookingId]);
        return $stmt->fetchAll();
    }

    /**
     * Lấy tất cả vé với thông tin chi tiết (Admin)
     * @param int $limit - Số lượng vé tối đa (default: 100)
     * @param int $offset - Vị trí bắt đầu (default: 0)
     * @return array
     */
    public function getAll($limit = 100, $offset = 0)
    {
        $stmt = $this->db->prepare("
            SELECT 
                t.*,
                s.seat_number,
                s.row_number,
                st.name AS seat_type_name,
                sh.start_time AS showtime_start,
                sh.end_time AS showtime_end,
                m.title AS movie_title,
                m.age_rating,
                r.name AS room_name,
                c.name AS cinema_name,
                b.total_amount AS booking_amount,
                b.booking_code,
                u.email AS user_email,
                u.full_name AS user_name
            FROM tickets t
            JOIN seats s ON t.seat_id = s.id
            JOIN seat_types st ON s.seat_type_id = st.id
            JOIN bookings b ON t.booking_id = b.id
            JOIN showtimes sh ON b.showtime_id = sh.id
            JOIN movies m ON sh.movie_id = m.id
            JOIN rooms r ON sh.room_id = r.id
            JOIN cinemas c ON r.cinema_id = c.id
            LEFT JOIN users u ON b.user_id = u.id
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
        ");

        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    }

    /**
     * Generate unique ticket code
     * @return string
     */
    public function generateTicketCode()
    {
        do {
            // Format: TKT-YYYYMMDD-XXXXX
            $code = 'TKT-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid(rand(), true)), 0, 5));

            // Check if code exists
            $stmt = $this->db->prepare("SELECT id FROM tickets WHERE ticket_code = ?");
            $stmt->execute([$code]);
            $exists = $stmt->fetch();
        } while ($exists);

        return $code;
    }

    /**
     * Cập nhật trạng thái vé
     * @param int $id
     * @param string $status - HOLDING, SOLD, USED, REFUNDED
     * @return bool
     */
    public function updateStatus($id, $status)
    {
        $stmt = $this->db->prepare("
            UPDATE tickets 
            SET status = ?, updated_at = NOW()
            WHERE id = ?
        ");

        return $stmt->execute([$status, $id]);
    }

    /**
     * Đánh dấu vé đã sử dụng
     * @param int $id
     * @return bool
     */
    public function markAsUsed($id)
    {
        return $this->updateStatus($id, 'USED');
    }

    /**
     * Tìm các vé HOLDING đã hết hạn (Cronjob)
     * @return array
     */
    public function checkExpiredHolding()
    {
        $stmt = $this->db->prepare("
            SELECT id, booking_id, ticket_code
            FROM tickets
            WHERE status = 'HOLDING'
            AND hold_expires_at < NOW()
        ");

        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Tự động hoàn vé hết hạn giữ chỗ (Cronjob)
     * @return int - Số vé đã refund
     */
    public function refundExpiredTickets()
    {
        try {
            $this->db->beginTransaction();

            // Tìm các vé hết hạn
            $expiredTickets = $this->checkExpiredHolding();

            if (empty($expiredTickets)) {
                $this->db->commit();
                return 0;
            }

            // Update status sang REFUNDED
            $stmt = $this->db->prepare("
                UPDATE tickets
                SET status = 'REFUNDED', updated_at = NOW()
                WHERE status = 'HOLDING'
                AND hold_expires_at < NOW()
            ");

            $stmt->execute();
            $count = $stmt->rowCount();

            // Log hoặc trigger hoàn tiền
            // TODO: Implement refund logic (payment gateway, wallet, etc.)

            $this->db->commit();
            return $count;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Lấy giá ghế dựa trên seat_type và showtime
     * @param int $seatId
     * @param int $showtimeId
     * @return float
     */
    private function getSeatPrice($seatId, $showtimeId)
    {
        $stmt = $this->db->prepare("
            SELECT 
                st.price AS base_price,
                sh.is_special_show
            FROM seats s
            JOIN seat_types st ON s.seat_type_id = st.id
            JOIN showtimes sh ON sh.id = ?
            WHERE s.id = ?
        ");

        $stmt->execute([$showtimeId, $seatId]);
        $data = $stmt->fetch();

        if (!$data) {
            throw new Exception('Không tìm thấy thông tin giá ghế');
        }

        $price = $data['base_price'];

        // Nếu là suất chiếu đặc biệt, tăng giá 20%
        if ($data['is_special_show']) {
            $price *= 1.2;
        }

        return $price;
    }

    /**
     * Cập nhật tất cả vé của booking sang SOLD khi thanh toán thành công
     * @param int $bookingId
     * @return bool
     */
    public function markBookingAsSold($bookingId)
    {
        $stmt = $this->db->prepare("
            UPDATE tickets
            SET status = 'SOLD', 
                hold_expires_at = NULL,
                updated_at = NOW()
            WHERE booking_id = ?
            AND status = 'HOLDING'
        ");

        return $stmt->execute([$bookingId]);
    }

    /**
     * Lấy tổng số vé theo trạng thái (cho báo cáo)
     * @param string $status
     * @param string $startDate
     * @param string $endDate
     * @return int
     */
    public function countByStatus($status, $startDate = null, $endDate = null)
    {
        $sql = "SELECT COUNT(*) as total FROM tickets WHERE status = ?";
        $params = [$status];

        if ($startDate && $endDate) {
            $sql .= " AND created_at BETWEEN ? AND ?";
            $params[] = $startDate;
            $params[] = $endDate;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();

        return $result['total'];
    }
}
