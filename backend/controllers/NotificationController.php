<?php

class NotificationController extends BaseController {
    private $model;

    public function __construct() {
        $this->model = new Notification();
    }

    public function getUserNotifications($userId) {
        AuthMiddleware::authenticate();
        self::authorizeUserId((int)$userId);

        $roleId = (int)($_REQUEST['auth_user_role_id'] ?? 2);
        $limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 30;
        $items = $this->model->getUserNotifications((int)$userId, $roleId, $limit);

        Response::success(['items' => $items]);
    }

    public function getPublicNotifications() {
        $limit = isset($_GET['limit']) ? max(1, min(50, (int)$_GET['limit'])) : 20;
        $items = $this->model->getPublicNotifications($limit);

        Response::success(['items' => $items]);
    }

    public function markAsRead($id) {
        AuthMiddleware::authenticate();
        $authUserId = (int)($_REQUEST['auth_user_id'] ?? 0);

        $ok = $this->model->markAsRead((int)$id, $authUserId);
        if (!$ok) {
            Response::error('Không thể cập nhật trạng thái đã đọc', 400);
        }

        Response::success([], 'Đã đánh dấu đã đọc');
    }

    public function adminList() {
        AuthMiddleware::requireManager();

        $search = trim((string)($_GET['search'] ?? ''));
        $type = trim((string)($_GET['type'] ?? 'all'));

        $campaigns = $this->model->listCampaigns($search, $type);

        $stats = [
            'total_notifications' => count($campaigns),
            'total_recipients' => array_sum(array_map(function ($n) {
                return (int)$n['recipient_count'];
            }, $campaigns)),
            'total_reads' => array_sum(array_map(function ($n) {
                return (int)$n['read_count'];
            }, $campaigns)),
            'sent_notifications' => count(array_filter($campaigns, function ($n) {
                return strtoupper((string)($n['status'] ?? 'SENT')) === 'SENT';
            })),
            'scheduled_notifications' => count(array_filter($campaigns, function ($n) {
                return strtoupper((string)($n['status'] ?? 'SENT')) === 'SCHEDULED';
            })),
        ];

        Response::success([
            'items' => $campaigns,
            'stats' => $stats,
        ]);
    }

    public function adminCreate() {
        AuthMiddleware::requireManager();

        $data = self::getRequestData();

        $title = trim((string)($data['title'] ?? ''));
        $message = trim((string)($data['message'] ?? ''));
        $type = trim((string)($data['type'] ?? 'SYSTEM'));
        $targetAudience = trim((string)($data['target_audience'] ?? 'ALL'));
        $scheduledAt = trim((string)($data['scheduled_at'] ?? ''));

        if ($title === '' || $message === '') {
            Response::validationError([
                'title' => $title === '' ? 'Tiêu đề là bắt buộc' : null,
                'message' => $message === '' ? 'Nội dung là bắt buộc' : null,
            ], 'Dữ liệu không hợp lệ');
        }

        $validTypes = ['BOOKING', 'PROMOTION', 'SYSTEM'];
        if (!in_array(strtoupper($type), $validTypes, true)) {
            Response::validationError(['type' => 'Loại thông báo không hợp lệ']);
        }

        $validAudience = ['ALL', 'GUEST', 'USER', 'STAFF', 'ADMIN'];
        $targetAudience = strtoupper($targetAudience);
        if (!in_array($targetAudience, $validAudience, true)) {
            Response::validationError(['target_audience' => 'Đối tượng nhận không hợp lệ']);
        }

        if ($scheduledAt !== '') {
            $dt = DateTime::createFromFormat('Y-m-d H:i:s', $scheduledAt)
                ?: DateTime::createFromFormat('Y-m-d\TH:i', $scheduledAt)
                ?: DateTime::createFromFormat('Y-m-d\TH:i:s', $scheduledAt);

            if (!$dt) {
                Response::validationError(['scheduled_at' => 'Định dạng thời gian hẹn không hợp lệ']);
            }

            $now = new DateTime('now');
            if ($dt <= $now) {
                Response::validationError(['scheduled_at' => 'Thời gian hẹn phải lớn hơn thời điểm hiện tại']);
            }

            $scheduledAt = $dt->format('Y-m-d H:i:s');
        } else {
            $scheduledAt = null;
        }

        $createdBy = (int)($_REQUEST['auth_user_id'] ?? 0);
        $inserted = $this->model->createCampaign(
            $title,
            $message,
            $type,
            $targetAudience,
            $createdBy ?: null,
            $scheduledAt
        );

        if (($inserted['id'] ?? 0) <= 0) {
            Response::error('Không có người nhận phù hợp hoặc gửi thất bại', 400);
        }

        Response::created([
            'id' => (int)$inserted['id'],
            'recipient_count' => (int)$inserted['recipient_count'],
            'status' => (string)($inserted['status'] ?? 'SENT'),
        ], 'Gửi thông báo thành công');
    }

    public function adminDelete($id) {
        AuthMiddleware::requireManager();

        $deleted = $this->model->deleteCampaignBySeedId((int)$id);
        if ($deleted <= 0) {
            Response::notFound('Không tìm thấy thông báo để xóa');
        }

        Response::success(['deleted' => $deleted], 'Đã xóa thông báo');
    }
}
