<?php
/**
 * Booking Controller
 */
class BookingController extends BaseController {
    private $db;
    private $bookingService;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->bookingService = new BookingService($this->db);
    }

    public function index() {
        AuthMiddleware::requireRole(['Admin', 'Manager']);

        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : Config::$items_per_page;

        $filters = [
            'status' => $_GET['status'] ?? null,
            'user_id' => $_GET['user_id'] ?? null,
            'showtime_id' => $_GET['showtime_id'] ?? null,
        ];

        list($bookings, $total) = $this->bookingService->listBookings($filters, $page, $limit);

        Response::paginated($bookings, $total, $page, $limit);
    }

    public function show($id) {
        AuthMiddleware::authenticate();

        $booking = $this->bookingService->getBookingDetails($id);
        if (!$booking) {
            Response::notFound('Booking not found');
        }

        self::authorizeBookingAccess($booking);

        Response::success($booking);
    }

    public function create() {
        AuthMiddleware::authenticate();

        $data = self::getRequestData();
        $seatIds = $this->extractSeatIds($data);
        $concessions = $data['concessions'] ?? [];
        $userVoucherId = $data['user_voucher_id'] ?? null;

        // Support both user_id (authenticated user) and guest_customer_id (POS walk-in)
        $guestCustomerId = $data['guest_customer_id'] ?? null;
        $userId = $guestCustomerId
            ? null
            : ($data['user_id'] ?? ($_REQUEST['auth_user_id'] ?? null));
        $showtimeId = $data['showtime_id'] ?? null;

        if (!$showtimeId || empty($seatIds)) {
            Response::validationError([
                'showtime_id' => 'Showtime id is required',
                'seat_ids' => 'Seat list is required',
            ]);
        }

        // Must have either user_id OR guest_customer_id
        if (!$userId && !$guestCustomerId) {
            Response::validationError([
                'user_id' => 'Either user_id or guest_customer_id is required',
            ]);
        }

        // If using user_id, authorize it (must be self or staff/admin for POS)
        if ($userId && !self::authorizeUserId((int)$userId, true)) {
            Response::forbidden('You do not have permission to create booking for this user');
        }

        try {
            $result = $this->bookingService->createBooking(
                $userId ? (int)$userId : null,
                (int)$showtimeId,
                $seatIds,
                $concessions,
                $userVoucherId ? (int)$userVoucherId : null,
                $guestCustomerId ? (int)$guestCustomerId : null  // Add guest_customer_id param
            );
            Response::created($result, 'Booking created successfully');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function confirm($id) {
        AuthMiddleware::authenticate();

        $booking = $this->bookingService->getBookingById($id);
        if (!$booking) {
            Response::notFound('Booking not found');
        }

        self::authorizeBookingAccess($booking);

        if ($booking['status'] !== 'Pending') {
            Response::error('Booking cannot be confirmed', 400);
        }

        try {
            $this->bookingService->confirmBooking($id);
            Response::success(['booking_id' => $id], 'Booking confirmed');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function cancel($id) {
        AuthMiddleware::authenticate();

        $booking = $this->bookingService->getBookingById($id);
        if (!$booking) {
            Response::notFound('Booking not found');
        }

        $this->authorizeBookingAccess($booking);

        if (!in_array($booking['status'], ['Pending', 'Paid'], true)) {
            Response::error('Booking cannot be cancelled', 400);
        }

        try {
            $this->bookingService->cancelBooking($id);
            Response::success(['booking_id' => $id], 'Booking cancelled');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function refund($id) {
        AuthMiddleware::authenticate();
        AuthMiddleware::requireRole(['Admin', 'Manager']);

        $booking = $this->bookingService->getBookingById($id);
        if (!$booking) {
            Response::notFound('Booking not found');
        }

        if (!in_array($booking['status'], ['Pending', 'Paid'], true)) {
            Response::error('Booking cannot be refunded', 400);
        }

        try {
            $this->bookingService->refundBooking($id);
            Response::success(['booking_id' => $id], 'Booking refunded');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }

    public function getUserBookings($userId) {
        AuthMiddleware::authenticate();

        $this->authorizeUserId((int)$userId);

        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : Config::$items_per_page;

        list($bookings, $total) = $this->bookingService->getUserBookings((int)$userId, $page, $limit);

        Response::paginated($bookings, $total, $page, $limit);
    }

    private function getStaffCinemaId() {
        $staffUserId = (int)($_REQUEST['auth_user_id'] ?? 0);
        if ($staffUserId <= 0) return null;
        
        $stmt = $this->db->prepare("SELECT cinema_id FROM cinema_staff WHERE user_id = :uid LIMIT 1");
        $stmt->execute([':uid' => $staffUserId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? (int)$row['cinema_id'] : null;
    }

    public function getPosPaymentHistory() {
        AuthMiddleware::authenticate();

        $authRole = $_REQUEST['auth_user_role'] ?? null;
        if (!in_array($authRole, ['Admin', 'Manager', 'Staff'], true)) {
            Response::forbidden('Insufficient permissions');
        }
        
        $cinemaId = null;
        if ($authRole === 'Staff' || $authRole === 'Manager') {
            $cinemaId = $this->getStaffCinemaId();
        }

        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;

        $filters = [
            'phone' => $_GET['phone'] ?? null,
            'booking_code' => $_GET['booking_code'] ?? null,
            'movie_title' => $_GET['movie_title'] ?? null,
            'booking_status' => $_GET['booking_status'] ?? null,
            'payment_status' => $_GET['payment_status'] ?? null,
            'date_from' => $_GET['date_from'] ?? null,
            'date_to' => $_GET['date_to'] ?? null,
            'cinema_id' => $cinemaId,
        ];

        list($items, $total) = $this->bookingService->getPosPaymentHistory($filters, $page, $limit);

        Response::paginated($items, $total, $page, $limit);
    }

    public function getBookingsByShowtime($showtimeId) {
        AuthMiddleware::authenticate();

        $bookings = $this->bookingService->getBookingsByShowtime((int)$showtimeId);

        Response::success($bookings);
    }
    public function getBookingByUserAndShowtime($userId, $showtimeId) {
        AuthMiddleware::authenticate();

        $this->authorizeUserId((int)$userId);

        $booking = $this->bookingService->getBookingByUserAndShowtime((int)$userId, (int)$showtimeId);

        Response::success($booking);
    }
    public function update($id) {
        AuthMiddleware::authenticate();

        $booking = $this->bookingService->getBookingById($id);
        if (!$booking) {
            Response::notFound('Booking not found');
        }

        self::authorizeBookingAccess($booking);

        if ($booking['status'] !== 'Pending') {
            Response::error('Only pending bookings can be updated', 400);
        }

        $data = self::getRequestData();
        $seatIds = $this->extractSeatIds($data);
        $concessions = $data['concessions'] ?? [];
        $userVoucherId = $data['user_voucher_id'] ?? null;

        try {
            $result = $this->bookingService->updateBooking(
                (int)$id,
                $seatIds,
                $concessions,
                $userVoucherId ? (int)$userVoucherId : null
            );
            Response::success($result, 'Booking updated successfully');
        } catch (Exception $e) {
            Response::error($e->getMessage(), 400);
        }
    }
    private function extractSeatIds($data) {
        $seatIds = $data['seat_ids'] ?? $data['seats'] ?? [];
        if (!is_array($seatIds)) {
            return [];
        }

        $result = [];
        foreach ($seatIds as $seat) {
            if (is_array($seat) && isset($seat['id'])) {
                $result[] = (int)$seat['id'];
            } else {
                $result[] = (int)$seat;
            }
        }
        return array_values(array_filter($result));
    }

    private function authorizeBookingAccess($booking) {
        $authUserId = (int)($_REQUEST['auth_user_id'] ?? 0);
        $authRole = $_REQUEST['auth_user_role'] ?? null;

        if ($authRole === 'Admin' || $authRole === 'Manager' || $authRole === 'Staff') {
            return;
        }

        if ($authUserId !== (int)$booking['user_id']) {
            Response::forbidden('Insufficient permissions');
        }
    }

}
