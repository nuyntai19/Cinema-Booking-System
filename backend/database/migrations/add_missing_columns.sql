-- ============================================
-- Migration: Add missing columns
-- hotline and status for cinemas, base_price for showtimes
-- Safe to re-run (checks before adding columns)
-- ============================================

USE galaxy_cinema;

-- Add hotline column to cinemas (if not exists)
SET @dbname = DATABASE();
SET @tablename = 'cinemas';
SET @columnname = 'hotline';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE cinemas ADD COLUMN hotline VARCHAR(20) DEFAULT NULL AFTER address'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add status column to cinemas (if not exists)
SET @columnname = 'status';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  "ALTER TABLE cinemas ADD COLUMN status ENUM('active', 'maintenance', 'closed') DEFAULT 'active' COMMENT 'Trang thai hoat dong' AFTER hotline"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add base_price column to showtimes (if not exists)
SET @tablename = 'showtimes';
SET @columnname = 'base_price';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE showtimes ADD COLUMN base_price DECIMAL(10,2) NOT NULL DEFAULT 90000 AFTER end_time'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing seed data with sample hotlines
UPDATE cinemas SET hotline = '1900 2224' WHERE id = 1 AND hotline IS NULL;
UPDATE cinemas SET hotline = '1900 2225' WHERE id = 2 AND hotline IS NULL;
UPDATE cinemas SET hotline = '1900 2226' WHERE id = 3 AND hotline IS NULL;

-- Set all existing cinemas to active
UPDATE cinemas SET status = 'active' WHERE status IS NULL;
