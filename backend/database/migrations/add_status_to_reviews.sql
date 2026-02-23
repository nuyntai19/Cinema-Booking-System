-- Migration: Add status column to reviews table
-- Date: 2026-02-23
-- Description: Add moderation status for reviews (Pending/Approved/Rejected)

-- Add status column
ALTER TABLE reviews 
ADD COLUMN status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending' 
COMMENT 'Review moderation status' 
AFTER comment;

-- Add index for status
ALTER TABLE reviews 
ADD INDEX idx_status (status);

-- Update existing reviews to Approved (backward compatibility)
UPDATE reviews 
SET status = 'Approved' 
WHERE status IS NULL OR status = '';

-- Show success message
SELECT 'Migration completed: reviews.status column added successfully' AS message;
