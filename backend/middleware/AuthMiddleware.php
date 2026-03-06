<?php
/**
 * Authentication Middleware
 */
class AuthMiddleware {
    public static function authenticate() {
        $headers = getallheaders();
        $token = null;
        
        // Get token from Authorization header
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }
        
        if (!$token) {
            Response::unauthorized('Token not provided');
        }
        
        try {
            $decoded = JWT::decode($token, Config::$jwt_secret);
            
            // Attach user info to request
            $_REQUEST['auth_user_id'] = $decoded['user_id'];
            $_REQUEST['auth_user_role'] = $decoded['role'];
            
            return $decoded;
        } catch (Exception $e) {
            Response::unauthorized('Invalid or expired token');
        }
    }
    
    public static function requireRole($roles) {
        self::authenticate();
        
        $userRole = $_REQUEST['auth_user_role'] ?? null;
        
        if (!in_array($userRole, $roles)) {
            Response::forbidden('Insufficient permissions');
        }
    }
    
    public static function requireAdmin() {
        self::requireRole(['Admin']);
    }
    
    public static function requireManager() {
        self::requireRole(['Admin', 'Manager']);
    }
    
    public static function requireStaff() {
        self::requireRole(['Admin', 'Manager', 'Staff']);
    }
}
