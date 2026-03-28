-- Fix Vietnamese UTF-8 text in database
-- Safe to re-run (uses INSERT ON DUPLICATE KEY UPDATE or ignores errors)
SET NAMES utf8mb4;
USE galaxy_cinema;

-- Genres: use correct ID mapping (matching seed_data.sql order)
-- id=1: Hành Động, id=2: Hài, id=3: Tình Cảm, id=4: Kinh Dị
-- id=5: Hoạt Hình, id=6: Khoa Học Viễn Tưởng, id=7: Tâm Lý, id=8: Tài Liệu
UPDATE IGNORE genres SET name='Hành Động' WHERE id=1;
UPDATE IGNORE genres SET name='Hài' WHERE id=2;
UPDATE IGNORE genres SET name='Tình Cảm' WHERE id=3;
UPDATE IGNORE genres SET name='Kinh Dị' WHERE id=4;
UPDATE IGNORE genres SET name='Hoạt Hình' WHERE id=5;
UPDATE IGNORE genres SET name='Khoa Học Viễn Tưởng' WHERE id=6;
UPDATE IGNORE genres SET name='Tâm Lý' WHERE id=7;
UPDATE IGNORE genres SET name='Tài Liệu' WHERE id=8;

UPDATE movies SET title='MAI', description='Câu chuyện về cuộc đời của Mai' WHERE id=1;
UPDATE movies SET title='Đào, Phở và Piano', description='Bối cảnh Hà Nội 1954' WHERE id=2;
UPDATE movies SET title='Kung Fu Panda 4', description='Po trở lại với nhiệm vụ mới' WHERE id=3;
UPDATE movies SET title='Dune: Part Two', description='Hành trình báo thù của Paul Atreides' WHERE id=4;
UPDATE movies SET title='Godzilla x Kong', description='Hai titan đại chiến' WHERE id=5;
UPDATE movies SET title='Lật Mặt 7', description='Phần tiếp theo của Lật Mặt' WHERE id=6;

UPDATE cinemas SET name='Galaxy Nguyễn Du', address='116 Nguyễn Du, Quận 1, TP.HCM' WHERE id=1;
UPDATE cinemas SET name='Galaxy Tân Bình', address='246 Nguyễn Hồng Đào, Quận Tân Bình, TP.HCM' WHERE id=2;
UPDATE cinemas SET name='Galaxy Đà Nẵng', address='Lô A4, Đường 2/9, Hải Châu, Đà Nẵng' WHERE id=3;

UPDATE cinema_halls SET name='Phòng 1' WHERE id=1;
UPDATE cinema_halls SET name='Phòng 2' WHERE id=2;
UPDATE cinema_halls SET name='Phòng VIP' WHERE id=3;
UPDATE cinema_halls SET name='Phòng 3' WHERE id=4;

UPDATE promotions SET description='Giảm 50K cho khách hàng mới' WHERE code='WELCOME2026';
UPDATE promotions SET description='Voucher sinh nhật - Giảm 20%' WHERE code='BIRTHDAY';
UPDATE promotions SET description='Giảm 20% cuối tuần' WHERE code='WEEKEND20';
UPDATE promotions SET description='Ưu đãi thành viên - Giảm 100K' WHERE code='MEMBER100';
UPDATE promotions SET description='Voucher giảm 20.000đ (đổi điểm)' WHERE code='REWARD_20K';
UPDATE promotions SET description='Voucher giảm 50.000đ (đổi điểm)' WHERE code='REWARD_50K';
UPDATE promotions SET description='Voucher vé miễn phí (đổi điểm)' WHERE code='REWARD_FREE';
UPDATE promotions SET description='Chào mừng thành viên mới - Giảm 30K' WHERE code='WELCOME_NEW';
UPDATE promotions SET description='Chúc mừng lên hạng Bạc - Giảm 30K' WHERE code='TIER_SILVER';
UPDATE promotions SET description='Chúc mừng lên hạng Vàng - Giảm 50K' WHERE code='TIER_GOLD';
UPDATE promotions SET description='Chúc mừng lên hạng Kim Cương - Giảm 100K' WHERE code='TIER_PLATINUM';

UPDATE concessions SET name='Bắp Rang Bơ (M)' WHERE id=1;
UPDATE concessions SET name='Bắp Rang Bơ (L)' WHERE id=2;
UPDATE concessions SET name='Coca Cola (M)' WHERE id=3;
UPDATE concessions SET name='Coca Cola (L)' WHERE id=4;
UPDATE concessions SET name='Combo 1 (Bắp M + Nước M)' WHERE id=5;
UPDATE concessions SET name='Combo 2 (Bắp L + 2 Nước M)' WHERE id=6;
UPDATE concessions SET name='Nachos' WHERE id=7;
UPDATE concessions SET name='Hot Dog' WHERE id=8;

UPDATE reviews SET comment='Phim hay, diễn xuất xuất sắc!' WHERE id=1;
UPDATE reviews SET comment='Cảm động, đáng xem' WHERE id=2;
UPDATE reviews SET comment='Con cái rất thích, hoạt hình đẹp' WHERE id=3;
UPDATE reviews SET comment='Dune 2 siêu phẩm, hình ảnh choáng ngợp!' WHERE id=4;

UPDATE notifications SET title='Đặt vé thành công', message='Bạn đã đặt vé xem phim MAI thành công. Mã vé: GXY-000001-001' WHERE id=1;
UPDATE notifications SET title='Ưu đãi mới', message='Giảm 20% cho tất cả suất chiếu cuối tuần. Mã: WEEKEND20' WHERE id=2;
UPDATE notifications SET title='Thông báo nhân sự', message='Nhân viên vui lòng kiểm tra lịch ca làm mới trong tuần này.' WHERE id=3;
UPDATE notifications SET title='Bảng điều hành', message='Báo cáo doanh thu tháng đã sẵn sàng trong mục quản trị.' WHERE id=4;
UPDATE notifications SET title='Khách vãng lai', message='Đăng nhập ngay để nhận ưu đãi thành viên và tích điểm.' WHERE id=5;

UPDATE user_profiles SET full_name='Nguyễn Văn A' WHERE user_id=4;
UPDATE user_profiles SET full_name='Trần Thị B' WHERE user_id=5;
UPDATE user_profiles SET full_name='Lê Văn C' WHERE user_id=6;
