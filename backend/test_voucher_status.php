<?php
require_once 'config/Database.php';

$db = Database::getInstance()->getConnection();

echo "=== USER VOUCHERS (User ID: 4) ===\n\n";
$stmt = $db->query("
    SELECT 
        uv.id,
        uv.user_id,
        uv.status,
        p.code,
        p.start_date,
        p.end_date,
        p.description,
        p.discount_amount,
        p.discount_type,
        p.min_order_value,
        CASE 
            WHEN uv.status != 'ACTIVE' THEN 'EXPIRED/USED'
            WHEN CURDATE() < p.start_date THEN 'NOT_STARTED'
            WHEN CURDATE() > p.end_date THEN 'ENDED'
            ELSE 'VALID'
        END as validity
    FROM user_vouchers uv
    JOIN promotions p ON uv.promotion_id = p.id
    WHERE uv.user_id = 4
    ORDER BY uv.id
");

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: {$row['id']} | Code: {$row['code']}\n";
    echo "  Status: {$row['status']}\n";
    echo "  Validity: {$row['validity']}\n";
    echo "  Period: {$row['start_date']} → {$row['end_date']}\n";
    echo "  Discount: {$row['discount_amount']} {$row['discount_type']}\n";
    echo "  Min Order: {$row['min_order_value']}\n";
    echo "  Description: {$row['description']}\n";
    echo str_repeat('-', 60) . "\n";
}

echo "\n=== ALL ACTIVE PROMOTIONS ===\n\n";
$stmt = $db->query("
    SELECT 
        id, code, start_date, end_date, is_auto_apply,
        CASE 
            WHEN CURDATE() < start_date THEN 'NOT_STARTED'
            WHEN CURDATE() > end_date THEN 'ENDED'
            ELSE 'ACTIVE'
        END as status
    FROM promotions
    ORDER BY created_at DESC
");

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "{$row['code']} | {$row['status']} | Auto: {$row['is_auto_apply']}\n";
    echo "  {$row['start_date']} → {$row['end_date']}\n";
}
