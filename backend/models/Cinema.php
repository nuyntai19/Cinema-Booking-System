<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * Cinema Model
 * Quản lý cụm rạp
 * Phụ trách: SƠN
 */
class Cinema
{
    private $db;
    private $table = 'cinemas';

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Lấy danh sách cinemas với filter
     * Kèm thông tin halls (số phòng, tổng ghế) và manager
     * @param array $filters - search (name/address)
     * @return array
     */
    public function getAll($filters = [])
    {
        try {
            $sql = "SELECT c.*, 
                           up.full_name as manager_name,
                           (SELECT COUNT(*) FROM cinema_halls ch WHERE ch.cinema_id = c.id) as total_halls,
                           (SELECT COALESCE(SUM(ch2.total_seats), 0) FROM cinema_halls ch2 WHERE ch2.cinema_id = c.id) as total_seats
                    FROM {$this->table} c
                    LEFT JOIN users u ON c.manager_id = u.id
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    WHERE 1=1";

            $params = [];

            if (!empty($filters['search'])) {
                $sql .= " AND (c.name LIKE :search OR c.address LIKE :search)";
                $params[':search'] = '%' . $filters['search'] . '%';
            }

            $sql .= " ORDER BY c.name ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            $cinemas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Lấy danh sách halls cho mỗi cinema
            foreach ($cinemas as &$cinema) {
                $hallSql = "SELECT id, name, total_seats FROM cinema_halls WHERE cinema_id = :cinema_id ORDER BY name ASC";
                $hallStmt = $this->db->prepare($hallSql);
                $hallStmt->bindParam(':cinema_id', $cinema['id'], PDO::PARAM_INT);
                $hallStmt->execute();
                $cinema['halls'] = $hallStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            return $cinemas;
        } catch (PDOException $e) {
            error_log("Cinema getAll Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Lấy chi tiết cinema theo ID
     * @param int $id
     * @return array|null
     */
    public function getById($id)
    {
        try {
            $sql = "SELECT c.*, 
                           up.full_name as manager_name,
                           u.email as manager_email
                    FROM {$this->table} c
                    LEFT JOIN users u ON c.manager_id = u.id
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    WHERE c.id = :id";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            error_log("Cinema getById Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Tạo cinema mới
     * @param array $data - name, address, hotline, status, manager_id (optional)
     * @return int|false - ID của cinema mới hoặc false
     */
    public function create($data)
    {
        try {
            $sql = "INSERT INTO {$this->table} (name, address, street, district, city, lat, lng, hotline, status, manager_id) 
                    VALUES (:name, :address, :street, :district, :city, :lat, :lng, :hotline, :status, :manager_id)";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':address', $data['address']);
            $stmt->bindParam(':street', $data['street']);
            $stmt->bindParam(':district', $data['district']);
            $stmt->bindParam(':city', $data['city']);

            $lat = $data['lat'] ?? null;
            $lng = $data['lng'] ?? null;
            $stmt->bindParam(':lat', $lat, $lat !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
            $stmt->bindParam(':lng', $lng, $lng !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);

            $hotline = $data['hotline'] ?? null;
            $stmt->bindParam(':hotline', $hotline, $hotline ? PDO::PARAM_STR : PDO::PARAM_NULL);
            $status = $data['status'] ?? 'active';
            $stmt->bindParam(':status', $status);
            $managerId = $data['manager_id'] ?? null;
            $stmt->bindParam(':manager_id', $managerId, $managerId ? PDO::PARAM_INT : PDO::PARAM_NULL);
            $stmt->execute();

            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log("Cinema create Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Cập nhật cinema
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, $data)
    {
        try {
            // Whitelist các trường được phép cập nhật
            $allowedFields = ['name', 'address', 'street', 'district', 'city', 'lat', 'lng', 'hotline', 'manager_id', 'status'];
            $fields = [];
            $params = [':id' => $id];

            foreach ($allowedFields as $field) {
                if (in_array($field, ['manager_id', 'lat', 'lng', 'street', 'district', 'city', 'hotline'])) {
                    // Các trường cho phép null
                    if (array_key_exists($field, $data)) {
                        $fields[] = "$field = :$field";
                        $params[":$field"] = $data[$field];
                    }
                } else if (isset($data[$field])) {
                    $fields[] = "$field = :$field";
                    $params[":$field"] = $data[$field];
                }
            }

            if (empty($fields)) {
                return false;
            }

            $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $this->db->prepare($sql);

            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("Cinema update Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Xóa cinema
     * @param int $id
     * @return bool
     */
    public function delete($id)
    {
        try {
            $sql = "DELETE FROM {$this->table} WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Cinema delete Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Lấy danh sách halls của cinema
     * @param int $cinemaId
     * @return array
     */
    public function getHalls($cinemaId)
    {
        try {
            $sql = "SELECT ch.*, 
                           (SELECT COUNT(*) FROM seats s WHERE s.cinema_hall_id = ch.id AND s.status = 'Active') as active_seats
                    FROM cinema_halls ch
                    WHERE ch.cinema_id = :cinema_id
                    ORDER BY ch.name ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':cinema_id', $cinemaId, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Cinema getHalls Error: " . $e->getMessage());
            return [];
        }
    }
}
