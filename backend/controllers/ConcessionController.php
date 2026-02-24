<?php

/**
 * Concession Controller - Quản lý bắp nước
 */
require_once __DIR__ . '/../models/Concession.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../utils/Validator.php';

class ConcessionController
{
    private $concessionModel;

    public function __construct()
    {
        $this->concessionModel = new Concession();
    }

    /**
     * Danh sách tất cả concessions
     * GET /api/concessions
     */
    public function index()
    {
        try {
            $concessions = $this->concessionModel->getAll();

            Response::success($concessions, 'Lấy danh sách bắp nước thành công');
        } catch (Exception $e) {
            Response::serverError('Lỗi khi lấy danh sách: ' . $e->getMessage());
        }
    }

    /**
     * Chi tiết một concession
     * GET /api/concessions/:id
     */
    public function show($id)
    {
        try {
            $concession = $this->concessionModel->getById($id);

            if (!$concession) {
                Response::notFound('Không tìm thấy sản phẩm');
            }

            Response::success($concession, 'Lấy thông tin sản phẩm thành công');
        } catch (Exception $e) {
            Response::serverError('Lỗi khi lấy thông tin: ' . $e->getMessage());
        }
    }

    /**
     * Tạo concession mới (Manager)
     * POST /api/concessions
     * Body: { "name": "Combo 1", "price": 89000, "category": "Combo", "image_url": "..." }
     */
    public function create()
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            // Validation
            $errors = [];

            if (empty($input['name'])) {
                $errors['name'] = 'Tên sản phẩm là bắt buộc';
            }

            if (empty($input['price']) || !is_numeric($input['price']) || $input['price'] <= 0) {
                $errors['price'] = 'Giá sản phẩm không hợp lệ';
            }

            if (!empty($errors)) {
                Response::validationError($errors);
            }

            // Prepare data
            $data = [
                'name' => trim($input['name']),
                'price' => floatval($input['price']),
                'category' => $input['category'] ?? null,
                'image_url' => $input['image_url'] ?? null,
                'is_available' => isset($input['is_available']) ? (bool)$input['is_available'] : true
            ];

            $concessionId = $this->concessionModel->create($data);

            if ($concessionId) {
                $concession = $this->concessionModel->getById($concessionId);
                Response::success($concession, 'Tạo sản phẩm thành công', 201);
            } else {
                Response::serverError('Không thể tạo sản phẩm');
            }
        } catch (Exception $e) {
            Response::serverError('Lỗi khi tạo sản phẩm: ' . $e->getMessage());
        }
    }

    /**
     * Cập nhật concession (Manager)
     * PUT /api/concessions/:id
     */
    public function update($id)
    {
        try {
            $concession = $this->concessionModel->getById($id);

            if (!$concession) {
                Response::notFound('Không tìm thấy sản phẩm');
            }

            $input = json_decode(file_get_contents('php://input'), true);

            // Validation
            $errors = [];

            if (isset($input['name']) && empty($input['name'])) {
                $errors['name'] = 'Tên sản phẩm không được để trống';
            }

            if (isset($input['price']) && (!is_numeric($input['price']) || $input['price'] <= 0)) {
                $errors['price'] = 'Giá sản phẩm không hợp lệ';
            }

            if (!empty($errors)) {
                Response::validationError($errors);
            }

            // Prepare data for update
            $data = [];

            if (isset($input['name'])) {
                $data['name'] = trim($input['name']);
            }

            if (isset($input['price'])) {
                $data['price'] = floatval($input['price']);
            }

            if (isset($input['category'])) {
                $data['category'] = $input['category'];
            }

            if (isset($input['image_url'])) {
                $data['image_url'] = $input['image_url'];
            }

            if (isset($input['is_available'])) {
                $data['is_available'] = (bool)$input['is_available'];
            }

            $result = $this->concessionModel->update($id, $data);

            if ($result) {
                $updated = $this->concessionModel->getById($id);
                Response::success($updated, 'Cập nhật sản phẩm thành công');
            } else {
                Response::serverError('Không thể cập nhật sản phẩm');
            }
        } catch (Exception $e) {
            Response::serverError('Lỗi khi cập nhật: ' . $e->getMessage());
        }
    }

    /**
     * Xóa concession (Manager)
     * DELETE /api/concessions/:id
     */
    public function delete($id)
    {
        try {
            $concession = $this->concessionModel->getById($id);

            if (!$concession) {
                Response::notFound('Không tìm thấy sản phẩm');
            }

            $result = $this->concessionModel->delete($id);

            if ($result) {
                Response::success(['id' => $id], 'Xóa sản phẩm thành công');
            } else {
                Response::serverError('Không thể xóa sản phẩm');
            }
        } catch (Exception $e) {
            Response::serverError('Lỗi khi xóa: ' . $e->getMessage());
        }
    }

    /**
     * Lấy danh sách concessions đang bán
     * GET /api/concessions/available
     */
    public function getAvailable()
    {
        try {
            $concessions = $this->concessionModel->getAvailable();

            Response::success($concessions, 'Lấy danh sách sản phẩm đang bán thành công');
        } catch (Exception $e) {
            Response::serverError('Lỗi khi lấy danh sách: ' . $e->getMessage());
        }
    }
}
