-- ============================================
-- Add scheduling support to notifications table
-- Run this if notifications table already exists from previous migration
-- Safe to re-run (checks if columns exist before adding)
-- ============================================

USE galaxy_cinema;

SET @dbname = DATABASE();
SET @tablename = 'notifications';

-- Add status column (if not exists)
SET @columnname = 'status';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT "Column status already exists" AS info',
  "ALTER TABLE notifications ADD COLUMN status ENUM('SCHEDULED', 'SENT', 'CANCELLED') NOT NULL DEFAULT 'SENT' AFTER target_audience"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add scheduled_at column (if not exists)
SET @columnname = 'scheduled_at';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT "Column scheduled_at already exists" AS info',
  'ALTER TABLE notifications ADD COLUMN scheduled_at DATETIME NULL AFTER status'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add sent_at column (if not exists)
SET @columnname = 'sent_at';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT "Column sent_at already exists" AS info',
  'ALTER TABLE notifications ADD COLUMN sent_at DATETIME NULL AFTER scheduled_at'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing notifications
UPDATE notifications
SET status = 'SENT',
    sent_at = COALESCE(sent_at, created_at),
    is_active = 1
WHERE status IS NULL OR status = '';

-- Add index (ignore error if already exists)
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_status_schedule') > 0,
  'SELECT "Index idx_status_schedule already exists" AS info',
  'ALTER TABLE notifications ADD INDEX idx_status_schedule (status, scheduled_at)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
