-- ============================================================
-- Cinema Concession Inventory
-- File: update_concession_inventory.sql
-- Mô tả: Tạo bảng tồn kho bắp nước theo rạp
-- Chạy trên XAMPP / phpMyAdmin
-- ============================================================

USE galaxy_cinema;

-- Tạo bảng tồn kho theo rạp x sản phẩm
-- Dùng INT (không phải UNSIGNED) để khớp với cinemas.id và concessions.id trong schema gốc
CREATE TABLE IF NOT EXISTS `cinema_concession_inventory` (
  `id`             INT             NOT NULL AUTO_INCREMENT,
  `cinema_id`      INT             NOT NULL,
  `concession_id`  INT             NOT NULL,
  `quantity`       INT             NOT NULL DEFAULT 0,
  `updated_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cinema_concession` (`cinema_id`, `concession_id`),
  CONSTRAINT `fk_cci_cinema`     FOREIGN KEY (`cinema_id`)     REFERENCES `cinemas`(`id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_cci_concession` FOREIGN KEY (`concession_id`) REFERENCES `concessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Khởi tạo tồn kho = 100 cho tất cả rạp x sản phẩm đang có
INSERT IGNORE INTO `cinema_concession_inventory` (`cinema_id`, `concession_id`, `quantity`)
SELECT c.id, co.id, 100
FROM cinemas c
CROSS JOIN concessions co;
