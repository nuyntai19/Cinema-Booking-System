-- Migration: Add director and cast columns to movies table
-- Date: 2026-02-16
-- Safe to re-run (checks if columns exist before adding)

USE galaxy_cinema;

-- Add director column (if not exists)
SET @dbname = DATABASE();
SET @tablename = 'movies';
SET @columnname = 'director';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT "Column director already exists" AS info',
  "ALTER TABLE movies ADD COLUMN director VARCHAR(255) NULL COMMENT 'Movie director(s)' AFTER description"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add cast column (if not exists)
SET @columnname = 'cast';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT "Column cast already exists" AS info',
  "ALTER TABLE movies ADD COLUMN cast TEXT NULL COMMENT 'Movie cast (comma-separated names)' AFTER director"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SELECT 'Migration completed: director and cast columns checked/added' AS status;
