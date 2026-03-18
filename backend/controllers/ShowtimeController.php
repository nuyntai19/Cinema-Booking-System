<?php
require_once __DIR__ . '/../models/Showtime.php';
require_once __DIR__ . '/../models/Cinema.php';
require_once __DIR__ . '/../models/CinemaHall.php';
require_once __DIR__ . '/../models/Seat.php';
require_once __DIR__ . '/../models/SeatType.php';
require_once __DIR__ . '/../models/PricingRule.php';
require_once __DIR__ . '/../models/Movie.php';
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

    /**
     * Chọn phim theo trọng số ưu tiên (weighted round-robin đơn giản)
     * @param array $candidates
     * @param array $prioritySet [movieId => true]
     * @param int $priorityWeight
     * @param int &$cursor
     * @param int|null $lastMovieId
     * @return array|null
     */
    private function pickMovieByWeight($candidates, $prioritySet, $priorityWeight, &$cursor, $lastMovieId = null)
    {
        if (empty($candidates)) {
            return null;
        }

        $pool = [];
        foreach ($candidates as $movie) {
            $movieId = (int) $movie['id'];
            $weight = isset($prioritySet[$movieId]) ? max(1, $priorityWeight) : 1;
            for ($i = 0; $i < $weight; $i++) {
                $pool[] = $movie;
            }
        }

        if (empty($pool)) {
            return null;
        }

        $poolSize = count($pool);
        $start = $cursor % $poolSize;

        // Cố tránh lặp ngay phim vừa chiếu nếu có lựa chọn khác
        for ($step = 0; $step < $poolSize; $step++) {
            $idx = ($start + $step) % $poolSize;
            $selected = $pool[$idx];
            if ($lastMovieId === null || (int) $selected['id'] !== (int) $lastMovieId || count($candidates) === 1) {
                $cursor = $idx + 1;
                return $selected;
            }
        }

        $selected = $pool[$start];
        $cursor = $start + 1;
        return $selected;
    }

    /**
     * Chọn phim theo cân bằng trọng số động:
     * - Phim ưu tiên có weight cao hơn
     * - Vẫn đảm bảo phim không ưu tiên có suất
     * - Chỉ chọn phim còn fit khung giờ còn lại
     */
    private function pickMovieBalancedForSlot(
        $candidates,
        $prioritySet,
        $priorityWeight,
        $dailyMovieCounts,
        $lastMovieId,
        DateTime $slotStart,
        DateTime $dayEnd,
        $sameSlotMovieCounts = [],
        $rerollToken = ''
    ) {
        $scored = [];

        foreach ($candidates as $movie) {
            $movieId = (int) ($movie['id'] ?? 0);
            $durationMinutes = (int) ($movie['duration'] ?? 0);
            if ($movieId <= 0 || $durationMinutes <= 0) {
                continue;
            }

            $slotStartStr = $slotStart->format('Y-m-d H:i:s');
            $endTime = $this->showtimeModel->calculateEndTime($slotStartStr, $durationMinutes);
            $endDate = new DateTime($endTime);

            // Khong fit slot con lai thi bo qua phim nay, nhung khong dung ca vong lap
            if ($endDate > $dayEnd) {
                continue;
            }

            $weight = isset($prioritySet[$movieId]) ? max(1, (int) $priorityWeight) : 1;
            $count = (int) ($dailyMovieCounts[$movieId] ?? 0);

            // Score cang nho cang duoc uu tien: count/weight
            $score = $count / $weight;

            // Giam tinh trang cung 1 khung gio tat ca phong deu chieu cung 1 phim
            $sameSlotCount = (int) ($sameSlotMovieCounts[$movieId] ?? 0);
            if ($sameSlotCount > 0) {
                $score += 0.6 * $sameSlotCount;
            }

            // Cho phep "xep lai" ra phuong an khac nhung van on dinh theo token
            if (!empty($rerollToken)) {
                $noiseKey = (string) $rerollToken . '|' . $slotStart->format('Y-m-d H:i') . '|' . $movieId . '|' . $count;
                $hash = abs((int) crc32($noiseKey));
                $score += ($hash % 1000) / 1000000;
            }

            $scored[] = [
                'movie' => $movie,
                'score' => $score,
                'count' => $count,
                'weight' => $weight,
            ];
        }

        if (empty($scored)) {
            return null;
        }

        usort($scored, function ($a, $b) {
            if ($a['score'] < $b['score'])
                return -1;
            if ($a['score'] > $b['score'])
                return 1;

            // Score bang nhau: uu tien phim it suat hon
            if ($a['count'] < $b['count'])
                return -1;
            if ($a['count'] > $b['count'])
                return 1;

            // Van bang nhau: uu tien phim weight cao hon
            if ($a['weight'] > $b['weight'])
                return -1;
            if ($a['weight'] < $b['weight'])
                return 1;

            return 0;
        });

        // Tranh lap lien tiep neu con lua chon khac
        if ($lastMovieId !== null && count($scored) > 1) {
            foreach ($scored as $item) {
                if ((int) $item['movie']['id'] !== (int) $lastMovieId) {
                    return $item['movie'];
                }
            }
        }

        return $scored[0]['movie'];
    }

    /**
     * POST /api/showtimes/auto-generate
     * Tạo suất chiếu tự động theo rạp, khoảng ngày và phim ưu tiên
     * Authorization: Manager/Admin
     */
    public function autoGenerate()
    {
        try {
            if (!$this->isAdminOrManager()) {
                return Response::error('Không có quyền truy cập', 403);
            }

            $input = json_decode(file_get_contents('php://input'), true) ?: [];

            $cinemaId = isset($input['cinema_id']) ? (int) $input['cinema_id'] : 0;
            $startDate = $input['start_date'] ?? '';
            $endDate = $input['end_date'] ?? '';
            $dayStartTime = $input['day_start_time'] ?? '09:00';
            $dayEndTime = $input['day_end_time'] ?? '23:00';
            $basePrice = isset($input['base_price']) ? (float) $input['base_price'] : 90000;
            $priorityMovieIds = isset($input['priority_movie_ids']) && is_array($input['priority_movie_ids'])
                ? array_values(array_unique(array_map('intval', $input['priority_movie_ids'])))
                : [];
            $excludedMovieIds = isset($input['excluded_movie_ids']) && is_array($input['excluded_movie_ids'])
                ? array_values(array_unique(array_map('intval', $input['excluded_movie_ids'])))
                : [];
            $priorityWeight = isset($input['priority_weight']) ? (int) $input['priority_weight'] : 3;
            $rerollToken = (string) ($input['reroll_token'] ?? '');
            $maxShowtimesPerHallPerDay = isset($input['max_showtimes_per_hall_per_day'])
                ? (int) $input['max_showtimes_per_hall_per_day']
                : 0;
            $dryRun = !empty($input['dry_run']);

            if ($cinemaId <= 0) {
                return Response::error('Thiếu cinema_id', 400);
            }

            if (!strtotime($startDate) || !strtotime($endDate)) {
                return Response::error('start_date hoặc end_date không hợp lệ', 400);
            }

            if (strtotime($startDate) > strtotime($endDate)) {
                return Response::error('start_date phải nhỏ hơn hoặc bằng end_date', 400);
            }

            if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $dayStartTime) || !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $dayEndTime)) {
                return Response::error('Định dạng giờ không hợp lệ (HH:mm)', 400);
            }

            if (strtotime("1970-01-01 {$dayStartTime}:00") >= strtotime("1970-01-01 {$dayEndTime}:00")) {
                return Response::error('day_start_time phải nhỏ hơn day_end_time', 400);
            }

            $cinema = $this->cinemaModel->getById($cinemaId);
            if (!$cinema) {
                return Response::error('Rạp không tồn tại', 404);
            }

            $halls = $this->hallModel->getByCinemaId($cinemaId);
            if (empty($halls)) {
                return Response::error('Rạp chưa có phòng chiếu', 400);
            }

            $movieModel = new Movie();
            $allMovies = $movieModel->getAll([], 1, 500);
            $allMovies = array_values(array_filter($allMovies, function ($m) {
                return isset($m['id']) && (int) ($m['duration'] ?? 0) > 0;
            }));

            if (empty($allMovies)) {
                return Response::error('Không có phim hợp lệ để xếp lịch (duration phải > 0)', 400);
            }

            // Dung tat ca phim hop le de lap lich (admin chu dong), khong gioi han chi Now Showing
            $movies = $allMovies;

            $prioritySet = [];
            foreach ($priorityMovieIds as $movieId) {
                $prioritySet[$movieId] = true;
            }

            $excludedSet = [];
            foreach ($excludedMovieIds as $movieId) {
                $excludedSet[$movieId] = true;
            }

            $priorityMovies = [];
            $missingPriorityMovieIds = [];
            if (!empty($prioritySet)) {
                $priorityMovies = array_values(array_filter($allMovies, function ($m) use ($prioritySet) {
                    return isset($prioritySet[(int) $m['id']]);
                }));

                if (empty($priorityMovies)) {
                    return Response::error('Không tìm thấy phim ưu tiên hợp lệ (kiểm tra trạng thái và duration)', 400);
                }

                foreach ($priorityMovieIds as $pid) {
                    $found = false;
                    foreach ($priorityMovies as $pm) {
                        if ((int) $pm['id'] === (int) $pid) {
                            $found = true;
                            break;
                        }
                    }
                    if (!$found) {
                        $missingPriorityMovieIds[] = (int) $pid;
                    }
                }
            }

            // Pool xep lich: tat ca phim hop le, phim uu tien se co trong so cao hon
            $schedulingMovieMap = [];
            foreach ($movies as $m) {
                $schedulingMovieMap[(int) $m['id']] = $m;
            }
            foreach ($priorityMovies as $pm) {
                $schedulingMovieMap[(int) $pm['id']] = $pm;
            }
            $schedulingMovies = array_values(array_filter($schedulingMovieMap, function ($m) use ($excludedSet) {
                return !isset($excludedSet[(int) $m['id']]);
            }));

            if (empty($schedulingMovies)) {
                return Response::error('Không còn phim nào để xếp lịch sau khi áp dụng danh sách loại trừ', 400);
            }

            $created = [];
            $skipped = 0;

            $start = new DateTime($startDate);
            $end = new DateTime($endDate);
            $end->setTime(0, 0, 0);

            for ($day = clone $start; $day <= $end; $day->modify('+1 day')) {
                $dateStr = $day->format('Y-m-d');

                // Dem theo ngay o cap do cinema de phan bo can bang giua nhieu phong
                $dailyTotal = 0;
                $dailyVN = 0;
                $dailyMovieCounts = [];
                foreach ($schedulingMovies as $sm) {
                    $dailyMovieCounts[(int) $sm['id']] = 0;
                }
                $slotMovieCounts = []; // key: Y-m-d H:i => [movieId => count]

                foreach ($halls as $hall) {
                    $hallId = (int) $hall['id'];
                    $current = new DateTime("{$dateStr} {$dayStartTime}:00");
                    $dayEnd = new DateTime("{$dateStr} {$dayEndTime}:00");
                    $lastMovieId = null;

                    while ($current < $dayEnd) {
                        if ($maxShowtimesPerHallPerDay > 0 && $dailyTotal >= $maxShowtimesPerHallPerDay) {
                            break;
                        }

                        // Luon xoay tren pool hon hop: phim uu tien + phim thuong
                        // Trong do phim uu tien co trong so lon hon nen xuat hien nhieu hon.
                        $candidates = $schedulingMovies;
                        $minQuota = Config::$min_vietnamese_quota ?? 15;
                        $requiredVNAfterAdd = (int) ceil((($dailyTotal + 1) * $minQuota) / 100);
                        $mustPickVietnam = $dailyVN < $requiredVNAfterAdd;

                        if ($mustPickVietnam) {
                            $vnOnly = array_values(array_filter($candidates, function ($m) {
                                return ($m['origin'] ?? '') === 'Vietnam';
                            }));

                            // Nếu nhóm hiện tại không có phim Việt mà quota bắt buộc, fallback sang toàn bộ phim
                            if (!empty($vnOnly)) {
                                $candidates = $vnOnly;
                            } else {
                                $vnFallback = array_values(array_filter($schedulingMovies, function ($m) {
                                    return ($m['origin'] ?? '') === 'Vietnam';
                                }));
                                if (!empty($vnFallback)) {
                                    $candidates = $vnFallback;
                                }
                            }
                        }

                        $selectedMovie = $this->pickMovieBalancedForSlot(
                            $candidates,
                            $prioritySet,
                            $priorityWeight,
                            $dailyMovieCounts,
                            $lastMovieId,
                            $current,
                            $dayEnd,
                            $slotMovieCounts[$current->format('Y-m-d H:i')] ?? [],
                            $rerollToken
                        );

                        if (!$selectedMovie) {
                            break;
                        }

                        $movieId = (int) $selectedMovie['id'];
                        $durationMinutes = (int) ($selectedMovie['duration'] ?? 0);
                        $startTime = $current->format('Y-m-d H:i:s');
                        $endTime = $this->showtimeModel->calculateEndTime($startTime, $durationMinutes);

                        $hasConflict = $this->showtimeModel->checkConflict($hallId, $startTime, $endTime);
                        if ($hasConflict) {
                            // Lùi 15 phút để thử vị trí kế tiếp, tránh vòng lặp vô hạn
                            $current->modify('+15 minutes');
                            $skipped++;
                            continue;
                        }

                        $newId = null;
                        if (!$dryRun) {
                            $newId = $this->showtimeModel->create([
                                'movie_id' => $movieId,
                                'cinema_hall_id' => $hallId,
                                'start_time' => $startTime,
                                'end_time' => $endTime,
                                'base_price' => $basePrice > 0 ? $basePrice : 90000,
                            ]);

                            if (!$newId) {
                                $skipped++;
                                $current->modify('+15 minutes');
                                continue;
                            }
                        }

                        $created[] = [
                            'id' => $newId ? (int) $newId : null,
                            'date' => $dateStr,
                            'hall_id' => $hallId,
                            'hall_name' => $hall['name'] ?? ('Hall #' . $hallId),
                            'movie_id' => $movieId,
                            'movie_title' => $selectedMovie['title'],
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                            'priority' => isset($prioritySet[$movieId]),
                        ];

                        $dailyTotal++;
                        $dailyMovieCounts[$movieId] = (int) ($dailyMovieCounts[$movieId] ?? 0) + 1;
                        $slotKey = (new DateTime($startTime))->format('Y-m-d H:i');
                        if (!isset($slotMovieCounts[$slotKey])) {
                            $slotMovieCounts[$slotKey] = [];
                        }
                        $slotMovieCounts[$slotKey][$movieId] = (int) ($slotMovieCounts[$slotKey][$movieId] ?? 0) + 1;
                        if (($selectedMovie['origin'] ?? '') === 'Vietnam') {
                            $dailyVN++;
                        }

                        $lastMovieId = $movieId;
                        $current = new DateTime($endTime);
                    }
                }
            }

            return Response::success([
                'message' => $dryRun ? 'Xem trước lịch chiếu tự động thành công' : 'Tạo suất chiếu tự động thành công',
                'summary' => [
                    'algorithm' => !empty($priorityMovies)
                        ? 'weighted round-robin (priority-biased) with vietnamese-quota fallback'
                        : 'weighted round-robin with vietnamese-quota',
                    'dry_run' => $dryRun,
                    'cinema_id' => $cinemaId,
                    'cinema_name' => $cinema['name'] ?? '',
                    'date_range' => ['start_date' => $startDate, 'end_date' => $endDate],
                    'halls' => count($halls),
                    'movies_considered' => count($movies),
                    'scheduling_pool_count' => count($schedulingMovies),
                    'priority_movies_found' => count($priorityMovies),
                    'priority_movie_ids' => $priorityMovieIds,
                    'priority_movie_ids_missing' => $missingPriorityMovieIds,
                    'excluded_movie_ids' => $excludedMovieIds,
                    'reroll_token' => $rerollToken,
                    'created_count' => count($created),
                    'skipped_count' => $skipped,
                ],
                'created_showtimes' => $created,
            ]);
        } catch (Exception $e) {
            error_log('ShowtimeController autoGenerate Error: ' . $e->getMessage());
            return Response::error('Lỗi khi tạo suất chiếu tự động', 500);
        }
    }
}
