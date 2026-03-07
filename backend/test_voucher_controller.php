<?php
require_once 'controllers/VoucherController.php';

// Simulate API call
$_GET = []; // No ?status=all, so default to ACTIVE
$controller = new VoucherController();

echo "=== SIMULATING: GET /api/vouchers/user/4 ===\n\n";

$response = $controller->getUserVouchers(4);

echo json_encode($response, JSON_PRETTY_PRINT);

echo "\n\n=== VOUCHERS COUNT ===\n";
echo "Total: " . count($response['data']['vouchers']) . "\n";
