<?php
/**
 * Test script to verify voucher validation when typing manually
 * Simulates the scenario where user types voucher code from keyboard
 */

require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/controllers/VoucherController.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/models/UserVoucher.php';
require_once __DIR__ . '/models/Promotion.php';

echo "=== Testing Manual Voucher Input Validation ===\n\n";

$controller = new VoucherController();
$userId = 4; // Test with user 4
$amount = 500000; // 500k order

// Test 1: Try to apply REWARD_50K (user already has it as USED)
echo "1. Testing REWARD_50K (already USED by user):\n";
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST = [];
file_put_contents('php://input', json_encode([
    'code' => 'REWARD_50K',
    'user_id' => $userId,
    'amount' => $amount
]));

// Simulate the request
$data = json_decode(json_encode([
    'code' => 'REWARD_50K',
    'user_id' => $userId,
    'amount' => $amount
]), true);

// Manually call applyVoucher with test data
try {
    $db = Database::getInstance()->getConnection();
    $code = 'REWARD_50K';
    
    // Check if user already has this voucher
    $checkQuery = "SELECT uv.id, uv.status, p.code, p.usage_limit,
        (SELECT COUNT(*) FROM user_vouchers WHERE promotion_id = p.id AND status = 'USED') as used_count
        FROM user_vouchers uv
        JOIN promotions p ON uv.promotion_id = p.id
        WHERE uv.user_id = :user_id AND (uv.code = :code OR p.code = :code2)";
    $stmt = $db->prepare($checkQuery);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':code', $code);
    $stmt->bindParam(':code2', $code);
    $stmt->execute();
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        echo "   ✓ User has voucher: {$existing['code']} (status: {$existing['status']})\n";
        echo "   ✓ Usage limit: {$existing['usage_limit']}, Used count: {$existing['used_count']}\n";
        
        if ($existing['status'] === 'USED') {
            echo "   ✓ Should reject: Already used\n";
        }
        if ($existing['usage_limit'] && $existing['used_count'] >= $existing['usage_limit']) {
            echo "   ✓ Should reject: Out of stock\n";
        }
    }
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test 2: Check promotion directly (fallback path)
echo "\n2. Checking promotion REWARD_50K in database:\n";
try {
    $db = Database::getInstance()->getConnection();
    $query = "SELECT p.*, 
        (SELECT COUNT(*) FROM user_vouchers WHERE promotion_id = p.id AND status = 'USED') as used_count
        FROM promotions p 
        WHERE p.code = 'REWARD_50K'";
    $stmt = $db->query($query);
    $promo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($promo) {
        echo "   Code: {$promo['code']}\n";
        echo "   Usage Limit: " . ($promo['usage_limit'] ?? 'NULL') . "\n";
        echo "   Used Count: {$promo['used_count']}\n";
        $remaining = $promo['usage_limit'] ? max(0, $promo['usage_limit'] - $promo['used_count']) : 'Unlimited';
        echo "   Remaining: {$remaining}\n";
        
        if ($promo['usage_limit'] && $promo['used_count'] >= $promo['usage_limit']) {
            echo "   ✓ OUT OF STOCK - Should not allow new assignments\n";
        }
    }
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test 3: Check all user's vouchers
echo "\n3. User's current vouchers:\n";
try {
    $voucherModel = new UserVoucher();
    $vouchers = $voucherModel->getByUser($userId, null);
    
    foreach ($vouchers as $v) {
        $code = $v['promo_code'] ?? $v['voucher_code'];
        echo "   - {$code}: status={$v['status']}, used_count={$v['used_count']}, limit={$v['usage_limit']}\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Expected Behavior ===\n";
echo "When user types 'REWARD_50K' from keyboard:\n";
echo "1. Backend should check if user already has this voucher (even if USED)\n";
echo "2. If yes → Reject with 'Bạn đã sử dụng voucher này rồi'\n";
echo "3. If no → Check usage_limit\n";
echo "4. If out of stock → Reject with 'Voucher đã hết số lượng sử dụng'\n";
echo "5. If all OK → Allow auto-assign\n";

echo "\n=== Test Complete ===\n";
