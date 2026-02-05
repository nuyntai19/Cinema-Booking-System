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

## Bước tiếp theo:

1. ✅ Tạo database schema (SQL script)
2. ✅ Tạo Controllers (AuthController, UserController, etc.)
3. ✅ Tạo Models (User, Movie, Booking, etc.)
4. ✅ Test API endpoints
5. ✅ Connect frontend React với backend PHP

Muốn tạo tiếp phần nào? (Database schema, Controllers, hoặc Models?)
