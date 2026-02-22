<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * Review Model
 * Phụ trách: TUẤN TÀI
 */
class Review {
    private $db;
    private $table = 'reviews';
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Tạo review mới
     */
    public function create($data) {
        try {
            // Kiểm tra user đã xem phim chưa (có booking đã paid)
            if (!$this->checkUserWatchedMovie($data['user_id'], $data['movie_id'])) {
                return ['success' => false, 'message' => 'Bạn chưa xem phim này nên không thể đánh giá'];
            }
            
            // Kiểm tra user đã review phim này chưa
            if ($this->userHasReviewed($data['user_id'], $data['movie_id'])) {
                return ['success' => false, 'message' => 'Bạn đã đánh giá phim này rồi'];
            }
            
            $query = "INSERT INTO {$this->table} 
                      (user_id, movie_id, rating, comment, status) 
                      VALUES 
                      (:user_id, :movie_id, :rating, :comment, 'Pending')";
            
            $stmt = $this->db->prepare($query);
            
            $stmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
            $stmt->bindParam(':movie_id', $data['movie_id'], PDO::PARAM_INT);
            $stmt->bindParam(':rating', $data['rating'], PDO::PARAM_INT);
            $stmt->bindParam(':comment', $data['comment']);
            
            if ($stmt->execute()) {
                return ['success' => true, 'review_id' => $this->db->lastInsertId()];
            }
            
            return ['success' => false, 'message' => 'Không thể tạo review'];
            
        } catch (PDOException $e) {
            error_log("Review Create Error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Lỗi hệ thống'];
        }
    }
    
    /**
     * Lấy reviews theo phim
     */
    public function getByMovie($movieId, $page = 1, $limit = 10) {
        try {
            $offset = ($page - 1) * $limit;
            
            $query = "SELECT r.*, 
                      u.email,
                      up.full_name,
                      up.avatar
                      FROM {$this->table} r
                      INNER JOIN users u ON r.user_id = u.id
                      LEFT JOIN user_profiles up ON u.id = up.user_id
                      WHERE r.movie_id = :movie_id AND r.status = 'Approved'
                      ORDER BY r.created_at DESC
                      LIMIT :limit OFFSET :offset";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':movie_id', $movieId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Review GetByMovie Error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Đếm tổng reviews của phim
     */
    public function countByMovie($movieId) {
        try {
            $query = "SELECT COUNT(*) as total 
                      FROM {$this->table} 
                      WHERE movie_id = :movie_id AND status = 'Approved'";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':movie_id', $movieId, PDO::PARAM_INT);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['total'] ?? 0;
            
        } catch (PDOException $e) {
            error_log("Review CountByMovie Error: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Lấy reviews theo user
     */
    public function getByUser($userId, $page = 1, $limit = 10) {
        try {
            $offset = ($page - 1) * $limit;
            
            $query = "SELECT r.*, 
                      m.title as movie_title,
                      m.poster_url as movie_poster
                      FROM {$this->table} r
                      INNER JOIN movies m ON r.movie_id = m.id
                      WHERE r.user_id = :user_id
                      ORDER BY r.created_at DESC
                      LIMIT :limit OFFSET :offset";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Review GetByUser Error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Cập nhật review
     */
    public function update($id, $data) {
        try {
            $query = "UPDATE {$this->table} SET 
                      rating = :rating,
                      comment = :comment,
                      status = 'Pending',
                      updated_at = CURRENT_TIMESTAMP
                      WHERE id = :id";
            
            $stmt = $this->db->prepare($query);
            
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->bindParam(':rating', $data['rating'], PDO::PARAM_INT);
            $stmt->bindParam(':comment', $data['comment']);
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log("Review Update Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Xóa review
     */
    public function delete($id) {
        try {
            $query = "DELETE FROM {$this->table} WHERE id = :id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log("Review Delete Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Lấy review theo ID
     */
    public function getById($id) {
        try {
            $query = "SELECT r.*, 
                      u.email,
                      up.full_name,
                      m.title as movie_title
                      FROM {$this->table} r
                      INNER JOIN users u ON r.user_id = u.id
                      LEFT JOIN user_profiles up ON u.id = up.user_id
                      INNER JOIN movies m ON r.movie_id = m.id
                      WHERE r.id = :id
                      LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Review GetById Error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Kiểm tra user đã xem phim chưa (có booking đã paid)
     */
    public function checkUserWatchedMovie($userId, $movieId) {
        try {
            $query = "SELECT COUNT(*) as count
                      FROM bookings b
                      INNER JOIN showtimes s ON b.showtime_id = s.id
                      WHERE b.user_id = :user_id 
                      AND s.movie_id = :movie_id 
                      AND b.status = 'Paid'";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':movie_id', $movieId, PDO::PARAM_INT);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result['count'] > 0;
            
        } catch (PDOException $e) {
            error_log("Review CheckUserWatchedMovie Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Kiểm tra user đã review phim chưa
     */
    private function userHasReviewed($userId, $movieId) {
        try {
            $query = "SELECT COUNT(*) as count 
                      FROM {$this->table} 
                      WHERE user_id = :user_id AND movie_id = :movie_id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':movie_id', $movieId, PDO::PARAM_INT);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result['count'] > 0;
            
        } catch (PDOException $e) {
            error_log("Review UserHasReviewed Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Duyệt review (Manager/Admin)
     */
    public function approve($id) {
        try {
            $query = "UPDATE {$this->table} SET 
                      status = 'Approved',
                      updated_at = CURRENT_TIMESTAMP
                      WHERE id = :id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log("Review Approve Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Từ chối review
     */
    public function reject($id) {
        try {
            $query = "UPDATE {$this->table} SET 
                      status = 'Rejected',
                      updated_at = CURRENT_TIMESTAMP
                      WHERE id = :id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log("Review Reject Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Report review (spam/inappropriate)
     */
    public function report($id, $reason = null) {
        try {
            $query = "UPDATE {$this->table} SET 
                      status = 'Reported',
                      updated_at = CURRENT_TIMESTAMP
                      WHERE id = :id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            
            // TODO: Có thể lưu reason vào bảng riêng hoặc field khác
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log("Review Report Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Lấy tất cả reviews (Admin/Manager) với filter
     */
    public function getAll($filters = [], $page = 1, $limit = 20) {
        try {
            $offset = ($page - 1) * $limit;
            
            $query = "SELECT r.*, 
                      u.email,
                      up.full_name,
                      m.title as movie_title
                      FROM {$this->table} r
                      INNER JOIN users u ON r.user_id = u.id
                      LEFT JOIN user_profiles up ON u.id = up.user_id
                      INNER JOIN movies m ON r.movie_id = m.id
                      WHERE 1=1";
            
            $params = [];
            
            // Filter by status
            if (!empty($filters['status'])) {
                $query .= " AND r.status = :status";
                $params[':status'] = $filters['status'];
            }
            
            // Filter by movie
            if (!empty($filters['movie_id'])) {
                $query .= " AND r.movie_id = :movie_id";
                $params[':movie_id'] = $filters['movie_id'];
            }
            
            // Filter by user
            if (!empty($filters['user_id'])) {
                $query .= " AND r.user_id = :user_id";
                $params[':user_id'] = $filters['user_id'];
            }
            
            // Filter by rating
            if (!empty($filters['rating'])) {
                $query .= " AND r.rating = :rating";
                $params[':rating'] = $filters['rating'];
            }
            
            $query .= " ORDER BY r.created_at DESC
                       LIMIT :limit OFFSET :offset";
            
            $stmt = $this->db->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Review GetAll Error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Đếm tổng reviews theo filter
     */
    public function count($filters = []) {
        try {
            $query = "SELECT COUNT(*) as total 
                      FROM {$this->table} r
                      WHERE 1=1";
            
            $params = [];
            
            if (!empty($filters['status'])) {
                $query .= " AND r.status = :status";
                $params[':status'] = $filters['status'];
            }
            
            if (!empty($filters['movie_id'])) {
                $query .= " AND r.movie_id = :movie_id";
                $params[':movie_id'] = $filters['movie_id'];
            }
            
            if (!empty($filters['user_id'])) {
                $query .= " AND r.user_id = :user_id";
                $params[':user_id'] = $filters['user_id'];
            }
            
            if (!empty($filters['rating'])) {
                $query .= " AND r.rating = :rating";
                $params[':rating'] = $filters['rating'];
            }
            
            $stmt = $this->db->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['total'] ?? 0;
            
        } catch (PDOException $e) {
            error_log("Review Count Error: " . $e->getMessage());
            return 0;
        }
    }
}
