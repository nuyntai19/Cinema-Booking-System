<?php
// Gọi trực tiếp AuthController->sendVerification() - Bypass Router
header('Content-Type: application/json');
require_once __DIR__ . '/controllers/AuthController.php';

$controller = new AuthController();
$controller->sendVerification();
