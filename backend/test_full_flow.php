<?php
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/models/Movie.php';

// Simulate a full update flow
try {
    $db = Database::getInstance();
    $movieModel = new Movie($db->getConnection());
    
    echo "=== FULL UPDATE FLOW TEST ===\n\n";
    
    // Step 1: Get movie before update
    echo "STEP 1: Get movie before update\n";
    $movie = $movieModel->getById(1);
    echo "- poster_url: " . ($movie['poster_url'] ?? 'NULL') . "\n\n";
    
    // Step 2: Simulate update with NEW poster URL
    echo "STEP 2: Update movie with new poster\n";
    $newPosterUrl = 'uploads/posters/new_poster_' . time() . '.jpg';
    $updateData = [
        'title' => $movie['title'],
        'description' => $movie['description'],
        'duration' => $movie['duration'],
        'release_date' => $movie['release_date'],
        'poster_url' => $newPosterUrl,  // NEW URL
        'trailer_url' => $movie['trailer_url'],
        'age_rating' => $movie['age_rating'],
        'origin' => $movie['origin'],
        'status' => $movie['status'],
        'director' => 'Updated Director',
        'cast' => 'Updated Cast',
        'genre_ids' => [7, 3]
    ];
    
    $result = $movieModel->update(1, $updateData);
    echo "- Update result: " . ($result ? 'SUCCESS' : 'FAILED') . "\n";
    echo "- New poster_url sent: " . $newPosterUrl . "\n\n";
    
    // Step 3: Fetch detail again (like handleEdit does)
    echo "STEP 3: Fetch detail again (API DETAIL)\n";
    $movieAfter = $movieModel->getById(1);
    echo "- poster_url returned: " . ($movieAfter['poster_url'] ?? 'NULL') . "\n";
    echo "- director: " . ($movieAfter['director'] ?? 'NULL') . "\n";
    echo "- cast: " . ($movieAfter['cast'] ?? 'NULL') . "\n\n";
    
    // Check if poster_url matches
    if (isset($movieAfter['poster_url']) && $movieAfter['poster_url'] === $newPosterUrl) {
        echo "✅ SUCCESS: poster_url updated correctly!\n";
    } else {
        echo "❌ FAILED: poster_url mismatch!\n";
        echo "   Expected: " . $newPosterUrl . "\n";
        echo "   Got: " . ($movieAfter['poster_url'] ?? 'NULL') . "\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
