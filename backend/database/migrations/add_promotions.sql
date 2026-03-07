-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th3 07, 2026 lúc 03:18 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `galaxy_cinema`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `promotions`
--

CREATE TABLE `promotions` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL COMMENT 'Mã public',
  `description` text DEFAULT NULL,
  `discount_amount` decimal(10,2) NOT NULL COMMENT 'Số tiền giảm cố định hoặc %',
  `discount_type` enum('FIXED','PERCENT') DEFAULT 'FIXED',
  `min_order_value` decimal(10,2) DEFAULT 0.00 COMMENT 'Giá trị đơn hàng tối thiểu',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_auto_apply` tinyint(1) DEFAULT 0 COMMENT 'True cho sinh nhật/sự kiện hệ thống',
  `usage_limit` int(11) DEFAULT NULL COMMENT 'Giới hạn số lần dùng (NULL = unlimited)',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `max_discount` decimal(10,2) DEFAULT NULL COMMENT 'So tien giam toi da (chi ap dung cho loai PERCENT)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `promotions`
--

INSERT INTO `promotions` (`id`, `code`, `description`, `discount_amount`, `discount_type`, `min_order_value`, `start_date`, `end_date`, `is_auto_apply`, `usage_limit`, `created_at`, `max_discount`) VALUES
(1, 'WELCOME2026', 'Giảm 50K cho khách hàng mới', 50000.00, 'FIXED', 200000.00, '2026-01-01', '2026-12-31', 0, NULL, '2026-03-06 19:01:02', NULL),
(2, 'BIRTHDAY', 'Voucher sinh nhật - Giảm 20%', 20.00, 'PERCENT', 100000.00, '2026-01-01', '2026-12-31', 1, 1, '2026-03-06 19:01:02', NULL),
(3, 'WEEKEND20', 'Giảm 20% cuối tuần', 20.00, 'PERCENT', 150000.00, '2026-01-01', '2026-12-31', 0, NULL, '2026-03-06 19:01:02', NULL),
(4, 'MEMBER100', 'Ưu đãi thành viên - Giảm 100K', 100000.00, 'FIXED', 300000.00, '2026-01-01', '2026-12-31', 0, NULL, '2026-03-06 19:01:02', NULL),
(12, 'REWARD_20K', 'Voucher giảm 20.000đ (đổi điểm)', 20000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL, '2026-03-06 21:47:24', NULL),
(13, 'REWARD_50K', 'Voucher giảm 50.000đ (đổi điểm)', 50000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL, '2026-03-06 21:47:24', NULL),
(14, 'REWARD_FREE', 'Voucher vé miễn phí (đổi điểm)', 90000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL, '2026-03-06 21:47:24', NULL),
(15, 'WELCOME_NEW', 'Chào mừng thành viên mới - Giảm 30K', 30000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL, '2026-03-06 21:47:24', NULL),
(16, 'TIER_SILVER', 'Chúc mừng lên hạng Bạc - Giảm 30K', 30000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL, '2026-03-06 21:47:24', NULL),
(17, 'TIER_GOLD', 'Chúc mừng lên hạng Vàng - Giảm 50K', 50000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL, '2026-03-06 21:47:24', NULL),
(18, 'TIER_PLATINUM', 'Chúc mừng lên hạng Kim Cương - Giảm 100K', 100000.00, 'FIXED', 0.00, '2020-01-01', '2030-12-31', 1, NULL, '2026-03-06 21:47:24', NULL);

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `promotions`
--
ALTER TABLE `promotions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_dates` (`start_date`,`end_date`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
