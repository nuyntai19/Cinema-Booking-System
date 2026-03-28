-- Migration: Add status column to reviews table
-- Date: 2026-02-23
-- Description: Add moderation status for reviews (Pending/Approved/Rejected)
-- Safe to re-run (checks if column exists before adding)

USE galaxy_cinema;

SET @dbname = DATABASE();
SET @tablename = 'reviews';

-- Add status column (if not exists)
SET @columnname = 'status';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT "Column status already exists" AS info',
  "ALTER TABLE reviews ADD COLUMN status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending' COMMENT 'Review moderation status' AFTER comment"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for status (if not exists)
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_status') > 0,
  'SELECT "Index idx_status already exists" AS info',
  'ALTER TABLE reviews ADD INDEX idx_status (status)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing reviews to Approved (backward compatibility)
UPDATE reviews 
SET status = 'Approved' 
WHERE status IS NULL OR status = '';

-- Show success message
SELECT 'Migration completed: reviews.status column checked/added successfully' AS message;
