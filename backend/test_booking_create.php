<?php
// Test booking creation

// First login to get token
$loginUrl = 'http://localhost/backend/api/auth/login';
$loginData = [
    'email' => 'nguyenvana@gmail.com',
    'password' => 'password'
];

$ch = curl_init($loginUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($loginData)
]);

$loginResponse = curl_exec($ch);
curl_close($ch);

$loginResult = json_decode($loginResponse, true);
if (!$loginResult['success']) {
    die("Login failed: " . $loginResult['message'] . "\n");
}

$token = $loginResult['data']['token'];
echo "✓ Login successful. User: " . $loginResult['data']['user']['name'] . "\n\n";

// Now test booking creation
$url = 'http://localhost/backend/api/bookings';
$data = [
    'user_id' => $loginResult['data']['user']['id'],
    'showtime_id' => 1,
    'seat_ids' => [2, 3], // A2, A3 - should be available
    'concessions' => []
];

echo "Request data:\n";
echo json_encode($data, JSON_PRETTY_PRINT) . "\n\n";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ],
    CURLOPT_POSTFIELDS => json_encode($data)
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response:\n";
echo json_encode(json_decode($response, true), JSON_PRETTY_PRINT);
echo "\n";
