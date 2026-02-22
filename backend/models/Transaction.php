<?php
/**
 * Transaction Model
 */
class Transaction {
    private $db;

    public function __construct($db) {
        $this->db=$db;
    }

    public function create($bookingId, $method, $amount) {
        $transactionCode = $this->generateTransactionCode($method, $bookingId);

        $stmt = $this->db->prepare(
            "INSERT INTO transactions (booking_id, payment_method, amount, transaction_code, status)
             VALUES (:booking_id, :payment_method, :amount, :transaction_code, 'Pending')"
        );
        $stmt->execute([
            ':booking_id' => $bookingId,
            ':payment_method' => $method,
            ':amount' => $amount,
            ':transaction_code' => $transactionCode,
        ]);

        return [
            'id' => (int)$this->db->lastInsertId(),
            'transaction_code' => $transactionCode,
            'status' => 'Pending',
        ];
    }

    public function getByBooking($bookingId) {
        $stmt = $this->db->prepare(
            "SELECT * FROM transactions WHERE booking_id = :booking_id ORDER BY created_at DESC LIMIT 1"
        );
        $stmt->execute([':booking_id' => $bookingId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateStatus($transactionCode, $status) {
        $stmt = $this->db->prepare(
            "UPDATE transactions SET status = :status WHERE transaction_code = :transaction_code"
        );
        return $stmt->execute([
            ':status' => $status,
            ':transaction_code' => $transactionCode,
        ]);
    }

    public function getByUser($userId, $page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;
        $stmt = $this->db->prepare(
            "SELECT t.*, b.user_id, m.title AS movie_title, s.start_time
             FROM transactions t
             JOIN bookings b ON t.booking_id = b.id
             JOIN showtimes s ON b.showtime_id = s.id
             JOIN movies m ON s.movie_id = m.id
             WHERE b.user_id = :user_id
             ORDER BY t.created_at DESC
             LIMIT :limit OFFSET :offset"
        );
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function countByUser($userId) {
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) AS total FROM transactions t
             JOIN bookings b ON t.booking_id = b.id
             WHERE b.user_id = :user_id"
        );
        $stmt->execute([':user_id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)$row['total'];
    }

    public function getByTransactionCode($transactionCode) {
        $stmt = $this->db->prepare("SELECT * FROM transactions WHERE transaction_code = :transaction_code");
        $stmt->execute([':transaction_code' => $transactionCode]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function generateTransactionCode($method, $bookingId) {
        $prefix = strtoupper(preg_replace('/\s+/', '', $method));
        $random = strtoupper(substr(md5(uniqid((string)$bookingId, true)), 0, 6));
        return $prefix . '-' . date('YmdHis') . '-' . $bookingId . '-' . $random;
    }
}
