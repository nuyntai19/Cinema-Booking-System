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
    return false; // Serve the file
}

// Route everything else through index.php
require __DIR__ . '/index.php';
