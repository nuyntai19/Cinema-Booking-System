<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config/Database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Test user
    $email = 'Nhân Viên 999'; // From screenshot, we don't know the exact email.
    // Let's just fetch recent 5 users.
    $stmt = $db->query("SELECT id, email, password_hash, status FROM users ORDER BY created_at DESC LIMIT 5");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $results = [];
    foreach ($users as $u) {
        $u['verify_123456'] = password_verify('123456', $u['password_hash']);
        $results[] = $u;
    }
    
    echo json_encode($results, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
