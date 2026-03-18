<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/models/Notification.php';

$notification = new Notification();
$campaigns = $notification->listCampaigns('', 'all');

echo "Total campaigns: " . count($campaigns) . "\n";
echo json_encode($campaigns, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
