-- ============================================
-- Galaxy Cinema - Sample Data
-- Dữ liệu mẫu để test hệ thống
-- ============================================

USE galaxy_cinema;

-- ============================================
-- 1. ROLES & MEMBERSHIPS
-- ============================================
INSERT INTO roles (name) VALUES
('Guest'),
('Member'),
('Staff'),
('Manager'),
('Admin');

INSERT INTO memberships (rank_name, min_points_required, discount_rate) VALUES
('Bronze', 0, 0.00),
('Silver', 2000, 5.00),
('Gold', 5000, 10.00),
('Platinum', 10000, 15.00);

-- ============================================
-- 2. USERS & PROFILES
-- ============================================
INSERT INTO users (email, password_hash, role_id, status, current_points) VALUES
('admin@galaxy.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 5, 'Active', 0), -- password: password
('manager@galaxy.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 4, 'Active', 0),
('staff@galaxy.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 'Active', 0),
('nguyenvana@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 'Active', 1500),
('tranthib@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 'Active', 3500),
('levanc@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 'Active', 12000);

INSERT INTO user_profiles (user_id, full_name, phone, dob, membership_id) VALUES
(1, 'Admin Galaxy', '0901234567', '1990-01-01', 4),
(2, 'Quản Lý Rạp', '0902345678', '1985-05-15', 3),
(3, 'Nhân Viên Quầy', '0903456789', '1995-08-20', 1),
(4, 'Nguyễn Văn A', '0904567890', '2000-03-10', 1),
(5, 'Trần Thị B', '0905678901', '1998-07-25', 2),
(6, 'Lê Văn C', '0906789012', '1988-12-05', 4);

-- ============================================
-- 3. GENRES & MOVIES
-- ============================================
INSERT INTO genres (name) VALUES
('Hành Động'),
('Hài'),
('Tình Cảm'),
('Kinh Dị'),
('Hoạt Hình'),
('Khoa Học Viễn Tưởng'),
('Tâm Lý'),
('Tài Liệu');

INSERT INTO movies (title, duration_minutes, age_rating, origin, poster_url, trailer_url, description, director, cast, release_date, status) VALUES
('MAI', 135, 'T16', 'Vietnam', 'https://example.com/mai.jpg', 'https://youtube.com/watch?v=xyz', 'Câu chuyện về cuộc đời của Mai', 'Trấn Thành', 'Phương Anh Đào, Tuấn Trần, Hồng Đào, Uyển Ân', '2024-02-10', 'Now Showing'),
('Đào, Phở và Piano', 110, 'K', 'Vietnam', 'https://example.com/dao.jpg', 'https://youtube.com/watch?v=abc', 'Bối cảnh Hà Nội 1954', 'Phi Tiến Sơn', 'Doãn Quốc Đam, Cao Thái Hà, Trọng Khang', '2024-02-25', 'Now Showing'),
('Kung Fu Panda 4', 95, 'P', 'International', 'https://example.com/kfp4.jpg', 'https://youtube.com/watch?v=def', 'Po trở lại với nhiệm vụ mới', 'Mike Mitchell', 'Jack Black, Awkwafina, Viola Davis, Dustin Hoffman', '2024-03-08', 'Now Showing'),
('Dune: Part Two', 166, 'T13', 'International', 'https://example.com/dune2.jpg', 'https://youtube.com/watch?v=ghi', 'Hành trình báo thù của Paul Atreides', 'Denis Villeneuve', 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Austin Butler', '2024-03-01', 'Now Showing'),
('Godzilla x Kong', 115, 'T13', 'International', 'https://example.com/godzilla.jpg', 'https://youtube.com/watch?v=jkl', 'Hai titan đại chiến', 'Adam Wingard', 'Rebecca Hall, Dan Stevens, Brian Tyree Henry', '2024-03-29', 'Coming Soon'),
('Lật Mặt 7', 140, 'T16', 'Vietnam', 'https://example.com/latmat7.jpg', 'https://youtube.com/watch?v=mno', 'Phần tiếp theo của Lật Mặt', 'Lý Hải', 'Lý Hải, Minh Hà, Trương Minh Quốc Thái, Trần Kim Hào', '2024-04-26', 'Coming Soon');

INSERT INTO movie_genres (movie_id, genre_id) VALUES
(1, 3), (1, 7), -- MAI: Tình cảm, Tâm lý
(2, 3), (2, 7), -- Đào Phở: Tình cảm, Tâm lý
(3, 1), (3, 5), (3, 2), -- Kung Fu Panda: Hành động, Hoạt hình, Hài
(4, 1), (4, 6), -- Dune: Hành động, Khoa học viễn tưởng
(5, 1), (5, 6), -- Godzilla: Hành động, Khoa học viễn tưởng
(6, 1), (6, 7); -- Lật Mặt: Hành động, Tâm lý

-- ============================================
-- 4. CINEMAS, HALLS, SEAT TYPES, SEATS
-- ============================================
INSERT INTO cinemas (name, address, street, district, city, lat, lng, hotline, status, manager_id) VALUES
('Galaxy Nguyễn Du', '116 Nguyễn Du, Quận 1, TP.HCM', '116 Nguyễn Du', 'Quận 1', 'Hồ Chí Minh', 10.78283500, 106.69521300, '1900 2224', 'active', 2),
('Galaxy Tân Bình', '246 Nguyễn Hồng Đào, Quận Tân Bình, TP.HCM', '246 Nguyễn Hồng Đào', 'Quận Tân Bình', 'Hồ Chí Minh', 10.80132700, 106.65274200, '1900 2225', 'active', 2),
('Galaxy Kinh Dương Vương', '718bis Kinh Dương Vương, Quận 6, TP.HCM', '718bis Kinh Dương Vương', 'Quận 6', 'Hồ Chí Minh', 10.74751800, 106.63580900, '1900 2226', 'active', NULL);

INSERT INTO cinema_halls (cinema_id, name, total_seats) VALUES
(1, 'Phòng 1', 120),
(1, 'Phòng 2', 120),
(1, 'IMAX', 150),
(2, 'Phòng 1', 100),
(2, '4DX', 80),
(3, 'Phòng 1', 120);

INSERT INTO seat_types (name, price_multiplier) VALUES
('Standard', 1.00),
('VIP', 1.50),
('Sweetbox', 2.00);

-- Generate seats for Phòng 1 (Cinema 1)
-- Rows A-H, 10 seats per row
INSERT INTO seats (cinema_hall_id, row_code, number, seat_type_id, status)
SELECT 
    1 as cinema_hall_id,
    row_code,
    number,
    CASE 
        WHEN row_code IN ('F', 'G') AND number BETWEEN 4 AND 7 THEN 2 -- VIP
        WHEN row_code = 'H' AND number BETWEEN 5 AND 6 THEN 3 -- Sweetbox
        ELSE 1 -- Standard
    END as seat_type_id,
    CASE
        WHEN row_code = 'A' AND number IN (1, 10) THEN 'Inactive' -- Khu vực không ngồi
        WHEN row_code = 'B' AND number = 5 THEN 'Broken' -- Ghế hỏng
        ELSE 'Active'
    END as status
FROM 
    (SELECT 'A' as row_code UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' 
     UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H') AS row_codes
CROSS JOIN
    (SELECT 1 as number UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
     UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) AS seat_numbers
ORDER BY row_code, number;

-- ============================================
-- 5. SHOWTIMES
-- ============================================
INSERT INTO showtimes (movie_id, cinema_hall_id, start_time, end_time, base_price) VALUES
-- MAI tại Galaxy Nguyễn Du
(1, 1, '2026-01-25 10:00:00', '2026-01-25 12:30:00', 75000),
(1, 1, '2026-01-25 14:00:00', '2026-01-25 16:30:00', 90000),
(1, 1, '2026-01-25 19:00:00', '2026-01-25 21:30:00', 100000),
(1, 2, '2026-01-25 20:00:00', '2026-01-25 22:30:00', 100000),

-- Kung Fu Panda 4
(3, 1, '2026-01-26 09:00:00', '2026-01-26 11:00:00', 70000),
(3, 4, '2026-01-26 14:30:00', '2026-01-26 16:30:00', 90000),

-- Dune: Part Two tại IMAX
(4, 3, '2026-01-26 15:00:00', '2026-01-26 18:00:00', 150000),
(4, 3, '2026-01-26 20:00:00', '2026-01-26 23:00:00', 150000);

-- ============================================
-- 6. PRICING RULES
-- ============================================
INSERT INTO pricing_rules (condition_type, adjustment_amount, is_active) VALUES
('Weekend', 20000, TRUE),
('Before10AM', -15000, TRUE),
('Holiday', 30000, TRUE);

-- ============================================
-- 7. PROMOTIONS
-- ============================================
INSERT INTO promotions (code, description, discount_amount, discount_type, min_order_value, start_date, end_date, is_auto_apply, usage_limit) VALUES
('WELCOME2024', 'Giảm 50K cho khách hàng mới', 50000, 'FIXED', 200000, '2024-01-01', '2024-12-31', FALSE, NULL),
('BIRTHDAY', 'Voucher sinh nhật - Giảm 20%', 20, 'PERCENT', 100000, '2024-01-01', '2024-12-31', TRUE, 1),
('WEEKEND20', 'Giảm 20% cuối tuần', 20, 'PERCENT', 150000, '2024-01-01', '2024-12-31', FALSE, NULL),
('MEMBER100', 'Ưu đãi thành viên - Giảm 100K', 100000, 'FIXED', 300000, '2024-01-01', '2024-12-31', FALSE, NULL);

-- ============================================
-- 8. USER VOUCHERS (Assign vouchers cho users)
-- ============================================
INSERT INTO user_vouchers (user_id, promotion_id, status) VALUES
(4, 1, 'ACTIVE'), -- Nguyễn Văn A có voucher WELCOME2024
(5, 3, 'ACTIVE'), -- Trần Thị B có voucher WEEKEND20
(6, 4, 'ACTIVE'); -- Lê Văn C có voucher MEMBER100

-- ============================================
-- 9. CONCESSIONS
-- ============================================
INSERT INTO concessions (name, price, category, image_url) VALUES
('Bắp Rang Bơ (M)', 55000, 'Popcorn', 'https://example.com/popcorn-m.jpg'),
('Bắp Rang Bơ (L)', 70000, 'Popcorn', 'https://example.com/popcorn-l.jpg'),
('Coca Cola (M)', 30000, 'Drink', 'https://example.com/coke-m.jpg'),
('Coca Cola (L)', 40000, 'Drink', 'https://example.com/coke-l.jpg'),
('Combo 1 (Bắp M + Nước M)', 75000, 'Combo', 'https://example.com/combo1.jpg'),
('Combo 2 (Bắp L + 2 Nước M)', 120000, 'Combo', 'https://example.com/combo2.jpg'),
('Nachos', 45000, 'Snack', 'https://example.com/nachos.jpg'),
('Hot Dog', 40000, 'Snack', 'https://example.com/hotdog.jpg');

-- ============================================
-- 10. SAMPLE BOOKINGS
-- ============================================
-- Booking 1: User 4 đặt vé xem MAI
INSERT INTO bookings (user_id, showtime_id, total_price, discount_amount, final_price, status) VALUES
(4, 1, 180000, 0, 180000, 'Paid');

SET @booking_id = LAST_INSERT_ID();

-- Tickets cho booking 1 (2 ghế F5, F6)
INSERT INTO tickets (booking_id, seat_id, price, ticket_code, status) VALUES
(@booking_id, 55, 90000, CONCAT('GXY-', LPAD(@booking_id, 6, '0'), '-001'), 'SOLD'),
(@booking_id, 56, 90000, CONCAT('GXY-', LPAD(@booking_id, 6, '0'), '-002'), 'SOLD');

-- Concessions cho booking 1
INSERT INTO booking_concessions (booking_id, concession_id, quantity, price) VALUES
(@booking_id, 5, 1, 75000); -- Combo 1

-- Transaction cho booking 1
INSERT INTO transactions (booking_id, payment_method, amount, transaction_code, status) VALUES
(@booking_id, 'Momo', 255000, CONCAT('MOMO-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', @booking_id), 'Success');

-- Loyalty history cho booking 1 (Earn points: 180000 / 10000 = 18 points)
INSERT INTO loyalty_history (user_id, points_change, type, description, related_booking_id) VALUES
(4, 18, 'PURCHASE', 'Tích điểm từ booking #1 - MAI', @booking_id);

-- ============================================
-- 11. REVIEWS
-- ============================================
INSERT INTO reviews (user_id, movie_id, rating, comment) VALUES
(4, 1, 5, 'Phim hay, diễn xuất xuất sắc!'),
(5, 1, 4, 'Cảm động, đáng xem'),
(6, 3, 5, 'Con cái rất thích, hoạt hình đẹp'),
(4, 4, 5, 'Dune 2 siêu phẩm, hình ảnh choáng ngợp!');

-- ============================================
-- 12. NOTIFICATIONS
-- ============================================
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(4, 'Đặt vé thành công', 'Bạn đã đặt vé xem phim MAI thành công. Mã vé: GXY-000001-001', 'BOOKING', TRUE),
(4, 'Ưu đãi mới', 'Giảm 20% cho tất cả suất chiếu cuối tuần. Mã: WEEKEND20', 'PROMOTION', FALSE),
(5, 'Sinh nhật vui vẻ!', 'Chúc mừng sinh nhật! Bạn nhận được voucher giảm 20% cho lần đặt vé tiếp theo.', 'PROMOTION', FALSE),
(6, 'Nâng cấp hạng thành viên', 'Chúc mừng! Bạn đã được nâng lên hạng Platinum với ưu đãi giảm 15%', 'SYSTEM', TRUE);

-- ============================================
-- 13. SYSTEM CONFIGS
-- ============================================
INSERT INTO system_configs (config_key, config_value, description) VALUES
('min_vietnamese_quota', '15', 'Tỷ lệ phim Việt tối thiểu (%)'),
('seat_hold_duration', '600', 'Thời gian giữ ghế (giây) - 10 phút'),
('cleanup_duration', '15', 'Thời gian dọn phòng giữa 2 suất chiếu (phút)'),
('curfew_u13', '22:00:00', 'Giờ giới nghiêm cho dưới 13 tuổi'),
('curfew_u16', '23:00:00', 'Giờ giới nghiêm cho dưới 16 tuổi'),
('loyalty_points_rate', '10000', 'Số tiền (VNĐ) = 1 điểm tích lũy'),
('base_ticket_price', '90000', 'Giá vé cơ bản (VNĐ)');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Kiểm tra số lượng bản ghi
SELECT 'Users' as TableName, COUNT(*) as RecordCount FROM users
UNION ALL SELECT 'Movies', COUNT(*) FROM movies
UNION ALL SELECT 'Cinemas', COUNT(*) FROM cinemas
UNION ALL SELECT 'Seats', COUNT(*) FROM seats
UNION ALL SELECT 'Showtimes', COUNT(*) FROM showtimes
UNION ALL SELECT 'Bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'Tickets', COUNT(*) FROM tickets
UNION ALL SELECT 'Promotions', COUNT(*) FROM promotions
UNION ALL SELECT 'User Vouchers', COUNT(*) FROM user_vouchers
UNION ALL SELECT 'Loyalty History', COUNT(*) FROM loyalty_history;
