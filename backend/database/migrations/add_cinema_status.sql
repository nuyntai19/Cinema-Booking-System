-- ============================================
-- Migration: Add status column to cinemas
-- Safe to re-run (checks before adding column)
-- ============================================

USE galaxy_cinema;

-- Add status column to cinemas (if not exists)
SET @dbname = DATABASE();
SET @tablename = 'cinemas';
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

-- Set all existing cinemas to active
UPDATE cinemas SET status = 'active' WHERE status IS NULL;
