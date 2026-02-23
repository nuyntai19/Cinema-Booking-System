<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * PricingRule Model
 * Quản lý quy tắc giá (Weekend, Before10AM, Holiday)
 * Phụ trách: SƠN
 */
class PricingRule
{
    private $db;
    private $table = 'pricing_rules';

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Lấy tất cả rules đang active
     * @return array
     */
    public function getActiveRules()
    {
        try {
            $sql = "SELECT * FROM {$this->table} WHERE is_active = 1 ORDER BY id ASC";
            $stmt = $this->db->query($sql);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("PricingRule getActiveRules Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Lấy rules áp dụng cho ngày cụ thể
     * @param string $date - format: Y-m-d
     * @return array - danh sách rules áp dụng
     */
    public function getByDate($date)
    {
        try {
            $activeRules = $this->getActiveRules();
            $applicableRules = [];

            $dateObj = new DateTime($date);
            $dayOfWeek = (int) $dateObj->format('N'); // 1=Monday, 7=Sunday

            foreach ($activeRules as $rule) {
                $conditionType = $rule['condition_type'];

                // Weekend: Thứ 7 (6) và Chủ nhật (7)
                if ($conditionType === 'Weekend' && ($dayOfWeek === 6 || $dayOfWeek === 7)) {
                    $applicableRules[] = $rule;
                }

                // Holiday: có thể mở rộng thêm logic kiểm tra ngày lễ
                if ($conditionType === 'Holiday') {
                    // Danh sách ngày lễ Việt Nam cố định
                    $holidays = [
                        '01-01', // Tết Dương lịch
                        '04-30', // Giải phóng
                        '05-01', // Lao động
                        '09-02', // Quốc khánh
                    ];
                    $monthDay = $dateObj->format('m-d');
                    if (in_array($monthDay, $holidays)) {
                        $applicableRules[] = $rule;
                    }
                }

                // Before10AM: chỉ áp dụng khi gọi với time cụ thể (xử lý ở calculateAdjustment)
                if ($conditionType === 'Before10AM') {
                    $applicableRules[] = $rule; // Giữ lại, filter theo time ở bước sau
                }
            }

            return $applicableRules;
        } catch (Exception $e) {
            error_log("PricingRule getByDate Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Tính tổng điều chỉnh giá cho ngày và giờ cụ thể
     * @param string $date - format: Y-m-d
     * @param string $time - format: H:i:s
     * @return float - tổng số tiền điều chỉnh (có thể âm)
     */
    public function calculateAdjustment($date, $time)
    {
        try {
            $rules = $this->getByDate($date);
            $totalAdjustment = 0;

            $timeObj = new DateTime($time);
            $tenAM = new DateTime('10:00:00');

            foreach ($rules as $rule) {
                // Before10AM: chỉ áp dụng nếu giờ chiếu trước 10h sáng
                if ($rule['condition_type'] === 'Before10AM') {
                    if ($timeObj < $tenAM) {
                        $totalAdjustment += (float) $rule['adjustment_amount'];
                    }
                    continue;
                }

                // Các rules khác (Weekend, Holiday) áp dụng trực tiếp
                $totalAdjustment += (float) $rule['adjustment_amount'];
            }

            return $totalAdjustment;
        } catch (Exception $e) {
            error_log("PricingRule calculateAdjustment Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Tính giá cuối cùng
     * Công thức: (basePrice + adjustment) × seatTypeMultiplier
     * @param float $basePrice - giá vé cơ bản
     * @param string $date - format: Y-m-d
     * @param string $time - format: H:i:s
     * @param float $seatTypeMultiplier - hệ số loại ghế (1.0, 1.5, 2.0)
     * @return float - giá cuối cùng
     */
    public function applyToPrice($basePrice, $date, $time, $seatTypeMultiplier = 1.00)
    {
        $adjustment = $this->calculateAdjustment($date, $time);
        $adjustedPrice = $basePrice + $adjustment;

        // Đảm bảo giá không âm
        if ($adjustedPrice < 0) {
            $adjustedPrice = 0;
        }

        $finalPrice = $adjustedPrice * $seatTypeMultiplier;

        return round($finalPrice, 2);
    }
}
