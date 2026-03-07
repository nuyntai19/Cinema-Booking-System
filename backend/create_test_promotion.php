<?php
require_once 'config/Database.php';

$db = Database::getInstance()->getConnection();

// Create a new test promotion
$code = 'TEST_' . strtoupper(substr(md5(time()), 0, 6));
$stmt = $db->prepare("
    INSERT INTO promotions (
        code, 
        description, 
        discount_amount, 
        discount_type, 
        min_order_value, 
        start_date, 
        end_date, 
        is_auto_apply, 
        usage_limit
    ) VALUES (
        :code,
        'Test promotion - Giảm 5%',
        5.00,
        'PERCENT',
        50000.00,
        CURDATE(),
        DATE_ADD(CURDATE(), INTERVAL 7 DAY),
        0,
        50
    )
");
$stmt->execute([':code' => $code]);

echo "✓ Created test promotion: {$code}\n";
echo "  Discount: 5% (min order: 50,000đ)\n";
echo "  Valid: " . date('Y-m-d') . " → " . date('Y-m-d', strtotime('+7 days')) . "\n\n";

// Show all valid public promotions
echo "=== VALID PUBLIC PROMOTIONS ===\n\n";
$stmt = $db->query("
    SELECT code, description, discount_amount, discount_type, min_order_value
    FROM promotions
    WHERE is_auto_apply = 0 
      AND CURDATE() BETWEEN start_date AND end_date
    ORDER BY created_at DESC
");

$count = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $count++;
    echo "{$count}. {$row['code']}\n";
    echo "   {$row['description']}\n";
    echo "   Discount: {$row['discount_amount']} {$row['discount_type']}\n";
    echo "   Min: {$row['min_order_value']}\n\n";
}

echo "Total: {$count} valid public promotions\n";
