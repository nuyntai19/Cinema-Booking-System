<?php
require_once 'config/Database.php';

$db = Database::getInstance()->getConnection();

echo "=== VALID PROMOTIONS (public, not auto-apply, within date) ===\n\n";
$stmt = $db->query("
    SELECT 
        code, 
        start_date, 
        end_date, 
        description,
        discount_amount,
        discount_type,
        min_order_value,
        is_auto_apply
    FROM promotions
    WHERE is_auto_apply = 0 
      AND CURDATE() BETWEEN start_date AND end_date
    ORDER BY created_at DESC
");

$count = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $count++;
    echo "{$count}. {$row['code']}\n";
    echo "   Period: {$row['start_date']} → {$row['end_date']}\n";
    echo "   Discount: {$row['discount_amount']} {$row['discount_type']}\n";
    echo "   Min Order: {$row['min_order_value']}\n";
    echo "   Description: {$row['description']}\n\n";
}

if ($count === 0) {
    echo "No valid public promotions available.\n\n";
}

echo "=== VALID USER VOUCHERS (User 4) ===\n\n";
$stmt = $db->prepare("
    SELECT 
        uv.id,
        p.code,
        uv.status,
        p.start_date,
        p.end_date,
        p.description,
        p.discount_amount,
        p.discount_type,
        p.min_order_value
    FROM user_vouchers uv
    JOIN promotions p ON uv.promotion_id = p.id
    WHERE uv.user_id = 4 
      AND uv.status = 'ACTIVE'
      AND CURDATE() BETWEEN p.start_date AND p.end_date
    ORDER BY uv.id
");
$stmt->execute();

$count = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $count++;
    echo "{$count}. {$row['code']} (UserVoucher #{$row['id']})\n";
    echo "   Status: {$row['status']}\n";
    echo "   Period: {$row['start_date']} → {$row['end_date']}\n";
    echo "   Discount: {$row['discount_amount']} {$row['discount_type']}\n";
    echo "   Min Order: {$row['min_order_value']}\n";
    echo "   Description: {$row['description']}\n\n";
}

if ($count === 0) {
    echo "No valid vouchers for user 4.\n";
}
