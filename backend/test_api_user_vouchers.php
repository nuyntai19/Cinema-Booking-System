<?php
require_once 'config/Database.php';

$db = Database::getInstance()->getConnection();

// Simulate API call to /vouchers/user/4
$userId = 4;

echo "=== API: GET /vouchers/user/{$userId} ===\n\n";

$stmt = $db->prepare("
    SELECT 
        uv.id,
        uv.user_id,
        uv.promotion_id,
        uv.status,
        uv.assigned_at,
        uv.used_at,
        p.code as promo_code,
        p.description,
        p.discount_amount,
        p.discount_type,
        p.min_order_value,
        p.max_discount,
        p.start_date,
        p.end_date,
        p.is_auto_apply
    FROM user_vouchers uv
    JOIN promotions p ON uv.promotion_id = p.id
    WHERE uv.user_id = :user_id
    ORDER BY uv.id DESC
");
$stmt->execute([':user_id' => $userId]);
$vouchers = $stmt->fetchAll(PDO::FETCH_ASSOC);

$response = [
    'success' => true,
    'data' => [
        'vouchers' => $vouchers
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT);
echo "\n\n";

echo "=== SHOULD DISPLAY (ACTIVE + valid date) ===\n\n";
$count = 0;
foreach ($vouchers as $v) {
    $today = date('Y-m-d');
    $isActive = $v['status'] === 'ACTIVE';
    $inDateRange = $today >= $v['start_date'] && $today <= $v['end_date'];
    
    if ($isActive && $inDateRange) {
        $count++;
        echo "{$count}. {$v['promo_code']} (UserVoucher #{$v['id']})\n";
        echo "   Status: {$v['status']}\n";
        echo "   Period: {$v['start_date']} → {$v['end_date']}\n";
        echo "   Discount: {$v['discount_amount']} {$v['discount_type']}\n\n";
    }
}

if ($count === 0) {
    echo "❌ NO VALID VOUCHERS\n";
}
