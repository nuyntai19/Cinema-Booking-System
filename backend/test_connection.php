x<?php
/**
 * Test Database Connection
 * Chạy file này để kiểm tra kết nối database
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config/Database.php';

echo "<h2>🎬 Galaxy Cinema - Test Database Connection</h2>";

try {
    // Get database instance
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    echo "✅ <strong>Kết nối database thành công!</strong><br><br>";
    
    // Test query: Count records in each table
    echo "<h3>📊 Thống kê dữ liệu:</h3>";
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
    echo "<tr><th>Bảng</th><th>Số bản ghi</th></tr>";
    
    $tables = [
        'users' => 'Người dùng',
        'user_profiles' => 'Hồ sơ',
        'roles' => 'Vai trò',
        'memberships' => 'Hạng thành viên',
        'movies' => 'Phim',
        'genres' => 'Thể loại',
        'cinemas' => 'Cụm rạp',
        'cinema_halls' => 'Phòng chiếu',
        'seats' => 'Ghế ngồi',
        'seat_types' => 'Loại ghế',
        'showtimes' => 'Lịch chiếu',
        'bookings' => 'Đơn đặt vé',
        'tickets' => 'Vé',
        'promotions' => 'Khuyến mãi',
        'user_vouchers' => 'Voucher người dùng',
        'loyalty_history' => 'Lịch sử tích điểm',
        'concessions' => 'Bắp nước',
        'transactions' => 'Giao dịch',
        'reviews' => 'Đánh giá',
        'notifications' => 'Thông báo',
        'system_configs' => 'Cấu hình hệ thống'
    ];
    
    foreach ($tables as $table => $label) {
        $stmt = $conn->query("SELECT COUNT(*) as count FROM $table");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $count = $result['count'];
        
        $color = $count > 0 ? 'green' : 'orange';
        echo "<tr>";
        echo "<td><strong>$label</strong> ($table)</td>";
        echo "<td style='color: $color; font-weight: bold;'>$count</td>";
        echo "</tr>";
    }
    
    echo "</table><br>";
    
    // Test query: Get sample user
    echo "<h3>👤 Dữ liệu mẫu - Users:</h3>";
    $stmt = $conn->query("
        SELECT u.id, u.email, r.name as role, u.current_points, u.status
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LIMIT 5
    ");
    
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Email</th><th>Role</th><th>Points</th><th>Status</th></tr>";
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr>";
        echo "<td>{$row['id']}</td>";
        echo "<td>{$row['email']}</td>";
        echo "<td><strong>{$row['role']}</strong></td>";
        echo "<td>{$row['current_points']}</td>";
        echo "<td style='color: " . ($row['status'] === 'Active' ? 'green' : 'red') . "'>{$row['status']}</td>";
        echo "</tr>";
    }
    
    echo "</table><br>";
    
    // Test query: Get sample movies
    echo "<h3>🎬 Dữ liệu mẫu - Movies:</h3>";
    $stmt = $conn->query("
        SELECT id, title, duration_minutes, age_rating, origin, status
        FROM movies
        LIMIT 5
    ");
    
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Tên Phim</th><th>Thời lượng</th><th>Độ tuổi</th><th>Xuất xứ</th><th>Trạng thái</th></tr>";
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr>";
        echo "<td>{$row['id']}</td>";
        echo "<td><strong>{$row['title']}</strong></td>";
        echo "<td>{$row['duration_minutes']} phút</td>";
        echo "<td><span style='background: orange; padding: 2px 8px; border-radius: 3px; color: white;'>{$row['age_rating']}</span></td>";
        echo "<td>{$row['origin']}</td>";
        echo "<td style='color: " . ($row['status'] === 'Now Showing' ? 'green' : 'blue') . "'>{$row['status']}</td>";
        echo "</tr>";
    }
    
    echo "</table><br>";
    
    echo "<hr>";
    echo "✅ <strong style='color: green; font-size: 18px;'>Tất cả đều hoạt động tốt! Backend đã sẵn sàng! 🚀</strong>";
    
} catch (PDOException $e) {
    echo "❌ <strong style='color: red;'>Lỗi kết nối database:</strong><br>";
    echo $e->getMessage();
}
