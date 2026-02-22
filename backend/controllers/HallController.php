<?php
require_once __DIR__ . '/../models/CinemaHall.php';
require_once __DIR__ . '/../models/Seat.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../config/Config.php';

/**
 * HallController
 * Quản lý phòng chiếu và sơ đồ ghế
 */
class HallController
{
    private $hallModel;
    private $seatModel;

    public function __construct()
    {
        $this->hallModel = new CinemaHall();
        $this->seatModel = new Seat();
    }

    private function isAdmin()
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        if (empty($authHeader))
            return false;

        $token = str_replace('Bearer ', '', $authHeader);
        $payload = JWT::decode($token, Config::$jwt_secret);

        return $payload && $payload['role_id'] == 5;
    }

    /**
     * GET /api/halls/:id
     */
    public function show($id)
    {
        $hall = $this->hallModel->getById($id);
        if (!$hall)
            return Response::error('Không tìm thấy phòng', 404);

        $hall['seats'] = $this->hallModel->getSeats($id);
        return Response::success(['hall' => $hall]);
    }

    /**
     * POST /api/halls
     */
    public function create()
    {
        if (!$this->isAdmin())
            return Response::error('Không có quyền', 403);

        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['cinema_id']) || empty($input['name'])) {
            return Response::error('Thiếu thông tin rạp hoặc tên phòng', 400);
        }

        $id = $this->hallModel->create($input);
        if (!$id)
            return Response::error('Không thể tạo phòng', 500);

        return Response::success(['id' => $id, 'message' => 'Tạo phòng thành công'], 201);
    }

    /**
     * PUT /api/halls/:id
     */
    public function update($id)
    {
        if (!$this->isAdmin())
            return Response::error('Không có quyền', 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $result = $this->hallModel->update($id, $input);

        if (!$result)
            return Response::error('Không thể cập nhật', 500);
        return Response::success(['message' => 'Cập nhật thành công']);
    }

    /**
     * DELETE /api/halls/:id
     */
    public function delete($id)
    {
        if (!$this->isAdmin())
            return Response::error('Không có quyền', 403);

        if (!$this->seatModel->canDeleteSeats($id)) {
            return Response::error('Không thể xóa phòng vì đã có suất chiếu', 400);
        }

        $result = $this->hallModel->delete($id);
        if (!$result)
            return Response::error('Không thể xóa', 500);

        return Response::success(['message' => 'Xóa phòng thành công']);
    }

    /**
     * POST /api/halls/:id/layout
     */
    public function saveLayout($id)
    {
        if (!$this->isAdmin())
            return Response::error('Không có quyền', 403);

        $input = json_decode(file_get_contents('php://input'), true);
        if (!isset($input['seats']) || !is_array($input['seats'])) {
            return Response::error('Dữ liệu ghế không hợp lệ', 400);
        }

        $result = $this->seatModel->replaceLayout($id, $input['seats']);
        if (!$result) {
            return Response::error('Không thể cập nhật sơ đồ ghế. Hãy kiểm tra xem có suất chiếu nào không.', 500);
        }

        return Response::success(['message' => 'Cập nhật sơ đồ ghế thành công']);
    }
}
