-- Add booking_code column to bookings table
ALTER TABLE bookings 
ADD COLUMN booking_code VARCHAR(20) UNIQUE NULL AFTER id;

-- Generate booking codes for existing bookings
UPDATE bookings 
SET booking_code = CONCAT('GXY-', DATE_FORMAT(created_at, '%Y'), '-', LPAD(id, 6, '0'))
WHERE booking_code IS NULL;

-- Make booking_code NOT NULL after populating
ALTER TABLE bookings 
MODIFY COLUMN booking_code VARCHAR(20) UNIQUE NOT NULL;

-- Add index for faster lookups
CREATE INDEX idx_booking_code ON bookings(booking_code);
