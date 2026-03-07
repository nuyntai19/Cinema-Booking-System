<?php
/**
 * Debug endpoint to capture exact request from frontend
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

echo "=== Request Debug Info ===\n\n";

echo "Method: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "URI: " . $_SERVER['REQUEST_URI'] . "\n\n";

echo "Headers:\n";
foreach (getallheaders() as $name => $value) {
    echo "  $name: $value\n";
}

echo "\nRaw Input:\n";
$rawInput = file_get_contents('php://input');
echo $rawInput . "\n\n";

echo "Decoded JSON:\n";
$decoded = json_decode($rawInput, true);
print_r($decoded);

echo "\n\nNow attempting actual update...\n";

require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/models/Promotion.php';
require_once __DIR__ . '/core/Response.php';

try {
    $promotionId = 15; // From error
    $model = new Promotion();
    
    echo "Calling model->update($promotionId, data)...\n";
    $result = $model->update($promotionId, $decoded);
    
    if ($result) {
        echo "✓ Update successful!\n";
        
        // Show updated data
        $updated = $model->getById($promotionId);
        echo "\nUpdated data:\n";
        print_r($updated);
    } else {
        echo "✗ Update returned false\n";
    }
} catch (Exception $e) {
    echo "✗ Exception: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
