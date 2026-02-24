<?php
require_once __DIR__ . '/../models/Membership.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/LoyaltyHistory.php';
require_once __DIR__ . '/../core/Response.php';

class MembershipController {
    private $membershipModel;
    private $userModel;

    public function __construct() {
        $this->membershipModel = new Membership();
        $this->userModel = new User();
    }

    public function index() {
        return Response::success(['memberships' => $this->membershipModel->getAll()]);
    }

    public function show($id) {
        $m = $this->membershipModel->getById($id);
        if (!$m) return Response::error('Membership not found', 404);
        return Response::success(['membership' => $m]);
    }

    public function getUserTier($userId) {
        $user = $this->userModel->findById($userId);
        if (!$user) return Response::error('User not found', 404);
        require_once __DIR__ . '/../models/UserProfile.php';
        $profileModel = new UserProfile();
        $profile = $profileModel->getByUserId($userId);
        $tierId = $profile['membership_id'] ?? 1;
        $tier = $this->membershipModel->getById($tierId);
        return Response::success(['tier' => $tier]);
    }

    public function checkUpgrade($userId) {
        try {
            $lh = new LoyaltyHistory();
            $points = $lh->getTotalPoints($userId);
            $tier = $this->membershipModel->getTierByPoints($points);
            return Response::success(['current_points' => $points, 'eligible_tier' => $tier]);
        } catch (Exception $e) {
            return Response::error('Lỗi: '.$e->getMessage(), 500);
        }
    }
}
