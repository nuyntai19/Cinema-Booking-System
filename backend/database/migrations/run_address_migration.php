<?php
/**
 * Run Cinema Address Migration
 */

require_once __DIR__ . '/../../config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    echo "Starting Cinema Address Migration...\n";

    $columnsToAdd = [
        'street' => "VARCHAR(255) DEFAULT NULL",
        'district' => "VARCHAR(100) DEFAULT NULL",
        'city' => "VARCHAR(100) DEFAULT NULL",
        'lat' => "DECIMAL(10, 8) DEFAULT NULL",
        'lng' => "DECIMAL(11, 8) DEFAULT NULL"
    ];

    foreach ($columnsToAdd as $column => $definition) {
        $checkQuery = "SHOW COLUMNS FROM cinemas LIKE '$column'";
        $stmt = $db->query($checkQuery);
        $result = $stmt->fetchAll();

        if (count($result) > 0) {
            echo "Column '$column' already exists. Skipping...\n";
        } else {
            $sql = "ALTER TABLE cinemas ADD COLUMN $column $definition";
            if ($db->exec($sql) !== false) {
                echo "✓ Column '$column' added successfully\n";
            } else {
                throw new Exception("Error adding column '$column'");
            }
        }
    }

    echo "\n✓ Cinema Address migration completed successfully!\n";

} catch (Exception $e) {
    echo "\n✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
