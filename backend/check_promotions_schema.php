<?php
require_once 'config/Database.php';

$db = Database::getInstance();
$conn = $db->getConnection();

// Kiểm tra cấu trúc bảng promotions
$sql = "SHOW COLUMNS FROM promotions";
$stmt = $conn->query($sql);
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<h3>Cấu trúc bảng PROMOTIONS:</h3><pre>";
print_r($columns);
echo "</pre>";

// Kiểm tra có cột max_discount không
$hasMaxDiscount = false;
foreach ($columns as $col) {
    if ($col['Field'] === 'max_discount') {
        $hasMaxDiscount = true;
        break;
    }
}

echo "<h3>Có cột max_discount: " . ($hasMaxDiscount ? 'YES ✓' : 'NO ✗') . "</h3>";

// Lấy danh sách promotions
$sql = "SELECT * FROM promotions ORDER BY id";
$stmt = $conn->query($sql);
$promotions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<h3>Danh sách Promotions (" . count($promotions) . " records):</h3><pre>";
print_r($promotions);
echo "</pre>";
