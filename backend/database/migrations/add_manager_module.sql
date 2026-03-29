-- ============================================
-- Migration: Cinema Manager Module
-- Ngày: 2026-03-29
-- Mô tả: Tạo bảng cinema_staff, thêm index manager_id
--         Mỗi rạp có đúng 1 Manager (cinemas.manager_id)
--         Nhân viên (Staff) thuộc rạp qua bảng cinema_staff
-- ============================================

USE galaxy_cinema;

-- ----------------------------------------------------------------
-- 1. Tạo bảng cinema_staff nếu chưa có
--    Mapping: nhân viên (role=3) ↔ rạp
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cinema_staff (
    cinema_id  INT NOT NULL,
    user_id    INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    PRIMARY KEY (cinema_id, user_id),
    CONSTRAINT fk_cs_cinema FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE,
    CONSTRAINT fk_cs_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------
-- 2. Đảm bảo cột manager_id trong cinemas đúng comment
-- ----------------------------------------------------------------
ALTER TABLE cinemas
    MODIFY COLUMN manager_id INT NULL COMMENT 'FK -> users (role_id=4 Manager) - Mỗi rạp tối đa 1 quản lý';

-- ----------------------------------------------------------------
-- 3. Tạo index nếu chưa có (tương thích MySQL 5.7+)
-- ----------------------------------------------------------------
DROP PROCEDURE IF EXISTS _add_idx_cinema_manager;
DELIMITER $$
CREATE PROCEDURE _add_idx_cinema_manager()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE table_schema = DATABASE()
          AND table_name   = 'cinemas'
          AND index_name   = 'idx_cinema_manager'
    ) THEN
        CREATE INDEX idx_cinema_manager ON cinemas(manager_id);
    END IF;
END$$
DELIMITER ;
CALL _add_idx_cinema_manager();
DROP PROCEDURE IF EXISTS _add_idx_cinema_manager;

-- ----------------------------------------------------------------
-- 4. Seed: Tài khoản Manager mẫu cho rạp đầu tiên
--    Password: password (hash bcrypt)
-- ----------------------------------------------------------------
INSERT IGNORE INTO users (email, password_hash, role_id, status, current_points)
VALUES (
    'manager@galaxy.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    4,
    'Active',
    0
);

-- FIX: Dùng SELECT INTO thay vì SET @var = (SELECT...) để tránh lỗi parse '@' trong Workbench
SELECT id INTO @manager_user_id FROM users WHERE email = 'manager@galaxy.com' LIMIT 1;

INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id)
VALUES (@manager_user_id, 'Nguyễn Văn Manager', '0901234567', 1);

-- Gán manager cho rạp đầu tiên chưa có manager
UPDATE cinemas
SET manager_id = @manager_user_id
WHERE id = (SELECT id FROM (SELECT MIN(id) AS id FROM cinemas WHERE manager_id IS NULL) AS tmp);

-- ----------------------------------------------------------------
-- 5. Kiểm tra kết quả
-- ----------------------------------------------------------------
SELECT
    u.id        AS user_id,
    u.email,
    u.role_id,
    up.full_name,
    c.id        AS cinema_id,
    c.name      AS cinema_name
FROM users u
JOIN user_profiles up ON up.user_id = u.id
LEFT JOIN cinemas c   ON c.manager_id = u.id
WHERE u.email = 'manager@galaxy.com';
