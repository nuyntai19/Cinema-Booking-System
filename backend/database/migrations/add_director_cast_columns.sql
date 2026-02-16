-- Migration: Add director and cast columns to movies table
-- Date: 2026-02-16

USE galaxy_cinema;

-- Add director column
ALTER TABLE movies 
ADD COLUMN director VARCHAR(255) NULL COMMENT 'Movie director(s)' AFTER description;

-- Add cast column (JSON format for multiple actors)
ALTER TABLE movies 
ADD COLUMN cast TEXT NULL COMMENT 'Movie cast (comma-separated names)' AFTER director;

-- Update existing movies with placeholder values (optional)
-- UPDATE movies SET director = 'Unknown', cast = 'Unknown' WHERE director IS NULL;

SELECT 'Migration completed: director and cast columns added' AS status;
