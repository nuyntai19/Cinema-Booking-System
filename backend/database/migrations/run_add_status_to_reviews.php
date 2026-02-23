<?php
/**
 * Run Migration: Add status column to reviews table
 */

require_once __DIR__ . '/../../config/Env.php';
require_once __DIR__ . '/../../config/Config.php';
require_once __DIR__ . '/../../config/Database.php';

// Load environment variables
Env::load(__DIR__ . '/../../.env');

try {
    $db = Database::getInstance()->getConnection();
    
    echo "Starting migration: Add status to reviews...\n";
    
    // Check if column already exists
    $checkSql = "SHOW COLUMNS FROM reviews LIKE 'status'";
    $stmt = $db->query($checkSql);
    $columnExists = $stmt->rowCount() > 0;
    
    if ($columnExists) {
        echo "✅ Column 'status' already exists in reviews table.\n";
    } else {
        // Add status column
        echo "Adding status column...\n";
        $db->exec("
            ALTER TABLE reviews 
            ADD COLUMN status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending' 
            COMMENT 'Review moderation status' 
            AFTER comment
        ");
        echo "✅ Status column added successfully.\n";
        
        // Add index
        echo "Adding index for status...\n";
        $db->exec("ALTER TABLE reviews ADD INDEX idx_status (status)");
        echo "✅ Index added successfully.\n";
        
        // Update existing reviews to Approved
        echo "Updating existing reviews to Approved...\n";
        $db->exec("UPDATE reviews SET status = 'Approved' WHERE status IS NULL");
        echo "✅ Existing reviews updated.\n";
    }
    
    // Show table structure
    echo "\n=== Reviews Table Structure ===\n";
    $stmt = $db->query("DESCRIBE reviews");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $col) {
        echo sprintf("%-20s %-30s %s\n", 
            $col['Field'], 
            $col['Type'], 
            $col['Null'] === 'NO' ? 'NOT NULL' : 'NULL'
        );
    }
    
    // Count reviews by status
    echo "\n=== Reviews Count by Status ===\n";
    $stmt = $db->query("SELECT status, COUNT(*) as count FROM reviews GROUP BY status");
    $counts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($counts as $row) {
        echo sprintf("%-20s: %d reviews\n", $row['status'], $row['count']);
    }
    
    echo "\n✅ Migration completed successfully!\n";
    
} catch (PDOException $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
