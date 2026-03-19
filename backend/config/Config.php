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

    // Cloudinary Settings
    public static $cloudinary_enabled = false;
    public static $cloudinary_cloud_name = 'galaxy-cinema';
    public static $cloudinary_api_key = '977851276553852';
    public static $cloudinary_api_secret = 'CCHVgQ44S9FGHYLXIVUGCO1jVHw';
    public static $cloudinary_folder = 'galaxy-cinema';

    // Booking Settings
    public static $seat_hold_duration = 300; // 5 minutes in seconds
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
    public static $vnpay_tmncode = 'DEMOSHOP01';
    public static $vnpay_hash_secret = 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ';
    public static $vnpay_url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';


    public static function init()
    {
        date_default_timezone_set(self::$timezone);

        self::$cloudinary_enabled = self::envBoolean('CLOUDINARY_ENABLED', false);
        self::$cloudinary_cloud_name = trim((string) getenv('CLOUDINARY_CLOUD_NAME'));
        self::$cloudinary_api_key = trim((string) getenv('CLOUDINARY_API_KEY'));
        self::$cloudinary_api_secret = trim((string) getenv('CLOUDINARY_API_SECRET'));

        $cloudinaryFolder = trim((string) getenv('CLOUDINARY_FOLDER'));
        if ($cloudinaryFolder !== '') {
            self::$cloudinary_folder = trim($cloudinaryFolder, '/');
        }

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
        }
    }

    public static function isCloudinaryRequested()
    {
        return self::$cloudinary_enabled;
    }

    public static function isCloudinaryConfigured()
    {
        return self::$cloudinary_cloud_name !== ''
            && self::$cloudinary_api_key !== ''
            && self::$cloudinary_api_secret !== '';
    }

    public static function useCloudinary()
    {
        return self::isCloudinaryRequested() && self::isCloudinaryConfigured();
    }

    public static function getCloudinaryFolder($subFolder = '')
    {
        $segments = [];

        if (self::$cloudinary_folder !== '') {
            $segments[] = trim(self::$cloudinary_folder, '/');
        }

        if ($subFolder !== '') {
            $segments[] = trim($subFolder, '/');
        }

        return implode('/', $segments);
    }

    private static function envBoolean($key, $default = false)
    {
        $value = getenv($key);

        if ($value === false || $value === null || $value === '') {
            return $default;
        }

        $normalized = strtolower(trim((string) $value));
        return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
    }
}

Config::init();
