 <?php
require_once __DIR__ . '/../models/UserVoucher.php';
require_once __DIR__ . '/../models/Promotion.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../config/Database.php';

class VoucherController {
    private $voucherModel;
    private $promoModel;
    private $userModel;

    public function __construct() {
        $this->voucherModel = new UserVoucher();
        $this->promoModel = new Promotion();
        $this->userModel = new User();
    }

    public function getUserVouchers($userId) {
        $v = $this->voucherModel->getByUser($userId, 'ACTIVE');
        return Response::success(['vouchers' => $v]);
    }

    public function show($id) {
        try {
            $queryId = (int)$id;
            $res = $this->voucherModel->getByUser(null, null); // fallback
            // Simpler: query promotion via model
            $promo = $this->promoModel->getById($queryId);
            if (!$promo) return Response::error('Voucher/Promotion not found', 404);
            return Response::success(['promotion' => $promo]);
        } catch (Exception $e) {
            return Response::error('Lỗi: '.$e->getMessage(), 500);
        }
    }

    public function assignToUser($userId, $promotionId) {
        $id = $this->voucherModel->assignToUser($userId, $promotionId);
        if (!$id) return Response::error('Could not assign voucher', 500);
        return Response::success(['user_voucher_id' => $id], 201);
    }

    public function applyVoucher($voucherId, $amount) {
        try {
            // Fetch voucher and promotion details
            $query = "SELECT uv.*, p.* FROM user_vouchers uv JOIN promotions p ON uv.promotion_id = p.id WHERE uv.id = :id AND uv.status = 'ACTIVE' LIMIT 1";
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $voucherId, PDO::PARAM_INT);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) return Response::error('Voucher not found or not active', 404);

            $discount = 0;
            if ($row['discount_type'] === 'PERCENT') {
                $discount = ($row['discount_amount'] / 100.0) * $amount;
            } else {
                $discount = (float)$row['discount_amount'];
            }
            // respect min_order_value
            if ($amount < (float)$row['min_order_value']) {
                return Response::error('Order total does not meet minimum value for this voucher', 400);
            }

            $final = max(0, $amount - $discount);
            return Response::success(['discount' => round($discount,2), 'final_price' => round($final,2)]);
        } catch (Exception $e) {
            return Response::error('Lỗi: '.$e->getMessage(), 500);
        }
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
