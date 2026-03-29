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
                s.`number` AS `seat_number`,
                s.row_code AS `row_number`,
                st.price_multiplier AS seat_type_price,
                st.name AS seat_type_name,
                sh.start_time AS showtime_start,
                sh.end_time AS showtime_end,
                m.title AS movie_title,
                m.duration_minutes,
                h.name AS room_name,
                c.name AS cinema_name,
                b.user_id,
                u.email AS user_email
            FROM tickets t
            JOIN seats s ON t.seat_id = s.id
            JOIN seat_types st ON s.seat_type_id = st.id
            JOIN bookings b ON t.booking_id = b.id
            JOIN showtimes sh ON b.showtime_id = sh.id
            JOIN movies m ON sh.movie_id = m.id
            JOIN cinema_halls h ON sh.cinema_hall_id = h.id
            JOIN cinemas c ON h.cinema_id = c.id
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
                s.`number` AS `seat_number`,
                s.row_code AS `row_number`,
                st.name AS seat_type_name,
                sh.start_time AS showtime_start,
                sh.end_time AS showtime_end,
                m.title AS movie_title,
                m.age_rating,
                h.name AS room_name,
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
            JOIN cinema_halls h ON sh.cinema_hall_id = h.id
            JOIN cinemas c ON h.cinema_id = c.id
            LEFT JOIN users u ON b.user_id = u.id
            WHERE t.ticket_code = ?
        ");

        $stmt->execute([$code]);
        return $stmt->fetch();
    }

    /**
     * Lấy danh sách vé theo booking_id phục vụ quét QR theo booking
     * @param int $bookingId
     * @return array
     */
    public function getScanBundleByBookingId($bookingId)
    {
        $stmt = $this->db->prepare("
            SELECT 
                t.*,
                s.`number` AS `seat_number`,
                s.row_code AS `row_number`,
                st.name AS seat_type_name,
                sh.start_time AS showtime_start,
                sh.end_time AS showtime_end,
                m.title AS movie_title,
                m.age_rating,
                h.name AS room_name,
                c.id AS cinema_id,
                c.name AS cinema_name,
                c.address AS cinema_address,
                b.booking_code,
                b.user_id,
                u.email AS user_email,
                up.full_name AS user_full_name,
                up.phone AS user_phone,
                up.avatar AS user_avatar
            FROM tickets t
            JOIN seats s ON t.seat_id = s.id
            JOIN seat_types st ON s.seat_type_id = st.id
            JOIN bookings b ON t.booking_id = b.id
            JOIN showtimes sh ON b.showtime_id = sh.id
            JOIN movies m ON sh.movie_id = m.id
            JOIN cinema_halls h ON sh.cinema_hall_id = h.id
            JOIN cinemas c ON h.cinema_id = c.id
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE t.booking_id = ?
            ORDER BY t.id ASC
        ");

        $stmt->execute([$bookingId]);
        return $stmt->fetchAll();
    }

    /**
     * Lấy danh sách vé bằng booking_code
     * @param string $bookingCode
     * @return array
     */
    public function getScanBundleByBookingCode($bookingCode)
    {
        $stmt = $this->db->prepare("SELECT id FROM bookings WHERE booking_code = ? LIMIT 1");
        $stmt->execute([$bookingCode]);
        $booking = $stmt->fetch();

        if (!$booking) {
            return [];
        }

        return $this->getScanBundleByBookingId((int)$booking['id']);
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
                s.`number` AS `seat_number`,
                s.row_code AS `row_number`,
                st.name AS seat_type_name,
                sh.start_time AS showtime_start,
                sh.end_time AS showtime_end,
                m.title AS movie_title,
                m.age_rating,
                h.name AS room_name,
                c.name AS cinema_name,
                b.total_price AS booking_amount,
                b.booking_code,
                u.email AS user_email,
                up.full_name AS user_name
            FROM tickets t
            JOIN seats s ON t.seat_id = s.id
            JOIN seat_types st ON s.seat_type_id = st.id
            JOIN bookings b ON t.booking_id = b.id
            JOIN showtimes sh ON b.showtime_id = sh.id
            JOIN movies m ON sh.movie_id = m.id
            JOIN cinema_halls h ON sh.cinema_hall_id = h.id
            JOIN cinemas c ON h.cinema_id = c.id
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN user_profiles up ON up.user_id = u.id
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
     * Đánh dấu tất cả vé SOLD trong booking thành USED
     * @param int $bookingId
     * @return int
     */
    public function markBookingAsUsed($bookingId)
    {
        $stmt = $this->db->prepare("\n            UPDATE tickets\n            SET status = 'USED', updated_at = NOW()\n            WHERE booking_id = ?\n            AND status = 'SOLD'\n        ");

        $stmt->execute([$bookingId]);
        return $stmt->rowCount();
    }

    /**
     * Đảm bảo bảng lịch sử quét tồn tại cho môi trường cũ chưa migrate schema
     */
    public function ensureScanHistoryTable()
    {
        $this->db->exec("\n            CREATE TABLE IF NOT EXISTS ticket_scan_history (\n                id INT AUTO_INCREMENT PRIMARY KEY,\n                booking_id INT NOT NULL,\n                ticket_code_input VARCHAR(50) NOT NULL,\n                scanned_by_user_id INT NULL,\n                scan_result ENUM('APPROVED') NOT NULL DEFAULT 'APPROVED',\n                note VARCHAR(255) NULL,\n                scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,\n                FOREIGN KEY (scanned_by_user_id) REFERENCES users(id) ON DELETE SET NULL,\n                INDEX idx_booking_scan_time (booking_id, scanned_at),\n                INDEX idx_scanned_by (scanned_by_user_id),\n                INDEX idx_ticket_code_input (ticket_code_input)\n            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci\n        ");
    }

    /**
     * Lưu lịch sử duyệt vé vào cổng
     */
    public function logScanApproval($bookingId, $ticketCodeInput, $staffUserId = null, $note = null)
    {
        $this->ensureScanHistoryTable();

        $stmt = $this->db->prepare("\n            INSERT INTO ticket_scan_history (booking_id, ticket_code_input, scanned_by_user_id, scan_result, note)\n            VALUES (?, ?, ?, 'APPROVED', ?)\n        ");

        return $stmt->execute([
            (int)$bookingId,
            (string)$ticketCodeInput,
            $staffUserId ? (int)$staffUserId : null,
            $note,
        ]);
    }

    /**
     * Lấy lịch sử duyệt vé tại cổng
     */
    public function getScanHistory($limit = 50, $offset = 0, $filters = [])
    {
        $this->ensureScanHistoryTable();

        $where = [];
        $params = [];

        $bookingCode = trim((string)($filters['booking_code'] ?? ''));
        if ($bookingCode !== '') {
            $where[] = 'b.booking_code LIKE ?';
            $params[] = '%' . $bookingCode . '%';
        }

        $ticketCode = trim((string)($filters['ticket_code_input'] ?? ''));
        if ($ticketCode !== '') {
            $where[] = 'tsh.ticket_code_input LIKE ?';
            $params[] = '%' . $ticketCode . '%';
        }

        $staffEmail = trim((string)($filters['scanned_by_email'] ?? ''));
        if ($staffEmail !== '') {
            $where[] = 'su.email LIKE ?';
            $params[] = '%' . $staffEmail . '%';
        }

        $scanResult = trim((string)($filters['scan_result'] ?? ''));
        if ($scanResult !== '') {
            $where[] = 'tsh.scan_result = ?';
            $params[] = $scanResult;
        }

        $dateFrom = trim((string)($filters['date_from'] ?? ''));
        if ($dateFrom !== '') {
            $where[] = 'DATE(tsh.scanned_at) >= ?';
            $params[] = $dateFrom;
        }

        $dateTo = trim((string)($filters['date_to'] ?? ''));
        if ($dateTo !== '') {
            $where[] = 'DATE(tsh.scanned_at) <= ?';
            $params[] = $dateTo;
        }

        $cinemaId = isset($filters['cinema_id']) ? (int)$filters['cinema_id'] : null;
        if ($cinemaId) {
            $where[] = 'c.id = ?';
            $params[] = $cinemaId;
        }

        $sql = "\n            SELECT\n                tsh.id,\n                tsh.booking_id,\n                tsh.ticket_code_input,\n                tsh.scanned_by_user_id,\n                tsh.scan_result,\n                tsh.note,\n                tsh.scanned_at,\n                b.booking_code,\n                m.title AS movie_title,\n                sh.start_time AS showtime_start,\n                sh.end_time AS showtime_end,\n                su.email AS scanned_by_email\n            FROM ticket_scan_history tsh\n            JOIN bookings b ON tsh.booking_id = b.id\n            JOIN showtimes sh ON b.showtime_id = sh.id\n            JOIN movies m ON sh.movie_id = m.id\n            JOIN cinema_halls ch ON sh.cinema_hall_id = ch.id\n            JOIN cinemas c ON ch.cinema_id = c.id\n            LEFT JOIN users su ON tsh.scanned_by_user_id = su.id\n        ";

        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY tsh.scanned_at DESC LIMIT ? OFFSET ?';

        $stmt = $this->db->prepare($sql);

        $bindIndex = 1;
        foreach ($params as $value) {
            $stmt->bindValue($bindIndex, $value, PDO::PARAM_STR);
            $bindIndex++;
        }

        $stmt->bindValue($bindIndex, (int)$limit, PDO::PARAM_INT);
        $bindIndex++;
        $stmt->bindValue($bindIndex, (int)$offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
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
