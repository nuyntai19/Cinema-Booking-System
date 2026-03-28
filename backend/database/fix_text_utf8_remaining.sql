SET NAMES utf8mb4;
USE galaxy_cinema;

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
