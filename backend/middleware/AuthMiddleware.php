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
        
        error_log('AuthMiddleware::authenticate - checking headers');
        error_log('AuthMiddleware::authenticate - headers keys: ' . json_encode(array_keys($headers)));
        
        // Get token from Authorization header
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            error_log('AuthMiddleware::authenticate - Authorization header found: ' . substr($authHeader, 0, 20) . '...');
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                $token = $matches[1];
                error_log('AuthMiddleware::authenticate - token extracted');
            }
        }
        
        if (!$token) {
            error_log('AuthMiddleware::authenticate - TOKEN NOT FOUND');
            Response::unauthorized('Token not provided');
        }
        
        error_log('AuthMiddleware::authenticate - decoding token');
        try {
            $decoded = JWT::decode($token, Config::$jwt_secret);

            $userId = is_array($decoded) ? ($decoded['user_id'] ?? null) : ($decoded->user_id ?? null);
            $role = is_array($decoded) ? ($decoded['role'] ?? null) : ($decoded->role ?? null);
            $roleId = is_array($decoded) ? ($decoded['role_id'] ?? null) : ($decoded->role_id ?? null);
            error_log('AuthMiddleware::authenticate - decoded userId: ' . $userId . ', role: ' . $role . ', roleId: ' . $roleId);
            
            $roleName = self::resolveRoleName($role, $roleId);
            error_log('AuthMiddleware::authenticate - resolved roleName: ' . $roleName);

            if (!$userId) {
                error_log('AuthMiddleware::authenticate - INVALID: userId not in token');
                Response::unauthorized('Invalid token payload');
            }
            
            // Attach user info to request
            $_REQUEST['auth_user_id'] = (int)$userId;
            $_REQUEST['auth_user_role'] = $roleName;
            $_REQUEST['auth_user_role_id'] = $roleId ? (int)$roleId : null;
            
            error_log('AuthMiddleware::authenticate - SUCCESS: set auth_user_role to ' . $roleName);
            return $decoded;
        } catch (Exception $e) {
            error_log('AuthMiddleware::authenticate - JWT DECODE ERROR: ' . $e->getMessage());
            Response::unauthorized('Invalid or expired token');
        }
    }
    
    public static function requireRole($roles) {
        error_log('AuthMiddleware::requireRole - required roles: ' . json_encode($roles));
        
        self::authenticate();
        
        $userRole = $_REQUEST['auth_user_role'] ?? null;
        error_log('AuthMiddleware::requireRole - userRole: ' . $userRole);
        
        if (!in_array($userRole, $roles)) {
            error_log('AuthMiddleware::requireRole - DENIED! userRole ' . $userRole . ' not in ' . json_encode($roles));
            Response::forbidden('Insufficient permissions');
        }
        
        error_log('AuthMiddleware::requireRole - PASSED');
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

    /**
     * Kiểm tra permission động dựa trên bảng role_permissions
     * Nếu user chưa đăng nhập → mặc định là Guest (role_id=1)
     * Nếu đã đăng nhập → lấy role_id từ JWT
     */
    public static function requirePermission($permissionName) {
        $roleId = 1; // Default: Guest

        // Thử lấy token, nếu có thì lấy role_id
        $headers = getallheaders();
        $token = null;
        if (isset($headers['Authorization'])) {
            if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
                $token = $matches[1];
            }
        }

        if ($token) {
            try {
                $decoded = JWT::decode($token, Config::$jwt_secret);
                $roleId = is_array($decoded)
                    ? (int)($decoded['role_id'] ?? 1)
                    : (int)($decoded->role_id ?? 1);
                // Cũng set auth info cho các middleware phía sau
                $userId = is_array($decoded) ? ($decoded['user_id'] ?? null) : ($decoded->user_id ?? null);
                $role = is_array($decoded) ? ($decoded['role'] ?? null) : ($decoded->role ?? null);
                $_REQUEST['auth_user_id'] = $userId ? (int)$userId : null;
                $_REQUEST['auth_user_role_id'] = $roleId;
                $_REQUEST['auth_user_role'] = self::resolveRoleName($role, $roleId);
            } catch (Exception $e) {
                // Token không hợp lệ → coi là Guest
                $roleId = 1;
            }
        }

        // Query bảng role_permissions để kiểm tra
        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare(
                "SELECT COUNT(*) FROM role_permissions rp
                 INNER JOIN permissions p ON rp.permission_id = p.id
                 WHERE rp.role_id = :role_id AND p.name = :perm_name"
            );
            $stmt->bindParam(':role_id', $roleId, PDO::PARAM_INT);
            $stmt->bindParam(':perm_name', $permissionName, PDO::PARAM_STR);
            $stmt->execute();

            if ((int)$stmt->fetchColumn() === 0) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => "Bạn không có quyền thực hiện hành động này ($permissionName)"
                ]);
                exit;
            }
        } catch (PDOException $e) {
            error_log("requirePermission Error: " . $e->getMessage());
            // Nếu lỗi DB thì cho qua để không block hoàn toàn
        }
    }
}
