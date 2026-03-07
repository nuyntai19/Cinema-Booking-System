<?php
/**
 * Simple test to verify Promotion model update method
 */

require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/models/Promotion.php';

echo "=== Verifying Promotion::update() method ===\n\n";

$model = new Promotion();

// Read the current update method
$reflection = new ReflectionClass($model);
$method = $reflection->getMethod('update');
$filename = $method->getFileName();
$startLine = $method->getStartLine();
$endLine = $method->getEndLine();

echo "Method location: $filename\n";
echo "Lines: $startLine - $endLine\n\n";

// Read the method source code
$source = file($filename);
$methodSource = array_slice($source, $startLine - 1, $endLine - $startLine + 1);

echo "Current update() method source:\n";
echo "-----\n";
echo implode('', $methodSource);
echo "-----\n\n";

// Test the method
echo "Testing update with ID=15...\n";
$testData = [
    'code' => 'TEST_UPDATE',
    'description' => 'Test description',
    'discount_amount' => 10,
    'discount_type' => 'PERCENT',
    'min_order_value' => 50000,
    'is_auto_apply' => false,
    'usage_limit' => 100
];

try {
    $result = $model->update(15, $testData);
    echo "Result: " . ($result ? "SUCCESS" : "FAILED") . "\n";
    
    if (!$result) {
        echo "\nChecking error log...\n";
        $errorLog = error_get_last();
        if ($errorLog) {
            print_r($errorLog);
        }
    }
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}

echo "\n=== End ===\n";
