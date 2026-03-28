<?php
require_once __DIR__ . '/../config/Database.php';

class Poster
{
    private $db;
    private $table = 'home_posters';

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Lấy danh sách tất cả poster (dành cho Admin)
     */
    public function getAll()
    {
        try {
            $query = "SELECT * FROM {$this->table} ORDER BY display_order ASC";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Poster GetAll Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Lấy danh sách poster đang hoạt động (dành cho Client - Trang chủ)
     */
    public function getActive()
    {
        try {
            $query = "SELECT * FROM {$this->table} WHERE is_active = 1 ORDER BY display_order ASC";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Poster GetActive Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Lấy thông tin 1 poster
     */
    public function getById($id)
    {
        try {
            $query = "SELECT * FROM {$this->table} WHERE id = :id LIMIT 1";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return null;
        }
    }

    /**
     * Thêm poster mới
     */
    public function create($data)
    {
        try {
            $query = "INSERT INTO {$this->table} (title, image_url, target_url, display_order, is_active) 
                      VALUES (:title, :image_url, :target_url, :display_order, :is_active)";
            
            $stmt = $this->db->prepare($query);
            
            $title = $data['title'] ?? null;
            $targetUrl = $data['target_url'] ?? null;
            $displayOrder = $data['display_order'] ?? 0;
            $isActive = isset($data['is_active']) ? (int)$data['is_active'] : 1;

            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':image_url', $data['image_url']);
            $stmt->bindParam(':target_url', $targetUrl);
            $stmt->bindParam(':display_order', $displayOrder, PDO::PARAM_INT);
            $stmt->bindParam(':is_active', $isActive, PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                return $this->db->lastInsertId();
            }
            return false;
        } catch (PDOException $e) {
            error_log("Poster Create Error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Cập nhật poster
     */
    public function update($id, $data)
    {
        try {
            $query = "UPDATE {$this->table} SET 
                      title = :title, 
                      image_url = :image_url, 
                      target_url = :target_url, 
                      display_order = :display_order, 
                      is_active = :is_active,
                      updated_at = CURRENT_TIMESTAMP
                      WHERE id = :id";
            
            $stmt = $this->db->prepare($query);
            
            $title = $data['title'] ?? null;
            $targetUrl = $data['target_url'] ?? null;
            $displayOrder = $data['display_order'] ?? 0;
            $isActive = isset($data['is_active']) ? (int)$data['is_active'] : 1;

            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':image_url', $data['image_url']);
            $stmt->bindParam(':target_url', $targetUrl);
            $stmt->bindParam(':display_order', $displayOrder, PDO::PARAM_INT);
            $stmt->bindParam(':is_active', $isActive, PDO::PARAM_INT);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Poster Update Error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Xóa poster
     */
    public function delete($id)
    {
        try {
            $query = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Poster Delete Error: " . $e->getMessage());
            return false;
        }
    }
}
?>
