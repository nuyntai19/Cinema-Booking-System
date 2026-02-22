<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * UserProfile Model
 * Phụ trách: THỊNH
 */
class UserProfile {
    private $db;
    private $table = 'user_profiles';
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Tạo profile mới
     */
    public function create($data) {
        try {
            $query = "INSERT INTO {$this->table} (user_id, full_name, phone, dob, membership_id) 
                      VALUES (:user_id, :full_name, :phone, :dob, :membership_id)";
            
            $stmt = $this->db->prepare($query);
            
            $stmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
            $stmt->bindParam(':full_name', $data['full_name']);
            $stmt->bindParam(':phone', $data['phone']);
            $stmt->bindParam(':dob', $data['dob']);
            $stmt->bindParam(':membership_id', $data['membership_id'], PDO::PARAM_INT);
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log("UserProfile Create Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Lấy profile theo user_id
     */
    public function getByUserId($userId) {
        try {
            $query = "SELECT up.*, m.rank_name, m.discount_rate 
                      FROM {$this->table} up
                      LEFT JOIN memberships m ON up.membership_id = m.id
                      WHERE up.user_id = :user_id LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("UserProfile GetByUserId Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update profile
     */
    public function update($userId, $data) {
        try {
            $fields = [];
            $params = ['user_id' => $userId];
            
            $allowedFields = ['full_name', 'phone', 'dob', 'avatar', 'membership_id'];
            
            foreach ($data as $key => $value) {
                if (in_array($key, $allowedFields)) {
                    $fields[] = "$key = :$key";
                    $params[$key] = $value;
                }
            }
            
            if (empty($fields)) {
                return false;
            }
            
            $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE user_id = :user_id";
            $stmt = $this->db->prepare($query);
            
            return $stmt->execute($params);
            
        } catch (PDOException $e) {
            error_log("UserProfile Update Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Tính tuổi từ ngày sinh
     */
    public function calculateAge($dob) {
        $birthDate = new DateTime($dob);
        $today = new DateTime();
        $age = $today->diff($birthDate);
        
        return $age->y;
    }
    
    /**
     * Get full profile với đầy đủ thông tin
     */
    public function getFullProfile($userId) {
        try {
            $query = "SELECT 
                        u.id,
                        u.email,
                        u.role_id,
                        u.status,
                        u.current_points,
                        u.created_at,
                        up.full_name,
                        up.phone,
                        up.dob,
                        up.avatar,
                        up.address,
                        up.gender,
                        up.membership_id,
                        m.rank_name,
                        m.min_points_required,
                        m.discount_rate,
                        r.name as role_name
                      FROM users u
                      LEFT JOIN {$this->table} up ON u.id = up.user_id
                      LEFT JOIN memberships m ON up.membership_id = m.id
                      LEFT JOIN roles r ON u.role_id = r.id
                      WHERE u.id = :user_id LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Calculate age if DOB exists
            if ($result && $result['dob']) {
                $result['age'] = $this->calculateAge($result['dob']);
            }
            
            return $result;
            
        } catch (PDOException $e) {
            error_log("UserProfile GetFullProfile Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Upload avatar
     */
    public function uploadAvatar($userId, $filePath) {
        try {
            $query = "UPDATE {$this->table} SET avatar = :avatar WHERE user_id = :user_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':avatar', $filePath);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log("UserProfile UploadAvatar Error: " . $e->getMessage());
            return false;
        }
    }
}
