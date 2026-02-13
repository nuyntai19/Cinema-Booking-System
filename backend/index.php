<?php
/**
 * Galaxy Cinema Backend - Entry Point
 * REST API for Cinema Booking System
 */

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load .env before configs
require_once __DIR__ . '/config/Env.php';
Env::load(__DIR__ . '/.env');

// Autoloader
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/config/Config.php';
require_once __DIR__ . '/core/Router.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';
require_once __DIR__ . '/middleware/CorsMiddleware.php';

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
$router->get('/api/health', function() {
    Response::success(['status' => 'OK', 'message' => 'Galaxy Cinema API is running']);
});

// ============================================
// AUTH ROUTES
// ============================================
$router->post('/api/auth/register', 'AuthController@register');
$router->post('/api/auth/login', 'AuthController@login');
$router->post('/api/auth/logout', 'AuthController@logout');
$router->get('/api/auth/me', 'AuthController@getCurrentUser'); // Protected

// ============================================
// USER ROUTES
// ============================================
$router->get('/api/users', 'UserController@index'); // Admin only
$router->get('/api/users/:id', 'UserController@show');
$router->put('/api/users/:id', 'UserController@update');
$router->delete('/api/users/:id', 'UserController@delete'); // Admin only
$router->get('/api/users/:id/profile', 'UserController@getProfile');
$router->put('/api/users/:id/profile', 'UserController@updateProfile');

// ============================================
// MOVIE ROUTES
// ============================================
$router->get('/api/movies', 'MovieController@index');
$router->get('/api/movies/:id', 'MovieController@show');
$router->post('/api/movies', 'MovieController@create'); // Admin
$router->put('/api/movies/:id', 'MovieController@update'); // Admin
$router->delete('/api/movies/:id', 'MovieController@delete'); // Admin
$router->get('/api/movies/:id/showtimes', 'MovieController@getShowtimes');
$router->get('/api/movies/:id/reviews', 'MovieController@getReviews');

// ============================================
// CINEMA ROUTES
// ============================================
$router->get('/api/cinemas', 'CinemaController@index');
$router->get('/api/cinemas/:id', 'CinemaController@show');
$router->post('/api/cinemas', 'CinemaController@create'); // Admin
$router->put('/api/cinemas/:id', 'CinemaController@update'); // Admin
$router->delete('/api/cinemas/:id', 'CinemaController@delete'); // Admin
$router->get('/api/cinemas/:id/halls', 'CinemaController@getHalls');

// ============================================
// SHOWTIME ROUTES
// ============================================
$router->get('/api/showtimes', 'ShowtimeController@index');
$router->get('/api/showtimes/:id', 'ShowtimeController@show');
$router->post('/api/showtimes', 'ShowtimeController@create'); // Manager
$router->put('/api/showtimes/:id', 'ShowtimeController@update'); // Manager
$router->delete('/api/showtimes/:id', 'ShowtimeController@delete'); // Manager
$router->get('/api/showtimes/:id/seats', 'ShowtimeController@getAvailableSeats');

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
$router->post('/api/transactions/momo/create', 'TransactionController@createMoMoPayment');
$router->post('/api/transactions/vnpay/create', 'TransactionController@createVNPayPayment');

// ============================================
// TICKET ROUTES
// ============================================
$router->get('/api/tickets/:code', 'TicketController@getByCode'); // QR scan
$router->put('/api/tickets/:id/use', 'TicketController@markAsUsed'); // Staff scan
$router->put('/api/tickets/:id/refund', 'TicketController@refund');

// ============================================
// LOYALTY & MEMBERSHIP ROUTES
// ============================================
$router->get('/api/loyalty/history/:userId', 'LoyaltyController@getHistory');
$router->post('/api/loyalty/earn', 'LoyaltyController@earnPoints');
$router->post('/api/loyalty/redeem', 'LoyaltyController@redeemPoints');
$router->get('/api/memberships', 'MembershipController@index');

// ============================================
// VOUCHER & PROMOTION ROUTES
// ============================================
$router->get('/api/promotions', 'PromotionController@index');
$router->get('/api/promotions/:id', 'PromotionController@show');
$router->post('/api/promotions', 'PromotionController@create'); // Admin
$router->put('/api/promotions/:id', 'PromotionController@update'); // Admin
$router->delete('/api/promotions/:id', 'PromotionController@delete'); // Admin
$router->get('/api/vouchers/user/:userId', 'VoucherController@getUserVouchers');
$router->post('/api/vouchers/apply', 'VoucherController@applyVoucher');

// ============================================
// CONCESSION ROUTES
// ============================================
$router->get('/api/concessions', 'ConcessionController@index');
$router->get('/api/concessions/:id', 'ConcessionController@show');
$router->post('/api/concessions', 'ConcessionController@create'); // Admin
$router->put('/api/concessions/:id', 'ConcessionController@update'); // Admin
$router->delete('/api/concessions/:id', 'ConcessionController@delete'); // Admin

// ============================================
// REVIEW ROUTES
// ============================================
$router->get('/api/reviews/movie/:movieId', 'ReviewController@getMovieReviews');
$router->post('/api/reviews', 'ReviewController@create');
$router->put('/api/reviews/:id', 'ReviewController@update');
$router->delete('/api/reviews/:id', 'ReviewController@delete');

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
