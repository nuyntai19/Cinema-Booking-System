<?php
/**
 * Router for PHP Built-in Server
 * Routes all requests through index.php
 */

// Serve static files directly
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$extension = pathinfo($path, PATHINFO_EXTENSION);

// Allow actual files to be served (for uploads, assets, etc.)
if ($extension && file_exists(__DIR__ . $path)) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    $filePath = __DIR__ . $path;
    if (!is_file($filePath)) {
        http_response_code(404);
        exit();
    }

    $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
    header("Content-Type: $mimeType");
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
    exit();
}

// Route everything else through index.php
require __DIR__ . '/index.php';
