# 🔐 HỆ THỐNG PHÂN QUYỀN - GALAXY CINEMA

## Tổng Quan

Dự án **CÓ HỆ THỐNG PHÂN QUYỀN ĐẦY ĐỦ** với 5 cấp độ vai trò (roles) và middleware xác thực JWT.

---

## 📊 CẤU TRÚC VAI TRÒ (ROLES)

### Bảng Roles trong Database

| ID | Tên Role | Mô Tả | Quyền Hạn |
|----|----------|-------|-----------|
| 1  | **Guest** | Khách vãng lai | Xem thông tin cơ bản, không đặt vé online |
| 2  | **Member** | Thành viên đã đăng ký | Đặt vé, tích điểm, quản lý booking cá nhân |
| 3  | **Staff** | Nhân viên quầy | POS, scan vé, quản lý khách vãng lai |
| 4  | **Manager** | Quản lý rạp | Quản lý suất chiếu, xem báo cáo, quản lý staff |
| 5  | **Admin** | Quản trị hệ thống | Toàn quyền (phim, rạp, user, cấu hình) |

### Hierarchy (Phân cấp quyền)

```
Admin (5) 
  ├── Có TẤT CẢ quyền của Manager
  │
Manager (4)
  ├── Có TẤT CẢ quyền của Staff
  │
Staff (3)
  ├── Có TẤT CẢ quyền của Member
  │
Member (2)
  ├── Có TẤT CẢ quyền của Guest
  │
Guest (1)
  └── Chỉ xem thông tin công khai
```

---

## 🔑 CÁCH THỨC HOẠT ĐỘNG

### 1. Authentication (Xác thực)
**File**: `backend/middleware/AuthMiddleware.php`

```php
// Kiểm tra JWT token từ header Authorization
AuthMiddleware::authenticate()

// Giải mã token và lấy thông tin user:
$_REQUEST['auth_user_id']      // ID người dùng
$_REQUEST['auth_user_role']    // Tên role (Admin/Manager/Staff/Member/Guest)
$_REQUEST['auth_user_role_id'] // ID của role (1-5)
```

### 2. Authorization (Phân quyền)
**File**: `backend/middleware/AuthMiddleware.php`

```php
// Kiểm tra role cụ thể
AuthMiddleware::requireRole(['Admin', 'Manager'])

// Chỉ Admin
AuthMiddleware::requireAdmin()

// Admin hoặc Manager
AuthMiddleware::requireManager()

// Admin, Manager, hoặc Staff
AuthMiddleware::requireStaff()
```

### 3. JWT Token Structure

Khi user đăng nhập, hệ thống tạo JWT token chứa:
```json
{
  "user_id": 1,
  "email": "admin@galaxy.vn",
  "role": "Admin",
  "role_id": 5,
  "iat": 1234567890,
  "exp": 1234654290
}
```

Token này được gửi kèm trong header của mọi request:
```
Authorization: Bearer <jwt_token_here>
```

---

## 📋 PHÂN QUYỀN CHI TIẾT THEO MODULE

### 🎬 **1. QUẢN LÝ PHIM (Movies)**

| Chức năng | Endpoint | Method | Quyền truy cập |
|-----------|----------|--------|----------------|
| Xem danh sách phim | `/api/movies` | GET | 🌍 Public (tất cả) |
| Xem chi tiết phim | `/api/movies/:id` | GET | 🌍 Public |
| Tạo phim mới | `/api/movies` | POST | 🔴 Admin only |
| Cập nhật phim | `/api/movies/:id` | PUT | 🔴 Admin only |
| Xóa phim | `/api/movies/:id` | DELETE | 🔴 Admin only |
| Upload poster | `/api/movies/:id/upload-poster` | POST | 🔴 Admin only |
| Import hàng loạt | `/api/movies/import` | POST | 🔴 Admin only |

**Code thực tế** (MovieController.php):
```php
public function create() {
    // Kiểm tra quyền Admin hoặc Manager
    if (!$this->isAdminOrManager()) {
        Response::forbidden('Only Admin/Manager can create movies');
    }
    // ... logic tạo phim
}
```

### 👥 **2. QUẢN LÝ NGƯỜI DÙNG (Users)**

| Chức năng | Endpoint | Method | Quyền truy cập |
|-----------|----------|--------|----------------|
| Danh sách users | `/api/users` | GET | 🔴 Admin only |
| Tạo user | `/api/users` | POST | 🔴 Admin only |
| Xem user | `/api/users/:id` | GET | 🟡 Admin hoặc chính user đó |
| Cập nhật user | `/api/users/:id` | PUT | 🟡 Admin hoặc chính user đó |
| Xóa user | `/api/users/:id` | DELETE | 🔴 Admin only |
| Thay đổi role | `/api/users/:id/role` | PUT | 🔴 Admin only |
| Profile cá nhân | `/api/users/:id/profile` | GET | 🟢 Chính user đó |
| Đổi mật khẩu | `/api/users/:id/change-password` | POST | 🟢 Chính user đó |

**Code thực tế** (UserController.php):
```php
public function update($id) {
    // Kiểm tra: Admin hoặc chính user đó
    $currentUserId = $this->getCurrentUserId();
    
    if (!$this->isAdmin() && $currentUserId != $id) {
        Response::forbidden('You can only update your own profile');
    }
    // ... logic cập nhật
}
```

### 🏢 **3. QUẢN LÝ RẠP & PHÒNG CHIẾU (Cinemas & Halls)**

| Chức năng | Endpoint | Method | Quyền truy cập |
|-----------|----------|--------|----------------|
| Xem danh sách rạp | `/api/cinemas` | GET | 🌍 Public |
| Tạo rạp | `/api/cinemas` | POST | 🔴 Admin only |
| Cập nhật rạp | `/api/cinemas/:id` | PUT | 🔴 Admin only |
| Xóa rạp | `/api/cinemas/:id` | DELETE | 🔴 Admin only |
| Tạo phòng chiếu | `/api/halls` | POST | 🔴 Admin only |
| Lưu layout ghế | `/api/halls/:id/layout` | POST | 🔴 Admin only |

### 🎫 **4. QUẢN LÝ SUẤT CHIẾU (Showtimes)**

| Chức năng | Endpoint | Method | Quyền truy cập |
|-----------|----------|--------|----------------|
| Xem suất chiếu | `/api/showtimes` | GET | 🌍 Public |
| Tạo suất chiếu | `/api/showtimes` | POST | 🟠 Manager+ (Manager, Admin) |
| Tự động tạo | `/api/showtimes/auto-generate` | POST | 🟠 Manager+ |
| Cập nhật | `/api/showtimes/:id` | PUT | 🟠 Manager+ |
| Xóa | `/api/showtimes/:id` | DELETE | 🟠 Manager+ |
| Xem sơ đồ ghế | `/api/showtimes/:id/seat-map` | GET | 🌍 Public |
| Giữ ghế | `/api/showtimes/:id/hold-seats` | POST | 🔵 Member+ |

### 💰 **5. ĐẶT VÉ & THANH TOÁN (Bookings & Transactions)**

| Chức năng | Endpoint | Method | Quyền truy cập |
|-----------|----------|--------|----------------|
| Tạo booking | `/api/bookings` | POST | 🔵 Member+ |
| Xem booking | `/api/bookings/:id` | GET | 🟡 Người đặt hoặc Staff+ |
| Xác nhận thanh toán | `/api/bookings/:id/confirm` | PUT | 🔵 Member+ |
| Hủy booking | `/api/bookings/:id/cancel` | PUT | 🟡 Người đặt hoặc Staff+ |
| Hoàn tiền | `/api/bookings/:id/refund` | PUT | 🔴 Admin only |
| Lịch sử POS | `/api/bookings/pos-history` | GET | 🟣 Staff+ |

**Code thực tế** (BookingController.php):
```php
public function create() {
    AuthMiddleware::authenticate();
    $userId = $_REQUEST['auth_user_id'];
    
    // Chỉ Member trở lên mới được đặt vé
    $userRole = $_REQUEST['auth_user_role'];
    if ($userRole === 'Guest') {
        Response::forbidden('Guest cannot create bookings. Please register.');
    }
    // ... logic đặt vé
}
```

### 🎟️ **6. QUẢN LÝ VÉ (Tickets)**

| Chức năng | Endpoint | Method | Quyền truy cập |
|-----------|----------|--------|----------------|
| Scan QR vé | `/api/tickets/code/:code` | GET | 🟣 Staff+ |
| Kiểm tra vé | `/api/tickets/check` | POST | 🟣 Staff+ |
| Duyệt vào cổng | `/api/tickets/approve-entry` | POST | 🟣 Staff+ |
| Lịch sử scan | `/api/tickets/scan-history` | GET | 🟣 Staff+ |
| Danh sách tất cả vé | `/api/tickets` | GET | 🔴 Admin only |

### 👤 **7. KHÁCH VÃNG LAI (POS Customers)**

| Chức năng | Endpoint | Method | Quyền truy cập |
|-----------|----------|--------|----------------|
| Tìm/tạo khách | `/api/customers/lookup-or-create` | POST | 🟣 Staff+ |
| Tìm theo SĐT | `/api/customers/by-phone` | GET | 🟣 Staff+ |
| Lịch sử booking | `/api/customers/:id/bookings` | GET | 🟣 Staff+ |
| Thống kê | `/api/customers/stats` | GET | 🟣 Staff+ hoặc Admin |

### 📊 **8. BÁO CÁO & QUẢN TRỊ (Admin & Manager Reports)**

| Chức năng | Endpoint | Method | Quyền truy cập |
|-----------|----------|--------|----------------|
| Dashboard stats | `/api/admin/dashboard` | GET | 🟠 Manager+ |
| Báo cáo doanh thu | `/api/admin/revenue` | GET | 🟠 Manager+ |
| Heatmap ghế | `/api/admin/seat-heatmap` | GET | 🟠 Manager+ |
| Giao dịch gần đây | `/api/admin/transactions/recent` | GET | 🟠 Manager+ |
| Export chi tiết | `/api/admin/transactions/export-details` | GET | 🟠 Manager+ |
| Báo cáo công suất | `/api/manager/reports/occupancy` | GET | 🟠 Manager+ |

**Code thực tế** (AdminController.php):
```php
public function getDashboardStats() {
    // Chỉ Manager và Admin
    AuthMiddleware::requireManager();
    
    // ... logic lấy thống kê
}
```

### 🍿 **9. ĐỒ ĂN & NƯỚC (Concessions)**

| Chức năng | Endpoint | Method | Quyền truy cập |
|-----------|----------|--------|----------------|
| Xem menu | `/api/concessions` | GET | 🌍 Public |
| Tạo món mới | `/api/concessions` | POST | 🟠 Manager+ |
| Cập nhật | `/api/concessions/:id` | PUT | 🟠 Manager+ |
| Xóa | `/api/concessions/:id` | DELETE | 🟠 Manager+ |
| Import hàng loạt | `/api/concessions/import` | POST | 🔴 Admin only |

### ⭐ **10. ĐÁNH GIÁ PHIM (Reviews)**

| Chức năng | Endpoint | Method | Quyền truy cập |
|-----------|----------|--------|----------------|
| Xem đánh giá | `/api/reviews/movie/:movieId` | GET | 🌍 Public |
| Tạo đánh giá | `/api/reviews` | POST | 🔵 Member+ |
| Cập nhật | `/api/reviews/:id` | PUT | 🟡 Người viết hoặc Admin |
| Xóa | `/api/reviews/:id` | DELETE | 🟡 Người viết hoặc Admin |
| Report đánh giá | `/api/reviews/:id/report` | POST | 🔵 Member+ |

### 🎁 **11. KHUYẾN MÃI & VOUCHER (Promotions & Vouchers)**

| Chức năng | Endpoint | Method | Quyền truy cập |
|-----------|----------|--------|----------------|
| Xem khuyến mãi | `/api/promotions` | GET | 🌍 Public |
| Tạo khuyến mãi | `/api/promotions` | POST | 🟠 Manager+ |
| Cập nhật | `/api/promotions/:id` | PUT | 🟠 Manager+ |
| Voucher của user | `/api/users/:userId/vouchers` | GET | 🟡 User đó hoặc Staff+ |
| Sử dụng voucher | `/api/vouchers/:id/redeem` | POST | 🔵 Member+ |

---

## 🛡️ CÁCH KIỂM TRA QUYỀN TRONG CONTROLLER

### Pattern 1: Dùng AuthMiddleware (Khuyến nghị)
```php
class AdminController {
    public function getDashboardStats() {
        // Tự động kiểm tra và reject nếu không phải Manager/Admin
        AuthMiddleware::requireManager();
        
        // Code chỉ chạy nếu user có quyền
        // ...
    }
}
```

### Pattern 2: Kiểm tra manual
```php
class UserController {
    public function update($id) {
        $currentUserId = $this->getCurrentUserId();
        
        // Cho phép Admin hoặc chính user đó
        if (!$this->isAdmin() && $currentUserId != $id) {
            Response::forbidden('You can only update your own profile');
        }
        
        // ... logic cập nhật
    }
}
```

### Pattern 3: Kiểm tra nhiều điều kiện
```php
class BookingController {
    public function show($id) {
        AuthMiddleware::authenticate();
        
        $booking = $this->bookingModel->getById($id);
        $currentUserId = $_REQUEST['auth_user_id'];
        $userRole = $_REQUEST['auth_user_role'];
        
        // Cho phép: người đặt, hoặc Staff trở lên
        if ($booking['user_id'] != $currentUserId && 
            !in_array($userRole, ['Staff', 'Manager', 'Admin'])) {
            Response::forbidden('Access denied');
        }
        
        // ... trả về booking
    }
}
```

---

## 🔐 BẢO MẬT & BEST PRACTICES

### ✅ Điểm Mạnh của Hệ Thống

1. **JWT Token-based Authentication**
   - Stateless, dễ scale
   - Token có thời gian hết hạn
   - Chứa đầy đủ thông tin role

2. **Middleware Pattern**
   - Tách biệt logic xác thực khỏi business logic
   - Dễ bảo trì và test
   - Có thể tái sử dụng

3. **Role-based Access Control (RBAC)**
   - 5 level rõ ràng
   - Hierarchy từ Guest → Admin
   - Database-driven (dễ mở rộng)

4. **Defense in Depth**
   - Kiểm tra ở nhiều layer (middleware + controller)
   - Validate cả token và business logic
   - Log đầy đủ để audit

### ⚠️ Khuyến Nghị Cải Tiến

1. **Tách biệt rõ ràng hơn giữa routes**
   ```php
   // Nên có route groups theo role
   $router->group(['middleware' => 'AuthMiddleware::requireAdmin'], function($router) {
       $router->post('/api/movies', 'MovieController@create');
       $router->delete('/api/movies/:id', 'MovieController@delete');
   });
   ```

2. **Thêm Permission-based ngoài Role**
   - Hiện tại chỉ có role-based
   - Nên thêm permissions chi tiết hơn (create_movie, delete_user, v.v.)

3. **Rate Limiting per Role**
   - Admin: unlimited
   - Member: 100 requests/minute
   - Guest: 10 requests/minute

4. **Audit Log**
   - Log tất cả actions của Admin/Manager
   - Track who changed what when

---

## 📝 TÀI KHOẢN MẪU (Seed Data)

### Có sẵn trong database

| Email | Password | Role | Mô tả |
|-------|----------|------|-------|
| admin@galaxy.vn | password | Admin | Quản trị toàn hệ thống |
| manager@galaxy.vn | password | Manager | Quản lý rạp |
| staff@galaxy.vn | password | Staff | Nhân viên quầy |
| nguyenvana@gmail.com | password | Member | Khách hàng thường |
| tranthib@gmail.com | password | Member | Khách hàng bạc (2000 điểm) |
| levanc@gmail.com | password | Member | Khách hàng platinum (12000 điểm) |

**⚠️ QUAN TRỌNG**: Đổi mật khẩu ngay sau khi deploy!

---

## 🧪 TESTING PHÂN QUYỀN

### Test Case 1: Member cố xóa phim
```bash
curl -X DELETE http://localhost:8000/api/movies/1 \
  -H "Authorization: Bearer <member_token>"

# Expected: 403 Forbidden
```

### Test Case 2: Admin xóa phim
```bash
curl -X DELETE http://localhost:8000/api/movies/1 \
  -H "Authorization: Bearer <admin_token>"

# Expected: 200 OK
```

### Test Case 3: Guest cố đặt vé
```bash
curl -X POST http://localhost:8000/api/bookings \
  -H "Authorization: Bearer <guest_token>" \
  -d '{"showtime_id": 1, "seats": [1,2]}'

# Expected: 403 Forbidden - "Guest cannot create bookings"
```

### Test Case 4: Staff scan vé
```bash
curl http://localhost:8000/api/tickets/code/ABC123 \
  -H "Authorization: Bearer <staff_token>"

# Expected: 200 OK with ticket details
```

---

## 📊 TỔNG KẾT

### Hệ thống phân quyền hoàn chỉnh:
✅ 5 cấp độ role rõ ràng (Guest → Admin)  
✅ JWT authentication với token expiration  
✅ Middleware pattern tách biệt concerns  
✅ Role-based access control đầy đủ  
✅ Kiểm tra quyền ở cả middleware và controller  
✅ Hỗ trợ cả public endpoints và protected endpoints  
✅ Database-driven roles (dễ mở rộng)  
✅ Logging đầy đủ cho debugging  

### Các module được bảo vệ:
✅ Users Management (Admin only)  
✅ Movies Management (Admin/Manager)  
✅ Cinemas & Halls (Admin)  
✅ Showtimes (Manager+)  
✅ Bookings (Member+, với ownership check)  
✅ Tickets & POS (Staff+)  
✅ Reports & Analytics (Manager+)  
✅ Promotions & Vouchers (Manager+)  

**Kết luận**: Hệ thống phân quyền được thiết kế và triển khai đầy đủ, phù hợp với yêu cầu của một ứng dụng Cinema Booking thương mại.

---

*Document tạo bởi: Deployment Review - 2026-04-02*
*Version: 1.0*
