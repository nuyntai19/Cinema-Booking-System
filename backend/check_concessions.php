<?php
require_once __DIR__ . '/config/Database.php';

$db = Database::getInstance()->getConnection();

// Check recent bookings with concessions
$sql = "SELECT 
    b.id as booking_id,
    b.user_id,
    b.total_price,
    b.discount_amount,
    b.final_price,
    b.status,
    b.created_at,
    COUNT(t.id) as ticket_count,
    COUNT(bc.id) as concession_count
FROM bookings b
LEFT JOIN tickets t ON b.id = t.booking_id
LEFT JOIN booking_concessions bc ON b.id = bc.booking_id
WHERE b.status = 'Paid'
GROUP BY b.id
ORDER BY b.id DESC
LIMIT 5";

$stmt = $db->query($sql);
$bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Recent Paid Bookings:\n";
echo json_encode($bookings, JSON_PRETTY_PRINT);
echo "\n\n";

// Check booking_concessions details for latest booking
if (!empty($bookings)) {
    $latestId = $bookings[0]['booking_id'];
    $sql2 = "SELECT 
        bc.*,
        c.name as concession_name
    FROM booking_concessions bc
    JOIN concessions c ON bc.concession_id = c.id
    WHERE bc.booking_id = $latestId";
    
    $stmt2 = $db->query($sql2);
    $concessions = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Concessions for booking #$latestId:\n";
    echo json_encode($concessions, JSON_PRETTY_PRINT);
}
