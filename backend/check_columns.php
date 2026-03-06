<?php
require_once __DIR__ . '/config/Database.php';

try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    
    echo "=== MOVIES TABLE STRUCTURE ===\n";
    $stmt = $pdo->query("SHOW COLUMNS FROM movies");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo sprintf("%-30s %-40s\n", $row['Field'], $row['Type']);
    }
    
    echo "\n=== SAMPLE MOVIE DATA ===\n";
    $stmt = $pdo->query("SELECT id, title, director, cast, poster_url FROM movies LIMIT 1");
    $movie = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($movie) {
        print_r($movie);
    } else {
        echo "No movies found\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
