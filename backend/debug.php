<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Debug REQUEST_URI
echo "REQUEST_URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD'] . "\n";

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
echo "Parsed URI: " . $uri . "\n";

// Remove /backend prefix if it exists
if (strpos($uri, '/backend') === 0) {
    $uri = substr($uri, strlen('/backend'));
}
echo "After removing /backend: " . $uri . "\n";

// Remove trailing slash
$uri = rtrim($uri, '/') ?: '/';
echo "After rtrim: " . $uri . "\n";

// Test regex pattern
$path = '/api/cinemas';
$pattern = preg_replace('/:\w+/', '([^/]+)', $path);
$pattern = '#^' . $pattern . '$#';
echo "\nRoute pattern for '/api/cinemas': " . $pattern . "\n";
echo "Does '$uri' match? " . (preg_match($pattern, $uri) ? "YES" : "NO") . "\n";
