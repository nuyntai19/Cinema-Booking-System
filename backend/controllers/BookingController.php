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

        $userId = $data['user_id'] ?? ($_REQUEST['auth_user_id'] ?? null);
        $showtimeId = $data['showtime_id'] ?? null;

        if (!$userId || !$showtimeId || empty($seatIds)) {
            Response::validationError([
                'user_id' => 'User id is required',
                'showtime_id' => 'Showtime id is required',
                'seat_ids' => 'Seat list is required',
            ]);
        }

        self::authorizeUserId((int)$userId);

        try {
            $result = $this->bookingService->createBooking(
                (int)$userId,
                (int)$showtimeId,
                $seatIds,
                $concessions,
                $userVoucherId ? (int)$userVoucherId : null
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

    public function getUserBookings($userId) {
        AuthMiddleware::authenticate();

        $this->authorizeUserId((int)$userId);

        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : Config::$items_per_page;

        list($bookings, $total) = $this->bookingService->getUserBookings((int)$userId, $page, $limit);

        Response::paginated($bookings, $total, $page, $limit);
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

        if ($authRole === 'Admin' || $authRole === 'Manager') {
            return;
        }

        if ($authUserId !== (int)$booking['user_id']) {
            Response::forbidden('Insufficient permissions');
        }
    }

}
