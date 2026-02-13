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

        self::authorizeBookingAccess($booking);

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

        self::authorizeBookingAccess($booking);

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
        $data = $this->getRequestData();

        $transactionCode = $data['transaction_code'] ?? $data['orderId'] ?? $data['vnp_TxnRef'] ?? null;
        $bookingId = $data['booking_id'] ?? $data['orderId'] ?? null;
        $status = $data['status'] ?? $data['resultCode'] ?? $data['vnp_ResponseCode'] ?? null;

        if (!$transactionCode && !$bookingId) {
            Response::validationError([
                'transaction_code' => 'Transaction code or booking id is required',
            ]);
        }

        $result = $this->transactionService->processGatewayVerification(
            $gateway,
            $transactionCode,
            $bookingId,
            $status
        );

        if (!$result) {
            Response::notFound('Transaction not found');
        }

        Response::success($result, $gateway . ' verification processed');
    }

    public function createMoMoPayment() {
        $this->createPayment('Momo');
    }

    public function createVNPayPayment() {
        $this->createPayment('VNPay');
    }
    private static function createPayment($gateway) {
        AuthMiddleware::authenticate();

        $data = self::getRequestData();
        $bookingId = $data['booking_id'] ?? null;
        $amount = $data['amount'] ?? null;
        $gatewayResponse = null;

        if (!$bookingId || $amount === null) {
            Response::validationError([
                'booking_id' => 'Booking id is required',
                'amount' => 'Amount is required',
            ]);
        }

        $booking = self::transactionService->getBookingById((int)$bookingId);
        if (!$booking) {
            Response::notFound('Booking not found');
        }

        self::authorizeBookingAccess($booking);

        try {
            $gatewayResponse = self::transactionService->createPaymentForBooking($gateway, $booking, (float)$amount);
            Response::success($gatewayResponse, $gateway . ' payment created');
        } catch (Exception $e) {
            Response::error($e->getMessage(), $e->getCode() ?: 400);
        }
    }


    private static function authorizeBookingAccess($booking) {
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
