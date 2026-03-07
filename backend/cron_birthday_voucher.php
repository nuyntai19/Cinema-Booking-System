<?php
/**
 * Cronjob: Tự động gán voucher sinh nhật
 * Chạy mỗi ngày lúc 0h: crontab -e → 0 0 * * * php /path/to/cron_birthday_voucher.php
 */

require_once __DIR__ . '/config/Env.php';
Env::load(__DIR__ . '/.env');

require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/models/UserVoucher.php';
require_once __DIR__ . '/models/Promotion.php';

$voucherModel = new UserVoucher();
$promoModel = new Promotion();

// 1. Mark expired vouchers
$voucherModel->checkExpired();

// 2. Find users with birthday today
$birthdayUsers = $voucherModel->checkBirthdayUsers();
if (empty($birthdayUsers)) {
    echo date('Y-m-d H:i:s') . " - No birthday users today.\n";
    exit(0);
}

// 3. Get birthday promotions specifically
$db = Database::getInstance()->getConnection();
$today = date('Y-m-d');
$stmt = $db->prepare("SELECT * FROM promotions WHERE code = 'BIRTHDAY' AND start_date <= :today1 AND end_date >= :today2");
$stmt->bindValue(':today1', $today);
$stmt->bindValue(':today2', $today);
$stmt->execute();
$birthdayPromos = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($birthdayPromos)) {
    echo date('Y-m-d H:i:s') . " - No auto-apply promotions configured.\n";
    exit(0);
}

// 4. Assign vouchers
$count = 0;
foreach ($birthdayUsers as $user) {
    foreach ($birthdayPromos as $promo) {
        $result = $voucherModel->assignToUser($user['id'], $promo['id']);
        if ($result) {
            $count++;
            echo "Assigned promo #{$promo['id']} to user #{$user['id']} ({$user['full_name']})\n";
        }
    }
}

echo date('Y-m-d H:i:s') . " - Done. Assigned {$count} voucher(s) to " . count($birthdayUsers) . " user(s).\n";
