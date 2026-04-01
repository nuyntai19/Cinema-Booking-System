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
     * Đếm số đơn đặt vé đã dùng concession này
     * @param int $id
     * @return int
     */
    public function countFutureBookings($id)
    {
        $stmt = $this->db->prepare(
            "SELECT COUNT(DISTINCT bc.booking_id) AS cnt
             FROM booking_concessions bc
             INNER JOIN bookings b ON b.id = bc.booking_id
             WHERE bc.concession_id = :concession_id
             AND b.status IN ('Pending', 'Paid')"
        );
        $stmt->execute([':concession_id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($row['cnt'] ?? 0);
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

    // ====================================================
    // INVENTORY MANAGEMENT (theo rạp)
    // ====================================================

    /**
     * Lấy tồn kho của tất cả sản phẩm theo rạp
     * @param int $cinemaId
     * @return array [concession_id => quantity, ...]
     */
    public function getInventoryByCinema(int $cinemaId): array
    {
        $stmt = $this->db->prepare("
            SELECT concession_id, quantity
            FROM cinema_concession_inventory
            WHERE cinema_id = ?
        ");
        $stmt->execute([$cinemaId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $result = [];
        foreach ($rows as $row) {
            $result[(int)$row['concession_id']] = (int)$row['quantity'];
        }
        return $result;
    }

    /**
     * Lấy tất cả concessions kèm tồn kho của rạp
     * @param int $cinemaId
     * @return array
     */
    public function getAllWithInventory(int $cinemaId): array
    {
        $stmt = $this->db->prepare("
            SELECT c.*,
                   COALESCE(inv.quantity, 0) AS inventory_quantity
            FROM concessions c
            LEFT JOIN cinema_concession_inventory inv
                   ON inv.concession_id = c.id AND inv.cinema_id = :cinema_id
            ORDER BY c.category, c.name
        ");
        $stmt->execute([':cinema_id' => $cinemaId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Lấy available concessions kèm tồn kho của rạp
     * @param int|null $cinemaId
     * @return array
     */
    public function getAvailableWithInventory(?int $cinemaId = null): array
    {
        if (!$cinemaId) {
            return $this->getAvailable();
        }
        $stmt = $this->db->prepare("
            SELECT c.*,
                   COALESCE(inv.quantity, 0) AS inventory_quantity
            FROM concessions c
            LEFT JOIN cinema_concession_inventory inv
                   ON inv.concession_id = c.id AND inv.cinema_id = :cinema_id
            WHERE c.is_available = TRUE
            ORDER BY c.category, c.name
        ");
        $stmt->execute([':cinema_id' => $cinemaId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Thiết lập hoặc cập nhật tồn kho cho 1 sản phẩm tại 1 rạp
     * @param int $cinemaId
     * @param int $concessionId
     * @param int $quantity
     * @return bool
     */
    public function setInventory(int $cinemaId, int $concessionId, int $quantity): bool
    {
        $stmt = $this->db->prepare("
            INSERT INTO cinema_concession_inventory (cinema_id, concession_id, quantity)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), updated_at = NOW()
        ");
        return $stmt->execute([$cinemaId, $concessionId, $quantity]);
    }

    /**
     * Trừ tồn kho khi đặt hàng
     * @param int $cinemaId
     * @param int $concessionId
     * @param int $amount - Số lượng cần trừ
     * @return bool - false nếu không đủ hàng
     */
    public function decreaseInventory(int $cinemaId, int $concessionId, int $amount): bool
    {
        // Atomic update + check
        $stmt = $this->db->prepare("
            UPDATE cinema_concession_inventory
            SET quantity = quantity - :amount
            WHERE cinema_id = :cinema_id
              AND concession_id = :concession_id
              AND quantity >= :amount2
        ");
        $stmt->execute([
            ':amount'        => $amount,
            ':cinema_id'     => $cinemaId,
            ':concession_id' => $concessionId,
            ':amount2'       => $amount,
        ]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Lấy tồn kho của 1 sản phẩm tại 1 rạp
     * @param int $cinemaId
     * @param int $concessionId
     * @return int
     */
    public function getStock(int $cinemaId, int $concessionId): int
    {
        $stmt = $this->db->prepare("
            SELECT quantity FROM cinema_concession_inventory
            WHERE cinema_id = ? AND concession_id = ?
        ");
        $stmt->execute([$cinemaId, $concessionId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? (int)$row['quantity'] : 0;
    }
}

