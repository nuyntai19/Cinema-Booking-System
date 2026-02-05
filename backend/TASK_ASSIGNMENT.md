# 🎬 PHÂN CÔNG BACKEND - GALAXY CINEMA PROJECT

## Thời gian: 4/2/2026 - 28/2/2026 (24 ngày)

## Team: 6 người

---

## 📋 TỔNG QUAN CÔNG VIỆC

### Cần hoàn thành:

- ✅ Database Schema & Seed Data (XONG)
- ✅ Core Framework (Router, Response, JWT, Validator) (XONG)
- 🔄 14 Controllers
- 🔄 15 Models chính
- 🔄 API Testing
- 🔄 Documentation

---

## 👥 PHÂN CÔNG CHI TIẾT (CHIA ĐỀU - LOGIC NHÓM)

### 🔴 **THỊNH** - Authentication & User Management (PHÂN QUYỀN)

**Module:** Auth, User, Role - Hệ thống xác thực và phân quyền

**Controllers:**

- **AuthController.php**
  - `register()` - Đăng ký tài khoản mới (validation email/phone)
  - `login()` - Đăng nhập (JWT token)
  - `logout()` - Đăng xuất (invalidate token)
  - `getCurrentUser()` - Lấy thông tin user hiện tại
  - `refreshToken()` - Refresh JWT token
- **UserController.php**
  - `index()` - List users (Admin only) - pagination
  - `show($id)` - Get user detail
  - `create()` - Tạo user mới (Admin)
  - `update($id)` - Update user info
  - `delete($id)` - Xóa user (soft delete)
  - `getProfile()` - Lấy profile của user đang login
  - `updateProfile()` - Update profile (dob, phone, address...)
  - `changePassword()` - Đổi mật khẩu
  - `updateRole($id)` - Đổi role (Admin only)

**Models:**

- **User.php**
  - `create($data)` - Tạo user (hash password)
  - `findByEmail($email)` - Tìm user qua email
  - `findById($id)` - Lấy user theo ID
  - `update($id, $data)` - Update user
  - `delete($id)` - Soft delete
  - `verifyPassword($password, $hash)` - Kiểm tra password
  - `getAll($filters, $page, $limit)` - List users với filter
- **UserProfile.php**
  - `getByUserId($userId)` - Lấy profile
  - `update($userId, $data)` - Update profile
  - `calculateAge($dob)` - Tính tuổi từ ngày sinh
- **Role.php**
  - `getAll()` - Lấy tất cả roles
  - `getById($id)` - Lấy role theo ID
  - `getPermissions($roleId)` - Lấy quyền của role

**Deadline:** 17/2  
**Deliverables:** 2 Controllers, 3 Models

---

### 🟢 **TUẤN TÀI** (Leader) - Movie & Review Management

**Module:** Movie, Genre, Review - Quản lý phim và đánh giá

**Controllers:**

- **MovieController.php**
  - `index()` - List movies (filter: status, origin, genre) - pagination
  - `show($id)` - Chi tiết phim (join genres, avg rating)
  - `create()` - Thêm phim (Admin/Manager)
  - `update($id)` - Cập nhật phim (Admin/Manager)
  - `delete($id)` - Xóa phim (Admin)
  - `getShowtimes($id)` - Lấy suất chiếu của phim
  - `getReviews($id)` - Lấy reviews của phim
  - `uploadPoster($id)` - Upload poster phim
- **ReviewController.php**
  - `index()` - List reviews (filter by movie/user)
  - `getByMovie($movieId)` - Reviews của 1 phim
  - `create()` - Tạo review (Member only, đã xem phim)
  - `update($id)` - Update review của mình
  - `delete($id)` - Xóa review của mình
  - `approve($id)` - Duyệt review (Manager)
  - `report($id)` - Report review spam

**Models:**

- **Movie.php**
  - `getAll($filters, $page, $limit)` - List với filter
  - `getById($id)` - Chi tiết phim join genres
  - `create($data)` - Tạo phim
  - `update($id, $data)` - Update phim
  - `delete($id)` - Xóa phim
  - `addGenre($movieId, $genreId)` - Thêm thể loại
  - `getWithGenres()` - Phim với danh sách thể loại
  - `calculateAverageRating($movieId)` - Tính rating trung bình
- **Genre.php**
  - `getAll()` - List thể loại
  - `getById($id)` - Chi tiết thể loại
  - `create($data)` - Tạo thể loại
- **MovieGenre.php** (Junction table)
  - `addGenreToMovie($movieId, $genreId)`
  - `removeGenreFromMovie($movieId, $genreId)`
  - `getMovieGenres($movieId)`
- **Review.php**
  - `create($data)` - Tạo review
  - `getByMovie($movieId)` - Reviews của phim
  - `getByUser($userId)` - Reviews của user
  - `update($id, $data)` - Update review
  - `delete($id)` - Xóa review
  - `checkUserWatchedMovie($userId, $movieId)` - Kiểm tra đã xem phim chưa

**Deadline:** 17/2  
**Deliverables:** 2 Controllers, 4 Models

---

### 🔵 **SƠN** - Cinema, Showtime & Pricing System

**Module:** Cinema, Hall, Seat, Showtime, Pricing - Hệ thống rạp và suất chiếu

**Controllers:**

- **CinemaController.php**
  - `index()` - List cinemas (filter by location)
  - `show($id)` - Chi tiết cinema
  - `create()` - Tạo cinema (Admin)
  - `update($id)` - Update cinema (Manager)
  - `delete($id)` - Xóa cinema (Admin)
  - `getHalls($id)` - Lấy danh sách rạp của cinema
  - `getShowtimes($id)` - Lấy suất chiếu của cinema
- **ShowtimeController.php**
  - `index()` - List showtimes (filter: date, cinema, movie)
  - `show($id)` - Chi tiết showtime
  - `create()` - Tạo showtime (Manager) - **Check conflict!**
  - `update($id)` - Update showtime (Manager)
  - `delete($id)` - Xóa showtime (Manager)
  - `getAvailableSeats($id)` - Ghế trống (exclude HOLDING/SOLD)
  - `getSeatMap($id)` - Sơ đồ ghế với status

**Models:**

- **Cinema.php**
  - `getAll($filters)` - List cinemas
  - `getById($id)` - Chi tiết cinema
  - `create($data)` - Tạo cinema
  - `update($id, $data)` - Update cinema
  - `getHalls($cinemaId)` - Lấy halls của cinema
- **CinemaHall.php**
  - `getByCinemaId($cinemaId)` - Halls của cinema
  - `getById($id)` - Chi tiết hall
  - `create($data)` - Tạo hall
  - `getSeats($hallId)` - Lấy seats của hall
- **Seat.php**
  - `getByHallId($hallId)` - Seats của hall
  - `getById($id)` - Chi tiết seat
  - `createBatch($hallId, $rows, $numbers)` - Tạo nhiều ghế
  - `getSeatStatus($seatId, $showtimeId)` - Status ghế cho suất chiếu
- **SeatType.php**
  - `getAll()` - List loại ghế (Standard, VIP, Sweetbox)
  - `getById($id)` - Chi tiết loại ghế
  - `getPriceMultiplier($id)` - Hệ số giá
- **Showtime.php**
  - `getAll($filters)` - List showtimes
  - `getById($id)` - Chi tiết showtime (join movie, hall, cinema)
  - `create($data)` - Tạo showtime + **validate conflict** + **VN quota check**
  - `update($id, $data)` - Update showtime
  - `delete($id)` - Xóa showtime
  - `checkConflict($hallId, $startTime, $endTime)` - Kiểm tra trùng lịch
  - `checkVietnameseQuota($cinemaId, $date)` - Kiểm tra >= 15% phim Việt
  - `getAvailableSeats($showtimeId)` - Ghế trống
  - `calculateEndTime($startTime, $duration)` - Tính giờ kết thúc
- **PricingRule.php**
  - `getActiveRules()` - Rules đang active
  - `getByDate($date)` - Rules theo ngày
  - `calculateAdjustment($date, $time)` - Tính hệ số (Weekend +10%, Before 10AM -20%)
  - `applyToPrice($basePrice, $date, $time, $seatType)` - Tính giá cuối

**Deadline:** 17/2  
**Deliverables:** 2 Controllers, 6 Models

---

### 🟡 **CƯỜNG** - Booking & Transaction System

**Module:** Booking, Transaction - Đặt vé và thanh toán

**Controllers:**

- **BookingController.php**
  - `index()` - List bookings (Admin/Manager)
  - `show($id)` - Chi tiết booking
  - `create()` - **Tạo booking + HOLDING tickets** (CRITICAL!)
    - Check seats available
    - Calculate price (base + seat type + pricing rules)
    - Apply discount (voucher + membership)
    - Create booking + tickets (status = HOLDING)
    - Set hold_expires_at = now + 10 minutes
  - `confirm($id)` - Confirm payment → Update tickets to SOLD
  - `cancel($id)` - Cancel booking → Update tickets to REFUNDED
  - `getUserBookings()` - Lịch sử booking của user
  - `getBookingDetails($id)` - Chi tiết booking (tickets, concessions, transaction)
- **TransactionController.php**
  - `create()` - Ghi nhận giao dịch
  - `getByBooking($bookingId)` - Transaction của booking
  - `verifyMomo()` - Verify callback từ Momo
  - `verifyVNPay()` - Verify callback từ VNPay
  - `getHistory($userId)` - Lịch sử giao dịch

**Models:**

- **Booking.php**
  - `create($userId, $showtimeId, $seats, $concessions, $voucherId)` - **Core logic**
  - `getById($id)` - Chi tiết booking
  - `getUserBookings($userId)` - Bookings của user
  - `updateStatus($id, $status)` - Update status
  - `calculateTotalPrice($showtimeId, $seats, $concessions)` - Tính tổng
  - `applyMembershipDiscount($userId, $total)` - Giảm giá membership
  - `applyVoucherDiscount($voucherId, $total)` - Giảm giá voucher
  - `cancel($id)` - Hủy booking
- **Transaction.php**
  - `create($bookingId, $method, $amount)` - Tạo giao dịch
  - `getByBooking($bookingId)` - Lấy transaction
  - `updateStatus($transactionCode, $status)` - Update status
  - `getByUser($userId)` - Lịch sử giao dịch

**Deadline:** 17/2  
**Deliverables:** 2 Controllers, 2 Models

---

### 🟣 **KHOA** - Ticket & Concession System

**Module:** Ticket, Concession - Vé và bắp nước

**Controllers:**

- **TicketController.php**
  - `getByCode($code)` - Tìm vé bằng QR code
  - `getByBooking($bookingId)` - Tickets của booking
  - `check($code)` - **Staff quét vé tại cổng**
    - Validate ticket status = SOLD
    - Check showtime chưa bắt đầu
    - Update status = USED
  - `markAsUsed($id)` - Đánh dấu đã sử dụng (Staff)
  - `refund($id)` - Hoàn vé
  - `sendEmail($id)` - Gửi email vé
- **ConcessionController.php**
  - `index()` - List bắp nước
  - `show($id)` - Chi tiết concession
  - `create()` - Thêm concession (Manager)
  - `update($id)` - Update concession (Manager)
  - `delete($id)` - Xóa concession (Manager)
  - `getAvailable()` - Concessions đang bán

**Models:**

- **Ticket.php**
  - `createBatch($bookingId, $showtimeId, $seats)` - Tạo nhiều vé
  - `getById($id)` - Chi tiết vé
  - `getByCode($code)` - Tìm vé theo code
  - `getByBooking($bookingId)` - Vé của booking
  - `generateTicketCode()` - Generate unique code
  - `updateStatus($id, $status)` - Update status
  - `markAsUsed($id)` - Đánh dấu đã dùng
  - `checkExpiredHolding()` - **Cronjob: Tìm vé HOLDING quá hạn**
  - `refundExpiredTickets()` - Auto refund vé hết hạn
- **Concession.php**
  - `getAll()` - List concessions
  - `getById($id)` - Chi tiết
  - `create($data)` - Tạo concession
  - `update($id, $data)` - Update
  - `delete($id)` - Xóa
  - `getAvailable()` - Còn bán
- **BookingConcession.php** (Junction table)
  - `addToBooking($bookingId, $items)` - Thêm bắp nước vào booking
  - `getByBooking($bookingId)` - Lấy concessions của booking
  - `calculateTotal($items)` - Tính tổng tiền bắp nước

**Background Job:**

- File `cron_expire_tickets.php` - Chạy mỗi 1 phút, tự động refund tickets HOLDING quá hạn

**Deadline:** 17/2  
**Deliverables:** 2 Controllers, 3 Models + Cronjob script

---

### 🟠 **THÀNH TÀI** - Loyalty, Membership, Promotion & Voucher

**Module:** Loyalty, Membership, Promotion, Voucher - Tích điểm và khuyến mãi

**Controllers:**

- **LoyaltyController.php**
  - `getHistory($userId)` - Lịch sử tích/đổi điểm
  - `getCurrentPoints()` - Điểm hiện tại của user
  - `earnPoints($userId, $amount)` - **Trigger khi booking paid**
  - `redeemPoints($userId, $points, $voucherId)` - Đổi điểm lấy voucher
- **MembershipController.php**
  - `index()` - List membership tiers (Bronze/Silver/Gold/Platinum)
  - `show($id)` - Chi tiết tier
  - `getUserTier($userId)` - Tier hiện tại của user
  - `checkUpgrade($userId)` - Kiểm tra đủ điểm lên hạng
- **PromotionController.php**
  - `index()` - List promotions (filter: active, type)
  - `show($id)` - Chi tiết promotion
  - `create()` - Tạo promotion (Admin/Manager)
  - `update($id)` - Update promotion
  - `delete($id)` - Xóa promotion
  - `getActive()` - Promotions đang active
- **VoucherController.php**
  - `getUserVouchers()` - Vouchers của user (status = ACTIVE)
  - `show($id)` - Chi tiết voucher
  - `assignToUser($userId, $promotionId)` - Gán voucher cho user
  - `applyVoucher($voucherId, $amount)` - Áp dụng voucher
  - `markAsUsed($voucherId)` - Đánh dấu đã dùng
  - `autoAssignBirthday()` - **Cronjob: Tự động gán voucher sinh nhật**

**Models:**

- **LoyaltyHistory.php**
  - `create($userId, $points, $type, $description)` - Ghi log tích/đổi điểm
  - `getByUser($userId)` - Lịch sử của user
  - `calculatePoints($amount)` - Tính điểm: amount / 10000 = 1 point
  - `getTotalPoints($userId)` - Tổng điểm tích lũy
- **Membership.php**
  - `getAll()` - List tiers
  - `getById($id)` - Chi tiết tier
  - `getTierByPoints($points)` - Xác định tier theo điểm
  - `getDiscountRate($tierId)` - % giảm giá của tier
- **Promotion.php**
  - `getAll($filters)` - List promotions
  - `getById($id)` - Chi tiết
  - `create($data)` - Tạo promotion
  - `update($id, $data)` - Update
  - `getActive()` - Promotions active
- **UserVoucher.php**
  - `assignToUser($userId, $promotionId)` - Gán voucher
  - `getByUser($userId, $status)` - Vouchers của user
  - `markAsUsed($id)` - Đánh dấu đã dùng
  - `checkExpired()` - Kiểm tra hết hạn
  - `checkBirthdayUsers()` - **Cronjob: Tìm users sinh nhật hôm nay**

**Background Job:**

- File `cron_birthday_voucher.php` - Chạy mỗi ngày 0h, tự động gán voucher sinh nhật

**Deadline:** 17/2  
**Deliverables:** 4 Controllers, 4 Models + Cronjob script

---

## 📅 TIMELINE CHI TIẾT

### **WEEK 1: Sprint 1 - Core Features** (4/2 - 10/2)

**Mục tiêu:** Hoàn thành Controllers & Models cơ bản

| Người     | Công việc                | Output                  |
| --------- | ------------------------ | ----------------------- |
| Tuấn Tài  | Auth + User              | 2 Controllers, 2 Models |
| Sơn       | Movies                   | 1 Controller, 4 Models  |
| Thịnh     | Booking                  | 1 Controller, 1 Model   |
| Cường     | Showtime                 | 1 Controller, 1 Model   |
| Khoa      | Loyalty                  | 1 Controller, 2 Models  |
| Thành Tài | Concession + Transaction | 2 Controllers, 3 Models |

**Daily standup:** 9:00 PM (15 phút) - Báo cáo tiến độ

---

### **WEEK 2: Sprint 2 - Advanced Features** (11/2 - 17/2)

**Mục tiêu:** Hoàn thành phần còn lại + Integration

| Người     | Công việc                 | Output                  |
| --------- | ------------------------- | ----------------------- |
| Tuấn Tài  | Code review + Integration | Merge all branches      |
| Sơn       | Cinema System             | 1 Controller, 4 Models  |
| Thịnh     | Ticket System             | 1 Controller, 1 Model   |
| Cường     | Pricing Rules             | 1 Model, helpers        |
| Khoa      | Promotion + Voucher       | 3 Controllers, 2 Models |
| Thành Tài | Review + Notification     | 2 Controllers, 2 Models |
| Tài Thành | Admin Dashboard           | 1 Controller, queries   |

**Checkpoint:** 17/2 - Review tổng thể, fix bugs

---

### **WEEK 3: Testing & Refinement** (18/2 - 24/2)

**Mục tiêu:** Test, fix bugs, optimize

| Ngày | Công việc                                            |
| ---- | ---------------------------------------------------- |
| 18/2 | API Testing (Postman) - Mỗi người test phần của mình |
| 19/2 | Integration Testing - Test luồng hoàn chỉnh          |
| 20/2 | Bug Fixing - Fix tất cả issues tìm được              |
| 21/2 | Code Review - Review code lần cuối                   |
| 22/2 | Performance Optimization - Optimize queries          |
| 23/2 | Documentation - Viết API docs                        |
| 24/2 | Security Review - Check XSS, SQL injection, JWT      |

---

### **WEEK 4: Finalization** (25/2 - 28/2)

**Mục tiêu:** Hoàn thiện & Deploy

| Ngày | Công việc                   |
| ---- | --------------------------- |
| 25/2 | Polish UI/UX issues         |
| 26/2 | Final testing on staging    |
| 27/2 | Prepare presentation/demo   |
| 28/2 | Final deployment & handover |

---

## 🔧 TECHNICAL STANDARDS

### Code Convention

- **PSR-4** autoloading
- **PSR-12** coding style
- **Tên file:** PascalCase (UserController.php)
- **Tên class:** PascalCase
- **Tên method:** camelCase
- **Tên biến:** camelCase hoặc snake_case

### Git Workflow

```bash
# Mỗi người tạo branch riêng
git checkout -b feature/auth-system-TuTai          # Tuấn Tài
git checkout -b feature/movie-system-Son         # Sơn
git checkout -b feature/booking-system-Thinh       # Thịnh
git checkout -b feature/showtime-system-Cuong      # Cường
git checkout -b feature/loyalty-system-Khoa       # Khoa
git checkout -b feature/concession-system-ThTai    # Thành Tài

# Commit thường xuyên
git add .
git commit -m "feat: implement login API"

# Push lên remote
git push origin feature/auth-system

# Tạo Pull Request → Tuấn Tài review → Merge
```

### API Response Format

```json
// Success
{
  "success": true,
  "message": "Success",
  "data": {...}
}

// Error
{
  "success": false,
  "message": "Error message",
  "errors": {...}
}
```

### Database Query Best Practices

- Dùng **prepared statements** (PDO)
- Dùng **transactions** cho multi-step operations
- **Index** các columns dùng trong WHERE/JOIN
- **Pagination** cho list APIs (LIMIT/OFFSET)

---

## 📝 TEMPLATE CODE

### Controller Template

```php
<?php
class MovieController {
    private $db;
    private $movieModel;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->movieModel = new Movie($this->db);
    }

    public function index() {
        // Validate request
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 20;

        // Get data from model
        $movies = $this->movieModel->getAll($page, $limit);
        $total = $this->movieModel->count();

        // Return response
        Response::paginated($movies, $total, $page, $limit);
    }
}
```

### Model Template

```php
<?php
class Movie {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll($page = 1, $limit = 20) {
        $offset = ($page - 1) * $limit;

        $sql = "SELECT * FROM movies
                WHERE status = 'Now Showing'
                ORDER BY release_date DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
```

---

## 🎯 PRIORITY & DEPENDENCIES

### P0 - CRITICAL (Phải code xong trước 17/2)

**Làm TRƯỚC vì modules khác phụ thuộc:**

1. **Auth & User** (Thịnh) - Làm đầu tiên
   - Lý do: Tất cả APIs cần JWT authentication
   - Dependency: Không có
2. **Movie** (Tuấn Tài) - Làm song song với Auth
   - Lý do: Showtime cần movie_id
   - Dependency: Không có
3. **Cinema & Showtime** (Sơn) - Làm sau khi có Movie
   - Lý do: Booking cần showtime_id
   - Dependency: Movie (movie_id)
4. **Booking** (Cường) - Làm sau khi có Showtime
   - Lý do: Core business logic
   - Dependency: Showtime (showtime_id), User (user_id)
5. **Ticket** (Khoa) - Làm song song với Booking
   - Lý do: Booking tạo tickets
   - Dependency: Booking (booking_id)

### P1 - IMPORTANT (Có thể làm song song)

6. **Review** (Tuấn Tài) - Phụ thuộc Movie
7. **Concession** (Khoa) - Độc lập, link với Booking
8. **Transaction** (Cường) - Phụ thuộc Booking
9. **Loyalty & Membership** (Thành Tài) - Phụ thuộc User & Booking
10. **Promotion & Voucher** (Thành Tài) - Phụ thuộc User, link với Booking

### P2 - NICE TO HAVE (Làm cuối nếu còn thời gian)

11. **Notification** - Backend đơn giản, chủ yếu frontend
12. **Admin Dashboard** - Queries thống kê
13. **Config Management** - CRUD đơn giản

---

## 📊 DEPENDENCY MAP

```
Auth/User (Thịnh)
    ↓
    ├─→ Movie (Tuấn Tài)
    │       ↓
    │       ├─→ Review (Tuấn Tài)
    │       └─→ Showtime (Sơn) ← Cinema (Sơn)
    │               ↓
    │               └─→ Booking (Cường)
    │                       ↓
    │                       ├─→ Ticket (Khoa)
    │                       ├─→ Transaction (Cường)
    │                       ├─→ Concession (Khoa)
    │                       └─→ Loyalty (Thành Tài)
    │
    └─→ Membership (Thành Tài)
    └─→ Promotion/Voucher (Thành Tài)
```

**Cách đọc:**

- Auth/User phải làm trước tiên (tất cả API cần)
- Movie và Cinema độc lập, làm song song được
- Showtime cần Movie (movie_id) và Cinema (cinema_hall_id)
- Booking cần Showtime (showtime_id) và User (user_id)
- Ticket, Transaction, Loyalty phụ thuộc Booking

---

## 📞 COMMUNICATION

### Daily Standup: 9:00 PM (15 phút)

- Hôm nay làm gì?
- Ngày mai làm gì?
- Có vấn đề gì cần support?

### Weekly Review: Chủ nhật 8:00 PM (1 tiếng)

- Demo tính năng đã làm
- Code review
- Plan tuần tiếp theo

### Tools:

- **Git:** GitHub/GitLab
- **Communication:** Zalo/Discord/Messenger
- **Task Management:** Trello/Notion
- **API Testing:** Postman (share collection)

---

## 🚨 RISK MANAGEMENT

### Rủi ro có thể xảy ra:

1. **Conflict code khi merge**
   - Giải pháp: Commit thường xuyên, pull trước khi code
2. 📦 DELIVERABLES SUMMARY

| Người         | Controllers | Models | Cronjobs | APIs    | Deadline |
| ------------- | ----------- | ------ | -------- | ------- | -------- |
| **Thịnh**     | 2           | 3      | 0        | ~15     | 17/2     |
| **Tuấn Tài**  | 2           | 4      | 0        | ~15     | 17/2     |
| **Sơn**       | 2           | 6      | 0        | ~18     | 17/2     |
| **Cường**     | 2           | 2      | 0        | ~12     | 17/2     |
| **Khoa**      | 2           | 3      | 1        | ~12     | 17/2     |
| **Thành Tài** | 4           | 4      | 1        | ~18     | 17/2     |
| **TOTAL**     | **14**      | **22** | **2**    | **~90** |          |

---

## 🎖️ SUCCESS METRICS

**Mục tiêu đạt được vào 28/2:**

- ✅ 14 Controllers hoàn chỉnh
- ✅ 22 Models hoàn chỉnh
- ✅ 90+ API endpoints working
- ✅ 2 Cronjob scripts (expire tickets, birthday voucher)
- ✅ 0 critical bugs, < 5 minor bugs
- ✅ Response time < 200ms (95% requests)
- ✅ API documentation đầy đủ (Postman collection)
- ✅ Security checklist pass 100%
- ✅ Production deployment success

---

## 📞 COMMUNICATION (CẬP NHẬT)

### Daily Standup: 9:00 PM (15 phút) - BẮT BUỘC

- Hôm nay code được gì? (cụ thể: file nào, method nào)
- Ngày mai code gì? (kế hoạch rõ ràng)
- Có vướng mắc gì không? (technical issues)

### Code Review: Mỗi tối trước khi ngủ

- Commit code lên branch riêng
- Push lên GitHub/GitLab
- Tag người review trong comment
- **Leader (Tuấn Tài) review tất cả code**

### Weekly Sync: Chủ nhật 8:00 PM

- 10/2: Demo code đã làm được
- 17/2: Demo tích hợp modules
- 24/2: Demo full system

### Communication Channels:

- **Urgent:** Zalo group (reply trong 30 phút)
- **Code issues:** GitHub Issues/Comments
- **Documentation:** Google Docs (shared)
- **Task tracking:** Trello/Notion board

---

## ⚡ GOLDEN RULES

### 1. CODE QUALITY > SPEED

- Đừng code nhanh mà sai logic
- Test kỹ trước khi commit
- Comment code phức tạp

### 2. GIT BEST PRACTICES

```bash
# Commit message format
git commit -m "feat: implement login API with JWT"
git commit -m "fix: booking calculation wrong discount"
git commit -m "refactor: optimize movie query performance"
```

### 3. COMMUNICATION IS KEY

- Hỏi ngay khi vướng, đừng ngồi nghĩ 1 mình quá 30 phút
- Share knowledge: Ai biết thì chia sẻ cho team
- Daily standup KHÔNG ĐƯỢC SKIP

### 4. TESTING IS MANDATORY

- Test API của mình trước khi báo xong
- Viết test cases trong Postman
- Không để bug chuyển sang người khác

### 5. DEPENDENCY AWARENESS

- Check xem module của mình cần gì từ người khác
- Thông báo sớm nếu bị block
- Làm mock data nếu module phụ thuộc chưa xong

---

## 🚨 ESCALATION PROCESS

**Khi gặp vấn đề:**

1. **Technical issue (30 phút không giải quyết được)**
   → Tag người có liên quan vào Zalo group
2. **Blocked by dependency (module khác chưa xong)**
   → Thông báo Tuấn Tài (Leader) để re-prioritize
3. **Cannot meet deadline**
   → Báo trước 24 giờ, Leader sẽ redistribute tasks
4. **Conflict in code/design**
   → Escalate to Leader, decision trong 1 giờ

---

## 🎯 FINAL CHECKLIST (28/2)

### Code Quality

- [ ] Tất cả APIs test pass trong Postman
- [ ] Không có error/warning trong PHP error log
- [ ] Code follow PSR-12 standard
- [ ] Tất cả functions có comment đầy đủ

### Security

- [ ] JWT authentication working
- [ ] Authorization checks đúng (Admin/Manager/Staff/Member)
- [ ] SQL injection safe (prepared statements)
- [ ] XSS prevention (sanitize output)
- [ ] Password hashed (bcrypt)

### Performance

- [ ] Database có indexes đúng chỗ
- [ ] Response time < 200ms (test with 100 concurrent users)
- [ ] Không có N+1 query problem
- [ ] Pagination implemented cho list APIs

### Documentation

- [ ] README.md đầy đủ (setup instructions)
- [ ] API documentation (Postman collection export)
- [ ] Database schema diagram
- [ ] Deployment guide

### Deployment

- [ ] Code merged vào `main` branch
- [ ] Database migration scripts
- [ ] Environment variables configured
- [ ] Cronjobs setup on server

---

**LET'S BUILD SOMETHING AMAZING! 🚀**

_"Good code is its own best documentation." - Steve McConnell_

## **REMEMBER:** Quality > Quantity. Làm ít nhưng chất > Làm nhiều nhưng bug đầy!

## ✅ DEFINITION OF DONE

### Controller hoàn thành khi:

- [ ] Tất cả methods theo spec
- [ ] Validation đầy đủ
- [ ] Error handling đúng
- [ ] Response format chuẩn
- [ ] Có comment rõ ràng

### Model hoàn thành khi:

- [ ] CRUD operations đầy đủ
- [ ] Prepared statements
- [ ] Relationships (join) đúng
- [ ] Pagination implemented
- [ ] Error handling

### API hoàn thành khi:

- [ ] Test Postman pass
- [ ] Document API (input/output)
- [ ] Edge cases handled
- [ ] Security checked

---

## 🎖️ SUCCESS METRICS

**Mục tiêu đạt được:**

- ✅ 14 Controllers hoàn chỉnh
- ✅ 15 Models hoàn chỉnh
- ✅ 50+ API endpoints working
- ✅ 0 critical bugs
- ✅ Response time < 200ms
- ✅ Test coverage > 80%

---

**LET'S BUILD SOMETHING AMAZING! 🚀**

_"Code is like humor. When you have to explain it, it's bad." - Cory House_
