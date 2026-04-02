-- ============================================
-- MIGRATION: Permission-Based Access Control
-- Thêm hệ thống quản lý quyền hạn chi tiết
-- ============================================

USE galaxy_cinema;

-- Bảng Permissions (Danh sách tất cả các quyền trong hệ thống)
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên permission (vd: create_movie, delete_user)',
    display_name VARCHAR(255) NOT NULL COMMENT 'Tên hiển thị',
    description TEXT COMMENT 'Mô tả chi tiết',
    module VARCHAR(50) NOT NULL COMMENT 'Module/nhóm (movies, users, bookings, etc)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Role_Permissions (Mapping giữa role và permissions)
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    INDEX idx_role (role_id),
    INDEX idx_permission (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED PERMISSIONS DATA
-- ============================================

-- MODULE: MOVIES
INSERT INTO permissions (name, display_name, description, module) VALUES
('movies.view', 'Xem danh sách phim', 'Xem danh sách và chi tiết phim', 'movies'),
('movies.create', 'Tạo phim', 'Thêm phim mới vào hệ thống', 'movies'),
('movies.update', 'Cập nhật phim', 'Chỉnh sửa thông tin phim', 'movies'),
('movies.delete', 'Xóa phim', 'Xóa phim khỏi hệ thống', 'movies'),
('movies.upload_poster', 'Upload poster', 'Upload/thay đổi poster phim', 'movies'),
('movies.import', 'Import phim hàng loạt', 'Import nhiều phim cùng lúc', 'movies');

-- MODULE: USERS
INSERT INTO permissions (name, display_name, description, module) VALUES
('users.view_all', 'Xem tất cả users', 'Xem danh sách tất cả người dùng', 'users'),
('users.create', 'Tạo user', 'Tạo tài khoản người dùng mới', 'users'),
('users.update_all', 'Cập nhật tất cả users', 'Chỉnh sửa thông tin bất kỳ user nào', 'users'),
('users.delete', 'Xóa user', 'Xóa tài khoản người dùng', 'users'),
('users.change_role', 'Thay đổi role', 'Thay đổi vai trò của user', 'users'),
('users.view_own', 'Xem profile cá nhân', 'Xem và chỉnh sửa profile của chính mình', 'users');

-- MODULE: CINEMAS
INSERT INTO permissions (name, display_name, description, module) VALUES
('cinemas.view', 'Xem danh sách rạp', 'Xem thông tin các rạp chiếu', 'cinemas'),
('cinemas.create', 'Tạo rạp', 'Thêm rạp chiếu mới', 'cinemas'),
('cinemas.update', 'Cập nhật rạp', 'Chỉnh sửa thông tin rạp', 'cinemas'),
('cinemas.delete', 'Xóa rạp', 'Xóa rạp khỏi hệ thống', 'cinemas');

-- MODULE: HALLS
INSERT INTO permissions (name, display_name, description, module) VALUES
('halls.view', 'Xem phòng chiếu', 'Xem thông tin phòng chiếu', 'halls'),
('halls.create', 'Tạo phòng chiếu', 'Thêm phòng chiếu mới', 'halls'),
('halls.update', 'Cập nhật phòng chiếu', 'Chỉnh sửa thông tin phòng', 'halls'),
('halls.delete', 'Xóa phòng chiếu', 'Xóa phòng chiếu', 'halls'),
('halls.manage_layout', 'Quản lý layout ghế', 'Thiết lập sơ đồ ghế ngồi', 'halls');

-- MODULE: SHOWTIMES
INSERT INTO permissions (name, display_name, description, module) VALUES
('showtimes.view', 'Xem suất chiếu', 'Xem lịch chiếu phim', 'showtimes'),
('showtimes.create', 'Tạo suất chiếu', 'Thêm suất chiếu mới', 'showtimes'),
('showtimes.update', 'Cập nhật suất chiếu', 'Chỉnh sửa lịch chiếu', 'showtimes'),
('showtimes.delete', 'Xóa suất chiếu', 'Xóa suất chiếu', 'showtimes'),
('showtimes.auto_generate', 'Tự động tạo suất chiếu', 'Tạo lịch chiếu tự động', 'showtimes');

-- MODULE: BOOKINGS
INSERT INTO permissions (name, display_name, description, module) VALUES
('bookings.view_own', 'Xem booking cá nhân', 'Xem các booking của chính mình', 'bookings'),
('bookings.view_all', 'Xem tất cả bookings', 'Xem tất cả bookings trong hệ thống', 'bookings'),
('bookings.create', 'Tạo booking', 'Đặt vé mới', 'bookings'),
('bookings.update', 'Cập nhật booking', 'Chỉnh sửa booking', 'bookings'),
('bookings.cancel', 'Hủy booking', 'Hủy đặt vé', 'bookings'),
('bookings.refund', 'Hoàn tiền', 'Hoàn tiền cho booking', 'bookings'),
('bookings.pos', 'Bán vé POS', 'Bán vé tại quầy', 'bookings');

-- MODULE: TICKETS
INSERT INTO permissions (name, display_name, description, module) VALUES
('tickets.view_own', 'Xem vé cá nhân', 'Xem vé của chính mình', 'tickets'),
('tickets.view_all', 'Xem tất cả vé', 'Xem tất cả vé trong hệ thống', 'tickets'),
('tickets.scan', 'Scan vé', 'Scan QR code vé tại cổng', 'tickets'),
('tickets.approve_entry', 'Duyệt vào cổng', 'Cho phép khách vào rạp', 'tickets');

-- MODULE: TRANSACTIONS
INSERT INTO permissions (name, display_name, description, module) VALUES
('transactions.view_own', 'Xem giao dịch cá nhân', 'Xem lịch sử giao dịch của mình', 'transactions'),
('transactions.view_all', 'Xem tất cả giao dịch', 'Xem tất cả giao dịch', 'transactions'),
('transactions.process', 'Xử lý thanh toán', 'Xử lý các giao dịch thanh toán', 'transactions');

-- MODULE: REPORTS
INSERT INTO permissions (name, display_name, description, module) VALUES
('reports.dashboard', 'Xem dashboard', 'Xem bảng điều khiển thống kê', 'reports'),
('reports.revenue', 'Báo cáo doanh thu', 'Xem báo cáo doanh thu', 'reports'),
('reports.occupancy', 'Báo cáo công suất', 'Xem báo cáo tỷ lệ lấp đầy', 'reports'),
('reports.export', 'Export báo cáo', 'Xuất báo cáo ra file', 'reports');

-- MODULE: PROMOTIONS
INSERT INTO permissions (name, display_name, description, module) VALUES
('promotions.view', 'Xem khuyến mãi', 'Xem danh sách khuyến mãi', 'promotions'),
('promotions.create', 'Tạo khuyến mãi', 'Tạo chương trình khuyến mãi', 'promotions'),
('promotions.update', 'Cập nhật khuyến mãi', 'Chỉnh sửa khuyến mãi', 'promotions'),
('promotions.delete', 'Xóa khuyến mãi', 'Xóa khuyến mãi', 'promotions');

-- MODULE: CONCESSIONS
INSERT INTO permissions (name, display_name, description, module) VALUES
('concessions.view', 'Xem đồ ăn/nước', 'Xem menu đồ ăn nước', 'concessions'),
('concessions.create', 'Tạo món mới', 'Thêm món ăn/nước mới', 'concessions'),
('concessions.update', 'Cập nhật món', 'Chỉnh sửa thông tin món', 'concessions'),
('concessions.delete', 'Xóa món', 'Xóa món khỏi menu', 'concessions'),
('concessions.import', 'Import hàng loạt', 'Import nhiều món cùng lúc', 'concessions');

-- MODULE: REVIEWS
INSERT INTO permissions (name, display_name, description, module) VALUES
('reviews.view', 'Xem đánh giá', 'Xem đánh giá phim', 'reviews'),
('reviews.create', 'Viết đánh giá', 'Viết đánh giá phim', 'reviews'),
('reviews.update_own', 'Sửa đánh giá của mình', 'Chỉnh sửa đánh giá đã viết', 'reviews'),
('reviews.delete_any', 'Xóa bất kỳ đánh giá', 'Xóa đánh giá của người khác', 'reviews'),
('reviews.report', 'Report đánh giá', 'Báo cáo đánh giá vi phạm', 'reviews');

-- MODULE: SYSTEM
INSERT INTO permissions (name, display_name, description, module) VALUES
('system.settings', 'Quản lý cấu hình', 'Thay đổi cấu hình hệ thống', 'system'),
('system.permissions', 'Quản lý quyền hạn', 'Quản lý permissions và gán cho roles', 'system'),
('system.roles', 'Quản lý roles', 'Tạo/sửa/xóa roles', 'system');

-- ============================================
-- GÁN PERMISSIONS MẶC ĐỊNH CHO CÁC ROLES
-- ============================================

-- GUEST (ID=1) - Chỉ xem thông tin công khai
INSERT INTO role_permissions (role_id, permission_id) 
SELECT 1, id FROM permissions WHERE name IN (
    'movies.view',
    'cinemas.view',
    'showtimes.view',
    'promotions.view',
    'concessions.view',
    'reviews.view'
);

-- MEMBER (ID=2) - Thêm quyền đặt vé, đánh giá
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE name IN (
    -- Inherit from Guest
    'movies.view',
    'cinemas.view',
    'showtimes.view',
    'promotions.view',
    'concessions.view',
    'reviews.view',
    -- Member specific
    'users.view_own',
    'bookings.view_own',
    'bookings.create',
    'bookings.cancel',
    'tickets.view_own',
    'transactions.view_own',
    'reviews.create',
    'reviews.update_own',
    'reviews.report'
);

-- STAFF (ID=3) - Thêm quyền POS, scan vé
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE name IN (
    -- Inherit from Member
    'movies.view',
    'cinemas.view',
    'showtimes.view',
    'promotions.view',
    'concessions.view',
    'reviews.view',
    'users.view_own',
    'bookings.view_own',
    'bookings.create',
    'bookings.cancel',
    'tickets.view_own',
    'transactions.view_own',
    -- Staff specific
    'bookings.view_all',
    'bookings.pos',
    'tickets.scan',
    'tickets.approve_entry',
    'transactions.process'
);

-- MANAGER (ID=4) - Thêm quyền quản lý suất chiếu, báo cáo
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE name IN (
    -- Inherit from Staff (all)
    'movies.view',
    'cinemas.view',
    'halls.view',
    'showtimes.view',
    'promotions.view',
    'concessions.view',
    'reviews.view',
    'users.view_own',
    'bookings.view_own',
    'bookings.view_all',
    'bookings.create',
    'bookings.cancel',
    'bookings.pos',
    'tickets.view_own',
    'tickets.scan',
    'tickets.approve_entry',
    'transactions.view_own',
    'transactions.view_all',
    'transactions.process',
    -- Manager specific
    'movies.create',
    'movies.update',
    'showtimes.create',
    'showtimes.update',
    'showtimes.delete',
    'showtimes.auto_generate',
    'promotions.create',
    'promotions.update',
    'concessions.create',
    'concessions.update',
    'concessions.delete',
    'reports.dashboard',
    'reports.revenue',
    'reports.occupancy',
    'reports.export',
    'reviews.delete_any'
);

-- ADMIN (ID=5) - Toàn quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions;

-- ============================================
-- INDEXES và CONSTRAINTS
-- ============================================

-- Đảm bảo performance khi query permissions của role
CREATE INDEX idx_role_permissions_lookup ON role_permissions(role_id, permission_id);

-- ============================================
-- VIEWS (Optional - để query dễ hơn)
-- ============================================

-- View: Xem permissions của từng role
CREATE OR REPLACE VIEW vw_role_permissions AS
SELECT 
    r.id AS role_id,
    r.name AS role_name,
    p.id AS permission_id,
    p.name AS permission_name,
    p.display_name AS permission_display_name,
    p.module AS permission_module
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
ORDER BY r.id, p.module, p.name;

-- View: Đếm permissions của mỗi role
CREATE OR REPLACE VIEW vw_role_permission_count AS
SELECT 
    r.id AS role_id,
    r.name AS role_name,
    COUNT(rp.permission_id) AS permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY r.id;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'Permission system migration completed successfully!' AS status,
       (SELECT COUNT(*) FROM permissions) AS total_permissions,
       (SELECT COUNT(*) FROM role_permissions) AS total_role_permissions;
