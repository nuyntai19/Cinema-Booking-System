<?php
// Test API send verification
$data = [
    'email' => 'testnew@example.com',
    'fullName' => 'Test User',
    'phone' => '0912345678',
    'dob' => '2000-01-01',
    'password' => '123456'
];

$ch = curl_init('http://localhost:8000/api/auth/send-verification');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
