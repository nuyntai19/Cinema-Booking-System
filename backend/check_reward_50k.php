<?php
/**
 * Check exact data in database
 */

require_once __DIR__ . '/config/Database.php';

echo "=== Checking REWARD_50K in Database ===\n\n";

try {
    $db = Database::getInstance()->getConnection();
    
    // Check promotion
    echo "1. Promotion details:\n";
    $query = "SELECT * FROM promotions WHERE code = 'REWARD_50K'";
    $stmt = $db->query($query);
    $promo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($promo) {
        echo "   ID: {$promo['id']}\n";
        echo "   Code: {$promo['code']}\n";
        echo "   Usage Limit: " . ($promo['usage_limit'] ?? 'NULL') . "\n";
        echo "   Discount: {$promo['discount_amount']} ({$promo['discount_type']})\n";
        echo "   Start: {$promo['start_date']}, End: {$promo['end_date']}\n";
    }
    
    // Check user_vouchers for this promotion
    echo "\n2. User vouchers for REWARD_50K promotion:\n";
    $query2 = "SELECT uv.id, uv.user_id, uv.status, uv.assigned_at, uv.used_at 
        FROM user_vouchers uv 
        WHERE uv.promotion_id = :promo_id
        ORDER BY uv.id";
    $stmt2 = $db->prepare($query2);
    $stmt2->bindParam(':promo_id', $promo['id'], PDO::PARAM_INT);
    $stmt2->execute();
    $vouchers = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Total vouchers assigned: " . count($vouchers) . "\n";
    foreach ($vouchers as $v) {
        $used = $v['status'] === 'USED' ? "✓ USED at {$v['used_at']}" : "○ {$v['status']}";
        echo "   - ID={$v['id']}, User={$v['user_id']}: {$used}\n";
    }
    
    $usedCount = count(array_filter($vouchers, function($v) { return $v['status'] === 'USED'; }));
    echo "\n   Used count: {$usedCount}\n";
    
    // Check AdminPromotions query
    echo "\n3. AdminPromotions query result:\n";
    $adminQuery = "SELECT p.id, p.code, p.usage_limit,
        (SELECT COUNT(*) FROM user_vouchers uv WHERE uv.promotion_id = p.id AND uv.status = 'USED') as used_count,
        (SELECT COALESCE(SUM(b.discount_amount), 0) FROM bookings b INNER JOIN user_vouchers uv ON b.user_voucher_id = uv.id WHERE uv.promotion_id = p.id AND uv.status = 'USED') as total_discount
        FROM promotions p
        WHERE p.code = 'REWARD_50K'";
    $stmt3 = $db->query($adminQuery);
    $adminData = $stmt3->fetch(PDO::FETCH_ASSOC);
    
    if ($adminData) {
        echo "   Usage Limit: " . ($adminData['usage_limit'] ?? 'NULL') . "\n";
        echo "   Used Count: {$adminData['used_count']}\n";
        echo "   Total Discount: {$adminData['total_discount']}\n";
        
        if ($adminData['usage_limit']) {
            $remaining = max(0, $adminData['usage_limit'] - $adminData['used_count']);
            echo "   Remaining: {$remaining}\n";
        } else {
            echo "   Remaining: Unlimited (no usage_limit set)\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== End ===\n";
