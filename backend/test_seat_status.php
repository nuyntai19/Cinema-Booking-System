<?php
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/config/Config.php';

$db = Database::getInstance()->getConnection();

// Test getSeatStatus logic for seat F5 (id=55) with showtime 1
$seat_id = 55;
$showtime_id = 1;

echo "Testing seat_id=$seat_id, showtime_id=$showtime_id\n\n";

// Check SOLD
$sql = "SELECT t.status, b.status as booking_status, b.id as booking_id
        FROM tickets t
        JOIN bookings b ON t.booking_id = b.id
        WHERE t.seat_id = :seat_id 
        AND b.showtime_id = :showtime_id
        AND b.status IN ('Paid', 'Confirmed')
        AND t.status IN ('SOLD', 'USED')
        ORDER BY t.created_at DESC
        LIMIT 1";

$stmt = $db->prepare($sql);
$stmt->execute([':seat_id' => $seat_id, ':showtime_id' => $showtime_id]);
$sold = $stmt->fetch(PDO::FETCH_ASSOC);

echo "SOLD check result:\n";
echo json_encode($sold, JSON_PRETTY_PRINT);
echo "\n\n";

// Check HOLDING
$holdDuration = 600;
$sql2 = "SELECT t.status, b.status as booking_status, b.id as booking_id, 
        TIMESTAMPDIFF(SECOND, b.created_at, NOW()) as seconds_elapsed
        FROM tickets t
        JOIN bookings b ON t.booking_id = b.id
        WHERE t.seat_id = :seat_id 
        AND b.showtime_id = :showtime_id
        AND b.status = 'Pending'
        AND t.status = 'HOLDING'
        AND TIMESTAMPDIFF(SECOND, b.created_at, NOW()) < :hold_duration
        ORDER BY t.created_at DESC
        LIMIT 1";

$stmt2 = $db->prepare($sql2);
$stmt2->execute([
    ':seat_id' => $seat_id, 
    ':showtime_id' => $showtime_id, 
    ':hold_duration' => $holdDuration
]);
$holding = $stmt2->fetch(PDO::FETCH_ASSOC);

echo "HOLDING check result:\n";
echo json_encode($holding, JSON_PRETTY_PRINT);
echo "\n\n";

// Show final conclusion
$status = $sold ? 'SOLD' : ($holding ? 'HOLDING' : 'Available');
echo "Final status: $status\n";
