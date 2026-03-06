<?php
require_once 'config/Database.php';

$db = Database::getInstance()->getConnection();

// Check booking just created
$stmt = $db->prepare("SELECT * FROM bookings ORDER BY id DESC LIMIT 3");
$stmt->execute();
$bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Recent bookings:\n";
foreach ($bookings as $booking) {
    echo "ID: {$booking['id']}, User: {$booking['user_id']}, Status: {$booking['status']}, Showtime: {$booking['showtime_id']}\n";
}

echo "\n";

// Check tickets for these bookings
echo "Tickets for recent bookings:\n";
foreach ($bookings as $booking) {
    $stmt = $db->prepare("SELECT t.*, s.row_code, s.number FROM tickets t JOIN seats s ON t.seat_id = s.id WHERE t.booking_id = :bid");
    $stmt->execute([':bid' => $booking['id']]);
    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Booking #{$booking['id']}: ";
    foreach ($tickets as $ticket) {
        echo "{$ticket['row_code']}{$ticket['number']} (status: {$ticket['status']}), ";
    }
    echo "\n";
}
