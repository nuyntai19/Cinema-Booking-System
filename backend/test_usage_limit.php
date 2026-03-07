<?php
/**
 * Test script to verify usage_limit validation
 * Run: php test_usage_limit.php
 */

require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/models/Promotion.php';
require_once __DIR__ . '/models/UserVoucher.php';

echo "=== Testing Usage Limit Validation ===\n\n";

// Test 1: Check if UserVoucher::getByUser includes usage_limit and used_count
echo "1. Checking UserVoucher data for user_id=4:\n";
$voucherModel = new UserVoucher();
$vouchers = $voucherModel->getByUser(4, null); // Get all vouchers
echo "Total vouchers: " . count($vouchers) . "\n\n";

foreach ($vouchers as $v) {
    $code = $v['promo_code'] ?? $v['voucher_code'];
    $usageLimit = $v['usage_limit'] ?? 'NULL';
    $usedCount = $v['used_count'] ?? 'NULL';
    $remaining = ($usageLimit !== 'NULL' && $usedCount !== 'NULL') 
        ? max(0, $usageLimit - $usedCount) 
        : 'N/A';
    
    echo "  - {$code}: limit={$usageLimit}, used={$usedCount}, remaining={$remaining}\n";
}

// Test 2: Check if Promotion::getActive includes used_count
echo "\n2. Checking Active Promotions:\n";
$promoModel = new Promotion();
$promos = $promoModel->getActive();
echo "Total active promotions: " . count($promos) . "\n\n";

foreach ($promos as $p) {
    $usageLimit = $p['usage_limit'] ?? 'NULL';
    $usedCount = $p['used_count'] ?? 'NULL';
    $remaining = ($usageLimit !== 'NULL' && $usedCount !== 'NULL') 
        ? max(0, $usageLimit - $usedCount) 
        : 'N/A';
    
    echo "  - {$p['code']}: limit={$usageLimit}, used={$usedCount}, remaining={$remaining}\n";
}

// Test 3: Check if there are any promotions that are out of stock
echo "\n3. Checking for out-of-stock promotions (used >= limit):\n";
$db = Database::getInstance()->getConnection();
$query = "SELECT p.code, p.usage_limit,
    (SELECT COUNT(*) FROM user_vouchers WHERE promotion_id = p.id AND status = 'USED') as used_count
    FROM promotions p
    WHERE p.usage_limit IS NOT NULL AND p.usage_limit > 0
    HAVING used_count >= p.usage_limit";
$stmt = $db->query($query);
$outOfStock = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($outOfStock)) {
    echo "  No out-of-stock promotions found.\n";
} else {
    foreach ($outOfStock as $p) {
        echo "  - {$p['code']}: limit={$p['usage_limit']}, used={$p['used_count']} (OUT OF STOCK)\n";
    }
}

echo "\n=== Test Complete ===\n";
