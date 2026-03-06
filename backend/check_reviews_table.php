<?php
/**
 * Check reviews table structure
 */

require_once __DIR__ . '/config/Env.php';
require_once __DIR__ . '/config/Database.php';

Env::load(__DIR__ . '/.env');

try {
    $db = Database::getInstance()->getConnection();
    
    echo "=== Reviews Table Structure ===\n\n";
    
    // 1. Check columns
    $stmt = $db->query("DESCRIBE reviews");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Columns:\n";
    foreach ($columns as $col) {
        $hasStatus = $col['Field'] === 'status' ? ' ✅' : '';
        echo sprintf("  - %-20s %-40s %s%s\n", 
            $col['Field'], 
            $col['Type'], 
            $col['Null'] === 'NO' ? 'NOT NULL' : 'NULL',
            $hasStatus
        );
    }
    
    // 2. Check if status column exists
    $hasStatusColumn = false;
    foreach ($columns as $col) {
        if ($col['Field'] === 'status') {
            $hasStatusColumn = true;
            break;
        }
    }
    
    echo "\n";
    if ($hasStatusColumn) {
        echo "✅ Status column EXISTS\n\n";
        
        // Check data
        $stmt = $db->query("SELECT status, COUNT(*) as count FROM reviews GROUP BY status");
        $statusCounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Reviews by status:\n";
        foreach ($statusCounts as $row) {
            echo "  - {$row['status']}: {$row['count']} reviews\n";
        }
    } else {
        echo "❌ Status column MISSING - Need to run migration!\n";
        echo "\nRun: php backend/database/migrations/run_add_status_to_reviews.php\n";
    }
    
    echo "\n=== Total Records ===\n";
    $stmt = $db->query("SELECT COUNT(*) as total FROM reviews");
    $total = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Total reviews: {$total['total']}\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
