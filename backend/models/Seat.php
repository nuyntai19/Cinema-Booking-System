<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * Seat Model
 * Quản lý ghế ngồi
 * Phụ trách: SƠN
 */
class Seat
{
    private $db;
    private $table = 'seats';

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Lấy danh sách ghế theo hall
     * @param int $hallId
     * @return array
     */
    public function getByHallId($hallId)
    {
        try {
            $sql = "SELECT s.*, st.name as seat_type_name, st.price_multiplier
                    FROM {$this->table} s
                    JOIN seat_types st ON s.seat_type_id = st.id
                    WHERE s.cinema_hall_id = :hall_id
                    ORDER BY s.row_code ASC, s.number ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':hall_id', $hallId, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Seat getByHallId Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Lấy chi tiết ghế theo ID
     * @param int $id
     * @return array|null
     */
    public function getById($id)
    {
        try {
            $sql = "SELECT s.*, 
                           st.name as seat_type_name, 
                           st.price_multiplier,
                           ch.name as hall_name,
                           c.name as cinema_name
                    FROM {$this->table} s
                    JOIN seat_types st ON s.seat_type_id = st.id
                    JOIN cinema_halls ch ON s.cinema_hall_id = ch.id
                    JOIN cinemas c ON ch.cinema_id = c.id
                    WHERE s.id = :id";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (PDOException $e) {
            error_log("Seat getById Error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Tạo nhiều ghế cùng lúc
     * @param int $hallId
     * @param array $rows - ['A', 'B', 'C', ...]
     * @param int $seatsPerRow
     * @param int $seatTypeId - default seat type
     * @return int - số ghế đã tạo
     */
    public function createBatch($hallId, $rows, $seatsPerRow, $seatTypeId = 1)
    {
        try {
            $this->db->beginTransaction();

            $sql = "INSERT INTO {$this->table} (cinema_hall_id, row_code, number, seat_type_id, status) 
                    VALUES (:hall_id, :row_code, :number, :seat_type_id, 'Active')";
            $stmt = $this->db->prepare($sql);

            $count = 0;
            foreach ($rows as $row) {
                for ($i = 1; $i <= $seatsPerRow; $i++) {
                    $stmt->execute([
                        ':hall_id' => $hallId,
                        ':row_code' => $row,
                        ':number' => $i,
                        ':seat_type_id' => $seatTypeId
                    ]);
                    $count++;
                }
            }

            // Cập nhật total_seats của hall
            $updateSql = "UPDATE cinema_halls SET total_seats = :total WHERE id = :hall_id";
            $updateStmt = $this->db->prepare($updateSql);
            $updateStmt->execute([':total' => $count, ':hall_id' => $hallId]);

            $this->db->commit();
            return $count;
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Seat createBatch Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Lấy trạng thái ghế cho một suất chiếu cụ thể
     * @param int $seatId
     * @param int $showtimeId
     * @return string - 'Available', 'HOLDING', 'SOLD', 'USED'
     */
    public function getSeatStatus($seatId, $showtimeId)
    {
        try {
            // Check if seat is sold (paid booking)
            $sql = "SELECT t.status
                    FROM tickets t
                    JOIN bookings b ON t.booking_id = b.id
                    WHERE t.seat_id = :seat_id 
                    AND b.showtime_id = :showtime_id
                    AND b.status IN ('Paid', 'Confirmed')
                    AND t.status IN ('SOLD', 'USED')
                    ORDER BY t.created_at DESC
                    LIMIT 1";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':seat_id', $seatId, PDO::PARAM_INT);
            $stmt->bindParam(':showtime_id', $showtimeId, PDO::PARAM_INT);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                return 'SOLD';
            }

            // Check if seat is being held (pending booking not expired)
            $holdDuration = Config::$seat_hold_duration; // 600 seconds = 10 minutes
            $sql = "SELECT t.status
                    FROM tickets t
                    JOIN bookings b ON t.booking_id = b.id
                    WHERE t.seat_id = :seat_id 
                    AND b.showtime_id = :showtime_id
                    AND b.status = 'Pending'
                    AND t.status = 'HOLDING'
                    AND TIMESTAMPDIFF(SECOND, b.created_at, NOW()) < :hold_duration
                    ORDER BY t.created_at DESC
                    LIMIT 1";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':seat_id', $seatId, PDO::PARAM_INT);
            $stmt->bindParam(':showtime_id', $showtimeId, PDO::PARAM_INT);
            $stmt->bindParam(':hold_duration', $holdDuration, PDO::PARAM_INT);
            $stmt->execute();

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                return 'HOLDING';
            }

            return 'Available';
        } catch (PDOException $e) {
            error_log("Seat getSeatStatus Error: " . $e->getMessage());
            return 'Available';
        }
    }

    /**
     * Thay thế toàn bộ layout ghế của một hall
     * Nếu có suất chiếu sắp tới: cập nhật seat_type_id và status trực tiếp (không xóa ghế)
     * Nếu không có suất chiếu: xóa và tạo lại toàn bộ
     */
    public function replaceLayout($hallId, $seats)
    {
        try {
            $hasUpcomingShowtimes = !$this->canDeleteSeats($hallId);

            $this->db->beginTransaction();

            if ($hasUpcomingShowtimes) {
                // Có suất chiếu sắp tới → cập nhật từng ghế tại chỗ (không xóa)
                $updateSql = "UPDATE {$this->table} 
                              SET seat_type_id = :seat_type_id, status = :status 
                              WHERE cinema_hall_id = :hall_id AND row_code = :row_code AND number = :number";
                $updateStmt = $this->db->prepare($updateSql);

                $insertSql = "INSERT INTO {$this->table} (cinema_hall_id, row_code, number, seat_type_id, status) 
                              VALUES (:hall_id, :row_code, :number, :seat_type_id, :status)
                              ON DUPLICATE KEY UPDATE seat_type_id = VALUES(seat_type_id), status = VALUES(status)";
                $insertStmt = $this->db->prepare($insertSql);

                foreach ($seats as $s) {
                    $seatStatus = isset($s['status']) ? $s['status'] : 'Active';
                    $insertStmt->execute([
                        ':hall_id' => $hallId,
                        ':row_code' => $s['row_code'],
                        ':number' => $s['number'],
                        ':seat_type_id' => $s['seat_type_id'],
                        ':status' => $seatStatus
                    ]);
                }
            } else {
                // Không có suất chiếu → xóa và tạo lại toàn bộ
                $deleteSql = "DELETE FROM {$this->table} WHERE cinema_hall_id = :hall_id";
                $deleteStmt = $this->db->prepare($deleteSql);
                $deleteStmt->execute([':hall_id' => $hallId]);

                $insertSql = "INSERT INTO {$this->table} (cinema_hall_id, row_code, number, seat_type_id, status) 
                              VALUES (:hall_id, :row_code, :number, :seat_type_id, :status)";
                $insertStmt = $this->db->prepare($insertSql);

                foreach ($seats as $s) {
                    $seatStatus = isset($s['status']) ? $s['status'] : 'Active';
                    $insertStmt->execute([
                        ':hall_id' => $hallId,
                        ':row_code' => $s['row_code'],
                        ':number' => $s['number'],
                        ':seat_type_id' => $s['seat_type_id'],
                        ':status' => $seatStatus
                    ]);
                }
            }

            // Cập nhật total_seats trong cinema_halls (chỉ đếm ghế Active)
            $count = count(array_filter($seats, fn($s) => ($s['status'] ?? 'Active') === 'Active'));
            $updateHallSql = "UPDATE cinema_halls SET total_seats = :total WHERE id = :hall_id";
            $updateHallStmt = $this->db->prepare($updateHallSql);
            $updateHallStmt->execute([':total' => $count, ':hall_id' => $hallId]);

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log("Seat replaceLayout Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Kiểm tra xem có thể xóa/thay đổi ghế của hall không
     */
    public function canDeleteSeats($hallId)
    {
        try {
            // Kiểm tra suất chiếu sắp tới
            $sql = "SELECT COUNT(*) FROM showtimes WHERE cinema_hall_id = :hall_id AND start_time > NOW()";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':hall_id' => $hallId]);
            if ($stmt->fetchColumn() > 0) return false;

            // Kiểm tra tickets đã tồn tại tham chiếu đến ghế của hall này
            $sql2 = "SELECT COUNT(*) FROM tickets t JOIN seats s ON t.seat_id = s.id WHERE s.cinema_hall_id = :hall_id";
            $stmt2 = $this->db->prepare($sql2);
            $stmt2->execute([':hall_id' => $hallId]);
            return $stmt2->fetchColumn() == 0;
        } catch (PDOException $e) {
            error_log("Seat canDeleteSeats Error: " . $e->getMessage());
            return false;
        }
    }
}
