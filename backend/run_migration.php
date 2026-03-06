<?php
require_once 'config/Database.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $db = Database::getInstance()->getConnection();
    
    $sql = file_get_contents(__DIR__ . '/database/migrations/add_booking_code.sql');
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            echo "Executing: " . substr($statement, 0, 100) . "...\n";
            $db->exec($statement);
            echo "✓ Success\n\n";
        }
    }
    
    echo "\n=== Migration completed successfully! ===\n";
    
    // Verify
    $stmt = $db->query("SELECT booking_code FROM bookings LIMIT 3");
    $samples = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Sample booking codes: " . implode(', ', $samples) . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}
