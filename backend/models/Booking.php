<?php
/**
 * Booking Model
 */
class Booking {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function create($userId, $showtimeId, $seatIds, $concessions = [], $userVoucherId = null) {
        if (empty($seatIds)) {
            throw new Exception('Danh sách ghế không được để trống');
        }

        $showtime = $this->getShowtime($showtimeId);
        if (!$showtime) {
            throw new Exception('Suất chiếu không tồn tại');
        }

        $seatIds = array_values(array_unique(array_map('intval', $seatIds)));

        $this->db->beginTransaction();
        try {
            // Validate seats belong to hall and are active
            $seatDetails = $this->getSeatDetails($seatIds, (int)$showtime['cinema_hall_id']);
            if (count($seatDetails) !== count($seatIds)) {
                throw new Exception('Ghế không hợp lệ hoặc không thuộc phòng chiếu');
            }

            // Check seat availability
            $unavailableSeats = $this->getUnavailableSeats($showtimeId, $seatIds);
            if (!empty($unavailableSeats)) {
                throw new Exception('Một số ghế đã được giữ hoặc đã bán');
            }

            // Calculate total price
            $pricing = $this->calculateTotalPrice($showtime, $seatDetails, $concessions);
            $totalPrice = $pricing['total_price'];

            $voucherDiscount = 0;
            if ($userVoucherId) {
                $voucherDiscount = $this->applyVoucherDiscount($userVoucherId, $userId, $totalPrice);
            }

            $membershipDiscount = $this->applyMembershipDiscount($userId, $totalPrice);

            $discountAmount = $voucherDiscount + $membershipDiscount;
            if ($discountAmount > $totalPrice) {
                $discountAmount = $totalPrice;
            }

            $finalPrice = $totalPrice - $discountAmount;

            // Create booking
            $stmt = $this->db->prepare(
                "INSERT INTO bookings (user_id, showtime_id, user_voucher_id, total_price, discount_amount, final_price, status)
                 VALUES (:user_id, :showtime_id, :user_voucher_id, :total_price, :discount_amount, :final_price, 'Pending')"
            );
            $stmt->execute([
                ':user_id' => $userId,
                ':showtime_id' => $showtimeId,
                ':user_voucher_id' => $userVoucherId ?: null,
                ':total_price' => $totalPrice,
                ':discount_amount' => $discountAmount,
                ':final_price' => $finalPrice,
            ]);

            $bookingId = (int)$this->db->lastInsertId();

            // Create tickets (HOLDING)
            $holdExpiresAt = date('Y-m-d H:i:s', time() + $this->getSeatHoldDuration());
            $ticketStmt = $this->db->prepare(
                "INSERT INTO tickets (booking_id, seat_id, price, ticket_code, status, hold_expires_at)
                 VALUES (:booking_id, :seat_id, :price, :ticket_code, 'HOLDING', :hold_expires_at)"
            );

            $ticketIndex = 1;
            foreach ($pricing['seat_prices'] as $seatId => $price) {
                $ticketCode = $this->generateTicketCode($bookingId, $ticketIndex);
                $ticketStmt->execute([
                    ':booking_id' => $bookingId,
                    ':seat_id' => $seatId,
                    ':price' => $price,
                    ':ticket_code' => $ticketCode,
                    ':hold_expires_at' => $holdExpiresAt,
                ]);
                $ticketIndex++;
            }

            // Insert concessions
            if (!empty($pricing['concessions'])) {
                $concessionStmt = $this->db->prepare(
                    "INSERT INTO booking_concessions (booking_id, concession_id, quantity, price)
                     VALUES (:booking_id, :concession_id, :quantity, :price)"
                );
                foreach ($pricing['concessions'] as $item) {
                    $concessionStmt->execute([
                        ':booking_id' => $bookingId,
                        ':concession_id' => $item['id'],
                        ':quantity' => $item['quantity'],
                        ':price' => $item['price'],
                    ]);
                }
            }

            $this->db->commit();

            return [
                'booking_id' => $bookingId,
                'hold_expires_at' => $holdExpiresAt,
                'total_price' => $totalPrice,
                'discount_amount' => $discountAmount,
                'final_price' => $finalPrice,
            ];
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getById($id) {
        $stmt = $this->db->prepare(
            "SELECT b.*, s.start_time, s.end_time, s.cinema_hall_id, m.title AS movie_title, m.duration_minutes,
                    c.name AS cinema_name, h.name AS hall_name
             FROM bookings b
             JOIN showtimes s ON b.showtime_id = s.id
             JOIN movies m ON s.movie_id = m.id
             JOIN cinema_halls h ON s.cinema_hall_id = h.id
             JOIN cinemas c ON h.cinema_id = c.id
             WHERE b.id = :id"
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getDetails($id) {
        $booking = $this->getById($id);
        if (!$booking) {
            return null;
        }

        $ticketStmt = $this->db->prepare(
            "SELECT t.*, s.row_code, s.number, st.name AS seat_type
             FROM tickets t
             JOIN seats s ON t.seat_id = s.id
             JOIN seat_types st ON s.seat_type_id = st.id
             WHERE t.booking_id = :booking_id"
        );
        $ticketStmt->execute([':booking_id' => $id]);
        $booking['tickets'] = $ticketStmt->fetchAll(PDO::FETCH_ASSOC);

        $concessionStmt = $this->db->prepare(
            "SELECT bc.*, c.name, c.category, c.image_url
             FROM booking_concessions bc
             JOIN concessions c ON bc.concession_id = c.id
             WHERE bc.booking_id = :booking_id"
        );
        $concessionStmt->execute([':booking_id' => $id]);
        $booking['concessions'] = $concessionStmt->fetchAll(PDO::FETCH_ASSOC);

        $transactionStmt = $this->db->prepare(
            "SELECT * FROM transactions WHERE booking_id = :booking_id ORDER BY created_at DESC LIMIT 1"
        );
        $transactionStmt->execute([':booking_id' => $id]);
        $booking['transaction'] = $transactionStmt->fetch(PDO::FETCH_ASSOC);

        return $booking;
    }

    public function getUserBookings($userId, $page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        $stmt = $this->db->prepare(
            "SELECT b.*, 
                    m.id AS movie_id, m.title AS movie_title, m.poster_url, m.duration_minutes, m.age_rating,
                    s.start_time, 
                    c.name AS cinema_name, 
                    h.name AS hall_name,
                    (SELECT payment_method FROM transactions WHERE booking_id = b.id ORDER BY created_at DESC LIMIT 1) AS payment_method
             FROM bookings b
             JOIN showtimes s ON b.showtime_id = s.id
             JOIN movies m ON s.movie_id = m.id
             JOIN cinema_halls h ON s.cinema_hall_id = h.id
             JOIN cinemas c ON h.cinema_id = c.id
             WHERE b.user_id = :user_id
             ORDER BY b.created_at DESC
             LIMIT :limit OFFSET :offset"
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get seats for each booking
        foreach ($bookings as &$booking) {
            $ticketStmt = $this->db->prepare(
                "SELECT t.*, s.row_code, s.number
                 FROM tickets t
                 JOIN seats s ON t.seat_id = s.id
                 WHERE t.booking_id = :booking_id
                 ORDER BY s.row_code, s.number"
            );
            $ticketStmt->execute([':booking_id' => $booking['id']]);
            $tickets = $ticketStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format seat names
            $seats = array_map(function($ticket) {
                return $ticket['row_code'] . $ticket['number'];
            }, $tickets);
            $booking['seats'] = implode(', ', $seats);
        }

        return $bookings;
    }

    public function countUserBookings($userId) {
        $stmt = $this->db->prepare("SELECT COUNT(*) AS total FROM bookings WHERE user_id = :user_id");
        $stmt->execute([':user_id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$row['total'];
    }

    public function getAll($filters = [], $page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        $where = [];
        $params = [];

        if (!empty($filters['status'])) {
            $where[] = 'b.status = :status';
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['user_id'])) {
            $where[] = 'b.user_id = :user_id';
            $params[':user_id'] = (int)$filters['user_id'];
        }
        if (!empty($filters['showtime_id'])) {
            $where[] = 'b.showtime_id = :showtime_id';
            $params[':showtime_id'] = (int)$filters['showtime_id'];
        }

        $whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql =
            "SELECT b.*, m.title AS movie_title, s.start_time, c.name AS cinema_name, h.name AS hall_name
             FROM bookings b
             JOIN showtimes s ON b.showtime_id = s.id
             JOIN movies m ON s.movie_id = m.id
             JOIN cinema_halls h ON s.cinema_hall_id = h.id
             JOIN cinemas c ON h.cinema_id = c.id
             $whereSql
             ORDER BY b.created_at DESC
             LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function countAll($filters = []) {
        $where = [];
        $params = [];

        if (!empty($filters['status'])) {
            $where[] = 'status = :status';
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['user_id'])) {
            $where[] = 'user_id = :user_id';
            $params[':user_id'] = (int)$filters['user_id'];
        }
        if (!empty($filters['showtime_id'])) {
            $where[] = 'showtime_id = :showtime_id';
            $params[':showtime_id'] = (int)$filters['showtime_id'];
        }

        $whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        $stmt = $this->db->prepare("SELECT COUNT(*) AS total FROM bookings $whereSql");
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$row['total'];
    }

    public function updateStatus($id, $status) {
        $stmt = $this->db->prepare("UPDATE bookings SET status = :status WHERE id = :id");
        return $stmt->execute([
            ':status' => $status,
            ':id' => $id,
        ]);
    }

    public function confirm($id) {
        $this->db->beginTransaction();
        try {
            $this->updateStatus($id, 'Paid');

            $stmt = $this->db->prepare(
                "UPDATE tickets SET status = 'SOLD', hold_expires_at = NULL WHERE booking_id = :booking_id AND status = 'HOLDING'"
            );
            $stmt->execute([':booking_id' => $id]);

            // Mark voucher used if any
            $stmt = $this->db->prepare("SELECT user_voucher_id FROM bookings WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!empty($row['user_voucher_id'])) {
                $updateVoucher = $this->db->prepare(
                    "UPDATE user_vouchers SET status = 'USED', used_at = NOW() WHERE id = :id AND status = 'ACTIVE'"
                );
                $updateVoucher->execute([':id' => $row['user_voucher_id']]);
            }

            // Award loyalty points for this paid booking
            try {
                require_once __DIR__ . '/LoyaltyHistory.php';
                $booking = $this->getById($id);
                if ($booking && !empty($booking['final_price']) && !empty($booking['user_id'])) {
                    $finalPrice = (float)$booking['final_price'];
                    $userId = (int)$booking['user_id'];
                    $points = LoyaltyHistory::calculatePoints($finalPrice);
                    if ($points > 0) {
                        $lh = new LoyaltyHistory();
                        $lh->create($userId, $points, 'PURCHASE', 'Earned from booking #'.(int)$id, $id);
                    }
                }
            } catch (Exception $e) {
                // Log but do not prevent booking confirmation
                error_log('Loyalty award error: ' . $e->getMessage());
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function cancel($id) {
        $this->db->beginTransaction();
        try {
            $this->updateStatus($id, 'Cancelled');

            $stmt = $this->db->prepare(
                "UPDATE tickets SET status = 'REFUNDED' WHERE booking_id = :booking_id AND status IN ('HOLDING', 'SOLD')"
            );
            $stmt->execute([':booking_id' => $id]);

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function calculateTotalPrice($showtime, $seatDetails, $concessions) {
        $basePrice = $this->getBaseTicketPrice();
        $adjustment = $this->getPricingAdjustment($showtime['start_time']);

        $seatPrices = [];
        $seatTotal = 0;
        foreach ($seatDetails as $seat) {
            $price = ($basePrice + $adjustment) * (float)$seat['price_multiplier'];
            $price = max(0, $price);
            $seatPrices[(int)$seat['id']] = $price;
            $seatTotal += $price;
        }

        $concessionItems = $this->normalizeConcessions($concessions);
        $concessionTotal = 0;
        $concessionDetails = [];
        if (!empty($concessionItems)) {
            $concessionDetails = $this->getConcessionDetails($concessionItems);
            foreach ($concessionDetails as $item) {
                $concessionTotal += $item['price'] * $item['quantity'];
            }
        }

        return [
            'seat_prices' => $seatPrices,
            'concessions' => $concessionDetails,
            'seat_total' => $seatTotal,
            'concession_total' => $concessionTotal,
            'total_price' => $seatTotal + $concessionTotal,
        ];
    }

    public function applyMembershipDiscount($userId, $total) {
        $stmt = $this->db->prepare(
            "SELECT m.discount_rate
             FROM user_profiles up
             JOIN memberships m ON up.membership_id = m.id
             WHERE up.user_id = :user_id"
        );
        $stmt->execute([':user_id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return 0;
        }
        $rate = (float)$row['discount_rate'];
        if ($rate <= 0) {
            return 0;
        }
        return round($total * ($rate / 100), 2);
    }

    public function applyVoucherDiscount($userVoucherId, $userId, $total) {
        $stmt = $this->db->prepare(
            "SELECT uv.id, uv.status, p.discount_amount, p.discount_type, p.min_order_value, p.start_date, p.end_date
             FROM user_vouchers uv
             JOIN promotions p ON uv.promotion_id = p.id
             WHERE uv.id = :id AND uv.user_id = :user_id"
        );
        $stmt->execute([
            ':id' => $userVoucherId,
            ':user_id' => $userId,
        ]);
        $voucher = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$voucher) {
            throw new Exception('Voucher không hợp lệ');
        }
        if ($voucher['status'] !== 'ACTIVE') {
            throw new Exception('Voucher không còn hiệu lực');
        }

        $today = date('Y-m-d');
        if ($today < $voucher['start_date'] || $today > $voucher['end_date']) {
            throw new Exception('Voucher đã hết hạn');
        }

        if ($total < (float)$voucher['min_order_value']) {
            throw new Exception('Đơn hàng chưa đạt giá trị tối thiểu để áp dụng voucher');
        }

        $discount = 0;
        if ($voucher['discount_type'] === 'PERCENT') {
            $discount = $total * ((float)$voucher['discount_amount'] / 100);
        } else {
            $discount = (float)$voucher['discount_amount'];
        }

        return min($discount, $total);
    }

    private function getShowtime($showtimeId) {
        $stmt = $this->db->prepare("SELECT * FROM showtimes WHERE id = :id");
        $stmt->execute([':id' => $showtimeId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function getSeatDetails($seatIds, $hallId) {
        list($placeholders, $params) = $this->buildInClause($seatIds, 'seat');
        $sql =
            "SELECT s.id, s.seat_type_id, st.price_multiplier
             FROM seats s
             JOIN seat_types st ON s.seat_type_id = st.id
             WHERE s.id IN (" . implode(',', $placeholders) . ")
             AND s.cinema_hall_id = :hall_id
             AND s.status = 'Active'";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_INT);
        }
        $stmt->bindValue(':hall_id', $hallId, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getUnavailableSeats($showtimeId, $seatIds) {
        list($placeholders, $params) = $this->buildInClause($seatIds, 'seat');
        $sql =
            "SELECT t.seat_id
             FROM tickets t
             JOIN bookings b ON t.booking_id = b.id
             WHERE b.showtime_id = :showtime_id
             AND t.seat_id IN (" . implode(',', $placeholders) . ")
             AND (
                t.status = 'SOLD'
                OR (t.status = 'HOLDING' AND (t.hold_expires_at IS NULL OR t.hold_expires_at > NOW()))
             )";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':showtime_id', $showtimeId, PDO::PARAM_INT);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    private function normalizeConcessions($concessions) {
        if (!is_array($concessions)) {
            return [];
        }
        $normalized = [];
        foreach ($concessions as $item) {
            if (!is_array($item) || empty($item['id'])) {
                continue;
            }
            $id = (int)$item['id'];
            $quantity = isset($item['quantity']) ? (int)$item['quantity'] : 1;
            if ($quantity < 1) {
                continue;
            }
            if (!isset($normalized[$id])) {
                $normalized[$id] = 0;
            }
            $normalized[$id] += $quantity;
        }
        return $normalized;
    }

    private function getConcessionDetails($concessionItems) {
        $ids = array_keys($concessionItems);
        list($placeholders, $params) = $this->buildInClause($ids, 'concession');
        $sql =
            "SELECT id, name, price, is_available
             FROM concessions
             WHERE id IN (" . implode(',', $placeholders) . ")";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($rows) !== count($ids)) {
            throw new Exception('Bắp nước không hợp lệ');
        }

        $details = [];
        foreach ($rows as $row) {
            if (!(bool)$row['is_available']) {
                throw new Exception('Một số bắp nước đã ngừng bán');
            }
            $id = (int)$row['id'];
            $details[] = [
                'id' => $id,
                'name' => $row['name'],
                'price' => (float)$row['price'],
                'quantity' => $concessionItems[$id],
            ];
        }

        return $details;
    }

    private function getBaseTicketPrice() {
        $stmt = $this->db->prepare("SELECT config_value FROM system_configs WHERE config_key = 'base_ticket_price' LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && is_numeric($row['config_value'])) {
            return (float)$row['config_value'];
        }
        return isset(Config::$base_ticket_price) ? (float)Config::$base_ticket_price : 60000;
    }

    private function getSeatHoldDuration() {
        $stmt = $this->db->prepare("SELECT config_value FROM system_configs WHERE config_key = 'seat_hold_duration' LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && is_numeric($row['config_value'])) {
            return (int)$row['config_value'];
        }
        return isset(Config::$seat_hold_duration) ? (int)Config::$seat_hold_duration : 600;
    }

    private function getPricingAdjustment($startTime) {
        $stmt = $this->db->prepare(
            "SELECT condition_type, adjustment_amount
             FROM pricing_rules
             WHERE is_active = 1"
        );
        $stmt->execute();
        $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $dateTime = new DateTime($startTime);
        $dayOfWeek = (int)$dateTime->format('N'); // 6=Sat,7=Sun
        $hour = (int)$dateTime->format('H');

        $holidayDates = $this->getHolidayDates();
        $isHoliday = in_array($dateTime->format('Y-m-d'), $holidayDates, true);

        $adjustment = 0;
        foreach ($rules as $rule) {
            switch ($rule['condition_type']) {
                case 'Weekend':
                    if ($dayOfWeek >= 6) {
                        $adjustment += (float)$rule['adjustment_amount'];
                    }
                    break;
                case 'Before10AM':
                    if ($hour < 10) {
                        $adjustment += (float)$rule['adjustment_amount'];
                    }
                    break;
                case 'Holiday':
                    if ($isHoliday) {
                        $adjustment += (float)$rule['adjustment_amount'];
                    }
                    break;
                default:
                    break;
            }
        }

        return $adjustment;
    }

    private function getHolidayDates() {
        if (isset(Config::$holiday_dates) && is_array(Config::$holiday_dates)) {
            return Config::$holiday_dates;
        }
        return [];
    }

    private function generateTicketCode($bookingId, $index) {
        return sprintf('GXY-%06d-%03d', $bookingId, $index);
    }

    private function buildInClause($items, $prefix) {
        $placeholders = [];
        $params = [];
        foreach ($items as $i => $value) {
            $key = ':' . $prefix . $i;
            $placeholders[] = $key;
            $params[$key] = $value;
        }
        return [$placeholders, $params];
    }
}
