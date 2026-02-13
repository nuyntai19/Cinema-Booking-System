<?php
/**
 * Booking Service
 */
class BookingService {
    private $bookingModel;

    public function __construct($db) {
        $this->bookingModel = new Booking($db);
    }

    public function listBookings($filters, $page, $limit) {
        $bookings = $this->bookingModel->getAll($filters, $page, $limit);
        $total = $this->bookingModel->countAll($filters);

        return [$bookings, $total];
    }

    public function getBookingDetails($id) {
        return $this->bookingModel->getDetails((int)$id);
    }

    public function getBookingById($id) {
        return $this->bookingModel->getById((int)$id);
    }

    public function createBooking($userId, $showtimeId, $seatIds, $concessions, $userVoucherId) {
        $expireTime = time() + config::$seat_hold_duration;
        $jobs = [
            'hold_seats' => [
                'user_id' => (int)$userId,
                'showtime_id' => (int)$showtimeId,
                'seat_ids' => $seatIds,
                'expire_time' => $expireTime,
            ],  
        ];
        $redis = new Redis();
        $redis->connect($_ENV['REDIS_HOST'], $_ENV['REDIS_PORT']);
        $redis->zAdd('seat_holds', $expireTime, json_encode($jobs));
        
        return $this->bookingModel->create(
            (int)$userId,
            (int)$showtimeId,
            $seatIds,
            $concessions,
            $userVoucherId ? (int)$userVoucherId : null
        );
    }

    public function confirmBooking($id) {
        return $this->bookingModel->confirm((int)$id);
    }

    public function cancelBooking($id) {
        return $this->bookingModel->cancel((int)$id);
    }

    public function getUserBookings($userId, $page, $limit) {
        $bookings = $this->bookingModel->getUserBookings((int)$userId, $page, $limit);
        $total = $this->bookingModel->countUserBookings((int)$userId);

        return [$bookings, $total];
    }
}
