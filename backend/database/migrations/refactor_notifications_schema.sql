-- ============================================
-- Refactor notifications schema to avoid one-row-per-user duplication
-- New model: notifications (campaign) + notification_reads (read tracking)
-- ============================================

USE galaxy_cinema;

START TRANSACTION;

-- Backup old table
DROP TABLE IF EXISTS notifications_backup;
CREATE TABLE notifications_backup AS SELECT * FROM notifications;

-- Rename old notifications table
RENAME TABLE notifications TO notifications_legacy;

-- Create new notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) COMMENT 'BOOKING/PROMOTION/SYSTEM',
    target_audience ENUM('ALL', 'GUEST', 'USER', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'ALL',
    status ENUM('SCHEDULED', 'SENT', 'CANCELLED') NOT NULL DEFAULT 'SENT',
    scheduled_at DATETIME NULL,
    sent_at DATETIME NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_target (target_audience),
    INDEX idx_type_target (type, target_audience),
    INDEX idx_status_schedule (status, scheduled_at),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create notification_reads table
CREATE TABLE notification_reads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notification_id INT NOT NULL,
    user_id INT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT TRUE,
    read_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_notification_user (notification_id, user_id),
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_notification (notification_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate old rows into deduplicated notifications (assume old rows mostly customer-facing)
INSERT INTO notifications (title, message, type, target_audience, status, scheduled_at, sent_at, is_active, created_by, created_at)
SELECT l.title,
       l.message,
       COALESCE(l.type, 'SYSTEM') AS type,
       'USER' AS target_audience,
    'SENT' AS status,
    NULL AS scheduled_at,
    l.created_at AS sent_at,
       TRUE,
       NULL,
       l.created_at
FROM notifications_legacy l
GROUP BY l.title, l.message, COALESCE(l.type, 'SYSTEM'), l.created_at
ORDER BY l.created_at;

-- Migrate read status
INSERT INTO notification_reads (notification_id, user_id, is_read, read_at)
SELECT n.id,
       l.user_id,
       TRUE,
       l.created_at
FROM notifications_legacy l
INNER JOIN notifications n
    ON n.title = l.title
   AND n.message = l.message
   AND COALESCE(n.type, 'SYSTEM') = COALESCE(l.type, 'SYSTEM')
   AND n.created_at = l.created_at
WHERE l.is_read = 1;

-- Keep legacy table for verification/manual rollback; drop manually after checking.
COMMIT;

-- Verification helpers
SELECT COUNT(*) AS notifications_legacy_count FROM notifications_legacy;
SELECT COUNT(*) AS notifications_new_count FROM notifications;
SELECT COUNT(*) AS notification_reads_count FROM notification_reads;
