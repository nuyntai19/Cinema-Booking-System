<?php
// Simulate frontend request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['CONTENT_TYPE'] = 'application/json';

$jsonPayload = json_encode([
    'code' => 'FRONTEND_TEST',
    'description' => 'Test from frontend format',
    'discount_amount' => 30000,
    'discount_type' => 'FIXED',
    'min_order_value' => 150000,
    'max_discount' => null,
    'start_date' => '2026-03-07',
    'end_date' => '2026-12-31',
    'is_auto_apply' => false,  // Boolean như frontend gửi
    'usage_limit' => 50
]);

// Write to php://input simulation
file_put_contents('php://memory', $jsonPayload);

require_once 'config/Database.php';
require_once 'models/Promotion.php';
require_once 'core/Response.php';
require_once 'controllers/PromotionController.php';

echo "<h2>Testing PromotionController->create()</h2>";
echo "<h3>Payload:</h3><pre>$jsonPayload</pre>";

// Manually decode and test
$data = json_decode($jsonPayload, true);
echo "<h3>Decoded Data:</h3><pre>";
print_r($data);
echo "</pre>";

try {
    $model = new Promotion();
    $id = $model->create($data);
    
    if ($id) {
        echo "<h3 style='color: green;'>✓ Success! Created ID: $id</h3>";
        
        // Verify
        $created = $model->getById($id);
        echo "<h3>Created Promotion:</h3><pre>";
        print_r($created);
        echo "</pre>";
        
        // Clean up
        $model->delete($id);
        echo "<p>✓ Test promotion deleted.</p>";
    } else {
        echo "<h3 style='color: red;'>✗ Failed to create</h3>";
    }
} catch (Exception $e) {
    echo "<h3 style='color: red;'>✗ Exception: " . $e->getMessage() . "</h3>";
}
