<?php

class AdminController extends BaseController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    private function percentChange($current, $previous) {
        $current = (float)$current;
        $previous = (float)$previous;

        if ($previous == 0.0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return (($current - $previous) / $previous) * 100.0;
    }

    private function getRevenueByDate($dateYmd) {
        $sql = "SELECT COALESCE(SUM(t.amount), 0) AS total
                FROM transactions t
                WHERE t.status = 'Success'
                  AND DATE(t.created_at) = :d";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':d' => $dateYmd]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (float)($row['total'] ?? 0);
    }

    private function getRevenueForLastDays($days, $offsetDays = 0) {
        $sql = "SELECT COALESCE(SUM(t.amount), 0) AS total
                FROM transactions t
                WHERE t.status = 'Success'
                  AND DATE(t.created_at) >= DATE_SUB(CURDATE(), INTERVAL :start_days DAY)
                  AND DATE(t.created_at) < DATE_SUB(CURDATE(), INTERVAL :end_days DAY)";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':start_days', (int)($days + $offsetDays), PDO::PARAM_INT);
        $stmt->bindValue(':end_days', (int)$offsetDays, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (float)($row['total'] ?? 0);
    }

    private function getTicketsSoldByDate($dateYmd) {
        $sql = "SELECT COUNT(*) AS total
                FROM tickets tk
                WHERE tk.status IN ('SOLD', 'USED')
                  AND DATE(tk.created_at) = :d";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':d' => $dateYmd]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($row['total'] ?? 0);
    }

    private function getTicketsSoldForLastDays($days, $offsetDays = 0) {
        $sql = "SELECT COUNT(*) AS total
                FROM tickets tk
                WHERE tk.status IN ('SOLD', 'USED')
                  AND DATE(tk.created_at) >= DATE_SUB(CURDATE(), INTERVAL :start_days DAY)
                  AND DATE(tk.created_at) < DATE_SUB(CURDATE(), INTERVAL :end_days DAY)";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':start_days', (int)($days + $offsetDays), PDO::PARAM_INT);
        $stmt->bindValue(':end_days', (int)$offsetDays, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($row['total'] ?? 0);
    }

    private function getFillRateByShowDate($dateYmd) {
        $capacitySql = "SELECT COALESCE(SUM(h.total_seats), 0) AS capacity
                        FROM showtimes s
                        INNER JOIN cinema_halls h ON h.id = s.cinema_hall_id
                        WHERE DATE(s.start_time) = :d";

        $capacityStmt = $this->db->prepare($capacitySql);
        $capacityStmt->execute([':d' => $dateYmd]);
        $capacityRow = $capacityStmt->fetch(PDO::FETCH_ASSOC);
        $capacity = (int)($capacityRow['capacity'] ?? 0);

        if ($capacity <= 0) {
            return 0.0;
        }

        $soldSql = "SELECT COUNT(*) AS sold
                    FROM tickets tk
                    INNER JOIN bookings b ON b.id = tk.booking_id
                    INNER JOIN showtimes s ON s.id = b.showtime_id
                    WHERE tk.status IN ('SOLD', 'USED')
                      AND DATE(s.start_time) = :d";

        $soldStmt = $this->db->prepare($soldSql);
        $soldStmt->execute([':d' => $dateYmd]);
        $soldRow = $soldStmt->fetch(PDO::FETCH_ASSOC);
        $sold = (int)($soldRow['sold'] ?? 0);

        return ($sold / $capacity) * 100.0;
    }

    private function getOverallFillRate() {
        $capacitySql = "SELECT COALESCE(SUM(h.total_seats), 0) AS capacity
                        FROM showtimes s
                        INNER JOIN cinema_halls h ON h.id = s.cinema_hall_id";

        $capacityStmt = $this->db->query($capacitySql);
        $capacityRow = $capacityStmt->fetch(PDO::FETCH_ASSOC);
        $capacity = (int)($capacityRow['capacity'] ?? 0);

        if ($capacity <= 0) {
            return 0.0;
        }

        $soldSql = "SELECT COUNT(*) AS sold
                    FROM tickets tk
                    INNER JOIN bookings b ON b.id = tk.booking_id
                    INNER JOIN showtimes s ON s.id = b.showtime_id
                    WHERE tk.status IN ('SOLD', 'USED')";

        $soldStmt = $this->db->query($soldSql);
        $soldRow = $soldStmt->fetch(PDO::FETCH_ASSOC);
        $sold = (int)($soldRow['sold'] ?? 0);

        return ($sold / $capacity) * 100.0;
    }

    public function getDashboardStats() {
        AuthMiddleware::requireManager();

        $totalRevenueSql = "SELECT COALESCE(SUM(t.amount), 0) AS total
                            FROM transactions t
                            WHERE t.status = 'Success'";
        $totalRevenueStmt = $this->db->query($totalRevenueSql);
        $totalRevenueRow = $totalRevenueStmt->fetch(PDO::FETCH_ASSOC);
        $totalRevenue = (float)($totalRevenueRow['total'] ?? 0);

        $totalTicketsSql = "SELECT COUNT(*) AS total
                            FROM tickets tk
                            WHERE tk.status IN ('SOLD', 'USED')";
        $totalTicketsStmt = $this->db->query($totalTicketsSql);
        $totalTicketsRow = $totalTicketsStmt->fetch(PDO::FETCH_ASSOC);
        $totalTickets = (int)($totalTicketsRow['total'] ?? 0);

        $overallFillRate = $this->getOverallFillRate();

        $currentRevenue = $this->getRevenueForLastDays(30, 0);
        $previousRevenue = $this->getRevenueForLastDays(30, 30);

        $currentTickets = $this->getTicketsSoldForLastDays(30, 0);
        $previousTickets = $this->getTicketsSoldForLastDays(30, 30);

        $vnSql = "SELECT
                    SUM(CASE WHEN origin = 'Vietnam' THEN 1 ELSE 0 END) AS vn_count,
                    COUNT(*) AS total_count
                  FROM movies";
        $vnStmt = $this->db->query($vnSql);
        $vnRow = $vnStmt->fetch(PDO::FETCH_ASSOC);
        $vnCount = (int)($vnRow['vn_count'] ?? 0);
        $totalMovies = (int)($vnRow['total_count'] ?? 0);
        $vnRatio = $totalMovies > 0 ? ($vnCount / $totalMovies) * 100.0 : 0.0;

        Response::success([
            // Keep key names for frontend compatibility, but values are now all-time totals.
            'today_revenue' => round($totalRevenue, 2),
            'today_tickets' => $totalTickets,
            'today_fill_rate' => round($overallFillRate, 2),
            'vn_ratio' => round($vnRatio, 2),
            'vn_count' => $vnCount,
            'international_count' => max(0, $totalMovies - $vnCount),
            'changes' => [
                'revenue' => round($this->percentChange($currentRevenue, $previousRevenue), 2),
                'tickets' => round($this->percentChange($currentTickets, $previousTickets), 2),
                'fill_rate' => 0,
            ],
        ]);
    }

    public function getRevenueReport() {
        AuthMiddleware::requireManager();

        $sql = "SELECT DATE(t.created_at) AS revenue_date,
                       COALESCE(SUM(t.amount), 0) AS revenue
                FROM transactions t
                WHERE t.status = 'Success'
                GROUP BY DATE(t.created_at)
                ORDER BY DATE(t.created_at) DESC
                LIMIT 7";

        $stmt = $this->db->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $rows = array_reverse($rows);

        $days = array_map(function ($r) {
            $d = new DateTime($r['revenue_date']);
            $dayLabel = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][(int)$d->format('w')];
            return [
                'date' => $d->format('Y-m-d'),
                'day' => $dayLabel,
                'revenue' => round((float)$r['revenue'], 2),
            ];
        }, $rows);

        Response::success(['items' => $days]);
    }

    public function getSeatHeatmap() {
        AuthMiddleware::requireManager();

        $sql = "SELECT s.row_code AS row_label,
                       s.number AS seat_number,
                       COALESCE(SUM(x.booking_count), 0) AS booking_count
                FROM seats s
                LEFT JOIN (
                    SELECT tk.seat_id, COUNT(*) AS booking_count
                    FROM tickets tk
                    INNER JOIN bookings b ON b.id = tk.booking_id
                    WHERE tk.status IN ('SOLD', 'USED')
                    GROUP BY tk.seat_id
                ) x ON x.seat_id = s.id
                GROUP BY s.row_code, s.number
                ORDER BY s.row_code, s.number";

        $stmt = $this->db->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $max = 0;
        $sum = 0;
        $zero = 0;
        foreach ($rows as $r) {
            $count = (int)$r['booking_count'];
            $sum += $count;
            if ($count === 0) {
                $zero++;
            }
            if ($count > $max) {
                $max = $count;
            }
        }

        $avg = count($rows) > 0 ? ($sum / count($rows)) : 0;

        Response::success([
            'items' => array_map(function ($r) {
                return [
                    'row' => $r['row_label'],
                    'number' => (int)$r['seat_number'],
                    'booking_count' => (int)$r['booking_count'],
                ];
            }, $rows),
            'stats' => [
                'max_booking_count' => $max,
                'zero_booking_seats' => $zero,
                'average_booking_count' => round($avg, 2),
            ],
        ]);
    }

    public function getRecentTransactions() {
        AuthMiddleware::requireManager();

        $sql = "SELECT t.transaction_code,
                       t.payment_method,
                       t.amount,
                       t.status,
                       t.created_at,
                       u.email,
                       COALESCE(up.full_name, u.email) AS customer_name,
                       COALESCE(up.phone, '') AS customer_phone
                FROM transactions t
                INNER JOIN bookings b ON b.id = t.booking_id
                INNER JOIN users u ON u.id = b.user_id
                LEFT JOIN user_profiles up ON up.user_id = u.id
                ORDER BY t.created_at DESC
                LIMIT 10";

        $stmt = $this->db->query($sql);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success(['items' => $items]);
    }
}
