<?php
/**
 * Debug: VNPAY URL Generation Test
 * Truy cập: http://localhost:8000/debug_vnpay_url.php
 */

require_once __DIR__ . '/config/Env.php';
Env::load(__DIR__ . '/.env');

header('Content-Type: text/plain; charset=UTF-8');

// ---- Đọc config ----
function readConf($key) {
    if (defined($key)) return constant($key);
    $v = getenv($key);
    if ($v !== false && $v !== '') return trim($v);
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') return trim($_ENV[$key]);
    return null;
}

$tmnCode    = readConf('VNP_TMNCODE');
$hashSecret = readConf('VNP_HASH_SECRET');
$vnpUrl     = readConf('VNP_URL');
$appUrl     = readConf('APP_URL') ?: 'http://localhost:8000';

echo "=== VNPAY CONFIG ===\n";
echo "VNP_TMNCODE    : " . ($tmnCode    ?? '[MISSING]') . "\n";
echo "VNP_HASH_SECRET: " . ($hashSecret ? substr($hashSecret, 0, 6) . '...' . substr($hashSecret, -4) : '[MISSING]') . "\n";
echo "VNP_URL        : " . ($vnpUrl     ?? '[MISSING]') . "\n";
echo "APP_URL        : " . $appUrl . "\n\n";

if (!$tmnCode || !$hashSecret || !$vnpUrl) {
    echo "ERROR: Missing VNPAY config. Check .env file.\n";
    exit;
}

// ---- Build test payment URL ----
$testAmount   = 150000;    // 150,000 VND
$testTxnRef   = 'TEST' . date('ymdHis'); // pure alphanumeric — no hyphens
$testOrderInfo = 'Test thanh toan don hang 123';
$returnUrl    = rtrim($appUrl, '/') . '/api/transactions/vnpay/verify';

$params = [
    'vnp_Version'    => '2.1.0',
    'vnp_Command'    => 'pay',
    'vnp_TmnCode'    => $tmnCode,
    'vnp_Amount'     => (string) intval(round($testAmount * 100)),
    'vnp_CurrCode'   => 'VND',
    'vnp_TxnRef'     => $testTxnRef,
    'vnp_OrderInfo'  => $testOrderInfo,
    'vnp_OrderType'  => 'other',
    'vnp_Locale'     => 'vn',
    'vnp_ReturnUrl'  => $returnUrl,
    'vnp_IpAddr'     => '127.0.0.1',
    'vnp_CreateDate' => date('YmdHis'),
];

ksort($params);

$hashDataArr = [];
$queryArr    = [];
foreach ($params as $key => $value) {
    if ($value === null || $value === '') continue;
    $hashDataArr[] = urlencode($key) . '=' . urlencode($value);
    $queryArr[]    = urlencode($key) . '=' . urlencode($value);
}

$hashData   = implode('&', $hashDataArr);
$query      = implode('&', $queryArr);
$secureHash = hash_hmac('sha512', $hashData, $hashSecret);
$finalUrl   = $vnpUrl . '?' . $query . '&vnp_SecureHash=' . $secureHash;

echo "=== BUILD PARAMS ===\n";
foreach ($params as $k => $v) {
    echo sprintf("  %-20s = %s\n", $k, $v);
}

echo "\n=== HASH DATA (raw string to be hashed) ===\n";
echo $hashData . "\n";

echo "\n=== SECURE HASH (sha512) ===\n";
echo $secureHash . "\n";

echo "\n=== GENERATED PAY URL ===\n";
echo $finalUrl . "\n";

echo "\n=== CLICKABLE LINK ===\n";
echo '<a href="' . htmlspecialchars($finalUrl) . '">' . $finalUrl . '</a>' . "\n";
