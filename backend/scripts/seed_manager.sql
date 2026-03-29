-- ================================================================
-- Galaxy Cinema – Manager & Staff Seed
-- Mục tiêu: Mỗi rạp có ĐÚNG 1 Manager (role_id=4) + nhiều Staff (role_id=3)
-- Password chung: Manager@123  →  hash bcrypt cost=10
-- ================================================================

USE galaxy_cinema;

-- ================================================================
-- BƯỚC 1: Tạo bảng cinema_staff nếu chưa có
-- ================================================================
CREATE TABLE IF NOT EXISTS cinema_staff (
    cinema_id  INT NOT NULL,
    user_id    INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    PRIMARY KEY (cinema_id, user_id),
    CONSTRAINT fk_cs_cinema FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE,
    CONSTRAINT fk_cs_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- BƯỚC 2: Tạo Manager cho từng rạp
--         Mỗi rạp có ĐÚNG 1 manager → gán vào cinemas.manager_id
-- ================================================================

-- ---------- Manager rạp 1 ----------
INSERT IGNORE INTO users (email, password_hash, role_id, status, created_at)
VALUES ('manager1@galaxycinema.vn',
        '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK',
        4, 'Active', NOW());

SELECT id INTO @mgr1 FROM users WHERE email = 'manager1@galaxycinema.vn' LIMIT 1;

INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id)
VALUES (@mgr1, 'Nguyễn Quản Lý 1', '0901000001', 1);

-- Gán cho rạp thứ 1 (id nhỏ nhất) nếu chưa có manager
UPDATE cinemas
SET manager_id = @mgr1
WHERE id = (SELECT id FROM (SELECT MIN(id) AS id FROM cinemas) AS t)
  AND (manager_id IS NULL OR manager_id = 0);

-- ---------- Manager rạp 2 ----------
INSERT IGNORE INTO users (email, password_hash, role_id, status, created_at)
VALUES ('manager2@galaxycinema.vn',
        '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK',
        4, 'Active', NOW());

SELECT id INTO @mgr2 FROM users WHERE email = 'manager2@galaxycinema.vn' LIMIT 1;

INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id)
VALUES (@mgr2, 'Trần Quản Lý 2', '0901000002', 1);

-- Gán cho rạp thứ 2
UPDATE cinemas
SET manager_id = @mgr2
WHERE id = (
    SELECT id FROM (
        SELECT MIN(id) AS id FROM cinemas
        WHERE id > (SELECT MIN(id) FROM cinemas)
    ) AS t
)
  AND (manager_id IS NULL OR manager_id = 0);

-- ---------- Manager rạp 3 ----------
INSERT IGNORE INTO users (email, password_hash, role_id, status, created_at)
VALUES ('manager3@galaxycinema.vn',
        '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK',
        4, 'Active', NOW());

SELECT id INTO @mgr3 FROM users WHERE email = 'manager3@galaxycinema.vn' LIMIT 1;

INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id)
VALUES (@mgr3, 'Lê Quản Lý 3', '0901000003', 1);

-- Gán cho rạp thứ 3 (chưa có manager)
UPDATE cinemas
SET manager_id = @mgr3
WHERE manager_id IS NULL
ORDER BY id ASC
LIMIT 1;

-- ================================================================
-- BƯỚC 3: Tạo nhân viên (Staff, role_id=3) + gán vào cinema_staff
-- ================================================================

-- Lấy id của 3 rạp đầu để gán nhân viên
SELECT id INTO @cinema1 FROM cinemas ORDER BY id ASC  LIMIT 1;
SELECT id INTO @cinema2 FROM cinemas WHERE id > @cinema1 ORDER BY id ASC LIMIT 1;
SELECT id INTO @cinema3 FROM cinemas WHERE id > @cinema2 ORDER BY id ASC LIMIT 1;

-- ----- Staff rạp 1 -----
INSERT IGNORE INTO users (email, password_hash, role_id, status, created_at)
VALUES
  ('staff1_c1@galaxycinema.vn', '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK', 3, 'Active', NOW()),
  ('staff2_c1@galaxycinema.vn', '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK', 3, 'Active', NOW());

SELECT id INTO @s1c1 FROM users WHERE email = 'staff1_c1@galaxycinema.vn' LIMIT 1;
SELECT id INTO @s2c1 FROM users WHERE email = 'staff2_c1@galaxycinema.vn' LIMIT 1;

INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id) VALUES
  (@s1c1, 'Nhân Viên 1 - Rạp 1', '0911000011', 1),
  (@s2c1, 'Nhân Viên 2 - Rạp 1', '0911000012', 1);

INSERT IGNORE INTO cinema_staff (cinema_id, user_id) VALUES
  (@cinema1, @s1c1),
  (@cinema1, @s2c1);

-- ----- Staff rạp 2 -----
INSERT IGNORE INTO users (email, password_hash, role_id, status, created_at)
VALUES
  ('staff1_c2@galaxycinema.vn', '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK', 3, 'Active', NOW()),
  ('staff2_c2@galaxycinema.vn', '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK', 3, 'Active', NOW());

SELECT id INTO @s1c2 FROM users WHERE email = 'staff1_c2@galaxycinema.vn' LIMIT 1;
SELECT id INTO @s2c2 FROM users WHERE email = 'staff2_c2@galaxycinema.vn' LIMIT 1;

INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id) VALUES
  (@s1c2, 'Nhân Viên 1 - Rạp 2', '0911000021', 1),
  (@s2c2, 'Nhân Viên 2 - Rạp 2', '0911000022', 1);

INSERT IGNORE INTO cinema_staff (cinema_id, user_id) VALUES
  (@cinema2, @s1c2),
  (@cinema2, @s2c2);

-- ----- Staff rạp 3 -----
INSERT IGNORE INTO users (email, password_hash, role_id, status, created_at)
VALUES
  ('staff1_c3@galaxycinema.vn', '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK', 3, 'Active', NOW()),
  ('staff2_c3@galaxycinema.vn', '$2y$10$8K1p/a0dLXmqMX1V5XJJaOL0kWBJgHzIlXUqCsNmBDPfG2RlEQgCK', 3, 'Active', NOW());

SELECT id INTO @s1c3 FROM users WHERE email = 'staff1_c3@galaxycinema.vn' LIMIT 1;
SELECT id INTO @s2c3 FROM users WHERE email = 'staff2_c3@galaxycinema.vn' LIMIT 1;

INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id) VALUES
  (@s1c3, 'Nhân Viên 1 - Rạp 3', '0911000031', 1),
  (@s2c3, 'Nhân Viên 2 - Rạp 3', '0911000032', 1);

INSERT IGNORE INTO cinema_staff (cinema_id, user_id) VALUES
  (@cinema3, @s1c3),
  (@cinema3, @s2c3);

-- ================================================================
-- BƯỚC 4: Nhân viên demo (từ file bạn tôi gửi) - gán vào rạp 1
-- ================================================================
INSERT IGNORE INTO users (email, password_hash, role_id, status, created_at) VALUES
  ('staff_demo1@galaxy.com', '$2y$10$rZ.5iF9R6r/5o0GZp5/x0On1QxJkZ1O.s9xU5R2q8r7L8r1Xq3GgW', 3, 'Active', NOW()),
  ('staff_demo2@galaxy.com', '$2y$10$rZ.5iF9R6r/5o0GZp5/x0On1QxJkZ1O.s9xU5R2q8r7L8r1Xq3GgW', 3, 'Active', NOW()),
  ('staff_demo3@galaxy.com', '$2y$10$rZ.5iF9R6r/5o0GZp5/x0On1QxJkZ1O.s9xU5R2q8r7L8r1Xq3GgW', 3, 'Active', NOW());

INSERT IGNORE INTO user_profiles (user_id, full_name, phone, membership_id) VALUES
  ((SELECT id FROM users WHERE email = 'staff_demo1@galaxy.com' LIMIT 1), 'Nguyễn Thị Nhân Viên A', '0901234001', 1),
  ((SELECT id FROM users WHERE email = 'staff_demo2@galaxy.com' LIMIT 1), 'Trần Văn Nhân Viên B',   '0901234002', 1),
  ((SELECT id FROM users WHERE email = 'staff_demo3@galaxy.com' LIMIT 1), 'Lê Thị Nhân Viên C',     '0901234003', 1);

INSERT IGNORE INTO cinema_staff (cinema_id, user_id) VALUES
  (@cinema1, (SELECT id FROM users WHERE email = 'staff_demo1@galaxy.com' LIMIT 1)),
  (@cinema1, (SELECT id FROM users WHERE email = 'staff_demo2@galaxy.com' LIMIT 1)),
  (@cinema1, (SELECT id FROM users WHERE email = 'staff_demo3@galaxy.com' LIMIT 1));

-- ================================================================
-- KIỂM TRA KẾT QUẢ
-- ================================================================
SELECT '=== CINEMAS + MANAGER ===' AS info;
SELECT
    c.id          AS cinema_id,
    c.name        AS cinema_name,
    u.id          AS manager_user_id,
    u.email       AS manager_email,
    up.full_name  AS manager_name
FROM cinemas c
LEFT JOIN users u       ON u.id = c.manager_id
LEFT JOIN user_profiles up ON up.user_id = u.id
ORDER BY c.id;

SELECT '=== STAFF THEO RẠP ===' AS info;
SELECT
    cs.cinema_id,
    c.name        AS cinema_name,
    u.email       AS staff_email,
    up.full_name  AS staff_name,
    u.status
FROM cinema_staff cs
JOIN cinemas c        ON c.id = cs.cinema_id
JOIN users u          ON u.id = cs.user_id
JOIN user_profiles up ON up.user_id = u.id
ORDER BY cs.cinema_id, u.email;
