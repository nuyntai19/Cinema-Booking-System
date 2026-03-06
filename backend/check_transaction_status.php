<?php
require_once 'config/Database.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $db = Database::getInstance()->getConnection();
    
    // Get transactions table structure
    $stmt = $db->query("SHOW COLUMNS FROM transactions WHERE Field = 'status'");
    $column = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'column_info' => $column,
        'current_statuses' => []
    ], JSON_PRETTY_PRINT);
    
    // Get distinct status values
    $stmt = $db->query("SELECT DISTINCT status FROM transactions");
    $statuses = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "\n\nCurrent status values in use: " . implode(', ', $statuses);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
