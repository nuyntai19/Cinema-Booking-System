<?php
require_once 'config/Database.php';
require_once 'models/Promotion.php';

$testData = [
    'code' => 'TEST2026',
    'description' => 'Test promotion',
    'discount_amount' => 50000,
    'discount_type' => 'FIXED',
    'min_order_value' => 100000,
    'max_discount' => null,
    'start_date' => '2026-03-01',
    'end_date' => '2026-12-31',
    'is_auto_apply' => false, // Boolean
    'usage_limit' => 100
];

echo "<h2>Testing Promotion Create</h2>";
echo "<h3>Test Data:</h3><pre>";
print_r($testData);
echo "</pre>";

try {
    $model = new Promotion();
    $id = $model->create($testData);
    if ($id) {
        echo "<h3 style='color: green;'>✓ Success! Created promotion ID: $id</h3>";
        
        // Verify
        $created = $model->getById($id);
        echo "<h3>Created Promotion:</h3><pre>";
        print_r($created);
        echo "</pre>";
        
        // Clean up
        $model->delete($id);
        echo "<p>Test promotion deleted.</p>";
    } else {
        echo "<h3 style='color: red;'>✗ Failed to create promotion</h3>";
    }
} catch (Exception $e) {
    echo "<h3 style='color: red;'>✗ Exception: " . $e->getMessage() . "</h3>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
