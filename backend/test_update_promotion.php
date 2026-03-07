<?php
/**
 * Test update promotion to debug 500 error
 */

require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/models/Promotion.php';

echo "=== Testing Promotion Update ===\n\n";

// Test data similar to what frontend sends
$testData = [
    'code' => 'TEST_3CD6E7',
    'title' => 'Test Promotion', // Frontend might send this
    'description' => 'Test promotion description',
    'discountType' => 'percentage', // Frontend format
    'discountAmount' => 15,
    'minOrderValue' => 100000,
    'maxDiscount' => 50000,
    'usageLimit' => 50,
    'startDate' => '2026-03-07',
    'endDate' => '2026-03-14'
];

echo "Frontend data format:\n";
print_r($testData);

// Transform to backend format (what AdminPromotions.tsx does)
$payload = [
    'code' => $testData['code'],
    'description' => $testData['description'] ?? $testData['title'],
    'discount_amount' => $testData['discountAmount'],
    'discount_type' => $testData['discountType'] === 'percentage' ? 'PERCENT' : 'FIXED',
    'min_order_value' => $testData['minOrderValue'],
    'max_discount' => $testData['discountType'] === 'fixed' ? null : $testData['maxDiscount'],
    'start_date' => $testData['startDate'],
    'end_date' => $testData['endDate'],
    'is_auto_apply' => false,
    'usage_limit' => $testData['usageLimit']
];

echo "\n\nTransformed payload:\n";
print_r($payload);

// Test update
$model = new Promotion();
$promotionId = 15; // The ID from the error

echo "\n\nAttempting to update promotion ID: $promotionId\n";

try {
    $result = $model->update($promotionId, $payload);
    
    if ($result) {
        echo "✓ Update successful!\n";
    } else {
        echo "✗ Update failed (returned false)\n";
    }
} catch (Exception $e) {
    echo "✗ Exception: " . $e->getMessage() . "\n";
}

// Check current data in DB
echo "\n\nCurrent data in database:\n";
$current = $model->getById($promotionId);
if ($current) {
    print_r($current);
} else {
    echo "Promotion ID $promotionId not found!\n";
}

echo "\n=== End ===\n";
