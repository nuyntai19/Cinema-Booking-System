<?php
/**
 * Authentication Middleware
 */
class AuthMiddleware {
    private static function resolveRoleName($roleValue, $roleId) {
        if (is_string($roleValue) && $roleValue !== '') {
            return $roleValue;
        }

        $roleMap = [
            1 => 'Guest',
            2 => 'Member',
            3 => 'Staff',
            4 => 'Manager',
            5 => 'Admin',
        ];

        $roleIdInt = (int)$roleId;
        return $roleMap[$roleIdInt] ?? null;
    }

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

            $userId = is_array($decoded) ? ($decoded['user_id'] ?? null) : ($decoded->user_id ?? null);
            $role = is_array($decoded) ? ($decoded['role'] ?? null) : ($decoded->role ?? null);
            $roleId = is_array($decoded) ? ($decoded['role_id'] ?? null) : ($decoded->role_id ?? null);
            $roleName = self::resolveRoleName($role, $roleId);

            if (!$userId) {
                Response::unauthorized('Invalid token payload');
            }
            
            // Attach user info to request
            $_REQUEST['auth_user_id'] = (int)$userId;
            $_REQUEST['auth_user_role'] = $roleName;
            $_REQUEST['auth_user_role_id'] = $roleId ? (int)$roleId : null;
            
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
