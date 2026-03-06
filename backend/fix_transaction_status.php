<?php
require_once 'config/Database.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $db = Database::getInstance()->getConnection();
    
    // Count before
    $stmt = $db->query("SELECT COUNT(*) as count FROM transactions WHERE status = 'Pending'");
    $before = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Before: {$before['count']} transactions with status 'Pending'\n\n";
    
    // Update transactions
    $sql = "UPDATE transactions t
            JOIN bookings b ON t.booking_id = b.id
            SET t.status = 'Success'
            WHERE b.status = 'Paid' AND t.status = 'Pending'";
    
    $affected = $db->exec($sql);
    echo "✓ Updated {$affected} transactions to 'Success'\n\n";
    
    // Count after
    $stmt = $db->query("SELECT COUNT(*) as count FROM transactions WHERE status = 'Pending'");
    $after = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "After: {$after['count']} transactions with status 'Pending'\n";
    
    $stmt = $db->query("SELECT COUNT(*) as count FROM transactions WHERE status = 'Success'");
    $completed = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Success: {$completed['count']} transactions with status 'Success'\n\n";
    
    // Show sample updated transactions
    $stmt = $db->query("SELECT t.id, t.transaction_code, t.status, b.status as booking_status 
                        FROM transactions t 
                        JOIN bookings b ON t.booking_id = b.id 
                        WHERE t.status = 'Success' 
                        ORDER BY t.created_at DESC 
                        LIMIT 5");
    $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Sample updated transactions:\n";
    foreach ($samples as $tx) {
        echo "  - Transaction #{$tx['id']} ({$tx['transaction_code']}): {$tx['status']} (Booking: {$tx['booking_status']})\n";
    }
    
    echo "\n=== Migration completed successfully! ===\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
