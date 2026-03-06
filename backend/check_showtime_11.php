<?php
require_once __DIR__ . '/config/Database.php';

$db = Database::getInstance()->getConnection();

// Find which hall showtime 11 uses
$sql = "SELECT sh.id, sh.cinema_hall_id, sh.start_time, 
        m.title, ch.name as hall_name
FROM showtimes sh
JOIN movies m ON sh.movie_id = m.id
JOIN cinema_halls ch ON sh.cinema_hall_id = ch.id
WHERE sh.id = 11";

$stmt = $db->query($sql);
$showtime = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Showtime 11:\n";
echo json_encode($showtime, JSON_PRETTY_PRINT);
echo "\n\n";

// Get first few seats of this hall
if ($showtime) {
    $sql2 = "SELECT id, row_code, number 
            FROM seats 
            WHERE cinema_hall_id = {$showtime['cinema_hall_id']} 
            ORDER BY row_code, number 
            LIMIT 10";
    $stmt2 = $db->query($sql2);
    $seats = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    echo "First 10 seats of this hall:\n";
    echo json_encode($seats, JSON_PRETTY_PRINT);
}
