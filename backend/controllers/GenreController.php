<?php
require_once __DIR__ . '/../models/Genre.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../config/Config.php';

class GenreController
{
    private $genreModel;

    public function __construct()
    {
        $this->genreModel = new Genre();
    }

    /**
     * Helper: Get current user from JWT token
     */
    private function getCurrentUser()
    {
        try {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            if (empty($authHeader)) return null;
            $token = str_replace('Bearer ', '', $authHeader);
            $payload = JWT::decode($token, Config::$jwt_secret);
            return $payload;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Helper: Check if user is admin or manager (role_id 4=Manager, 5=Admin)
     */
    private function isAdminOrManager(): bool
    {
        $user = $this->getCurrentUser();
        if (!$user) return false;
        return in_array($user['role_id'], [4, 5]);
    }

    /**
     * Helper: Check if user is admin only (role_id 5=Admin)
     */
    private function isAdmin(): bool
    {
        $user = $this->getCurrentUser();
        if (!$user) return false;
        return $user['role_id'] === 5;
    }

    /**
     * GET /api/genres - Lấy tất cả thể loại
     */
    public function index()
    {
        try {
            $genres = $this->genreModel->getAll();
            Response::success(['genres' => $genres]);
        } catch (Exception $e) {
            error_log("Genre API Error: " . $e->getMessage());
            Response::error('Lỗi khi lấy danh sách thể loại', 500);
        }
    }

    /**
     * GET /api/genres/:id - Lấy chi tiết thể loại
     */
    public function show($id)
    {
        try {
            $genre = $this->genreModel->getById($id);
            
            if (!$genre) {
                Response::error('Không tìm thấy thể loại', 404);
                return;
            }

            Response::success(['genre' => $genre]);
        } catch (Exception $e) {
            error_log("Genre API Error: " . $e->getMessage());
            Response::error('Lỗi khi lấy chi tiết thể loại', 500);
        }
    }

    /**
     * POST /api/genres - Tạo thể loại mới (Admin/Manager)
     */
    public function create()
    {
        try {
            if (!$this->isAdminOrManager()) {
                Response::error('Không có quyền thực hiện thao tác này', 403);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (empty($input['name'])) {
                Response::error('Tên thể loại không được để trống', 400);
                return;
            }

            $data = [
                'name' => trim($input['name']),
                'description' => isset($input['description']) ? trim($input['description']) : null
            ];

            $genreId = $this->genreModel->create($data);
            if (!$genreId) {
                Response::error('Không thể tạo thể loại', 500);
                return;
            }

            $genre = $this->genreModel->getById($genreId);
            Response::success(['genre' => $genre, 'message' => 'Tạo thể loại thành công'], 201);
        } catch (Exception $e) {
            error_log("Genre Create Error: " . $e->getMessage());
            Response::error('Lỗi khi tạo thể loại: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/genres/:id - Cập nhật thể loại (Admin/Manager)
     */
    public function update($id)
    {
        try {
            if (!$this->isAdminOrManager()) {
                Response::error('Không có quyền thực hiện thao tác này', 403);
                return;
            }

            $genre = $this->genreModel->getById($id);
            if (!$genre) {
                Response::error('Không tìm thấy thể loại', 404);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (empty($input['name'])) {
                Response::error('Tên thể loại không được để trống', 400);
                return;
            }

            $data = [
                'name' => trim($input['name']),
                'description' => isset($input['description']) ? trim($input['description']) : ($genre['description'] ?? null)
            ];

            $result = $this->genreModel->update($id, $data);
            if (!$result) {
                Response::error('Không thể cập nhật thể loại', 500);
                return;
            }

            $updatedGenre = $this->genreModel->getById($id);
            Response::success(['genre' => $updatedGenre, 'message' => 'Cập nhật thể loại thành công']);
        } catch (Exception $e) {
            error_log("Genre Update Error: " . $e->getMessage());
            Response::error('Lỗi khi cập nhật thể loại', 500);
        }
    }

    /**
     * DELETE /api/genres/:id - Xóa thể loại (Admin only)
     * Không thể xóa thể loại đang được sử dụng bởi phìm
     */
    public function delete($id)
    {
        try {
            if (!$this->isAdmin()) {
                Response::error('Chỉ Admin mới có thể xóa thể loại', 403);
                return;
            }

            $genre = $this->genreModel->getById($id);
            if (!$genre) {
                Response::error('Không tìm thấy thể loại', 404);
                return;
            }

            $result = $this->genreModel->delete($id);
            if ($result === false) {
                Response::error('Không thể xóa thể loại này vì đang được gắn với ' . ($genre['movie_count'] ?? 0) . ' phim. Hãy gỡ thể loại khỏi các phim trước.', 409);
                return;
            }

            Response::success(['message' => 'Xóa thể loại thành công']);
        } catch (Exception $e) {
            error_log("Genre Delete Error: " . $e->getMessage());
            Response::error('Lỗi khi xóa thể loại', 500);
        }
    }
}

