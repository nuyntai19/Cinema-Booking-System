-- SQL Script để import nhân viên mẫu
-- Lưu ý: Bạn cần thay đổi giá trị `cinema_id` (hiện tại là 1) bằng giá trị thực tế của bạn.
-- Mật khẩu mặc định trong script này: 123456 (đã được hash).

-- 1. Thêm users mới (role_id = 3 dành cho Staff)
INSERT INTO `users` (`email`, `password_hash`, `role_id`, `status`, `created_at`) VALUES
('staff_demo1@galaxy.com', '$2y$10$rZ.5iF9R6r/5o0GZp5/x0On1QxJkZ1O.s9xU5R2q8r7L8r1Xq3GgW', 3, 'Active', NOW()),
('staff_demo2@galaxy.com', '$2y$10$rZ.5iF9R6r/5o0GZp5/x0On1QxJkZ1O.s9xU5R2q8r7L8r1Xq3GgW', 3, 'Active', NOW()),
('staff_demo3@galaxy.com', '$2y$10$rZ.5iF9R6r/5o0GZp5/x0On1QxJkZ1O.s9xU5R2q8r7L8r1Xq3GgW', 3, 'Active', NOW());

-- 2. Thêm thông tin profile cho các users vừa tạo (membership_id = 1 cho Bronze)
INSERT INTO `user_profiles` (`user_id`, `full_name`, `phone`, `membership_id`) VALUES
((SELECT id FROM users WHERE email = 'staff_demo1@galaxy.com' LIMIT 1), 'Nguyễn Thị Nhân Viên A', '0901234001', 1),
((SELECT id FROM users WHERE email = 'staff_demo2@galaxy.com' LIMIT 1), 'Trần Văn Nhân Viên B', '0901234002', 1),
((SELECT id FROM users WHERE email = 'staff_demo3@galaxy.com' LIMIT 1), 'Lê Thị Nhân Viên C', '0901234003', 1);

-- 3. Liên kết các users vừa tạo với rạp phim cụ thể (cinema_staff)
-- Thay thế số `1` bằng ID rạp của bạn
INSERT INTO `cinema_staff` (`cinema_id`, `user_id`, `created_at`) VALUES
(1, (SELECT id FROM users WHERE email = 'staff_demo1@galaxy.com' LIMIT 1), NOW()),
(1, (SELECT id FROM users WHERE email = 'staff_demo2@galaxy.com' LIMIT 1), NOW()),
(1, (SELECT id FROM users WHERE email = 'staff_demo3@galaxy.com' LIMIT 1), NOW());
