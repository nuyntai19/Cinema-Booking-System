<?php
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/models/Movie.php';

try {
    $db = Database::getInstance();
    $movieModel = new Movie($db->getConnection());
    
    // Test update movie ID 1 với poster mới
    echo "=== TEST UPDATE MOVIE ===\n\n";
    
    // Before update
    $before = $movieModel->getById(1);
    echo "BEFORE UPDATE:\n";
    echo "- poster_url: " . ($before['poster_url'] ?? 'NULL') . "\n";
    echo "- director: " . ($before['director'] ?? 'NULL') . "\n";
    echo "- cast: " . ($before['cast'] ?? 'NULL') . "\n\n";
    
    // Simulate update
    $updateData = [
        'title' => $before['title'],
        'description' => $before['description'],
        'duration' => $before['duration'],
        'release_date' => $before['release_date'],
        'poster_url' => 'uploads/posters/test_new_poster_' . time() . '.jpg',
        'trailer_url' => $before['trailer_url'],
        'age_rating' => $before['age_rating'],
        'origin' => $before['origin'],
        'status' => $before['status'],
        'director' => 'Test Director',
        'cast' => 'Test Actor 1, Test Actor 2',
        'genre_ids' => [7, 3]
    ];
    
    $result = $movieModel->update(1, $updateData);
    echo "UPDATE RESULT: " . ($result ? 'SUCCESS' : 'FAILED') . "\n\n";
    
    // After update
    $after = $movieModel->getById(1);
    echo "AFTER UPDATE:\n";
    echo "- poster_url: " . ($after['poster_url'] ?? 'NULL') . "\n";
    echo "- director: " . ($after['director'] ?? 'NULL') . "\n";
    echo "- cast: " . ($after['cast'] ?? 'NULL') . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
