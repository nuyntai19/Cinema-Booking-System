<?php
require_once 'config/Database.php';

$db = Database::getInstance()->getConnection();

// Add a new ACTIVE voucher for user 4 using RAUMA36 promotion
// But only if they don't already have an ACTIVE one
$stmt = $db->prepare("
    INSERT INTO user_vouchers (user_id, promotion_id, status, assigned_at)
    SELECT 4, id, 'ACTIVE', NOW()
    FROM promotions 
    WHERE code = 'RAUMA36'
    AND NOT EXISTS (
        SELECT 1 FROM user_vouchers 
        WHERE user_id = 4 
        AND promotion_id = (SELECT id FROM promotions WHERE code = 'RAUMA36')
        AND status = 'ACTIVE'
    )
");
$stmt->execute();

if ($stmt->rowCount() > 0) {
    echo "✓ Added new ACTIVE RAUMA36 voucher for user 4\n\n";
} else {
    echo "- User 4 already has ACTIVE RAUMA36 voucher\n\n";
}

// Show all user 4 vouchers
echo "=== All vouchers for user 4 ===\n\n";
$stmt = $db->query("
    SELECT 
        uv.id,
        p.code,
        uv.status,
        p.start_date,
        p.end_date,
        CASE 
            WHEN uv.status != 'ACTIVE' THEN '❌ NOT ACTIVE'
            WHEN CURDATE() < p.start_date THEN '⏳ NOT STARTED'
            WHEN CURDATE() > p.end_date THEN '⌛ EXPIRED'
            ELSE '✓ VALID'
        END as display_status
    FROM user_vouchers uv
    JOIN promotions p ON uv.promotion_id = p.id
    WHERE uv.user_id = 4
    ORDER BY uv.id DESC
");

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: {$row['id']} | {$row['code']}\n";
    echo "  DB Status: {$row['status']}\n";
    echo "  Display: {$row['display_status']}\n";
    echo "  Period: {$row['start_date']} → {$row['end_date']}\n";
    echo str_repeat('-', 50) . "\n";
}
