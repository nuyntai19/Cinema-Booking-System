<?php
/**
 * Migration Runner
 * Run: php run_migration.php
 */

require_once __DIR__ . '/../../config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    echo "Running migration: Add director and cast columns...\n";
    
    // Check if director column already exists
    $checkQuery = "SHOW COLUMNS FROM movies LIKE 'director'";
    $stmt = $db->query($checkQuery);
    $result = $stmt->fetchAll();
    
    if (count($result) > 0) {
        echo "Column 'director' already exists. Skipping...\n";
    } else {
        // Add director column
        $sql = "ALTER TABLE movies 
                ADD COLUMN director VARCHAR(255) NULL COMMENT 'Movie director(s)' AFTER description";
        
        if ($db->exec($sql) !== false) {
            echo "✓ Column 'director' added successfully\n";
        } else {
            throw new Exception("Error adding director column");
        }
    }
    
    // Check cast column
    $checkQuery = "SHOW COLUMNS FROM movies LIKE 'cast'";
    $stmt = $db->query($checkQuery);
    $result = $stmt->fetchAll();
    
    if (count($result) > 0) {
        echo "Column 'cast' already exists. Skipping...\n";
    } else {
        // Add cast column
        $sql = "ALTER TABLE movies 
                ADD COLUMN cast TEXT NULL COMMENT 'Movie cast (comma-separated names)' AFTER director";
        
        if ($db->exec($sql) !== false) {
            echo "✓ Column 'cast' added successfully\n";
        } else {
            throw new Exception("Error adding cast column");
        }
    }
    
    echo "\n✓ Migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "\n✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
