<?php
require_once 'config/Database.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = Database::getInstance()->getConnection();
    
    // Check bookings table structure
    $stmt = $db->query("DESCRIBE bookings");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $hasBookingCode = false;
    foreach($columns as $col) {
        if($col['Field'] === 'booking_code') {
            $hasBookingCode = true;
            break;
        }
    }
    
    echo json_encode([
        'has_booking_code_column' => $hasBookingCode,
        'columns' => array_column($columns, 'Field')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
