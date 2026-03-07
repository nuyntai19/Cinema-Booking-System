<?php
require_once 'config/Database.php';
require_once 'models/UserVoucher.php';

$voucherModel = new UserVoucher();

echo "=== TEST: Fetch vouchers with ?status=all ===\n\n";

// Test with status=all (should return ALL vouchers)
$allVouchers = $voucherModel->getByUser(4, null);
echo "All vouchers for user 4 (status=null):\n";
echo json_encode($allVouchers, JSON_PRETTY_PRINT);
echo "\n\nCount: " . count($allVouchers) . " vouchers\n\n";

// Test with status=ACTIVE (should return only ACTIVE + valid dates)
$activeVouchers = $voucherModel->getByUser(4, 'ACTIVE');
echo "Active vouchers for user 4 (status=ACTIVE):\n";
echo json_encode($activeVouchers, JSON_PRETTY_PRINT);
echo "\n\nCount: " . count($activeVouchers) . " vouchers\n";
