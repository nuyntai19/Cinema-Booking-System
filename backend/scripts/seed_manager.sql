-- ================================================================
-- Galaxy Cinema – Cinema Manager Seed & Schema Patch
-- Run: mysql -u root galaxy_cinema < seed_manager.sql
-- ================================================================

USE galaxy_cinema;

-- ----------------------------------------------------------------
-- 1. Tạo bảng cinema_staff (mapping nhân viên ↔ rạp)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cinema_staff (
    cinema_id  INT NOT NULL,
    user_id    INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    PRIMARY KEY (cinema_id, user_id),
    CONSTRAINT fk_cs_cinema FOREIGN KEY (cinema_id) REFERENCES cinemas(id)  ON DELETE CASCADE,
    CONSTRAINT fk_cs_user   FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- 2. Tạo tài khoản Manager mẫu (password: Manager@123)
--    bcrypt hash của "Manager@123" với cost=10
-- ----------------------------------------------------------------
INSERT IGNORE INTO users (email, password_hash, role_id, status, created_at)
VALUES (
    'manager@galaxycinema.vn',
    '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK',
    4,
    'Active',
    NOW()
);

-- Lấy id vừa tạo
SET @manager_id = (SELECT id FROM users WHERE email = 'manager@galaxycinema.vn' LIMIT 1);

-- Tạo user_profile cho manager
INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id, created_at)
VALUES (@manager_id, 'Nguyễn Quản Lý', '0901234567', 1, NOW());

-- ----------------------------------------------------------------
-- 3. Gán manager cho rạp đầu tiên (cinema id=1)
-- ----------------------------------------------------------------
-- Lấy cinema đầu tiên chưa có manager, hoặc cinema id=1
SET @cinema_id = (SELECT id FROM cinemas ORDER BY id ASC LIMIT 1);

-- Gán manager_id cho cinema
UPDATE cinemas
SET manager_id = @manager_id
WHERE id = @cinema_id AND (manager_id IS NULL OR manager_id = 0);

-- ----------------------------------------------------------------
-- 4. Tạo thêm 1 tài khoản Manager thứ 2 (gán cho cinema id=2 nếu có)
-- ----------------------------------------------------------------
INSERT IGNORE INTO users (email, password_hash, role_id, status, created_at)
VALUES (
    'manager2@galaxycinema.vn',
    '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK',
    4,
    'Active',
    NOW()
);

SET @manager2_id = (SELECT id FROM users WHERE email = 'manager2@galaxycinema.vn' LIMIT 1);

INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id, created_at)
VALUES (@manager2_id, 'Trần Quản Lý', '0912345678', 1, NOW());

-- Gán cho cinema thứ 2 nếu tồn tại
SET @cinema2_id = (SELECT id FROM cinemas WHERE id != @cinema_id ORDER BY id ASC LIMIT 1);
UPDATE cinemas
SET manager_id = @manager2_id
WHERE id = @cinema2_id AND @cinema2_id IS NOT NULL AND (manager_id IS NULL OR manager_id = 0);

-- ----------------------------------------------------------------
-- 5. Tạo nhân viên (Staff, role_id=3) mẫu và link vào cinema
-- ----------------------------------------------------------------
-- Staff 1
INSERT IGNORE INTO users (email, password_hash, role_id, status, created_at)
VALUES ('staff1@galaxycinema.vn', '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK', 3, 'Active', NOW());
SET @staff1_id = (SELECT id FROM users WHERE email = 'staff1@galaxycinema.vn' LIMIT 1);
INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id) VALUES (@staff1_id, 'Lê Văn Staff', '0933111111', 1);
INSERT IGNORE INTO cinema_staff (cinema_id, user_id) VALUES (@cinema_id, @staff1_id);

-- Staff 2
INSERT IGNORE INTO users (email, password_hash, role_id, status, created_at)
VALUES ('staff2@galaxycinema.vn', '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK', 3, 'Active', NOW());
SET @staff2_id = (SELECT id FROM users WHERE email = 'staff2@galaxycinema.vn' LIMIT 1);
INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id) VALUES (@staff2_id, 'Nguyễn Thị Nhân Viên', '0933222222', 1);
INSERT IGNORE INTO cinema_staff (cinema_id, user_id) VALUES (@cinema_id, @staff2_id);

-- Staff 3 (Banned for testing)
INSERT IGNORE INTO users (email, password_hash, role_id, status, created_at)
VALUES ('staff3@galaxycinema.vn', '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK', 3, 'Banned', NOW());
SET @staff3_id = (SELECT id FROM users WHERE email = 'staff3@galaxycinema.vn' LIMIT 1);
INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id) VALUES (@staff3_id, 'Phạm Quốc Vinh', '0933333333', 1);
INSERT IGNORE INTO cinema_staff (cinema_id, user_id) VALUES (@cinema_id, @staff3_id);

-- ----------------------------------------------------------------
-- 6. Kiểm tra kết quả
-- ----------------------------------------------------------------
SELECT '=== CINEMAS ===' AS info;
SELECT id, name, manager_id FROM cinemas ORDER BY id;

SELECT '=== MANAGERS ===' AS info;
SELECT u.id, u.email, u.role_id, u.status, up.full_name
FROM users u
JOIN user_profiles up ON up.user_id = u.id
WHERE u.role_id = 4;

SELECT '=== CINEMA_STAFF ===' AS info;
SELECT cs.cinema_id, c.name AS cinema_name, u.email, up.full_name, u.status
FROM cinema_staff cs
JOIN cinemas c ON c.id = cs.cinema_id
JOIN users u ON u.id = cs.user_id
JOIN user_profiles up ON up.user_id = u.id;
