<?php
/**
 * Test Hall and Seat Layout API
 */

require_once __DIR__ . '/config/Config.php';

function testAPI($method, $url, $data = null)
{
    echo "Testing $method $url...\n";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    // Admin token (mock or from file if exists)
    // For this test, you might need to login first or use a hardcoded token for local testing
    // curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer <TOKEN>']);

    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "Status: $httpCode\n";
    echo "Response: $response\n\n";
    return json_decode($response, true);
}

$baseUrl = "http://localhost/backend/api";

// 1. Create a new Hall
// $newHall = testAPI('POST', "$baseUrl/halls", ['cinema_id' => 1, 'name' => 'Demo Hall']);

// 2. Save Layout
// if (isset($newHall['data']['id'])) {
//     $hallId = $newHall['data']['id'];
//     $seats = [
//         ['row_code' => 'A', 'number' => 1, 'seat_type_id' => 1],
//         ['row_code' => 'A', 'number' => 2, 'seat_type_id' => 2], // VIP
//     ];
//     testAPI('POST', "$baseUrl/halls/$hallId/layout", ['seats' => $seats]);
// }

echo "Manual verification recommended via the UI.\n";
