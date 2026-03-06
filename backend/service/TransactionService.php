<?php
/**
 * Transaction Service
 */
class TransactionService {
    private $transactionModel;
    private $bookingModel;

    public function __construct($db) {
        $this->transactionModel = new Transaction($db);
        $this->bookingModel = new Booking($db);
    }

    public function getBookingById($bookingId) {
        return $this->bookingModel->getById((int)$bookingId);
    }

    public function getTransactionByBooking($bookingId) {
        return $this->transactionModel->getByBooking((int)$bookingId);
    }

    public function createTransactionForBooking($booking, $method, $amount) {
        if ($booking['status'] !== 'Pending') {
            throw new Exception('Booking is not in pending status', 400);
        }

        $existing = $this->transactionModel->getByBooking((int)$booking['id']);
        if ($existing && $existing['status'] === 'Success') {
            throw new Exception('Booking already paid', 400);
        }

        return $this->transactionModel->create((int)$booking['id'], $method, (float)$amount);
    }

    public function getHistory($userId, $page, $limit) {
        $transactions = $this->transactionModel->getByUser((int)$userId, $page, $limit);
        $total = $this->transactionModel->countByUser((int)$userId);

        return [$transactions, $total];
    }

    public function processGatewayVerification($gateway, $transactionCode, $bookingId, $status) {
        $transaction = null;
        if ($transactionCode) {
            $transaction = $this->transactionModel->getByTransactionCode($transactionCode);
        }
        if (!$transaction && $bookingId) {
            $transaction = $this->transactionModel->getByBooking((int)$bookingId);
        }

        if (!$transaction) {
            return null;
        }

        $isSuccess = $this->isSuccessStatus($gateway, $status);
        $newStatus = $isSuccess ? 'Success' : 'Failed';

        $this->transactionModel->updateStatus($transaction['transaction_code'], $newStatus);

        if ($isSuccess) {
            $this->bookingModel->confirm($transaction['booking_id']);
        }

        return [
            'transaction_code' => $transaction['transaction_code'],
            'status' => $newStatus,
        ];
    }

    public function createPaymentForBooking($gateway, $booking) {
        if ($booking['status'] !== 'Pending') {
            throw new Exception('Booking is not in pending status', 400);
        }

        $amount = $this->resolveBookingAmount($booking);
        if ($amount <= 0) {
            throw new Exception('Invalid booking amount', 400);
        }

        $transaction = $this->transactionModel->getByBooking((int)$booking['id']);
        if ($transaction && $transaction['status'] === 'Success') {
            throw new Exception('Booking already paid', 400);
        }

        if (!$transaction || $transaction['status'] === 'Failed') {
            $transaction = $this->transactionModel->create((int)$booking['id'], $gateway, $amount);
        }

        $payload = $this->buildPaymentPayload(
            $gateway,
            (int)$booking['id'],
            $transaction['transaction_code'],
            $amount
        );

        if ($gateway === 'Momo') {
            $momoPayment = PaymentService::createMoMoPayment(
                $payload['amount'],
                $payload['orderId'],
                $payload['orderInfo'],
                $payload['returnUrl'],
                $payload['notifyUrl']
            );
            return $momoPayment;
        }

        if ($gateway === 'VNPay') {
            $payUrl = PaymentService::createVNPayPayment(
                $payload['amount'],
                $payload['orderId'],
                $payload['orderInfo'],
                $payload['returnUrl']
            );
            return ['pay_url' => $payUrl];
        }

        throw new Exception('Unsupported payment gateway', 400);
    }

    private function isSuccessStatus($gateway, $status) {
        if ($gateway === 'Momo') {
            if ($status === 0 || $status === '0') {
                return true;
            }
        }
        if ($gateway === 'VNPay') {
            if ($status === '00') {
                return true;
            }
        }
        if (is_string($status)) {
            $normalized = strtolower(trim($status));
            return in_array($normalized, ['success', 'succeeded', 'paid', 'ok'], true);
        }
        return false;
    }

    private function buildPaymentPayload($gateway, $bookingId, $transactionCode, $amount) {
        $baseUrl = $this->getBaseUrl();

        if ($gateway === 'Momo') {
            $returnUrl = getenv('MOMO_RETURN_URL') ?: $baseUrl;
            $notifyUrl = getenv('MOMO_NOTIFY_URL') ?: ($baseUrl . '/api/transactions/momo/verify');
            return [
                'amount' => $amount,
                'orderId' => $transactionCode,
                'orderInfo' => 'Booking #' . $bookingId,
                'returnUrl' => $returnUrl,
                'notifyUrl' => $notifyUrl,
            ];
        }

        if ($gateway === 'VNPay') {
            $returnUrl = getenv('VNPAY_RETURN_URL') ?: $baseUrl;
            return [
                'amount' => $amount,
                'orderId' => $transactionCode,
                'orderInfo' => 'Booking #' . $bookingId,
                'returnUrl' => $returnUrl,
            ];
        }

        return [];
    }

    private function getBaseUrl() {
        $appUrl = getenv('APP_URL');
        if (!empty($appUrl)) {
            return rtrim($appUrl, '/');
        }

        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
        return $scheme . '://' . $host;
    }

    private function resolveBookingAmount($booking) {
        $final = isset($booking['final_price']) ? (float)$booking['final_price'] : 0.0;
        if ($final > 0) {
            return $final;
        }

        $total = isset($booking['total_price']) ? (float)$booking['total_price'] : 0.0;
        return $total;
    }
}
