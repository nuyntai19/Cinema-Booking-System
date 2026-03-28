<?php

try {
    $db = new PDO("mysql:host=localhost;dbname=galaxy_cinema;charset=utf8mb4", "root", "");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $sql = "SELECT id, name, address, lat, lng FROM cinemas";
    $stmt = $db->query($sql);
    $cinemas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($cinemas, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
