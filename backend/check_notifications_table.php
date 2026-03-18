<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/check_notif_test.log');

file_put_contents(__DIR__ . '/check_notif_test.log', "=== TEST START ===\n", FILE_APPEND);

try {
    file_put_contents(__DIR__ . '/check_notif_test.log', "Requiring Database...\n", FILE_APPEND);
    require_once __DIR__ . '/config/Database.php';
    
    file_put_contents(__DIR__ . '/check_notif_test.log', "Getting DB connection...\n", FILE_APPEND);
    $db = Database::getInstance()->getConnection();
    
    file_put_contents(__DIR__ . '/check_notif_test.log', "Checking notifications table count...\n", FILE_APPEND);
    $stmt = $db->query("SELECT COUNT(*) as count FROM notifications");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $count = $result['count'] ?? 0;
    
    file_put_contents(__DIR__ . '/check_notif_test.log', "Notifications count: $count\n", FILE_APPEND);
    
    // Show first 3 records
    $stmt = $db->query("SELECT id, title, type, target_audience, status, created_at FROM notifications ORDER BY created_at DESC LIMIT 3");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    file_put_contents(__DIR__ . '/check_notif_test.log', "Sample records:\n", FILE_APPEND);
    foreach ($rows as $row) {
        file_put_contents(__DIR__ . '/check_notif_test.log', json_encode($row) . "\n", FILE_APPEND);
    }
    
    file_put_contents(__DIR__ . '/check_notif_test.log', "=== TEST SUCCESS ===\n", FILE_APPEND);
    
    echo "✓ Check completed. See check_notif_test.log for details:\n";
    echo "Total notifications: $count\n";
    echo "Sample records: " . count($rows) . "\n";
    
} catch (Throwable $e) {
    file_put_contents(__DIR__ . '/check_notif_test.log', "ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
    file_put_contents(__DIR__ . '/check_notif_test.log', "TRACE: " . $e->getTraceAsString() . "\n", FILE_APPEND);
    echo "Error: " . $e->getMessage() . "\n";
}

