<?php
/**
 * Application Configuration
 */
class Config
{
    // JWT Settings
    public static $jwt_secret = 'galaxy_cinema_secret_key_2026_change_this_in_production';
    public static $jwt_expiration = 86400; // 24 hours in seconds

    // App Settings
    public static $app_name = 'Galaxy Cinema';
    public static $app_version = '1.0.0';
    public static $timezone = 'Asia/Ho_Chi_Minh';

    // Pagination
    public static $items_per_page = 20;

    // Upload Settings
    public static $upload_path = __DIR__ . '/../uploads/';
    public static $allowed_image_types = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    public static $max_file_size = 5242880; // 5MB in bytes

    // Booking Settings
    public static $seat_hold_duration = 600; // 10 minutes in seconds
    public static $min_vietnamese_quota = 15; // 15% minimum Vietnamese movies

    // Loyalty Settings
    public static $points_per_vnd = 10000; // 10,000 VND = 1 point

    // Curfew Settings
    public static $curfew_u13 = '22:00:00';
    public static $curfew_u16 = '23:00:00';

    // API Rate Limiting
    public static $rate_limit_requests = 100;
    public static $rate_limit_window = 60; // seconds

    // SMTP Email Settings (Gmail)
    public static $smtp_enabled = true; // Set false để disable SMTP và dùng log
    public static $smtp_host = 'smtp.gmail.com';
    public static $smtp_port = 587; // 587 for TLS, 465 for SSL
    public static $smtp_encryption = 'tls'; // 'tls' hoặc 'ssl'
    public static $smtp_username = ''; // Email của bạn, ví dụ: 'yourname@gmail.com'
    public static $smtp_password = ''; // App Password từ Google (16 ký tự)
    public static $smtp_from_email = 'noreply@galaxycinema.vn';
    public static $smtp_from_name = 'Galaxy Cinema';

    public static function init()
    {
        date_default_timezone_set(self::$timezone);

        // Create upload directory if not exists
        if (!file_exists(self::$upload_path)) {
            mkdir(self::$upload_path, 0777, true);
        }
    }
}

Config::init();
