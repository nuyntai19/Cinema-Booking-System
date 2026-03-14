-- ============================================
-- Add scheduling support to notifications table
-- Run this if notifications table already exists from previous migration
-- ============================================

USE galaxy_cinema;

ALTER TABLE notifications
  ADD COLUMN status ENUM('SCHEDULED', 'SENT', 'CANCELLED') NOT NULL DEFAULT 'SENT' AFTER target_audience,
  ADD COLUMN scheduled_at DATETIME NULL AFTER status,
  ADD COLUMN sent_at DATETIME NULL AFTER scheduled_at;

UPDATE notifications
SET status = 'SENT',
    sent_at = COALESCE(sent_at, created_at),
    is_active = 1
WHERE status IS NULL OR status = '';

ALTER TABLE notifications
  ADD INDEX idx_status_schedule (status, scheduled_at);
