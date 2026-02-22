<?php
// Run this script daily (e.g., cron at 0 0 * * *) to auto-assign birthday vouchers
require_once __DIR__ . '/controllers/VoucherController.php';

$vc = new VoucherController();

// First expire old vouchers
require_once __DIR__ . '/models/UserVoucher.php';
$uv = new UserVoucher();
$uv->checkExpired();

$res = $vc->autoAssignBirthday();

// If running from CLI, print result
if (php_sapi_name() === 'cli') {
    echo json_encode($res, JSON_PRETTY_PRINT) . PHP_EOL;
}
