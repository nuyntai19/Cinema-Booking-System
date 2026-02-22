<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * Genre Model
 * Phụ trách: TUẤN TÀI
 */
class Genre {
    private $db;
    private $table = 'genres';
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Lấy tất cả thể loại
     */
    public function getAll() {
        try {
            $query = "SELECT g.*,
                      COUNT(DISTINCT mg.movie_id) as movie_count
                      FROM {$this->table} g
                      LEFT JOIN movie_genres mg ON g.id = mg.genre_id
                      GROUP BY g.id
                      ORDER BY g.name ASC";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Genre GetAll Error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Lấy thể loại theo ID
     */
    public function getById($id) {
        try {
            $query = "SELECT g.*,
                      COUNT(DISTINCT mg.movie_id) as movie_count
                      FROM {$this->table} g
                      LEFT JOIN movie_genres mg ON g.id = mg.genre_id
                      WHERE g.id = :id
                      GROUP BY g.id
                      LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Genre GetById Error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Tạo thể loại mới
     */
    public function create($data) {
        try {
            $query = "INSERT INTO {$this->table} (name, description) 
                      VALUES (:name, :description)";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':name', $data['name']);
            
            $description = $data['description'] ?? null;
            $stmt->bindParam(':description', $description);
            
            if ($stmt->execute()) {
                return $this->db->lastInsertId();
            }
            
            return false;
            
        } catch (PDOException $e) {
            error_log("Genre Create Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Cập nhật thể loại
     */
    public function update($id, $data) {
        try {
            $query = "UPDATE {$this->table} SET 
                      name = :name,
                      description = :description,
                      updated_at = CURRENT_TIMESTAMP
                      WHERE id = :id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->bindParam(':name', $data['name']);
            
            $description = $data['description'] ?? null;
            $stmt->bindParam(':description', $description);
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log("Genre Update Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Xóa thể loại
     */
    public function delete($id) {
        try {
            // Check if genre is in use
            $checkQuery = "SELECT COUNT(*) as count FROM movie_genres WHERE genre_id = :id";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $checkStmt->execute();
            $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result['count'] > 0) {
                return false; // Cannot delete genre that is in use
            }
            
            $query = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log("Genre Delete Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Lấy phim theo thể loại
     */
    public function getMovies($genreId, $page = 1, $limit = 20) {
        try {
            $offset = ($page - 1) * $limit;
            
            $query = "SELECT m.*, 
                      AVG(r.rating) as avg_rating,
                      COUNT(DISTINCT r.id) as review_count
                      FROM movies m
                      INNER JOIN movie_genres mg ON m.id = mg.movie_id
                      LEFT JOIN reviews r ON m.id = r.movie_id
                      WHERE mg.genre_id = :genre_id
                      GROUP BY m.id
                      ORDER BY m.release_date DESC
                      LIMIT :limit OFFSET :offset";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':genre_id', $genreId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("Genre GetMovies Error: " . $e->getMessage());
            return [];
        }
    }
}
