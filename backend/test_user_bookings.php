<?php
require_once 'config/Database.php';

$db = Database::getInstance()->getConnection();

// Check bookings for user_id=4 (Nguyễn Văn A)
$stmt = $db->prepare("SELECT COUNT(*) as count FROM bookings WHERE user_id = 4");
$stmt->execute();
$result = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Bookings count for user_id=4: " . $result['count'] . "\n\n";

// Get detailed booking info
$stmt = $db->prepare(
    "SELECT b.*, 
            m.title AS movie_title, 
            s.start_time, 
            c.name AS cinema_name, 
            h.name AS hall_name
     FROM bookings b
     JOIN showtimes s ON b.showtime_id = s.id
     JOIN movies m ON s.movie_id = m.id
     JOIN cinema_halls h ON s.cinema_hall_id = h.id
     JOIN cinemas c ON h.cinema_id = c.id
     WHERE b.user_id = 4"
);
$stmt->execute();
$bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Booking details:\n";
print_r($bookings);
