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
    public static $seat_hold_duration = 300; // 5 minutes in seconds
    public static $showtime_cleanup_minutes = 15; // phút dọn phòng giữa 2 suất
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
    public static $smtp_username = 'taiv80527@gmail.com'; // Email của bạn, ví dụ: 'yourname@gmail.com'
    public static $smtp_password = 'oscuepstsovuwehn'; // App Password từ Google (16 ký tự)
    public static $smtp_from_email = 'noreply@galaxycinema.vn';
    public static $smtp_from_name = 'Galaxy Cinema';
    
    // REDIS Settings
    public static $redis_host = 'localhost';
    public static $redis_port = 6379;

    // Payment Gateway Settings
    // MoMo Test Credentials (https://developers.momo.vn/)
    public static $momo_partner_code = 'MOMOBKUN20180529';
    public static $momo_access_key = 'klm05TvNBzhg7h7j';
    public static $momo_secret_key = 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa';
    
    // VNPay Test Credentials
    public static $vnpay_tmncode = 'RBHKX032';
    public static $vnpay_hash_secret = 'UTXEFH8WUE9NPQDQC3WIKK8JOX19O3CK';
    public static $vnpay_url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    // Optional: default return and IPN URLs (can be overridden by .env)
    public static $vnpay_return_url = '';
    public static $vnpay_notify_url = '';


    public static function init()
    {
        date_default_timezone_set(self::$timezone);

        // Create upload directory if not exists
        if (!file_exists(self::$upload_path)) {
            mkdir(self::$upload_path, 0777, true);
        }
        
        // Define payment gateway constants for PaymentService
        if (!defined('MOMO_PARTNER_CODE')) {
            define('MOMO_PARTNER_CODE', self::$momo_partner_code);
            define('MOMO_ACCESS_KEY', self::$momo_access_key);
            define('MOMO_SECRET_KEY', self::$momo_secret_key);
            define('VNP_TMNCODE', self::$vnpay_tmncode);
            define('VNP_HASH_SECRET', self::$vnpay_hash_secret);
            define('VNP_URL', self::$vnpay_url);
            define('VNPAY_RETURN_URL', self::$vnpay_return_url);
            define('VNPAY_NOTIFY_URL', self::$vnpay_notify_url);
        }
    }
}

Config::init();
