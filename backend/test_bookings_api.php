<?php
require_once 'config/Database.php';
require_once 'models/Booking.php';
header('Content-Type: application/json; charset=utf-8');
try {
    $db = Database::getInstance()->getConnection();
    $bookingModel = new Booking($db);
    $bookings = $bookingModel->getUserBookings(4, 1, 2);
    $booking = $bookings[0] ?? null;
    echo json_encode([
        'success' => true,
        'booking_code' => $booking['booking_code'] ?? 'N/A',
        'concessions' => $booking['concessions'] ?? [],
        'total_price' => $booking['total_price'] ?? 0
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_PRETTY_PRINT);
}
