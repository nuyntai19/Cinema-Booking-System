<?php
// Direct debug test - this file is accessed directly, no routing needed
header('Content-Type: application/json');
echo json_encode([
    'test' => 'ok',
    'request_uri' => $_SERVER['REQUEST_URI'],
    'script_name' => $_SERVER['SCRIPT_NAME'],
    'php_self' => $_SERVER['PHP_SELF'],
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'script_filename' => $_SERVER['SCRIPT_FILENAME'],
    'htaccess_working' => 'this file is accessed directly, not via rewrite',
]);
