<?php
require_once __DIR__ . '/backend/config/Database.php';

try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->query("DESCRIBE cinemas");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "=== CINEMAS TABLE STRUCTURE ===\n";
    foreach ($columns as $column) {
        printf("%-30s %-20s %-10s\n", $column['Field'], $column['Type'], $column['Null']);
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
