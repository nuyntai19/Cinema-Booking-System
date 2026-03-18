<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/backend_debug.log');

require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/models/Notification.php';

error_log('=== TEST START ===');
error_log('Time: ' . date('Y-m-d H:i:s'));

$notification = new Notification();
$campaigns = $notification->listCampaigns('', 'all');

error_log('TEST RESULT: ' . count($campaigns) . ' campaigns');
foreach ($campaigns as $c) {
    error_log('Campaign: ' . $c['title'] . ' (ID: ' . $c['id'] . ')');
}

error_log('=== TEST END ===');
echo "Check backend_debug.log for details";
