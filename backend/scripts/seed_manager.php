<?php
/**
 * Seed Manager Module
 * Chạy: php backend/scripts/seed_manager.php
 * Tạo tài khoản manager mẫu và gán vào rạp đầu tiên
 */

require_once __DIR__ . '/../config/Env.php';
Env::load(__DIR__ . '/../.env');
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Config.php';

$db = Database::getInstance()->getConnection();

echo "🎬 Seeding Cinema Manager Module...\n\n";

try {
    // 1. Tạo tài khoản manager
    $managerEmail = 'manager@galaxy.com';
    $managerPassword = 'Manager@123';

    $existing = $db->prepare("SELECT id FROM users WHERE email = :email");
    $existing->execute([':email' => $managerEmail]);
    $existingUser = $existing->fetch(PDO::FETCH_ASSOC);

    if ($existingUser) {
        $managerId = $existingUser['id'];
        echo "✅ Manager account already exists (ID: $managerId)\n";
    } else {
        $passwordHash = password_hash($managerPassword, PASSWORD_BCRYPT, ['cost' => 10]);
        $stmt = $db->prepare("
            INSERT INTO users (email, password_hash, role_id, status)
            VALUES (:email, :hash, 4, 'Active')
        ");
        $stmt->execute([':email' => $managerEmail, ':hash' => $passwordHash]);
        $managerId = (int)$db->lastInsertId();

        $profileStmt = $db->prepare("
            INSERT INTO user_profiles (user_id, full_name, phone, membership_id)
            VALUES (:uid, 'Nguyễn Văn Manager', '0901234567', 1)
        ");
        $profileStmt->execute([':uid' => $managerId]);
        echo "✅ Created manager account (ID: $managerId, Email: $managerEmail, Password: $managerPassword)\n";
    }

    // 2. Lấy rạp chưa có manager
    $cinemaStmt = $db->prepare("SELECT id, name FROM cinemas WHERE manager_id IS NULL ORDER BY id ASC LIMIT 1");
    $cinemaStmt->execute();
    $cinema = $cinemaStmt->fetch(PDO::FETCH_ASSOC);

    if (!$cinema) {
        // Nếu tất cả rạp đã có manager, lấy rạp đầu tiên
        $cinemaStmt2 = $db->prepare("SELECT id, name FROM cinemas ORDER BY id ASC LIMIT 1");
        $cinemaStmt2->execute();
        $cinema = $cinemaStmt2->fetch(PDO::FETCH_ASSOC);
    }

    if ($cinema) {
        $updateStmt = $db->prepare("UPDATE cinemas SET manager_id = :uid WHERE id = :cid");
        $updateStmt->execute([':uid' => $managerId, ':cid' => $cinema['id']]);
        echo "✅ Assigned manager to cinema: [{$cinema['id']}] {$cinema['name']}\n";
    } else {
        echo "⚠️  No cinemas found. Please create a cinema first.\n";
    }

    // 3. Hiển thị kết quả
    $resultStmt = $db->prepare("
        SELECT u.id, u.email, u.role_id, u.status,
               up.full_name, up.phone,
               c.id AS cinema_id, c.name AS cinema_name
        FROM users u
        JOIN user_profiles up ON up.user_id = u.id
        LEFT JOIN cinemas c ON c.manager_id = u.id
        WHERE u.email = :email
    ");
    $resultStmt->execute([':email' => $managerEmail]);
    $result = $resultStmt->fetch(PDO::FETCH_ASSOC);

    echo "\n📊 Manager Account Summary:\n";
    echo "   ID:           {$result['id']}\n";
    echo "   Email:        {$result['email']}\n";
    echo "   Password:     $managerPassword\n";
    echo "   Full Name:    {$result['full_name']}\n";
    echo "   Phone:        {$result['phone']}\n";
    echo "   Role ID:      {$result['role_id']} (4 = Manager)\n";
    echo "   Status:       {$result['status']}\n";
    echo "   Cinema ID:    " . ($result['cinema_id'] ?? 'Not assigned') . "\n";
    echo "   Cinema Name:  " . ($result['cinema_name'] ?? 'Not assigned') . "\n";
    echo "\n✅ Done! Login at /login with: $managerEmail / $managerPassword\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
