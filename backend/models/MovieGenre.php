<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * MovieGenre Model (Junction Table)
 * Phụ trách: TUẤN TÀI
 */
class MovieGenre {
    private $db;
    private $table = 'movie_genres';
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Thêm genre cho phim
     */
    public function addGenreToMovie($movieId, $genreId) {
        try {
            $query = "INSERT INTO {$this->table} (movie_id, genre_id) 
                      VALUES (:movie_id, :genre_id)
                      ON DUPLICATE KEY UPDATE movie_id = movie_id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':movie_id', $movieId, PDO::PARAM_INT);
            $stmt->bindParam(':genre_id', $genreId, PDO::PARAM_INT);
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log("MovieGenre AddGenreToMovie Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Xóa genre khỏi phim
     */
    public function removeGenreFromMovie($movieId, $genreId) {
        try {
            $query = "DELETE FROM {$this->table} 
                      WHERE movie_id = :movie_id AND genre_id = :genre_id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':movie_id', $movieId, PDO::PARAM_INT);
            $stmt->bindParam(':genre_id', $genreId, PDO::PARAM_INT);
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log("MovieGenre RemoveGenreFromMovie Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Lấy tất cả genres của 1 phim
     */
    public function getMovieGenres($movieId) {
        try {
            $query = "SELECT g.* 
                      FROM genres g
                      INNER JOIN {$this->table} mg ON g.id = mg.genre_id
                      WHERE mg.movie_id = :movie_id
                      ORDER BY g.name ASC";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':movie_id', $movieId, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("MovieGenre GetMovieGenres Error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Xóa tất cả genres của 1 phim
     */
    public function removeAllGenresFromMovie($movieId) {
        try {
            $query = "DELETE FROM {$this->table} WHERE movie_id = :movie_id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':movie_id', $movieId, PDO::PARAM_INT);
            
            return $stmt->execute();
            
        } catch (PDOException $e) {
            error_log("MovieGenre RemoveAllGenresFromMovie Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Thêm nhiều genres cho phim
     */
    public function addGenresToMovie($movieId, $genreIds) {
        try {
            $this->db->beginTransaction();
            
            foreach ($genreIds as $genreId) {
                $this->addGenreToMovie($movieId, $genreId);
            }
            
            $this->db->commit();
            return true;
            
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("MovieGenre AddGenresToMovie Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Cập nhật genres của phim (xóa cũ, thêm mới)
     */
    public function updateMovieGenres($movieId, $genreIds) {
        try {
            $this->db->beginTransaction();
            
            // Xóa tất cả genres cũ
            $this->removeAllGenresFromMovie($movieId);
            
            // Thêm genres mới
            if (!empty($genreIds)) {
                $this->addGenresToMovie($movieId, $genreIds);
            }
            
            $this->db->commit();
            return true;
            
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("MovieGenre UpdateMovieGenres Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Kiểm tra phim có genre không
     */
    public function movieHasGenre($movieId, $genreId) {
        try {
            $query = "SELECT COUNT(*) as count 
                      FROM {$this->table} 
                      WHERE movie_id = :movie_id AND genre_id = :genre_id";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':movie_id', $movieId, PDO::PARAM_INT);
            $stmt->bindParam(':genre_id', $genreId, PDO::PARAM_INT);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result['count'] > 0;
            
        } catch (PDOException $e) {
            error_log("MovieGenre MovieHasGenre Error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Lấy tất cả phim có genre
     */
    public function getMoviesByGenre($genreId, $page = 1, $limit = 20) {
        try {
            $offset = ($page - 1) * $limit;
            
            $query = "SELECT m.* 
                      FROM movies m
                      INNER JOIN {$this->table} mg ON m.id = mg.movie_id
                      WHERE mg.genre_id = :genre_id
                      ORDER BY m.release_date DESC
                      LIMIT :limit OFFSET :offset";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':genre_id', $genreId, PDO::PARAM_INT);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (PDOException $e) {
            error_log("MovieGenre GetMoviesByGenre Error: " . $e->getMessage());
            return [];
        }
    }
}
