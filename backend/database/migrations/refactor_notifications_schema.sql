-- ============================================
-- Refactor notifications schema to avoid one-row-per-user duplication
-- New model: notifications (campaign) + notification_reads (read tracking)
-- Safe to re-run: checks if tables/columns exist before creating
-- ============================================

USE galaxy_cinema;

START TRANSACTION;

-- Check if we need to migrate from old schema (notifications_legacy doesn't exist yet)
SET @needs_migration = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications_legacy') = 0
  AND (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'user_id') > 0,
  1, 0
));

-- Only run migration if old schema exists (has user_id column) and hasn't been migrated yet
-- If already migrated or fresh install, skip everything

-- Backup old table (only if migration needed)
SET @stmt = IF(@needs_migration = 1,
  'CREATE TABLE IF NOT EXISTS notifications_backup AS SELECT * FROM notifications',
  'SELECT "No migration needed - skipping backup" AS info'
);
PREPARE execStmt FROM @stmt;
EXECUTE execStmt;
DEALLOCATE PREPARE execStmt;

-- Rename old notifications table (only if migration needed)
SET @stmt = IF(@needs_migration = 1,
  'RENAME TABLE notifications TO notifications_legacy',
  'SELECT "No migration needed - skipping rename" AS info'
);
PREPARE execStmt FROM @stmt;
EXECUTE execStmt;
DEALLOCATE PREPARE execStmt;

-- Create new notifications table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
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

-- Create notification_reads table (if not exists)
CREATE TABLE IF NOT EXISTS notification_reads (
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

-- Migrate data only if legacy table exists
SET @has_legacy = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications_legacy');

SET @stmt = IF(@has_legacy > 0 AND @needs_migration = 1,
  CONCAT(
    'INSERT IGNORE INTO notifications (title, message, type, target_audience, status, scheduled_at, sent_at, is_active, created_by, created_at) ',
    'SELECT l.title, l.message, COALESCE(l.type, ''SYSTEM'') AS type, ''USER'' AS target_audience, ',
    '''SENT'' AS status, NULL AS scheduled_at, l.created_at AS sent_at, TRUE, NULL, l.created_at ',
    'FROM notifications_legacy l ',
    'GROUP BY l.title, l.message, COALESCE(l.type, ''SYSTEM''), l.created_at ',
    'ORDER BY l.created_at'
  ),
  'SELECT "No legacy data to migrate" AS info'
);
PREPARE execStmt FROM @stmt;
EXECUTE execStmt;
DEALLOCATE PREPARE execStmt;

COMMIT;

-- Verification
SELECT 'notifications' AS table_name, COUNT(*) AS record_count FROM notifications
UNION ALL
SELECT 'notification_reads', COUNT(*) FROM notification_reads;
