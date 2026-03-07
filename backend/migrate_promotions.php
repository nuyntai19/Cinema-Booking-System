<?php
require_once 'config/Database.php';

$db = Database::getInstance();
$conn = $db->getConnection();

echo "<h2>MIGRATION: Update Promotions Table</h2>";

try {
    // Step 1: Add max_discount column
    echo "<h3>Step 1: Adding max_discount column...</h3>";
    
    // Check if column exists
    $checkStmt = $conn->query("SHOW COLUMNS FROM promotions WHERE Field = 'max_discount'");
    $columnExists = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$columnExists) {
        $sql = "ALTER TABLE promotions 
                ADD COLUMN max_discount DECIMAL(10,2) DEFAULT NULL 
                COMMENT 'Số tiền giảm tối đa (chỉ áp dụng cho loại PERCENT)'";
        $conn->exec($sql);
        echo "✓ Column max_discount added successfully<br>";
    } else {
        echo "✓ Column max_discount already exists (skipped)<br>";
    }

    // Step 2: Insert new promotions
    echo "<h3>Step 2: Inserting new promotions...</h3>";
    
    $newPromotions = [
        ['REWARD_20K', 'Voucher giảm 20.000đ (đổi điểm)', 20000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL],
        ['REWARD_50K', 'Voucher giảm 50.000đ (đổi điểm)', 50000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL],
        ['REWARD_FREE', 'Voucher vé miễn phí (đổi điểm)', 90000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL],
        ['WELCOME_NEW', 'Chào mừng thành viên mới - Giảm 30K', 30000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL],
        ['TIER_SILVER', 'Chúc mừng lên hạng Bạc - Giảm 30K', 30000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL],
        ['TIER_GOLD', 'Chúc mừng lên hạng Vàng - Giảm 50K', 50000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL],
        ['TIER_PLATINUM', 'Chúc mừng lên hạng Kim Cương - Giảm 100K', 100000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL],
    ];

    $insertStmt = $conn->prepare(
        "INSERT INTO promotions (code, description, discount_amount, discount_type, min_order_value, start_date, end_date, is_auto_apply, usage_limit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)"
    );

    $insertedCount = 0;
    foreach ($newPromotions as $promo) {
        $insertStmt->execute($promo);
        $insertedCount++;
        echo "✓ Inserted: {$promo[0]} - {$promo[1]}<br>";
    }

    echo "<br><strong>Total new promotions inserted: $insertedCount</strong><br>";

    // Step 3: Verify results
    echo "<h3>Step 3: Verification</h3>";
    $stmt = $conn->query("SELECT COUNT(*) as total FROM promotions");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✓ Total promotions in database: {$result['total']}<br>";

    $stmt = $conn->query("SHOW COLUMNS FROM promotions WHERE Field = 'max_discount'");
    $hasColumn = $stmt->fetch(PDO::FETCH_ASSOC);
    echo $hasColumn ? "✓ Column 'max_discount' exists<br>" : "✗ Column 'max_discount' NOT found<br>";

    echo "<h3>✅ Migration completed successfully!</h3>";

    // Display all promotions
    echo "<h3>All Promotions:</h3>";
    $stmt = $conn->query("SELECT id, code, description, discount_amount, discount_type FROM promotions ORDER BY id");
    $allPromos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($allPromos);
    echo "</pre>";

} catch (Exception $e) {
    echo "<h3 style='color: red;'>❌ Error: " . $e->getMessage() . "</h3>";
}
