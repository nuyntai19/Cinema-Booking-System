-- Thêm cột is_active vào bảng permissions để khóa/mở khóa permission thay vì xóa cứng
ALTER TABLE permissions ADD COLUMN is_active TINYINT NOT NULL DEFAULT 1 COMMENT 'Trạng thái: 1=Hoạt động, 0=Đã khóa' AFTER module;
