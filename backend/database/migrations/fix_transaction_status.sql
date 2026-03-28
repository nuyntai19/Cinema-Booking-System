-- Fix existing transactions with Pending status where booking is already Paid
USE galaxy_cinema;

UPDATE transactions t
JOIN bookings b ON t.booking_id = b.id
SET t.status = 'Completed'
WHERE b.status = 'Paid' AND t.status = 'Pending';

-- Show updated count
SELECT 
    'Updated transactions:' as info,
    COUNT(*) as count 
FROM transactions 
WHERE status = 'Completed';
