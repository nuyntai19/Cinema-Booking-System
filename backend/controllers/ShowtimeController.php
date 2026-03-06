<?php
require_once __DIR__ . '/../models/Showtime.php';
require_once __DIR__ . '/../models/Cinema.php';
require_once __DIR__ . '/../models/CinemaHall.php';
require_once __DIR__ . '/../models/Seat.php';
require_once __DIR__ . '/../models/SeatType.php';
require_once __DIR__ . '/../models/PricingRule.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../config/Config.php';

/**
 * ShowtimeController
 * Quản lý suất chiếu
 * Phụ trách: SƠN
 */
class ShowtimeController
{
    private $showtimeModel;
    private $cinemaModel;
    private $hallModel;
    private $seatModel;
    private $seatTypeModel;
    private $pricingModel;

    public function __construct()
    {
        $this->showtimeModel = new Showtime();
        $this->cinemaModel = new Cinema();
        $this->hallModel = new CinemaHall();
        $this->seatModel = new Seat();
        $this->seatTypeModel = new SeatType();
        $this->pricingModel = new PricingRule();
    }

    /**
     * Helper: Get current user from JWT token
     */
    private function getCurrentUser()
    {
        try {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';

            if (empty($authHeader)) {
                return null;
            }

            $token = str_replace('Bearer ', '', $authHeader);
            $payload = JWT::decode($token, Config::$jwt_secret);

            return $payload;
        } catch (Exception $e) {
            error_log("JWT decode error in ShowtimeController: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Helper: Check if user is admin or manager
     */
    private function isAdminOrManager()
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return false;
        }

        // role_id: 4 = Manager, 5 = Admin
        return in_array($user['role_id'], [4, 5]);
    }

    /**
     * GET /api/showtimes
     * Lấy danh sách suất chiếu
     * Public access
     */
    public function index()
    {
        try {
            $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

            $filters = [];
            if (isset($_GET['date']))
                $filters['date'] = $_GET['date'];
            if (isset($_GET['cinema_id']))
                $filters['cinema_id'] = (int) $_GET['cinema_id'];
            if (isset($_GET['movie_id']))
                $filters['movie_id'] = (int) $_GET['movie_id'];
            if (isset($_GET['hall_id']))
                $filters['hall_id'] = (int) $_GET['hall_id'];

            $showtimes = $this->showtimeModel->getAll($filters, $page, $limit);
            $total = $this->showtimeModel->count($filters);

            $totalPages = ceil($total / $limit);

            return Response::success([
                'showtimes' => $showtimes,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'total_pages' => $totalPages
                ]
            ]);

        } catch (Exception $e) {
            error_log("ShowtimeController Index Error: " . $e->getMessage());
            return Response::error('Lỗi khi lấy danh sách suất chiếu', 500);
        }
    }

    /**
     * GET /api/showtimes/:id
     * Chi tiết suất chiếu
     * Public access
     */
    public function show($id)
    {
        try {
            $showtime = $this->showtimeModel->getById($id);

            if (!$showtime) {
                return Response::error('Không tìm thấy suất chiếu', 404);
            }

            return Response::success([
                'showtime' => $showtime
            ]);

        } catch (Exception $e) {
            error_log("ShowtimeController Show Error: " . $e->getMessage());
            return Response::error('Lỗi khi lấy thông tin suất chiếu', 500);
        }
    }

    /**
     * POST /api/showtimes
     * Tạo suất chiếu mới
     * Authorization: Manager/Admin
     * Validates: conflict check + VN quota
     */
    public function create()
    {
        try {
            if (!$this->isAdminOrManager()) {
                return Response::error('Không có quyền truy cập', 403);
            }

            $input = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            $requiredFields = ['movie_id', 'cinema_hall_id', 'start_time'];
            foreach ($requiredFields as $field) {
                if (empty($input[$field])) {
                    return Response::error("Thiếu trường bắt buộc: {$field}", 400);
                }
            }

            // Validate start_time format
            $startTime = $input['start_time'];
            if (!strtotime($startTime)) {
                return Response::error('Thời gian bắt đầu không hợp lệ', 400);
            }

            // Validate hall exists
            $hall = $this->hallModel->getById($input['cinema_hall_id']);
            if (!$hall) {
                return Response::error('Phòng chiếu không tồn tại', 404);
            }

            // Validate movie exists — lấy duration để tính end_time
            require_once __DIR__ . '/../models/Movie.php';
            $movieModel = new Movie();
            $movie = $movieModel->getById($input['movie_id']);
            if (!$movie) {
                return Response::error('Phim không tồn tại', 404);
            }

            // Tính end_time = start_time + duration + cleanup
            $durationMinutes = (int) ($movie['duration'] ?? 0);
            if ($durationMinutes <= 0) {
                error_log("Warning: Movie duration is 0 or missing for movie_id " . $movie['id']);
            }
            $endTime = $this->showtimeModel->calculateEndTime($startTime, $durationMinutes);
            $input['end_time'] = $endTime;

            // Check conflict — trùng lịch trong cùng phòng
            $hasConflict = $this->showtimeModel->checkConflict(
                $input['cinema_hall_id'],
                $startTime,
                $endTime
            );

            if ($hasConflict) {
                return Response::error('Trùng lịch chiếu! Đã có suất chiếu khác trong phòng này vào thời gian đó', 409);
            }

            // Check Vietnamese quota
            $cinemaId = $hall['cinema_id'];
            $date = date('Y-m-d', strtotime($startTime));
            $quota = $this->showtimeModel->checkVietnameseQuota($cinemaId, $date);

            // Nếu thêm phim ngoại mà tỷ lệ phim Việt sẽ dưới 15% → cảnh báo
            if ($movie['origin'] === 'International' && !$quota['passed']) {
                return Response::error(
                    "Tỷ lệ phim Việt (" . $quota['percentage'] . "%) dưới mức tối thiểu 15%. Vui lòng thêm suất chiếu phim Việt trước.",
                    400
                );
            }

            // Create showtime
            $showtimeId = $this->showtimeModel->create($input);

            if (!$showtimeId) {
                return Response::error('Không thể tạo suất chiếu', 500);
            }

            $showtime = $this->showtimeModel->getById($showtimeId);

            return Response::success([
                'message' => 'Tạo suất chiếu thành công',
                'showtime' => $showtime
            ], 201);

        } catch (Exception $e) {
            error_log("ShowtimeController Create Error: " . $e->getMessage());
            return Response::error('Lỗi khi tạo suất chiếu', 500);
        }
    }

    /**
     * PUT /api/showtimes/:id
     * Cập nhật suất chiếu
     * Authorization: Manager/Admin
     */
    public function update($id)
    {
        try {
            if (!$this->isAdminOrManager()) {
                return Response::error('Không có quyền truy cập', 403);
            }

            $showtime = $this->showtimeModel->getById($id);
            if (!$showtime) {
                return Response::error('Không tìm thấy suất chiếu', 404);
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (empty($input)) {
                return Response::error('Không có dữ liệu cập nhật', 400);
            }

            // Nếu thay đổi thời gian hoặc phòng → kiểm tra conflict
            $hallId = $input['cinema_hall_id'] ?? $showtime['cinema_hall_id'];
            $startTime = $input['start_time'] ?? $showtime['start_time'];

            // Tính lại end_time nếu đổi start_time hoặc movie
            if (isset($input['start_time']) || isset($input['movie_id'])) {
                $movieId = $input['movie_id'] ?? $showtime['movie_id'];
                require_once __DIR__ . '/../models/Movie.php';
                $movieModel = new Movie();
                $movie = $movieModel->getById($movieId);

                if (!$movie) {
                    return Response::error('Phim không tồn tại', 404);
                }

                $durationMinutes = (int) ($movie['duration'] ?? 0);
                if ($durationMinutes <= 0) {
                    error_log("Warning: Movie duration is 0 or missing for movie_id " . $movie['id']);
                }
                $endTime = $this->showtimeModel->calculateEndTime($startTime, $durationMinutes);
                $input['end_time'] = $endTime;
            } else {
                $endTime = $showtime['end_time'];
            }

            // Check conflict (exclude self)
            if (isset($input['start_time']) || isset($input['cinema_hall_id']) || isset($input['movie_id'])) {
                $hasConflict = $this->showtimeModel->checkConflict($hallId, $startTime, $endTime, $id);

                if ($hasConflict) {
                    return Response::error('Trùng lịch chiếu! Đã có suất chiếu khác trong phòng này vào thời gian đó', 409);
                }
            }

            $result = $this->showtimeModel->update($id, $input);

            if (!$result) {
                return Response::error('Không thể cập nhật suất chiếu', 500);
            }

            $updatedShowtime = $this->showtimeModel->getById($id);

            return Response::success([
                'message' => 'Cập nhật suất chiếu thành công',
                'showtime' => $updatedShowtime
            ]);

        } catch (Exception $e) {
            error_log("ShowtimeController Update Error: " . $e->getMessage());
            return Response::error('Lỗi khi cập nhật suất chiếu', 500);
        }
    }

    /**
     * DELETE /api/showtimes/:id
     * Xóa suất chiếu
     * Authorization: Manager/Admin
     */
    public function delete($id)
    {
        try {
            if (!$this->isAdminOrManager()) {
                return Response::error('Không có quyền truy cập', 403);
            }

            $showtime = $this->showtimeModel->getById($id);
            if (!$showtime) {
                return Response::error('Không tìm thấy suất chiếu', 404);
            }

            $result = $this->showtimeModel->delete($id);

            if (!$result) {
                return Response::error('Không thể xóa suất chiếu', 500);
            }

            return Response::success([
                'message' => 'Xóa suất chiếu thành công'
            ]);

        } catch (Exception $e) {
            error_log("ShowtimeController Delete Error: " . $e->getMessage());
            return Response::error('Lỗi khi xóa suất chiếu', 500);
        }
    }

    /**
     * GET /api/showtimes/:id/seats
     * Lấy danh sách ghế trống cho suất chiếu
     * Public access
     */
    public function getAvailableSeats($id)
    {
        try {
            $showtime = $this->showtimeModel->getById($id);
            if (!$showtime) {
                return Response::error('Không tìm thấy suất chiếu', 404);
            }

            $availableSeats = $this->showtimeModel->getAvailableSeats($id);

            // Tính giá cho từng ghế dựa trên pricing rules
            $date = date('Y-m-d', strtotime($showtime['start_time']));
            $time = date('H:i:s', strtotime($showtime['start_time']));
            $basePrice = (float) ($showtime['base_price'] ?? 90000);
            if ($basePrice <= 0)
                $basePrice = 90000;

            foreach ($availableSeats as &$seat) {
                $seat['calculated_price'] = $this->pricingModel->applyToPrice(
                    $basePrice,
                    $date,
                    $time,
                    (float) $seat['price_multiplier']
                );
            }
            unset($seat);

            return Response::success([
                'showtime' => [
                    'id' => $showtime['id'],
                    'movie_title' => $showtime['movie_title'],
                    'hall_name' => $showtime['hall_name'],
                    'cinema_name' => $showtime['cinema_name'],
                    'start_time' => $showtime['start_time']
                ],
                'available_seats' => $availableSeats,
                'total_available' => count($availableSeats)
            ]);

        } catch (Exception $e) {
            error_log("ShowtimeController GetAvailableSeats Error: " . $e->getMessage());
            return Response::error('Lỗi khi lấy ghế trống', 500);
        }
    }

    /**
     * GET /api/showtimes/:id/seat-map
     * Sơ đồ ghế đầy đủ với trạng thái từng ghế
     * Public access
     */
    public function getSeatMap($id)
    {
        try {
            $showtime = $this->showtimeModel->getById($id);
            if (!$showtime) {
                return Response::error('Không tìm thấy suất chiếu', 404);
            }

            $hallId = $showtime['cinema_hall_id'];

            // Lấy tất cả ghế trong phòng
            $allSeats = $this->seatModel->getByHallId($hallId);

            // Tính giá và status cho từng ghế
            $date = date('Y-m-d', strtotime($showtime['start_time']));
            $time = date('H:i:s', strtotime($showtime['start_time']));
            $basePrice = (float) ($showtime['base_price'] ?? 90000);
            if ($basePrice <= 0)
                $basePrice = 90000;

            $seatMap = [];
            foreach ($allSeats as $seat) {
                $status = $this->seatModel->getSeatStatus($seat['id'], $id);

                $seatMap[] = [
                    'id' => $seat['id'],
                    'row_code' => $seat['row_code'],
                    'number' => $seat['number'],
                    'seat_type' => $seat['seat_type_name'],
                    'price_multiplier' => $seat['price_multiplier'],
                    'status' => ($seat['status'] !== 'Active') ? 'Maintenance' : $status,
                    'calculated_price' => $this->pricingModel->applyToPrice(
                        $basePrice,
                        $date,
                        $time,
                        (float) $seat['price_multiplier']
                    )
                ];
            }

            // Nhóm theo hàng
            $seatsByRow = [];
            foreach ($seatMap as $seat) {
                $seatsByRow[$seat['row_code']][] = $seat;
            }

            return Response::success([
                'showtime' => [
                    'id' => $showtime['id'],
                    'movie_title' => $showtime['movie_title'],
                    'hall_name' => $showtime['hall_name'],
                    'cinema_name' => $showtime['cinema_name'],
                    'start_time' => $showtime['start_time']
                ],
                'seat_map' => $seatsByRow,
                'summary' => [
                    'total_seats' => count($seatMap),
                    'available' => count(array_filter($seatMap, fn($s) => $s['status'] === 'Available')),
                    'holding' => count(array_filter($seatMap, fn($s) => $s['status'] === 'HOLDING')),
                    'sold' => count(array_filter($seatMap, fn($s) => $s['status'] === 'SOLD')),
                    'maintenance' => count(array_filter($seatMap, fn($s) => $s['status'] === 'Maintenance'))
                ]
            ]);

        } catch (Exception $e) {
            error_log("ShowtimeController GetSeatMap Error: " . $e->getMessage());
            return Response::error('Lỗi khi lấy sơ đồ ghế', 500);
        }
    }
}
