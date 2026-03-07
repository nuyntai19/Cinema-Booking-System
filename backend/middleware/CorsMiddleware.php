<?php

class CorsMiddleware
{
    /**
     * Handle CORS preflight and set CORS headers
     */
    public static function handle()
    {
        // Allow the requesting origin during development
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        header("Access-Control-Allow-Origin: $origin");

        // Allow common HTTP methods
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

        // Allow common headers
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

        // Allow credentials
        header("Access-Control-Allow-Credentials: true");

        // Cache preflight request for 1 hour
        header("Access-Control-Max-Age: 3600");

        // Handle preflight OPTIONS request
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
}
