<?php
require_once 'config/Database.php';

$db = Database::getInstance()->getConnection();

echo "=== RECENT BOOKINGS WITH DISCOUNT INFO ===\n\n";
$stmt = $db->query('
    SELECT 
        b.id, 
        b.booking_code, 
        b.user_voucher_id,
        b.discount_amount,
        b.total_price, 
        b.final_price,
        b.status,
        p.code as promo_code
    FROM bookings b
    LEFT JOIN user_vouchers uv ON b.user_voucher_id = uv.id
    LEFT JOIN promotions p ON uv.promotion_id = p.id
    ORDER BY b.created_at DESC 
    LIMIT 5
');

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "Booking ID: {$row['id']}\n";
    echo "  Code: {$row['booking_code']}\n";
    echo "  Voucher ID: " . ($row['user_voucher_id'] ?? 'NULL') . "\n";
    echo "  Promo Code: " . ($row['promo_code'] ?? 'N/A') . "\n";
    echo "  Total Price: {$row['total_price']}\n";
    echo "  Discount Amount: {$row['discount_amount']}\n";
    echo "  Final Price: {$row['final_price']}\n";
    echo "  Status: {$row['status']}\n";
    echo str_repeat('-', 50) . "\n";
}

echo "\n=== USER_VOUCHERS STATUS ===\n\n";
$stmt = $db->query('
    SELECT 
        uv.id,
        uv.user_id,
        p.code as promo_code,
        uv.status,
        COUNT(b.id) as booking_count
    FROM user_vouchers uv
    JOIN promotions p ON uv.promotion_id = p.id
    LEFT JOIN bookings b ON b.user_voucher_id = uv.id
    GROUP BY uv.id
    LIMIT 10
');

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "UserVoucher ID: {$row['id']}\n";
    echo "  User ID: {$row['user_id']}\n";
    echo "  Promo: {$row['promo_code']}\n";
    echo "  Status: {$row['status']}\n";
    echo "  Used in Bookings: {$row['booking_count']}\n";
    echo str_repeat('-', 50) . "\n";
}

echo "\n=== PROMOTIONS USAGE COUNT ===\n\n";
$stmt = $db->query('
    SELECT 
        p.id,
        p.code,
        p.usage_limit,
        (SELECT COUNT(*) FROM user_vouchers uv WHERE uv.promotion_id = p.id AND uv.status = "USED") as used_count
    FROM promotions p
    WHERE p.usage_limit IS NOT NULL
    ORDER BY p.created_at DESC
    LIMIT 10
');

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "Promotion: {$row['code']}\n";
    echo "  Limit: " . ($row['usage_limit'] ?? 'UNLIMITED') . "\n";
    echo "  Used: {$row['used_count']}\n";
    echo str_repeat('-', 50) . "\n";
}
