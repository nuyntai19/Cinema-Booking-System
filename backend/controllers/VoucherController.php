 <?php
require_once __DIR__ . '/../models/UserVoucher.php';
require_once __DIR__ . '/../models/Promotion.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/LoyaltyHistory.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../config/Database.php';

class VoucherController {
    private $voucherModel;
    private $promoModel;
    private $userModel;

    // Points required for each reward tier
    private static $rewardPointsMap = [
        'REWARD_20K'  => 200,
        'REWARD_50K'  => 500,
        'REWARD_FREE' => 1000,
    ];

    public function __construct() {
        $this->voucherModel = new UserVoucher();
        $this->promoModel = new Promotion();
        $this->userModel = new User();
    }

    public function getUserVouchers($userId) {
        // Support ?status=all to fetch all vouchers (for profile history)
        $status = isset($_GET['status']) && $_GET['status'] === 'all' ? null : 'ACTIVE';
        $v = $this->voucherModel->getByUser($userId, $status);
        return Response::success(['vouchers' => $v]);
    }

    /**
     * GET /api/vouchers/reward-tiers
     * Returns available reward tiers with promo details + points required
     */
    public function getRewardTiers() {
        try {
            $db = Database::getInstance()->getConnection();
            $codes = array_keys(self::$rewardPointsMap);
            $placeholders = implode(',', array_fill(0, count($codes), '?'));
            $query = "SELECT id, code, description, discount_amount, discount_type FROM promotions WHERE code IN ($placeholders)";
            $stmt = $db->prepare($query);
            $stmt->execute($codes);
            $promos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $tiers = [];
            foreach ($promos as $p) {
                $tiers[] = [
                    'promotion_id'   => (int)$p['id'],
                    'code'           => $p['code'],
                    'description'    => $p['description'],
                    'discount_amount'=> (float)$p['discount_amount'],
                    'discount_type'  => $p['discount_type'],
                    'points_required'=> self::$rewardPointsMap[$p['code']] ?? 0,
                ];
            }

            // Sort by points_required ascending
            usort($tiers, fn($a, $b) => $a['points_required'] - $b['points_required']);

            return Response::success(['tiers' => $tiers]);
        } catch (Exception $e) {
            return Response::error('Lỗi: '.$e->getMessage(), 500);
        }
    }

    /**
     * POST /api/vouchers/redeem-points
     * Body: { user_id, promotion_code } e.g. "REWARD_20K"
     * Deducts points + creates user_voucher
     */
    public function redeemPoints() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $data['user_id'] ?? null;
            $promoCode = $data['promotion_code'] ?? null;

            if (!$userId || !$promoCode) {
                return Response::error('Missing user_id or promotion_code', 400);
            }

            $pointsRequired = self::$rewardPointsMap[$promoCode] ?? null;
            if (!$pointsRequired) {
                return Response::error('Mã phần thưởng không hợp lệ', 400);
            }

            // Check user points
            $user = $this->userModel->findById($userId);
            if (!$user) return Response::error('User not found', 404);

            $currentPoints = (int)$user['current_points'];
            if ($currentPoints < $pointsRequired) {
                return Response::error("Bạn cần $pointsRequired điểm nhưng chỉ có $currentPoints điểm", 400);
            }

            // Find the promotion
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("SELECT id FROM promotions WHERE code = :code LIMIT 1");
            $stmt->bindParam(':code', $promoCode);
            $stmt->execute();
            $promo = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$promo) return Response::error('Promotion not found', 404);

            // Deduct points via loyalty_history
            $loyaltyModel = new LoyaltyHistory();
            $negPoints = -1 * $pointsRequired;
            $ok = $loyaltyModel->create(
                $userId,
                $negPoints,
                'REDEEM',
                "Đổi $pointsRequired điểm lấy voucher $promoCode"
            );
            if (!$ok) return Response::error('Không thể trừ điểm', 500);

            // Sync users.current_points
            $newTotal = $loyaltyModel->getTotalPoints($userId);
            $this->userModel->update($userId, ['current_points' => $newTotal]);

            // Recalculate membership tier after point deduction
            try {
                require_once __DIR__ . '/../models/Membership.php';
                require_once __DIR__ . '/../models/UserProfile.php';
                $membershipModel = new Membership();
                $profileModel = new UserProfile();
                $eligibleTier = $membershipModel->getTierByPoints($newTotal);
                if ($eligibleTier) {
                    $profile = $profileModel->getByUserId($userId);
                    $currentTierId = $profile['membership_id'] ?? 1;
                    if ((int)$eligibleTier['id'] !== (int)$currentTierId) {
                        $profileModel->update($userId, ['membership_id' => $eligibleTier['id']]);
                    }
                }
            } catch (Exception $ignore) {}

            // Create user_voucher
            $voucherId = $this->voucherModel->assignToUser($userId, (int)$promo['id']);
            if (!$voucherId) return Response::error('Không thể tạo voucher', 500);

            return Response::success([
                'voucher_id'     => (int)$voucherId,
                'promotion_code' => $promoCode,
                'points_used'    => $pointsRequired,
                'current_points' => $newTotal,
            ], 201);
        } catch (Exception $e) {
            return Response::error('Lỗi: '.$e->getMessage(), 500);
        }
    }

    public function show($id) {
        try {
            $db = Database::getInstance()->getConnection();
            $query = "SELECT uv.*, p.code as promo_code, p.description, p.discount_amount, p.discount_type, p.min_order_value, p.start_date, p.end_date, p.is_auto_apply FROM user_vouchers uv JOIN promotions p ON uv.promotion_id = p.id WHERE uv.id = :id LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $voucher = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$voucher) return Response::error('Voucher not found', 404);
            return Response::success(['voucher' => $voucher]);
        } catch (Exception $e) {
            return Response::error('Lỗi: '.$e->getMessage(), 500);
        }
    }

    public function assignToUser() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $data['user_id'] ?? null;
            $promotionId = $data['promotion_id'] ?? null;
            if (!$userId || !$promotionId) return Response::error('Missing user_id or promotion_id', 400);
            $id = $this->voucherModel->assignToUser($userId, $promotionId);
            if (!$id) return Response::error('Could not assign voucher', 500);
            return Response::success(['user_voucher_id' => $id], 201);
        } catch (Exception $e) {
            return Response::error('Lỗi: '.$e->getMessage(), 500);
        }
    }

    public function applyVoucher() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $voucherId = $data['voucher_id'] ?? null;
            $amount = $data['amount'] ?? 0;
            $code = $data['code'] ?? null;
            $userId = $data['user_id'] ?? null;

            if (!$amount) return Response::error('Missing amount', 400);

            $db = Database::getInstance()->getConnection();

            // --- 1) Try user_vouchers first (personal vouchers) ---
            if ($code && !$voucherId) {
                $query = "SELECT uv.id FROM user_vouchers uv JOIN promotions p ON uv.promotion_id = p.id WHERE (uv.code = :code1 OR p.code = :code2) AND uv.status = 'ACTIVE'";
                if ($userId) {
                    $query .= " AND uv.user_id = :user_id";
                }
                $query .= " LIMIT 1";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':code1', $code);
                $stmt->bindParam(':code2', $code);
                if ($userId) {
                    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
                }
                $stmt->execute();
                $found = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($found) $voucherId = $found['id'];
            }

            // --- 2) If found user_voucher, apply it ---
            if ($voucherId) {
                $query = "SELECT uv.*, p.discount_amount, p.discount_type, p.min_order_value, p.max_discount, p.code as promo_code FROM user_vouchers uv JOIN promotions p ON uv.promotion_id = p.id WHERE uv.id = :id AND uv.status = 'ACTIVE' LIMIT 1";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $voucherId, PDO::PARAM_INT);
                $stmt->execute();
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($row) {
                    return $this->calculateDiscount($row, $amount, (int)$voucherId, 'voucher');
                }
            }

            // --- 3) Fallback: look up directly from promotions table (public promo codes) ---
            if ($code) {
                $today = date('Y-m-d');
                $query = "SELECT * FROM promotions WHERE code = :code AND start_date <= :today1 AND end_date >= :today2 LIMIT 1";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':code', $code);
                $stmt->bindParam(':today1', $today);
                $stmt->bindParam(':today2', $today);
                $stmt->execute();
                $promo = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($promo) {
                    // Auto-assign as user_voucher so booking can reference it
                    $autoVoucherId = null;
                    if ($userId) {
                        $autoVoucherId = $this->voucherModel->assignToUser((int)$userId, (int)$promo['id'], $promo['code']);
                    }
                    if ($autoVoucherId) {
                        // Return as a voucher (with user_voucher_id) so booking applies the discount
                        return $this->calculateDiscount($promo, $amount, (int)$autoVoucherId, 'voucher');
                    }
                    return $this->calculateDiscount($promo, $amount, (int)$promo['id'], 'promotion');
                }
            }

            return Response::error('Mã giảm giá không hợp lệ hoặc đã hết hạn', 404);
        } catch (Exception $e) {
            return Response::error('Lỗi: '.$e->getMessage(), 500);
        }
    }

    private function calculateDiscount($row, $amount, $id, $type = 'voucher') {
        if ($amount < (float)$row['min_order_value']) {
            $min = number_format((float)$row['min_order_value'], 0, ',', '.');
            return Response::error("Đơn hàng tối thiểu {$min}đ để sử dụng mã này", 400);
        }

        $discount = 0;
        if ($row['discount_type'] === 'PERCENT') {
            $discount = ($row['discount_amount'] / 100.0) * $amount;
            if (!empty($row['max_discount']) && $discount > (float)$row['max_discount']) {
                $discount = (float)$row['max_discount'];
            }
        } else {
            $discount = (float)$row['discount_amount'];
        }

        $final = max(0, $amount - $discount);
        return Response::success([
            'voucher_id' => $type === 'voucher' ? $id : null,
            'promotion_id' => $type === 'promotion' ? $id : null,
            'discount' => round($discount, 2),
            'final_price' => round($final, 2),
            'type' => $type,
        ]);
    }

    public function markAsUsed($voucherId) {
        $ok = $this->voucherModel->markAsUsed($voucherId);
        if (!$ok) return Response::error('Could not mark voucher as used', 500);
        return Response::success(['marked' => true]);
    }

    public function autoAssignBirthday() {
        // Find birthday users and assign configured birthday promotion(s)
        $users = $this->voucherModel->checkBirthdayUsers();
        if (empty($users)) return Response::success(['assigned' => 0]);

        // Get promotions that are auto apply and active
        $promos = $this->promoModel->getActive();
        $birthdayPromos = array_filter($promos, function($p){ return (bool)$p['is_auto_apply']; });

        $count = 0;
        foreach ($users as $u) {
            foreach ($birthdayPromos as $p) {
                $res = $this->voucherModel->assignToUser($u['id'], $p['id']);
                if ($res) $count++;
            }
        }

        return Response::success(['assigned' => $count]);
    }
}
