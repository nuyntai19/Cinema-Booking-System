<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * Permission Model
 * Quản lý permissions trong hệ thống
 */
class Permission
{
    private $db;
    private $table = 'permissions';

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Lấy tất cả permissions
     */
    public function getAll($filters = [])
    {
        try {
            $query = "SELECT * FROM {$this->table} WHERE 1=1";
            $params = [];

            // Filter by module
            if (!empty($filters['module'])) {
                $query .= " AND module = :module";
                $params[':module'] = $filters['module'];
            }

            // Search by name or display_name
            if (!empty($filters['search'])) {
                $query .= " AND (name LIKE :search OR display_name LIKE :search)";
                $params[':search'] = '%' . $filters['search'] . '%';
            }

            $query .= " ORDER BY module, name";

            $stmt = $this->db->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Permission GetAll Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Lấy permission theo ID
     */
    public function getById($id)
    {
        try {
            $query = "SELECT * FROM {$this->table} WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Permission GetById Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Lấy permission theo name
     */
    public function getByName($name)
    {
        try {
            $query = "SELECT * FROM {$this->table} WHERE name = :name";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':name', $name);
            $stmt->execute();

            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Permission GetByName Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Tạo permission mới
     */
    public function create($data)
    {
        try {
            $query = "INSERT INTO {$this->table} (name, display_name, description, module) 
                     VALUES (:name, :display_name, :description, :module)";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':display_name', $data['display_name']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':module', $data['module']);

            $stmt->execute();
            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log("Permission Create Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Cập nhật permission
     */
    public function update($id, $data)
    {
        try {
            $query = "UPDATE {$this->table} 
                     SET display_name = :display_name,
                         description = :description,
                         module = :module
                     WHERE id = :id";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':display_name', $data['display_name']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':module', $data['module']);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Permission Update Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Xóa permission
     */
    public function delete($id)
    {
        try {
            $query = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Permission Delete Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Lấy tất cả modules (nhóm permissions)
     */
    public function getAllModules()
    {
        try {
            $query = "SELECT DISTINCT module FROM {$this->table} ORDER BY module";
            $stmt = $this->db->query($query);

            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            error_log("Permission GetAllModules Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Lấy permissions theo module
     */
    public function getByModule($module)
    {
        try {
            $query = "SELECT * FROM {$this->table} WHERE module = :module ORDER BY name";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':module', $module);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Permission GetByModule Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Kiểm tra permission name đã tồn tại chưa
     */
    public function exists($name, $excludeId = null)
    {
        try {
            $query = "SELECT COUNT(*) FROM {$this->table} WHERE name = :name";
            
            if ($excludeId) {
                $query .= " AND id != :id";
            }

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':name', $name);
            
            if ($excludeId) {
                $stmt->bindParam(':id', $excludeId, PDO::PARAM_INT);
            }

            $stmt->execute();
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log("Permission Exists Error: " . $e->getMessage());
            return false;
        }
    }
}
