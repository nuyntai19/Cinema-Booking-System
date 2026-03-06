<?php
// CORS headers
header('Access-Control-Allow-Origin: http://localhost:8080');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../models/Genre.php';
require_once __DIR__ . '/../../core/Response.php';

$genreModel = new Genre();

// Route based on HTTP method
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all genres
    try {
        $genres = $genreModel->getAll();
        Response::success(['genres' => $genres]);
    } catch (Exception $e) {
        error_log("Genre API Error: " . $e->getMessage());
        Response::error('Lỗi khi lấy danh sách thể loại', 500);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
