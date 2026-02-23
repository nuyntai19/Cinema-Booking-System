<?php
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/models/Movie.php';

try {
    $db = Database::getInstance();
    $movieModel = new Movie($db->getConnection());
    
    // Fetch movie ID 1
    $movie = $movieModel->getById(1);
    
    echo "=== MOVIE DETAIL (ID=1) ===\n";
    echo json_encode($movie, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    echo "\n\n";
    
    // Check if director and cast fields exist
    echo "Director field exists: " . (isset($movie['director']) ? 'YES' : 'NO') . "\n";
    echo "Cast field exists: " . (isset($movie['cast']) ? 'YES' : 'NO') . "\n";
    
    if (isset($movie['genres'])) {
        echo "Genres field: " . $movie['genres'] . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
