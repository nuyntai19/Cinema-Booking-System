<?php
require_once __DIR__ . '/config/Database.php';

$db = Database::getInstance()->getConnection();

// Check paid bookings and their tickets
$sql = "SELECT 
    b.id as booking_id, 
    b.showtime_id, 
    b.status as booking_status,
    b.created_at,
    t.id as ticket_id,
    t.seat_id, 
    t.status as ticket_status,
    t.ticket_code,
    s.row_code,
    s.number
FROM bookings b 
JOIN tickets t ON b.id = t.booking_id 
JOIN seats s ON t.seat_id = s.id
WHERE b.status = 'Paid' 
ORDER BY b.id DESC 
LIMIT 10";

$stmt = $db->query($sql);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'success' => true,
    'data' => $results
], JSON_PRETTY_PRINT);
