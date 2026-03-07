<?php
require_once 'config/Database.php';
require_once 'models/UserVoucher.php';

$voucherModel = new UserVoucher();

echo "=== Testing API response for ?status=all ===\n\n";

// Simulate what VoucherController::getUserVouchers does
$userId = 4;
$status = null; // This is what ?status=all sets

$vouchers = $voucherModel->getByUser($userId, $status);

echo "Total vouchers returned: " . count($vouchers) . "\n\n";

foreach ($vouchers as $v) {
    echo sprintf(
        "ID: %s | Code: %s | Status: %s | Dates: %s to %s\n",
        $v['id'],
        $v['promo_code'],
        $v['status'],
        $v['start_date'],
        $v['end_date']
    );
}

echo "\n=== Expected 6 vouchers for user 4 ===\n";
echo "1. WELCOME2024 (ACTIVE but expired)\n";
echo "2. RAUMA36 (USED)\n";
echo "3. REWARD_20K (USED)\n";
echo "4. RAUMA36 (ACTIVE, valid)\n";
echo "5. REWARD_50K (USED)\n";
echo "6. TEST_3CD6E7 (ACTIVE, valid)\n";
