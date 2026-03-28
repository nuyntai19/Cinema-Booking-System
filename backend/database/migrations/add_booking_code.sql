-- Add booking_code column to bookings table
-- Safe to re-run (checks if column exists before adding)
USE galaxy_cinema;

-- Add booking_code column (if not exists)
SET @dbname = DATABASE();
SET @tablename = 'bookings';
SET @columnname = 'booking_code';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT "Column booking_code already exists" AS info',
  'ALTER TABLE bookings ADD COLUMN booking_code VARCHAR(20) UNIQUE NULL AFTER id'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Generate booking codes for existing bookings
UPDATE bookings 
SET booking_code = CONCAT('GXY-', DATE_FORMAT(created_at, '%Y'), '-', LPAD(id, 6, '0'))
WHERE booking_code IS NULL;

-- Make booking_code NOT NULL after populating (only if it's still nullable)
SET @preparedStatement = (SELECT IF(
  (SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) = 'YES',
  'ALTER TABLE bookings MODIFY COLUMN booking_code VARCHAR(20) UNIQUE NOT NULL',
  'SELECT "Column booking_code is already NOT NULL" AS info'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
