-- ============================================
-- Galaxy Cinema Database Schema
-- Theo ERD đã cập nhật (Đã xóa SEAT_HOLDS, thêm LOYALTY_HISTORY, USER_VOUCHERS)
-- ============================================

-- XÓA DATABASE CŨ (NẾU CÓ)
DROP DATABASE IF EXISTS galaxy_cinema;

-- TẠO DATABASE MỚI
CREATE DATABASE galaxy_cinema CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- SỬ DỤNG DATABASE
USE galaxy_cinema;

-- ============================================
-- NHÓM 1: NGƯỜI DÙNG, ĐỊNH DANH & LOYALTY
-- ============================================

-- Bảng Vai Trò
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Guest/Member/Staff/Manager/Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Hạng Thành Viên
CREATE TABLE memberships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rank_name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Bronze/Silver/Gold/Platinum',
    min_points_required INT NOT NULL DEFAULT 0,
    discount_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Tỷ lệ giảm giá (%)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Người Dùng
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL DEFAULT 2 COMMENT 'Default: Member',
    status ENUM('Active', 'Banned') DEFAULT 'Active',
    current_points INT NOT NULL DEFAULT 0 COMMENT 'Tổng điểm loyalty hiện tại',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Hồ Sơ Người Dùng
CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    dob DATE COMMENT 'Ngày sinh để kiểm tra tuổi & tự động voucher sinh nhật',
    avatar VARCHAR(500),
    membership_id INT DEFAULT 1 COMMENT 'Default: Bronze',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE SET NULL,
    INDEX idx_dob (dob),
    INDEX idx_membership (membership_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Lịch Sử Tích Điểm (MỚI - Audit Trail)
CREATE TABLE loyalty_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points_change INT NOT NULL COMMENT '+ (Earn) hoặc - (Redeem)',
    type ENUM('PURCHASE', 'REDEEM', 'EVENT', 'ADMIN_ADJUST') NOT NULL,
    description TEXT,
    related_booking_id INT NULL COMMENT 'Nếu liên quan đến booking',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_type (user_id, type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NHÓM 2: PHIM & HẠ TẦNG RẠP
-- ============================================

-- Bảng Phim
CREATE TABLE movies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL,
    age_rating ENUM('P', 'K', 'T13', 'T16', 'T18', 'C') NOT NULL COMMENT 'Phân loại độ tuổi VN',
    origin ENUM('Vietnam', 'International') NOT NULL,
    poster_url VARCHAR(500),
    trailer_url VARCHAR(500),
    description TEXT,
    director VARCHAR(255) NULL COMMENT 'Movie director(s)',
    cast TEXT NULL COMMENT 'Movie cast (comma-separated names)',
    release_date DATE,
    status ENUM('Coming Soon', 'Now Showing', 'Ended') DEFAULT 'Coming Soon',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_origin (origin),
    INDEX idx_release_date (release_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Thể Loại
CREATE TABLE genres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Phim - Thể Loại (Many-to-Many)
CREATE TABLE movie_genres (
    movie_id INT NOT NULL,
    genre_id INT NOT NULL,
    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Cụm Rạp
CREATE TABLE cinemas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    street VARCHAR(255) DEFAULT NULL COMMENT 'Địa chỉ chi tiết',
    district VARCHAR(100) DEFAULT NULL COMMENT 'Quận/Huyện',
    city VARCHAR(100) DEFAULT NULL COMMENT 'Thành phố/Tỉnh',
    lat DECIMAL(10, 8) DEFAULT NULL COMMENT 'Vĩ độ',
    lng DECIMAL(11, 8) DEFAULT NULL COMMENT 'Kinh độ',
    hotline VARCHAR(20) DEFAULT NULL COMMENT 'Số hotline của rạp',
    status ENUM('active', 'maintenance', 'closed') DEFAULT 'active' COMMENT 'Trạng thái hoạt động',
    manager_id INT NULL COMMENT 'FK -> users (role Manager)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_manager (manager_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Phòng Chiếu
CREATE TABLE cinema_halls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cinema_id INT NOT NULL,
    name VARCHAR(100) NOT NULL COMMENT 'Room 1/IMAX/4DX',
    total_seats INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE,
    INDEX idx_cinema (cinema_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Loại Ghế
CREATE TABLE seat_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Standard/VIP/Sweetbox',
    price_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00 COMMENT 'Hệ số nhân giá',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Ghế Ngồi
CREATE TABLE seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cinema_hall_id INT NOT NULL,
    row_code VARCHAR(5) NOT NULL COMMENT 'A/B/C/D',
    number INT NOT NULL COMMENT 'Số ghế trong hàng',
    seat_type_id INT NOT NULL,
    status ENUM('Active', 'Broken', 'Inactive') DEFAULT 'Active' COMMENT 'Active: Hoạt động, Broken: Hỏng, Inactive: Khu vực không ngồi',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cinema_hall_id) REFERENCES cinema_halls(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_type_id) REFERENCES seat_types(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_seat (cinema_hall_id, row_code, number),
    INDEX idx_hall_status (cinema_hall_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NHÓM 3: LỊCH CHIẾU & ĐẶT VÉ
-- ============================================

-- Bảng Lịch Chiếu
CREATE TABLE showtimes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    cinema_hall_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL COMMENT 'Thời gian kết thúc (start_time + duration + cleanup)',
    base_price DECIMAL(10,2) NOT NULL DEFAULT 90000 COMMENT 'Giá vé cơ sở',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (cinema_hall_id) REFERENCES cinema_halls(id) ON DELETE CASCADE,
    INDEX idx_movie_time (movie_id, start_time),
    INDEX idx_hall_time (cinema_hall_id, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Quy Tắc Giá
CREATE TABLE pricing_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    condition_type VARCHAR(100) NOT NULL COMMENT 'Weekend/Before10AM/Holiday',
    adjustment_amount DECIMAL(10,2) NOT NULL COMMENT 'Số tiền tăng/giảm',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Khuyến Mãi
CREATE TABLE promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã public',
    description TEXT,
    discount_amount DECIMAL(10,2) NOT NULL COMMENT 'Số tiền giảm cố định hoặc %',
    discount_type ENUM('FIXED', 'PERCENT') DEFAULT 'FIXED',
    min_order_value DECIMAL(10,2) DEFAULT 0 COMMENT 'Giá trị đơn hàng tối thiểu',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_auto_apply BOOLEAN DEFAULT FALSE COMMENT 'True cho sinh nhật/sự kiện hệ thống',
    usage_limit INT DEFAULT NULL COMMENT 'Giới hạn số lần dùng (NULL = unlimited)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Kho Voucher Người Dùng (MỚI)
CREATE TABLE user_vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    promotion_id INT NOT NULL,
    code VARCHAR(50) NULL COMMENT 'Mã cụ thể cho user (nếu cần)',
    status ENUM('ACTIVE', 'USED', 'EXPIRED') DEFAULT 'ACTIVE',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_promotion (promotion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Đơn Đặt Vé
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    user_voucher_id INT NULL COMMENT 'FK -> user_vouchers nếu dùng voucher',
    total_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Paid', 'Cancelled', 'Expired') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_voucher_id) REFERENCES user_vouchers(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_showtime (showtime_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Vé Xem Phim (CẬP NHẬT - Tích hợp logic HOLDING)
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    seat_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    ticket_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'QR Code unique',
    status ENUM('HOLDING', 'SOLD', 'USED', 'REFUNDED') DEFAULT 'HOLDING' COMMENT 'HOLDING = đang giữ chỗ',
    hold_expires_at DATETIME NULL COMMENT 'Thời gian hết hạn giữ ghế (10 phút)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE RESTRICT,
    INDEX idx_booking (booking_id),
    INDEX idx_seat_status (seat_id, status),
    INDEX idx_ticket_code (ticket_code),
    INDEX idx_hold_expires (hold_expires_at, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Bắp Nước
CREATE TABLE concessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    category VARCHAR(100) COMMENT 'Popcorn/Drink/Combo',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Chi Tiết Bắp Nước trong Booking
CREATE TABLE booking_concessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    concession_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL COMMENT 'Giá tại thời điểm đặt',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (concession_id) REFERENCES concessions(id) ON DELETE RESTRICT,
    INDEX idx_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NHÓM 4: HỆ THỐNG & TƯƠNG TÁC
-- ============================================

-- Bảng Giao Dịch
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL COMMENT 'Momo/Card/Cash',
    amount DECIMAL(10,2) NOT NULL,
    transaction_code VARCHAR(100) UNIQUE,
    status ENUM('Pending', 'Success', 'Failed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id),
    INDEX idx_status (status),
    INDEX idx_transaction_code (transaction_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Đánh Giá
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    movie_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_movie (user_id, movie_id),
    INDEX idx_movie_rating (movie_id, rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Thông Báo
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) COMMENT 'BOOKING/PROMOTION/SYSTEM',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Cấu Hình Hệ Thống
CREATE TABLE system_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'e.g., min_vietnamese_movie_rate',
    config_value TEXT NOT NULL COMMENT 'e.g., 15',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRIGGER: Tự động cập nhật current_points khi có loyalty_history
-- ============================================
DELIMITER $$
CREATE TRIGGER after_loyalty_insert
AFTER INSERT ON loyalty_history
FOR EACH ROW
BEGIN
    UPDATE users 
    SET current_points = current_points + NEW.points_change
    WHERE id = NEW.user_id;
END$$
DELIMITER ;

-- ============================================
-- TRIGGER: Tự động hủy tickets HOLDING quá hạn
-- ============================================
DELIMITER $$
CREATE EVENT expire_holding_tickets
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
    UPDATE tickets
    SET status = 'REFUNDED'
    WHERE status = 'HOLDING' 
    AND hold_expires_at < NOW();
    
    -- Update booking status nếu tất cả tickets đều REFUNDED
    UPDATE bookings b
    SET b.status = 'Expired'
    WHERE b.status = 'Pending'
    AND NOT EXISTS (
        SELECT 1 FROM tickets t 
        WHERE t.booking_id = b.id 
        AND t.status IN ('HOLDING', 'SOLD')
    );
END$$
DELIMITER ;

SET GLOBAL event_scheduler = ON;

-- ============================================
-- INDEX bổ sung cho performance
-- ============================================
CREATE INDEX idx_movies_showing ON movies(status, release_date);
CREATE INDEX idx_showtimes_datetime ON showtimes(start_time, end_time);
CREATE INDEX idx_bookings_user_date ON bookings(user_id, created_at DESC);
