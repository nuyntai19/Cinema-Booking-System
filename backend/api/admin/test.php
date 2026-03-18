<?php
// Simple test to verify API is responding

error_log('=== SIMPLE TEST ENDPOINT CALLED ===');
error_log('Time: ' . date('Y-m-d H:i:s'));
error_log('GET params: ' . json_encode($_GET));
error_log('Headers: ' . json_encode(getallheaders()));

echo json_encode([
    'success' => true,
    'message' => 'Simple test OK',
    'time' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'],
    'path' => $_SERVER['REQUEST_URI']
], JSON_PRETTY_PRINT);

error_log('=== SIMPLE TEST ENDPOINT COMPLETE ===');
