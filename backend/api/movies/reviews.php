<?php
// CORS headers
$allowedOrigins = ['http://localhost:8000', 'http://localhost:8080', 'http://localhost:8081'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
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
    // Get movie reviews
    $controller->getReviews($movieId);
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
