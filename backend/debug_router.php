<?php
/**
 * Simulate the full index.php and test route matching for GET /api/halls/6
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/core/Router.php';
require_once __DIR__ . '/core/Response.php';

$router = new Router();

// Register ALL routes exactly as in index.php
// HALL ROUTES
$router->post('/api/halls', 'HallController@create');
$router->get('/api/halls/:id', 'HallController@show');
$router->put('/api/halls/:id', 'HallController@update');
$router->delete('/api/halls/:id', 'HallController@delete');
$router->post('/api/halls/:id/layout', 'HallController@saveLayout');

// AUTH ROUTES
$router->post('/api/auth/send-verification', 'AuthController@sendVerification');
$router->post('/api/auth/verify-email', 'AuthController@verifyEmail');
$router->post('/api/auth/register', 'AuthController@register');
$router->post('/api/auth/login', 'AuthController@login');
$router->post('/api/auth/logout', 'AuthController@logout');
$router->post('/api/auth/refresh-token', 'AuthController@refreshToken');
$router->get('/api/auth/me', 'AuthController@getCurrentUser');

// USER ROUTES
$router->get('/api/users', 'UserController@index');
$router->post('/api/users', 'UserController@create');
$router->get('/api/users/:id', 'UserController@show');
$router->put('/api/users/:id', 'UserController@update');
$router->delete('/api/users/:id', 'UserController@delete');
$router->put('/api/users/:id/role', 'UserController@updateRole');
$router->get('/api/users/:id/profile', 'UserController@getProfile');
$router->put('/api/users/:id/profile', 'UserController@updateProfile');
$router->post('/api/users/:id/change-password', 'UserController@changePassword');
$router->post('/api/users/:id/upload-avatar', 'UserController@uploadAvatar');
$router->get('/api/roles', 'RoleController@index');

// MOVIE ROUTES
$router->get('/api/movies', 'MovieController@index');
$router->get('/api/movies/:id', 'MovieController@show');
$router->post('/api/movies', 'MovieController@create');
$router->put('/api/movies/:id', 'MovieController@update');
$router->delete('/api/movies/:id', 'MovieController@delete');
$router->get('/api/movies/:id/showtimes', 'MovieController@getShowtimes');
$router->get('/api/movies/:id/reviews', 'MovieController@getReviews');

// CINEMA ROUTES
$router->get('/api/cinemas', 'CinemaController@index');
$router->get('/api/cinemas/:id', 'CinemaController@show');
$router->post('/api/cinemas', 'CinemaController@create');
$router->put('/api/cinemas/:id', 'CinemaController@update');
$router->delete('/api/cinemas/:id', 'CinemaController@delete');
$router->get('/api/cinemas/:id/halls', 'CinemaController@getHalls');
$router->get('/api/cinemas/:id/showtimes', 'CinemaController@getShowtimes');

// SHOWTIME ROUTES
$router->get('/api/showtimes', 'ShowtimeController@index');
$router->get('/api/showtimes/:id', 'ShowtimeController@show');
$router->post('/api/showtimes', 'ShowtimeController@create');
$router->put('/api/showtimes/:id', 'ShowtimeController@update');
$router->delete('/api/showtimes/:id', 'ShowtimeController@delete');
$router->get('/api/showtimes/:id/seats', 'ShowtimeController@getAvailableSeats');
$router->get('/api/showtimes/:id/seat-map', 'ShowtimeController@getSeatMap');

// BOOKING ROUTES
$router->get('/api/bookings', 'BookingController@index');
$router->get('/api/bookings/:id', 'BookingController@show');
$router->post('/api/bookings', 'BookingController@create');
$router->put('/api/bookings/:id/confirm', 'BookingController@confirm');
$router->put('/api/bookings/:id/cancel', 'BookingController@cancel');
$router->get('/api/bookings/user/:userId', 'BookingController@getUserBookings');

// TICKET ROUTES
$router->get('/api/tickets/:code', 'TicketController@getByCode');
$router->put('/api/tickets/:id/use', 'TicketController@markAsUsed');
$router->put('/api/tickets/:id/refund', 'TicketController@refund');

// LOYALTY & MEMBERSHIP
$router->get('/api/loyalty/history/:userId', 'LoyaltyController@getHistory');
$router->post('/api/loyalty/earn', 'LoyaltyController@earnPoints');
$router->post('/api/loyalty/redeem', 'LoyaltyController@redeemPoints');
$router->get('/api/memberships', 'MembershipController@index');

// VOUCHER & PROMOTION
$router->get('/api/promotions', 'PromotionController@index');
$router->get('/api/promotions/:id', 'PromotionController@show');
$router->post('/api/promotions', 'PromotionController@create');
$router->put('/api/promotions/:id', 'PromotionController@update');
$router->delete('/api/promotions/:id', 'PromotionController@delete');
$router->get('/api/vouchers/user/:userId', 'VoucherController@getUserVouchers');
$router->post('/api/vouchers/apply', 'VoucherController@applyVoucher');

// CONCESSION
$router->get('/api/concessions', 'ConcessionController@index');
$router->get('/api/concessions/:id', 'ConcessionController@show');
$router->post('/api/concessions', 'ConcessionController@create');
$router->put('/api/concessions/:id', 'ConcessionController@update');
$router->delete('/api/concessions/:id', 'ConcessionController@delete');

// REVIEW
$router->get('/api/reviews/movie/:movieId', 'ReviewController@getMovieReviews');
$router->post('/api/reviews', 'ReviewController@create');
$router->put('/api/reviews/:id', 'ReviewController@update');
$router->delete('/api/reviews/:id', 'ReviewController@delete');

// NOTIFICATION
$router->get('/api/notifications/user/:userId', 'NotificationController@getUserNotifications');
$router->put('/api/notifications/:id/read', 'NotificationController@markAsRead');

// ADMIN
$router->get('/api/admin/stats', 'AdminController@getDashboardStats');
$router->get('/api/admin/revenue', 'AdminController@getRevenueReport');
$router->get('/api/admin/seat-heatmap', 'AdminController@getSeatHeatmap');

// CONFIG
$router->get('/api/config', 'ConfigController@index');
$router->put('/api/config', 'ConfigController@update');

// Get routes via reflection
$ref = new ReflectionClass($router);
$routesProp = $ref->getProperty('routes');
$routesProp->setAccessible(true);
$routes = $routesProp->getValue($router);

echo "Total routes registered: " . count($routes) . "\n\n";

// Test GET /api/halls/6
$testUri = '/api/halls/6';
$testMethod = 'GET';
echo "=== Testing: $testMethod $testUri ===\n";

$found = false;
foreach ($routes as $i => $route) {
    if ($route['method'] === $testMethod && preg_match($route['pattern'], $testUri, $matches)) {
        echo "MATCH at index [$i]: {$route['method']} {$route['path']} => handler: {$route['handler']}\n";
        $found = true;
        break;
    }
}

if (!$found) {
    echo "NO MATCH FOUND!\n";

    // Show all GET routes and test them
    echo "\nAll GET routes:\n";
    foreach ($routes as $i => $route) {
        if ($route['method'] === 'GET') {
            $m = preg_match($route['pattern'], $testUri);
            echo "  [$i] {$route['path']} {$route['pattern']} => " . ($m ? 'MATCH!' : 'no') . "\n";
        }
    }
}
