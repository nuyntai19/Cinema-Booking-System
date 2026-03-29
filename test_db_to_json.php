<?php
require_once __DIR__ . '/backend/config/Database.php';

try {
    $db = Database::getInstance()->getConnection();
    $stmt = $db->query("SELECT id, email, password_hash, status FROM users ORDER BY created_at DESC LIMIT 5");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $results = [];
    foreach ($users as $u) {
        $u['verify_123456'] = password_verify('123456', $u['password_hash']);
        $results[] = $u;
    }
    
    file_put_contents('db_out.json', json_encode($results, JSON_PRETTY_PRINT));
} catch (Exception $e) {
    file_put_contents('db_out.json', json_encode(['error' => $e->getMessage()]));
}
