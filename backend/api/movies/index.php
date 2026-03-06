<?php
// CORS headers
header('Access-Control-Allow-Origin: http://localhost:8080');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../controllers/MovieController.php';

$controller = new MovieController();

// Route based on HTTP method
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all movies with filters
    $controller->index();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create new movie (Admin/Manager only)
    $controller->create();
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
