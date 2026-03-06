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

    public function updateBooking($id, $seatIds, $concessions, $userVoucherId) {
        return $this->bookingModel->update(
            (int)$id,
            $seatIds,
            $concessions,
            $userVoucherId ? (int)$userVoucherId : null
        );
    }

    public function getBookingsByShowtime($showtimeId) {
        return $this->bookingModel->getByShowtime((int)$showtimeId);
    }
    public function getBookingByUserAndShowtime($userId, $showtimeId) {
        return $this->bookingModel->getByUserAndShowtime((int)$userId, (int)$showtimeId);
    }

    public function createBooking($userId, $showtimeId, $seatIds, $concessions, $userVoucherId) {
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
