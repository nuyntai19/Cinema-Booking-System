-- ============================================
-- Migration: Cinema Manager Module
-- Ngày: 2026-03-29
-- Mô tả: Thêm cinema_id vào JWT payload thông qua cinemas.manager_id
--         Bảng cinemas đã có cột manager_id → chỉ cần thêm index + seed data
-- ============================================

USE galaxy_cinema;

-- Đảm bảo index cho manager_id tồn tại trong cinemas (đã có nhưng chắc chắn)
-- cinemas.manager_id FK -> users(id) đã tồn tại trong schema gốc

-- Thêm cột cinema_id vào users để cache tra cứu nhanh (optional, dùng cinemas.manager_id là đủ)
-- Không cần thiết vì ta JOIN cinemas ON manager_id = user_id

-- Đảm bảo index tìm kiếm theo manager_id hiệu quả
ALTER TABLE cinemas
    MODIFY COLUMN manager_id INT NULL COMMENT 'FK -> users (role Manager) - Quản lý rạp này';

-- Tạo index nếu chưa có
CREATE INDEX IF NOT EXISTS idx_cinema_manager ON cinemas(manager_id);

-- ============================================
-- Thêm seed data: Tài khoản Manager mẫu
-- Password: Manager@123 (bcrypt hash)
-- ============================================

-- Tạo tài khoản manager (role_id = 4)
INSERT IGNORE INTO users (email, password_hash, role_id, status, current_points)
VALUES (
    'manager@galaxy.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    4,
    'Active',
    0
);

-- Lấy user_id vừa tạo
SET @manager_user_id = (SELECT id FROM users WHERE email = 'manager@galaxy.com');

-- Tạo profile cho manager
INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id)
VALUES (@manager_user_id, 'Nguyễn Văn Manager', '0901234567', 1);

-- Gán manager cho rạp đầu tiên (nếu chưa có manager)
UPDATE cinemas
SET manager_id = @manager_user_id
WHERE id = (SELECT * FROM (SELECT MIN(id) FROM cinemas) AS tmp)
  AND (manager_id IS NULL);

-- Hiển thị kết quả
SELECT
    u.id,
    u.email,
    u.role_id,
    up.full_name,
    c.id AS cinema_id,
    c.name AS cinema_name
FROM users u
JOIN user_profiles up ON up.user_id = u.id
LEFT JOIN cinemas c ON c.manager_id = u.id
WHERE u.email = 'manager@galaxy.com';
