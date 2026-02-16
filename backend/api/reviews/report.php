<?php
// CORS headers
header('Access-Control-Allow-Origin: http://localhost:8080');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../controllers/ReviewController.php';

// Get review ID from query parameter
$reviewId = $_GET['id'] ?? null;

if (!$reviewId) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing review ID'
    ]);
    exit();
}

$controller = new ReviewController();

// Route based on HTTP method
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Report review (Member only)
    $controller->report($reviewId);
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
