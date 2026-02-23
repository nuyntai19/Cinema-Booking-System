<?php
// CORS headers
$allowedOrigins = ['http://localhost:8000', 'http://localhost:8080', 'http://localhost:8081'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../controllers/ReviewController.php';

$controller = new ReviewController();

// Route based on HTTP method
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all reviews (Admin/Manager only)
    $controller->index();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create new review (Member only)
    $controller->create();
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
