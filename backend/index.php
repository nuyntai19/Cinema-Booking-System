<?php

/**
 * Galaxy Cinema Backend - Entry Point
 * REST API for Cinema Booking System
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set timezone to Vietnam
date_default_timezone_set('Asia/Ho_Chi_Minh');

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output (breaks JSON)
ini_set('log_errors', 1);     // Log errors instead

// Start output buffering to catch any unexpected output
ob_start();
file_put_contents(__DIR__ . '/debug_index_hit.txt', date('Y-m-d H:i:s') . ' - ' . $_SERVER['REQUEST_URI'] . "\n", FILE_APPEND);

// Load and apply CORS middleware
require_once __DIR__ . '/middleware/CorsMiddleware.php';
CorsMiddleware::handle();

// Set content type
header('Content-Type: application/json; charset=UTF-8');

// Load .env before configs
require_once __DIR__ . '/config/Env.php';
Env::load(__DIR__ . '/.env');

// Autoloader
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/config/Config.php';
require_once __DIR__ . '/core/Router.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

// Auto-load controllers and models
spl_autoload_register(function ($class) {
    $paths = [
        __DIR__ . '/controllers/' . $class . '.php',
        __DIR__ . '/models/' . $class . '.php',
        __DIR__ . '/middleware/' . $class . '.php',
        __DIR__ . '/utils/' . $class . '.php',
        __DIR__ . '/service/' . $class . '.php'
    ];

    foreach ($paths as $path) {
        if (file_exists($path)) {
            require_once $path;
            return;
        }
    }
});

// Initialize Router
$router = new Router();

// Health check endpoint
$router->get('/api/health', function () {
    Response::success(['status' => 'OK', 'message' => 'Galaxy Cinema API is running']);
});

// ============================================
// HALL ROUTES
// ============================================
$router->post('/api/halls', 'HallController@create'); // Admin
$router->get('/api/halls/:id', 'HallController@show'); // Admin
$router->put('/api/halls/:id', 'HallController@update'); // Admin
$router->delete('/api/halls/:id', 'HallController@delete'); // Admin
$router->post('/api/halls/:id/layout', 'HallController@saveLayout'); // Admin

// ============================================
// AUTH ROUTES
// ============================================
$router->post('/api/auth/send-verification', 'AuthController@sendVerification');
$router->post('/api/auth/verify-email', 'AuthController@verifyEmail');
$router->post('/api/auth/register', 'AuthController@register');
$router->post('/api/auth/login', 'AuthController@login');
$router->post('/api/auth/logout', 'AuthController@logout');
$router->post('/api/auth/refresh-token', 'AuthController@refreshToken');
$router->get('/api/auth/me', 'AuthController@getCurrentUser'); // Protected
$router->post('/api/auth/forgot-password', 'AuthController@forgotPassword');
$router->post('/api/auth/reset-password', 'AuthController@resetPassword');

// ============================================
// USER ROUTES
// ============================================
// Admin routes
$router->get('/api/users', 'UserController@index'); // Admin only - List users
$router->post('/api/users', 'UserController@create'); // Admin only - Create user
$router->get('/api/users/:id', 'UserController@show'); // Admin or self
$router->put('/api/users/:id', 'UserController@update'); // Admin or self
$router->delete('/api/users/:id', 'UserController@delete'); // Admin only
$router->put('/api/users/:id/role', 'UserController@updateRole'); // Admin only

// User profile routes
$router->get('/api/users/:id/profile', 'UserController@getProfile'); // Self only
$router->put('/api/users/:id/profile', 'UserController@updateProfile'); // Self only
$router->post('/api/users/:id/change-password', 'UserController@changePassword'); // Self only
$router->post('/api/users/:id/upload-avatar', 'UserController@uploadAvatar'); // Self only

// Role routes
$router->get('/api/roles', 'RoleController@index'); // Get all roles

// ============================================
// MOVIE ROUTES
// ============================================
$router->get('/api/movies', 'MovieController@index');
$router->get('/api/movies/:id', 'MovieController@show');
$router->post('/api/movies', 'MovieController@create'); // Admin
$router->put('/api/movies/:id', 'MovieController@update'); // Admin
$router->delete('/api/movies/:id', 'MovieController@delete'); // Admin
$router->post('/api/movies/:id/upload-poster', 'MovieController@uploadPoster'); // Admin - Upload poster
$router->get('/api/movies/:id/showtimes', 'MovieController@getShowtimes');
$router->get('/api/movies/:id/reviews', 'MovieController@getReviews');

// ============================================
// GENRE ROUTES
// ============================================
$router->get('/api/genres', 'GenreController@index');
$router->get('/api/genres/:id', 'GenreController@show');

// ============================================
// CINEMA ROUTES
// ============================================
$router->get('/api/cinemas', 'CinemaController@index');
$router->get('/api/cinemas/:id', 'CinemaController@show');
$router->post('/api/cinemas', 'CinemaController@create'); // Admin
$router->put('/api/cinemas/:id', 'CinemaController@update'); // Admin
$router->delete('/api/cinemas/:id', 'CinemaController@delete'); // Admin
$router->get('/api/cinemas/:id/halls', 'CinemaController@getHalls');
$router->get('/api/cinemas/:id/showtimes', 'CinemaController@getShowtimes');


// ============================================
// SHOWTIME ROUTES
// ============================================
$router->get('/api/showtimes', 'ShowtimeController@index');
$router->get('/api/showtimes/:id', 'ShowtimeController@show');
$router->post('/api/showtimes', 'ShowtimeController@create'); // Manager
$router->put('/api/showtimes/:id', 'ShowtimeController@update'); // Manager
$router->delete('/api/showtimes/:id', 'ShowtimeController@delete'); // Manager
$router->get('/api/showtimes/:id/seats', 'ShowtimeController@getAvailableSeats');
$router->get('/api/showtimes/:id/seat-map', 'ShowtimeController@getSeatMap');

// ============================================
// BOOKING ROUTES
// ============================================
$router->get('/api/bookings', 'BookingController@index');
$router->get('/api/bookings/:id', 'BookingController@show');
$router->post('/api/bookings', 'BookingController@create'); // Create booking & hold seats
$router->put('/api/bookings/:id/confirm', 'BookingController@confirm'); // Confirm payment
$router->put('/api/bookings/:id/cancel', 'BookingController@cancel');
$router->get('/api/bookings/user/:userId', 'BookingController@getUserBookings');

// ============================================
// TRANSACTION ROUTES
// ============================================
$router->post('/api/transactions', 'TransactionController@create');
$router->get('/api/transactions/booking/:bookingId', 'TransactionController@getByBooking');
$router->post('/api/transactions/momo/verify', 'TransactionController@verifyMomo');
$router->post('/api/transactions/vnpay/verify', 'TransactionController@verifyVNPay');
$router->get('/api/transactions/user/:userId', 'TransactionController@getHistory');
$router->post('/api/transactions/momo', 'TransactionController@createMoMoPayment');
$router->post('/api/transactions/vnpay', 'TransactionController@createVNPayPayment');

// ============================================
// TICKET ROUTES
// ============================================
$router->get('/api/tickets', 'TicketController@index'); // Admin - Get all tickets
$router->get('/api/tickets/code/:code', 'TicketController@getByCode'); // QR scan
$router->get('/api/tickets/booking/:bookingId', 'TicketController@getByBooking'); // Get tickets by booking
$router->post('/api/tickets/check', 'TicketController@check'); // Staff scan at gate
$router->put('/api/tickets/:id/use', 'TicketController@markAsUsed'); // Mark as used
$router->post('/api/tickets/:id/refund', 'TicketController@refund'); // Refund ticket
$router->post('/api/tickets/:id/send-email', 'TicketController@sendEmail'); // Send email

// ============================================
// LOYALTY & MEMBERSHIP ROUTES
// ============================================
$router->get('/api/loyalty/history/:userId', 'LoyaltyController@getHistory');
$router->get('/api/loyalty/points/:userId', 'LoyaltyController@getCurrentPoints');
$router->post('/api/loyalty/earn', 'LoyaltyController@earnPoints');
$router->post('/api/loyalty/redeem', 'LoyaltyController@redeemPoints');
$router->get('/api/memberships', 'MembershipController@index');
$router->get('/api/memberships/user/:userId', 'MembershipController@getUserTier');
$router->get('/api/memberships/check-upgrade/:userId', 'MembershipController@checkUpgrade');
$router->get('/api/memberships/:id', 'MembershipController@show');

// ============================================
// VOUCHER & PROMOTION ROUTES
// ============================================
$router->get('/api/promotions/active', 'PromotionController@getActive');
$router->get('/api/promotions', 'PromotionController@index');
$router->get('/api/promotions/:id', 'PromotionController@show');
$router->post('/api/promotions', 'PromotionController@create'); // Admin
$router->put('/api/promotions/:id', 'PromotionController@update'); // Admin
$router->delete('/api/promotions/:id', 'PromotionController@delete'); // Admin
$router->get('/api/vouchers/reward-tiers', 'VoucherController@getRewardTiers');
$router->post('/api/vouchers/redeem-points', 'VoucherController@redeemPoints');
$router->get('/api/vouchers/user/:userId', 'VoucherController@getUserVouchers');
$router->get('/api/vouchers/:id', 'VoucherController@show');
$router->post('/api/vouchers/assign', 'VoucherController@assignToUser');
$router->post('/api/vouchers/apply', 'VoucherController@applyVoucher');
$router->put('/api/vouchers/:id/use', 'VoucherController@markAsUsed');

// ============================================
// CONCESSION ROUTES
// ============================================
$router->get('/api/concessions', 'ConcessionController@index');
$router->get('/api/concessions/available', 'ConcessionController@getAvailable'); // Get available concessions
$router->get('/api/concessions/:id', 'ConcessionController@show');
$router->post('/api/concessions', 'ConcessionController@create'); // Admin
$router->put('/api/concessions/:id', 'ConcessionController@update'); // Admin
$router->delete('/api/concessions/:id', 'ConcessionController@delete'); // Admin

// ============================================
// REVIEW ROUTES
// ============================================
$router->get('/api/reviews', 'ReviewController@index'); // Admin - List all reviews
$router->get('/api/reviews/movie/:movieId', 'ReviewController@getMovieReviews');
$router->post('/api/reviews', 'ReviewController@create');
$router->put('/api/reviews/:id', 'ReviewController@update');
$router->delete('/api/reviews/:id', 'ReviewController@delete');
$router->put('/api/reviews/:id/approve', 'ReviewController@approve'); // Admin - Approve review
$router->put('/api/reviews/:id/reject', 'ReviewController@reject'); // Admin - Reject review
$router->post('/api/reviews/:id/report', 'ReviewController@report'); // Report review

// ============================================
// NOTIFICATION ROUTES
// ============================================
$router->get('/api/notifications/user/:userId', 'NotificationController@getUserNotifications');
$router->put('/api/notifications/:id/read', 'NotificationController@markAsRead');

// ============================================
// ADMIN DASHBOARD ROUTES
// ============================================
$router->get('/api/admin/stats', 'AdminController@getDashboardStats'); // Admin
$router->get('/api/admin/revenue', 'AdminController@getRevenueReport'); // Admin
$router->get('/api/admin/seat-heatmap', 'AdminController@getSeatHeatmap'); // Admin

// ============================================
// SYSTEM CONFIG ROUTES
// ============================================
$router->get('/api/config', 'ConfigController@index');
$router->put('/api/config', 'ConfigController@update'); // Admin

// Run router
$router->run();
