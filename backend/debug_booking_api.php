<?php
require_once 'config/Database.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = Database::getInstance()->getConnection();
    
    // Get latest paid booking with all details
    $query = "SELECT b.*,
        m.title AS movie_title,
        c.name AS cinema_name,
        h.name AS hall_name
    FROM bookings b
    JOIN showtimes s ON b.showtime_id = s.id
    JOIN movies m ON s.movie_id = m.id
    JOIN cinema_halls h ON s.cinema_hall_id = h.id
    JOIN cinemas c ON h.cinema_id = c.id
    WHERE b.status = 'Paid'
    ORDER BY b.created_at DESC
    LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($booking) {
        // Get concessions
        $concQuery = "SELECT bc.*, c.name AS concession_name, c.category
        FROM booking_concessions bc
        JOIN concessions c ON bc.concession_id = c.id
        WHERE bc.booking_id = ?";
        
        $concStmt = $db->prepare($concQuery);
        $concStmt->execute([$booking['id']]);
        $concessions = $concStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $booking['concessions'] = $concessions;
    }
    
    echo json_encode([
        'success' => true,
        'booking' => $booking,
        'debug' => [
            'booking_code_exists' => !empty($booking['booking_code']),
            'booking_code_value' => $booking['booking_code'] ?? 'NULL',
            'concession_count' => count($concessions ?? []),
            'concession_sample' => $concessions[0] ?? null
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
