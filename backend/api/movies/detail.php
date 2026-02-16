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

// Get movie ID from query parameter
$movieId = $_GET['id'] ?? null;

if (!$movieId) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing movie ID'
    ]);
    exit();
}

$controller = new MovieController();

// Route based on HTTP method
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get movie details
    $controller->show($movieId);
} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update movie (Admin/Manager only)
    $controller->update($movieId);
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Delete movie (Admin only)
    $controller->delete($movieId);
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
