<?php
/**
 * Transaction Controller
 */
class TransactionController extends BaseController {
    private $db;
    private $transactionService;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->transactionService = new TransactionService($this->db);
    }

    public function create() {
        AuthMiddleware::authenticate();

        $data = self::getRequestData();
        $bookingId = $data['booking_id'] ?? null;
        $method = $data['payment_method'] ?? null;
        $amount = $data['amount'] ?? null;

        if (!$bookingId || !$method || $amount === null) {
            Response::validationError([
                'booking_id' => 'Booking id is required',
                'payment_method' => 'Payment method is required',
                'amount' => 'Amount is required',
            ]);
        }

        $booking = $this->transactionService->getBookingById((int)$bookingId);
        if (!$booking) {
            Response::notFound('Booking not found');
        }

        $this->authorizeBookingAccess($booking);

        try {
            $result = $this->transactionService->createTransactionForBooking($booking, $method, (float)$amount);
            Response::created($result, 'Transaction created');
        } catch (Exception $e) {
            Response::error($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function getByBooking($bookingId) {
        AuthMiddleware::authenticate();

        $booking = $this->transactionService->getBookingById((int)$bookingId);
        if (!$booking) {
            Response::notFound('Booking not found');
        }

        $this->authorizeBookingAccess($booking);

        $transaction = $this->transactionService->getTransactionByBooking((int)$bookingId);
        if (!$transaction) {
            Response::notFound('Transaction not found');
        }

        Response::success($transaction);
    }

    public function verifyMomo() {
        $this->verifyGateway('Momo');
    }

    public function verifyVNPay() {
        $this->verifyGateway('VNPay');
    }

    public function getHistory($userId) {
        AuthMiddleware::authenticate();

        self::authorizeUserId((int)$userId);

        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : Config::$items_per_page;

        list($transactions, $total) = $this->transactionService->getHistory((int)$userId, $page, $limit);

        Response::paginated($transactions, $total, $page, $limit);
    }

    private function verifyGateway($gateway) {
        $data = array_merge($_GET, self::getRequestData());

        try {
            $result = $this->transactionService->processGatewayVerification($gateway, $data);
            Response::success($result, $gateway . ' verification processed');
        } catch (Exception $e) {
            Response::error($e->getMessage(), $e->getCode() ?: 400);
        }
    }

    public function createMoMoPayment() {
        $this->createPayment('Momo');
    }

    public function createVNPayPayment() {
        $this->createPayment('VNPay');
    }

    private function createPayment($gateway) {
        AuthMiddleware::authenticate();

        $data = self::getRequestData();
        $bookingId = $data['booking_id'] ?? null;
        $isPos = !empty($data['is_pos']);
        $gatewayResponse = null;

        if (!$bookingId) {
            Response::validationError([
                'booking_id' => 'Booking id is required',
            ]);
        }

        $booking = $this->transactionService->getBookingById((int)$bookingId);
        if (!$booking) {
            Response::notFound('Booking not found');
        }

        $this->authorizeBookingAccess($booking);

        try {
            // Amount is resolved server-side from booking final price.
            $gatewayResponse = $this->transactionService->createPaymentForBooking($gateway, $booking, [
                'is_pos' => $isPos,
            ]);
            Response::success($gatewayResponse, $gateway . ' payment created');
        } catch (Exception $e) {
            Response::error($e->getMessage(), $e->getCode() ?: 400);
        }
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
