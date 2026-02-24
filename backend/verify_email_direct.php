<?php
// Gọi trực tiếp AuthController->verifyEmail() - Bypass Router
header('Content-Type: application/json');
require_once __DIR__ . '/controllers/AuthController.php';

$controller = new AuthController();
$controller->verifyEmail();
