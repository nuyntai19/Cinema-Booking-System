<?php
require_once 'config/Database.php';

$db = Database::getInstance()->getConnection();

// Check total promotions in database
$stmt = $db->query('SELECT COUNT(*) as total FROM promotions');
$totalPromos = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
echo "Total promotions in database: $totalPromos\n\n";

// Check total user_vouchers for user 4
$stmt = $db->prepare('SELECT COUNT(*) as total FROM user_vouchers WHERE user_id = 4');
$stmt->execute();
$totalVouchers = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
echo "Total user_vouchers for user 4: $totalVouchers\n\n";

// Get all user_vouchers for user 4 with details
$stmt = $db->prepare('
    SELECT 
        uv.id,
        uv.promotion_id,
        uv.status,
        uv.used_at,
        p.code as promo_code,
        p.description
    FROM user_vouchers uv
    LEFT JOIN promotions p ON uv.promotion_id = p.id
    WHERE uv.user_id = 4
    ORDER BY uv.id
');
$stmt->execute();
$vouchers = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "All vouchers for user 4:\n";
foreach ($vouchers as $v) {
    echo sprintf(
        "ID: %d | Promo: %s | Status: %s | Used: %s\n",
        $v['id'],
        $v['promo_code'],
        $v['status'],
        $v['used_at'] ?? 'No'
    );
}
