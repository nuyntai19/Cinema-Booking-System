<?php
require_once __DIR__ . '/../models/LoyaltyHistory.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../core/Response.php';

class LoyaltyController {
    private $historyModel;
    private $userModel;

    public function __construct() {
        $this->historyModel = new LoyaltyHistory();
        $this->userModel = new User();
    }

    public function getHistory($userId) {
        try {
            $history = $this->historyModel->getByUser($userId);
            return Response::success(['history' => $history]);
        } catch (Exception $e) {
            return Response::error('Lỗi: '.$e->getMessage(), 500);
        }
    }

    public function getCurrentPoints($userId = null) {
        try {
            if (!$userId) {
                return Response::error('User ID required', 400);
            }
            $user = $this->userModel->findById($userId);
            if (!$user) return Response::error('User not found', 404);
            return Response::success(['current_points' => (int)$user['current_points']]);
        } catch (Exception $e) {
            return Response::error('Lỗi: '.$e->getMessage(), 500);
        }
    }

    public function earnPoints()
{
    try {
        $data = json_decode(file_get_contents("php://input"), true);

        $userId = $data['user_id'] ?? null;
        $amount = $data['amount'] ?? 0;
        $relatedBookingId = $data['booking_id'] ?? null;

        if (!$userId || !$amount) {
            return Response::error('Missing user_id or amount', 400);
        }

        $points = LoyaltyHistory::calculatePoints($amount);

        if ($points <= 0) {
            return Response::error('No points earned for this amount', 200);
        }

        $ok = $this->historyModel->create(
            $userId,
            $points,
            'PURCHASE',
            "Earned from booking",
            $relatedBookingId
        );

        if (!$ok) {
            return Response::error('Could not record points', 500);
        }

        return Response::success(['earned_points' => $points]);

    } catch (Exception $e) {
        return Response::error('Lỗi: ' . $e->getMessage(), 500);
    }
}

    public function redeemPoints($userId, $points, $voucherId = null) {
        try {
            if ($points <= 0) return Response::error('Invalid points', 400);
            $total = $this->historyModel->getTotalPoints($userId);
            if ($total < $points) return Response::error('Not enough points', 400);
            $neg = -1 * abs((int)$points);
            $ok = $this->historyModel->create($userId, $neg, 'REDEEM', 'Redeemed for voucher ID: '.($voucherId?:'N/A'));
            if (!$ok) return Response::error('Could not redeem points', 500);
            return Response::success(['redeemed_points' => $points]);
        } catch (Exception $e) {
            return Response::error('Lỗi: '.$e->getMessage(), 500);
        }
    }
}
