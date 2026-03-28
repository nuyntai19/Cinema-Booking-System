USE galaxy_cinema;

-- Migration: Add POS guest customer support
-- Run once on existing database (or re-run safely on MySQL 8+)

CREATE TABLE IF NOT EXISTS pos_customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL COMMENT 'Số điện thoại khách',
    name VARCHAR(255) COMMENT 'Tên khách (tuỳ chọn)',
    guest_customer_code VARCHAR(50) UNIQUE COMMENT 'Mã khách vãng lai (GUEST-...)',
    total_bookings INT DEFAULT 0 COMMENT 'Số lần mua vé',
    first_visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by_staff_id INT NULL COMMENT 'Staff tạo bản ghi này',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_staff_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_phone (phone),
    INDEX idx_guest_code (guest_customer_code),
    INDEX idx_first_visit (first_visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add guest_customer_id column if missing (compatible with older MySQL)
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME = 'guest_customer_id'
);

SET @col_sql = IF(
    @col_exists = 0,
    "ALTER TABLE bookings ADD COLUMN guest_customer_id INT NULL COMMENT 'FK -> pos_customers nếu khách vãng lai, NULL nếu user đã đăng nhập' AFTER user_id",
    'SELECT 1'
);

PREPARE stmt_col FROM @col_sql;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

-- Make user_id nullable for guest bookings
ALTER TABLE bookings
    MODIFY COLUMN user_id INT NULL COMMENT 'FK -> users nếu user đã đăng nhập, NULL nếu khách vãng lai';

-- Add index for guest_customer_id if missing (compatible with older MySQL)
SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bookings'
      AND INDEX_NAME = 'idx_guest_customer'
);

SET @idx_sql = IF(
    @idx_exists = 0,
    'ALTER TABLE bookings ADD INDEX idx_guest_customer (guest_customer_id)',
    'SELECT 1'
);

PREPARE stmt_idx FROM @idx_sql;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;

SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bookings'
      AND CONSTRAINT_NAME = 'fk_bookings_guest_customer'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @fk_sql = IF(
    @fk_exists = 0,
    'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_guest_customer FOREIGN KEY (guest_customer_id) REFERENCES pos_customers(id) ON DELETE CASCADE',
    'SELECT 1'
);

PREPARE stmt_fk FROM @fk_sql;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;
