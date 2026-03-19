<?php

/**
 * Concession Model - Quản lý bắp nước
 */
require_once __DIR__ . '/../config/Database.php';

class Concession
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Lấy tất cả concessions
     * @return array
     */
    public function getAll()
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM concessions
            ORDER BY category, name
        ");

        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Lấy chi tiết một concession
     * @param int $id
     * @return array|null
     */
    public function getById($id)
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM concessions
            WHERE id = ?
        ");

        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Tạo concession mới
     * @param array $data - ['name', 'price', 'category', 'image_url', 'is_available']
     * @return int|false - ID của concession mới tạo
     */
    public function create($data)
    {
        $stmt = $this->db->prepare("
            INSERT INTO concessions (name, price, category, image_url, is_available)
            VALUES (?, ?, ?, ?, ?)
        ");

        $result = $stmt->execute([
            $data['name'],
            $data['price'],
            $data['category'] ?? null,
            $data['image_url'] ?? null,
            $data['is_available'] ?? true
        ]);

        return $result ? $this->db->lastInsertId() : false;
    }

    /**
     * Cập nhật concession
     * @param int $id
     * @param array $data - Các field cần update
     * @return bool
     */
    public function update($id, $data)
    {
        $fields = [];
        $values = [];

        // Dynamically build UPDATE query
        if (isset($data['name'])) {
            $fields[] = 'name = ?';
            $values[] = $data['name'];
        }

        if (isset($data['price'])) {
            $fields[] = 'price = ?';
            $values[] = $data['price'];
        }

        if (isset($data['category'])) {
            $fields[] = 'category = ?';
            $values[] = $data['category'];
        }

        if (isset($data['image_url'])) {
            $fields[] = 'image_url = ?';
            $values[] = $data['image_url'];
        }

        if (isset($data['is_available'])) {
            $fields[] = 'is_available = ?';
            $values[] = $data['is_available'];
        }

        if (empty($fields)) {
            return false; // Nothing to update
        }

        $values[] = $id; // Add ID for WHERE clause

        $sql = "UPDATE concessions SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);

        return $stmt->execute($values);
    }

    /**
     * Xóa concession
     * @param int $id
     * @return bool
     */
    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM concessions WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Lấy danh sách concessions đang còn bán
     * @return array
     */
    public function getAvailable()
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM concessions
            WHERE is_available = TRUE
            ORDER BY category, name
        ");

        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Lấy concessions theo category
     * @param string $category
     * @return array
     */
    public function getByCategory($category)
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM concessions
            WHERE category = ?
            AND is_available = TRUE
            ORDER BY name
        ");

        $stmt->execute([$category]);
        return $stmt->fetchAll();
    }

    /**
     * Tìm kiếm concessions theo tên
     * @param string $keyword
     * @return array
     */
    public function search($keyword)
    {
        $stmt = $this->db->prepare("
            SELECT *
            FROM concessions
            WHERE name LIKE ?
            ORDER BY category, name
        ");

        $stmt->execute(['%' . $keyword . '%']);
        return $stmt->fetchAll();
    }

    /**
     * Cập nhật trạng thái available
     * @param int $id
     * @param bool $isAvailable
     * @return bool
     */
    public function updateAvailability($id, $isAvailable)
    {
        $stmt = $this->db->prepare("
            UPDATE concessions
            SET is_available = ?
            WHERE id = ?
        ");

        return $stmt->execute([$isAvailable, $id]);
    }

    /**
     * Cập nhật ảnh concession
     * @param int $id
     * @param string $imageUrl
     * @return bool
     */
    public function uploadImage($id, $imageUrl)
    {
        $stmt = $this->db->prepare("\
            UPDATE concessions
            SET image_url = ?
            WHERE id = ?
        ");

        return $stmt->execute([$imageUrl, $id]);
    }

    /**
     * Lấy top concessions bán chạy
     * @param int $limit
     * @param string $startDate
     * @param string $endDate
     * @return array
     */
    public function getTopSelling($limit = 10, $startDate = null, $endDate = null)
    {
        $sql = "
            SELECT 
                c.*,
                SUM(bc.quantity) AS total_sold,
                SUM(bc.price * bc.quantity) AS total_revenue
            FROM concessions c
            JOIN booking_concessions bc ON c.id = bc.concession_id
        ";

        $params = [];

        if ($startDate && $endDate) {
            $sql .= " WHERE bc.created_at BETWEEN ? AND ?";
            $params[] = $startDate;
            $params[] = $endDate;
        }

        $sql .= "
            GROUP BY c.id
            ORDER BY total_sold DESC
            LIMIT ?
        ";

        $params[] = $limit;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }
}
