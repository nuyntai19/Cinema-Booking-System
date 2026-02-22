<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * Role Model
 * Quản lý roles/quyền hạn
 * Phụ trách: THỊNH
 */
class Role {
    private $db;
    private $table = 'roles';
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Lấy tất cả roles
     */
    public function getAll() {
        try {
            $query = "SELECT * FROM {$this->table} ORDER BY id";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Role GetAll Error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Lấy role theo ID
     */
    public function getById($id) {
        try {
            $query = "SELECT * FROM {$this->table} WHERE id = :id LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Role GetById Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Lấy role theo tên
     */
    public function getByName($name) {
        try {
            $query = "SELECT * FROM {$this->table} WHERE name = :name LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':name', $name);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Role GetByName Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get permissions của role (có thể mở rộng sau)
     * Hiện tại trả về danh sách permissions cơ bản dựa trên role
     */
    public function getPermissions($roleId) {
        $role = $this->getById($roleId);
        
        if (!$role) {
            return [];
        }
        
        // Define permissions theo role
        $permissions = [
            5 => [ // Admin
                'users.view', 'users.create', 'users.edit', 'users.delete',
                'movies.view', 'movies.create', 'movies.edit', 'movies.delete',
                'cinemas.view', 'cinemas.create', 'cinemas.edit', 'cinemas.delete',
                'bookings.view', 'bookings.edit', 'bookings.delete',
                'reports.view', 'settings.edit'
            ],
            4 => [ // Manager
                'users.view', 'users.edit',
                'movies.view', 'movies.edit',
                'cinemas.view', 'cinemas.edit',
                'bookings.view', 'bookings.edit',
                'reports.view'
            ],
            3 => [ // Staff
                'bookings.view', 'bookings.scan',
                'concessions.sell',
                'movies.view', 'cinemas.view'
            ],
            2 => [ // Member
                'movies.view', 'cinemas.view',
                'bookings.create', 'bookings.view.own',
                'profile.edit.own', 'reviews.create'
            ],
            1 => [ // Guest
                'movies.view', 'cinemas.view'
            ]
        ];
        
        return $permissions[$roleId] ?? [];
    }
    
    /**
     * Check if role has permission
     */
    public function hasPermission($roleId, $permission) {
        $permissions = $this->getPermissions($roleId);
        return in_array($permission, $permissions);
    }
    
    /**
     * Tạo role mới (nếu cần)
     */
    public function create($data) {
        try {
            $query = "INSERT INTO {$this->table} (name) VALUES (:name)";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':name', $data['name']);
            
            if ($stmt->execute()) {
                return $this->db->lastInsertId();
            }
            
            return false;
            
        } catch (PDOException $e) {
            error_log("Role Create Error: " . $e->getMessage());
            return false;
        }
    }
}
