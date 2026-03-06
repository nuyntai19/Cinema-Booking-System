<?php
require_once __DIR__ . '/config/Database.php';

$db = Database::getInstance()->getConnection();

// Check showtimes
$sql = "SELECT 
    sh.id, 
    sh.start_time, 
    sh.showtime_date, 
    m.title, 
    ch.name as hall,
    m.id as movie_id
FROM showtimes sh 
JOIN movies m ON sh.movie_id = m.id 
JOIN cinema_halls ch ON sh.cinema_hall_id = ch.id 
WHERE sh.id IN (1, 11)";

$stmt = $db->query($sql);
$showtimes = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Check all bookings with showtime 11
$sql2 = "SELECT 
    b.id as booking_id, 
    b.showtime_id,
    b.status as booking_status,
    t.seat_id,
    t.status as ticket_status,
    s.row_code,
    s.number
FROM bookings b
JOIN tickets t ON b.id = t.booking_id
JOIN seats s ON t.seat_id = s.id
WHERE b.showtime_id = 11";

$stmt2 = $db->query($sql2);
$bookings11 = $stmt2->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'success' => true,
    'showtimes' => $showtimes,
    'bookings_for_showtime_11' => $bookings11
], JSON_PRETTY_PRINT);
