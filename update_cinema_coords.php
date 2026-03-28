<?php

try {
    $db = new PDO("mysql:host=localhost;dbname=galaxy_cinema;charset=utf8mb4", "root", "");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $updates = [
        1 => ['lat' => 10.776889, 'lng' => 106.696167], // Galaxy Nguyễn Du
        2 => ['lat' => 10.794278, 'lng' => 106.643306], // Galaxy Tân Bình
        3 => ['lat' => 16.050301, 'lng' => 108.225134], // Galaxy Đà Nẵng
        4 => ['lat' => 10.716251, 'lng' => 106.737650]  // Galaxy siêu soái
    ];

    foreach ($updates as $id => $coords) {
        $stmt = $db->prepare("UPDATE cinemas SET lat = :lat, lng = :lng WHERE id = :id");
        $stmt->execute([
            ':lat' => $coords['lat'],
            ':lng' => $coords['lng'],
            ':id' => $id
        ]);
        echo "Updated cinema $id\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
