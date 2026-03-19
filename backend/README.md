# Backend Structure Created Successfully! 🎉

## Cấu trúc thư mục đã tạo:

```
backend/
├── index.php                    # Entry point, định nghĩa tất cả routes
├── .htaccess                    # URL rewrite & CORS config
│
├── config/                      # Configuration files
│   ├── Database.php            # Database connection (Singleton)
│   └── Config.php              # App settings (JWT, Upload, Curfew, etc.)
│
├── core/                        # Core framework files
│   ├── Router.php              # HTTP Router with regex matching
│   └── Response.php            # Standardized JSON responses
│
├── middleware/                  # Middleware classes
│   └── AuthMiddleware.php      # JWT authentication & role checks
│
├── utils/                       # Helper utilities
│   ├── JWT.php                 # JSON Web Token encode/decode
│   └── Validator.php           # Input validation helper
│
├── controllers/                 # (Sẽ tạo tiếp)
│   ├── AuthController.php
│   ├── UserController.php
│   ├── MovieController.php
│   ├── CinemaController.php
│   ├── ShowtimeController.php
│   ├── BookingController.php
│   ├── TicketController.php
│   ├── LoyaltyController.php
│   ├── VoucherController.php
│   ├── PromotionController.php
│   ├── ConcessionController.php
│   ├── ReviewController.php
│   ├── NotificationController.php
│   ├── AdminController.php
│   └── ConfigController.php
│
├── models/                      # (Sẽ tạo tiếp)
│   ├── User.php
│   ├── Movie.php
│   ├── Cinema.php
│   ├── Showtime.php
│   ├── Booking.php
│   ├── Ticket.php
│   ├── Loyalty.php
│   ├── Voucher.php
│   ├── Promotion.php
│   └── ...
│
└── uploads/                     # Upload folder (auto-created)
```

## Routes đã định nghĩa:

### Auth Routes

- POST `/api/auth/register` - Đăng ký
- POST `/api/auth/login` - Đăng nhập
- POST `/api/auth/logout` - Đăng xuất
- GET `/api/auth/me` - Get current user info

### User Routes

- GET `/api/users` - List users (Admin)
- GET `/api/users/:id` - Get user detail
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user (Admin)
- GET `/api/users/:id/profile` - Get user profile
- PUT `/api/users/:id/profile` - Update profile

### Movie Routes

- GET `/api/movies` - List movies
- GET `/api/movies/:id` - Get movie detail
- POST `/api/movies` - Create movie (Admin)
- PUT `/api/movies/:id` - Update movie (Admin)
- DELETE `/api/movies/:id` - Delete movie (Admin)
- GET `/api/movies/:id/showtimes` - Get showtimes
- GET `/api/movies/:id/reviews` - Get reviews

### Booking Routes (Theo ERD mới)

- POST `/api/bookings` - Create booking & hold seats (tạo TICKETS với status HOLDING)
- PUT `/api/bookings/:id/confirm` - Confirm payment (đổi status HOLDING → SOLD)
- PUT `/api/bookings/:id/cancel` - Cancel & release seats

### Loyalty Routes (Theo ERD mới)

- GET `/api/loyalty/history/:userId` - Get LOYALTY_HISTORY
- POST `/api/loyalty/earn` - Earn points
- POST `/api/loyalty/redeem` - Redeem points

### Voucher Routes (Theo ERD mới)

- GET `/api/vouchers/user/:userId` - Get USER_VOUCHERS
- POST `/api/vouchers/apply` - Apply voucher to booking

## Features đã implement:

✅ **Router** - Pattern matching với :param
✅ **Response Helper** - Standardized JSON responses
✅ **JWT Authentication** - Token encode/decode
✅ **Auth Middleware** - Role-based access control
✅ **Validator** - Input validation
✅ **Database** - Singleton connection
✅ **Config** - Centralized settings
✅ **CORS** - Cross-origin support
✅ **Email Service** - Gmail SMTP support

## 📧 Email Setup (Gửi Email Xác Nhận Thật)

Để gửi email xác nhận thật qua Gmail:

### Quick Start:

1. **Đọc hướng dẫn chi tiết**: Xem file [`GMAIL_SMTP_SETUP.md`](GMAIL_SMTP_SETUP.md)

2. **Bật 2FA cho Gmail**: https://myaccount.google.com/security

3. **Tạo App Password**: https://myaccount.google.com/apppasswords

4. **Cấu hình trong `config/Config.php`**:
   ```php
   public static $smtp_enabled = true;
   public static $smtp_username = 'youremail@gmail.com';
   public static $smtp_password = 'xxxx xxxx xxxx xxxx'; // App Password
   ```

5. **Test**: Đăng ký tài khoản mới và kiểm tra email!

### Disable Email (Chỉ Log):

Nếu chưa muốn gửi email thật:
```php
public static $smtp_enabled = false;
```

Email sẽ chỉ hiển thị trong PHP server log.

---

## Cloudinary Uploads

Ứng dụng hiện hỗ trợ lưu ảnh mới lên Cloudinary thông qua các endpoint upload hiện có:

- `POST /api/movies/:id/upload-poster`
- `POST /api/users/:id/upload-avatar`

Thiết lập trong file `.env`:

```env
CLOUDINARY_ENABLED=true
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=galaxy-cinema
```

Hành vi runtime:

- Khi `CLOUDINARY_ENABLED=true` và đủ credentials, ảnh mới sẽ được upload lên Cloudinary và database sẽ lưu `secure_url`.
- Khi `CLOUDINARY_ENABLED=false`, hệ thống giữ nguyên cơ chế lưu local trong thư mục `uploads/`.
- Nếu bật Cloudinary nhưng thiếu biến môi trường, endpoint upload sẽ trả lỗi cấu hình để tránh lưu lẫn lộn giữa local và cloud.

---

## Bước tiếp theo:

1. ✅ Tạo database schema (SQL script)
2. ✅ Tạo Controllers (AuthController, UserController, etc.)
3. ✅ Tạo Models (User, Movie, Booking, etc.)
4. ✅ Test API endpoints
5. ✅ Connect frontend React với backend PHP
6. ✅ Setup Email Service với Gmail SMTP

Muốn tạo tiếp phần nào? (Database schema, Controllers, hoặc Models?)

