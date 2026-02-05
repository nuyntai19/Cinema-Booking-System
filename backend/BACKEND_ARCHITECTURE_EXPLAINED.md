# 🏗️ GIẢI THÍCH KIẾN TRÚC BACKEND - DỄ HIỂU CHO NGƯỜI MỚI

> **Mục tiêu:** Giúp bạn hiểu rõ từng file trong backend làm gì, chúng kết nối với nhau như thế nào, và luồng xử lý request từ đầu đến cuối.

---

## 📚 MỤC LỤC

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Luồng xử lý request](#2-luồng-xử-lý-request)
3. [Giải thích từng file chi tiết](#3-giải-thích-từng-file-chi-tiết)
4. [Cách các file liên kết với nhau](#4-cách-các-file-liên-kết-với-nhau)
5. [Ví dụ thực tế đầy đủ](#5-ví-dụ-thực-tế-đầy-đủ)
6. [Best Practices](#6-best-practices)

---

## 1. TỔNG QUAN KIẾN TRÚC

### 🎯 Backend này sử dụng mô hình MVC (Model-View-Controller)

```
┌─────────────┐
│   REACT     │ ← Frontend (đã xong)
│  Frontend   │
└──────┬──────┘
       │ HTTP Request (JSON)
       │
┌──────▼──────────────────────────────────────┐
│           BACKEND PHP (MVC)                 │
│                                             │
│  ┌──────────┐    ┌──────────┐               │
│  │ .htaccess│───▶│index.php │              │
│  │ URL Rules│    │  Router  │               │
│  └──────────┘    └────┬─────┘               │
│                       │                     │
│                ┌──────▼──────┐              │
│                │ Middleware  │ (JWT check)  │
│                └──────┬──────┘              │
│                       │                     │
│                ┌──────▼──────────┐          │
│                │   CONTROLLER    │          │
│                │  (Logic nghiệp  │          │
│                │   vụ)           │          │
│                └──────┬──────────┘          │
│                       │                     │
│                ┌──────▼──────┐              │
│                │    MODEL    │              │
│                │  (Truy vấn  │              │
│                │   Database) │              │
│                └──────┬──────┘              │
│                       │                     │
│                ┌──────▼──────┐              │
│                │  DATABASE   │              │
│                │   (MySQL)   │              │
│                └─────────────┘              │
│                       │                     │
│                ┌──────▼──────┐              │
│                │   Response  │              │
│                │    (JSON)   │              │
│                └─────────────┘              │
└─────────────────────────────────────────────┘
       │
       │ HTTP Response (JSON)
       │
┌──────▼──────┐
│   REACT     │
│  Frontend   │
└─────────────┘
```

### 📁 Cấu trúc thư mục (hiện tại)

```
backend/
│
├── index.php              ← Cửa chính, định nghĩa 50+ routes
├── .htaccess             ← Bảo vệ viên, chuyển hướng URL
│
├── config/               ← Cấu hình hệ thống
│   ├── Database.php      ← Kết nối MySQL (1 lần duy nhất)
│   └── Config.php        ← Các thiết lập (JWT secret, thời gian giữ ghế...)
│
├── core/                 ← Trái tim hệ thống
│   ├── Router.php        ← Bộ điều phối, tìm Controller xử lý
│   └── Response.php      ← Chuẩn hóa JSON trả về
│
├── middleware/           ← Lớp kiểm tra trung gian
│   └── AuthMiddleware.php ← Kiểm tra JWT token, phân quyền
│
├── utils/                ← Công cụ hỗ trợ
│   ├── JWT.php           ← Mã hóa/giải mã token
│   └── Validator.php     ← Kiểm tra dữ liệu đầu vào
│
├── database/             ← SQL scripts
│   ├── schema.sql        ← Tạo 23 bảng + triggers
│   └── seed_data.sql     ← Dữ liệu mẫu để test
│
└── test_connection.php   ← Test kết nối DB (đã chạy ok)
```

---

## 2. LUỒNG XỬ LÝ REQUEST

### 🔄 Từng bước chi tiết khi user gọi API

```
[1] User nhấn nút "Đăng nhập" trên React
     ↓
[2] React gửi POST request
     URL: http://localhost/backend/api/auth/login
     Body: {"email": "user@gmail.com", "password": "123456"}
     ↓
[3] .htaccess bắt request
     - Kiểm tra: có phải file tĩnh? (css, js, image) → Không
     - Rewrite: Bỏ /backend/ khỏi URL
     - Chuyển tất cả request → index.php
     ↓
[4] index.php nhận request
     - Include tất cả file cần thiết (Router, Response, Controllers...)
     - Tạo $router = new Router()
     - Đọc danh sách 50+ routes đã định nghĩa
     ↓
[5] Router.php tìm route phù hợp
     - So sánh URL: /api/auth/login với pattern /api/auth/login
     - Tìm thấy: 'AuthController@login'
     - Extract parameters nếu có (:id, :code...)
     ↓
[6] Router gọi middleware (nếu có)
     - Kiểm tra JWT token trong header
     - Giải mã token → lấy user_id, role
     - Kiểm tra quyền: Admin? Manager? Staff?
     ↓
[7] Router gọi Controller
     - Tạo instance: $controller = new AuthController()
     - Gọi method: $controller->login()
     ↓
[8] AuthController xử lý logic
     - Lấy input: $email, $password từ $_POST
     - Validate: Email đúng format? Password không trống?
     - Gọi Model để truy vấn database
     ↓
[9] Model truy vấn Database
     - Tạo câu SQL: SELECT * FROM users WHERE email = ?
     - Dùng PDO prepared statement (tránh SQL injection)
     - Trả kết quả về Controller
     ↓
[10] Controller xử lý kết quả
     - Kiểm tra password với password_verify()
     - Tạo JWT token với JWT::encode()
     - Gọi Response::success() để chuẩn hóa JSON
     ↓
[11] Response trả về JSON
     {
       "success": true,
       "message": "Đăng nhập thành công",
       "data": {
         "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
         "user": {
           "id": 1,
           "email": "user@gmail.com",
           "role": "Member"
         }
       }
     }
     ↓
[12] React nhận response
     - Lưu token vào localStorage
     - Chuyển trang → Home
```

---

## 3. GIẢI THÍCH TỪNG FILE CHI TIẾT

### 📄 `index.php` - CỬA CHÍNH CỦA HỆ THỐNG

**Nhiệm vụ:** Điểm vào duy nhất, định nghĩa tất cả routes, dispatch request

```php
<?php
// 1. BẬT CORS - cho phép React (localhost:3000) gọi API
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

// 2. AUTOLOAD - tự động include files khi cần
spl_autoload_register(function ($class) {
    // Khi code gọi: new AuthController()
    // PHP tự động tìm file: controllers/AuthController.php
    // Không cần viết 50 dòng require_once nữa!
});

// 3. TẠO ROUTER
$router = new Router();

// 4. ĐỊNH NGHĨA ROUTES (50+ routes)
// Pattern: Method + URL + Controller@Method
$router->post('/api/auth/login', 'AuthController@login');
$router->post('/api/auth/register', 'AuthController@register');
$router->get('/api/movies', 'MovieController@index');
$router->get('/api/movies/:id', 'MovieController@show');
$router->post('/api/bookings', 'BookingController@create');
// ... 45 routes nữa

// 5. XỬ LÝ REQUEST
$router->dispatch();
// Router sẽ tự tìm controller phù hợp và gọi method
```

**Ví dụ thực tế:**

- User truy cập: `GET /api/movies/123`
- Router tìm thấy pattern: `/api/movies/:id`
- Router gọi: `MovieController->show(123)`

---

### 📄 `.htaccess` - BẢO VỆ VIÊN

**Nhiệm vụ:** Chuyển hướng tất cả requests qua index.php, ẩn .php khỏi URL

```apache
# 1. BẬT REWRITE ENGINE
RewriteEngine On

# 2. RULE 1: Nếu file/folder tồn tại thật → cho qua
# Ví dụ: /backend/test_connection.php → truy cập trực tiếp
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# 3. RULE 2: Còn lại → chuyển về index.php
# /api/movies/123 → index.php?url=api/movies/123
RewriteRule ^(.*)$ index.php [QSA,L]

# 4. CORS HEADERS - cho phép React gọi API
Header set Access-Control-Allow-Origin "*"
```

**Tại sao cần .htaccess?**

- **Không có .htaccess:** URL xấu như `/index.php?controller=movie&action=show&id=123`
- **Có .htaccess:** URL đẹp như `/api/movies/123`

---

### 📄 `config/Database.php` - KẾT NỐI MYSQL

**Nhiệm vụ:** Tạo kết nối PDO đến MySQL, đảm bảo chỉ kết nối 1 lần (Singleton)

```php
<?php
class Database {
    private static $instance = null;  // Lưu instance duy nhất
    private $connection;

    // 1. THÔNG TIN KẾT NỐI
    private $host = 'localhost';
    private $dbname = 'galaxy_cinema';
    private $username = 'root';
    private $password = '';

    // 2. CONSTRUCTOR PRIVATE - không cho new từ bên ngoài
    private function __construct() {
        try {
            // Tạo kết nối PDO
            $this->connection = new PDO(
                "mysql:host={$this->host};dbname={$this->dbname};charset=utf8mb4",
                $this->username,
                $this->password
            );

            // Set chế độ báo lỗi
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        } catch(PDOException $e) {
            die("Connection failed: " . $e->getMessage());
        }
    }

    // 3. LẤY INSTANCE (Singleton Pattern)
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    // 4. LẤY CONNECTION
    public function getConnection() {
        return $this->connection;
    }
}
```

**Tại sao dùng Singleton?**

```php
// SAI - tạo nhiều kết nối (lãng phí resources)
$db1 = new PDO(...);
$db2 = new PDO(...);
$db3 = new PDO(...);

// ĐÚNG - chỉ tạo 1 kết nối, dùng chung
$db = Database::getInstance()->getConnection();
```

**Sử dụng trong Model:**

```php
class Movie {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll() {
        $sql = "SELECT * FROM movies";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
}
```

---

### 📄 `config/Config.php` - CÀI ĐẶT HỆ THỐNG

**Nhiệm vụ:** Lưu các hằng số, thiết lập toàn hệ thống (1 chỗ, dễ sửa)

```php
<?php
class Config {
    // 1. JWT SETTINGS - Mã hóa token
    const JWT_SECRET = 'galaxy_cinema_super_secret_key_2024';
    const JWT_EXPIRATION = 86400; // 24 giờ (đơn vị: giây)

    // 2. BOOKING SETTINGS - Quy tắc đặt vé
    const SEAT_HOLD_DURATION = 600; // Giữ ghế 10 phút (600 giây)
    const CLEANUP_DURATION = 15;    // Dọn dẹp mỗi 15 phút

    // 3. CURFEW TIMES - Giờ giới nghiêm theo tuổi
    const CURFEW_U13 = '22:00:00';  // Dưới 13 tuổi phải về trước 10 giờ đêm
    const CURFEW_U16 = '23:00:00';  // Dưới 16 tuổi phải về trước 11 giờ đêm

    // 4. LOYALTY SETTINGS - Tích điểm
    const LOYALTY_POINTS_RATE = 10000; // 10,000 VNĐ = 1 điểm

    // 5. MOVIE QUOTA - Định mức phim Việt
    const MIN_VIETNAMESE_QUOTA = 15; // 15% số suất chiếu phải là phim Việt

    // 6. UPLOAD SETTINGS - Tải ảnh
    const UPLOAD_DIR = 'uploads/';
    const MAX_FILE_SIZE = 5242880; // 5MB
}
```

**Sử dụng:**

```php
// Tạo JWT token với secret key
$token = JWT::encode($payload, Config::JWT_SECRET);

// Kiểm tra ghế có hết hạn giữ chưa
$holdExpired = time() > ($holdTime + Config::SEAT_HOLD_DURATION);

// Tính điểm loyalty
$points = $totalAmount / Config::LOYALTY_POINTS_RATE;
```

**Lợi ích:**

- Sửa 1 chỗ → toàn bộ hệ thống áp dụng
- Dễ quản lý, không phải search khắp code

---

### 📄 `core/Router.php` - BỘ ĐIỀU PHỐI

**Nhiệm vụ:** Nhận URL, tìm Controller phù hợp, gọi method xử lý

```php
<?php
class Router {
    private $routes = [];  // Lưu tất cả routes

    // 1. ĐĂNG KÝ ROUTE CHO TỪNG HTTP METHOD
    public function get($pattern, $handler) {
        $this->routes['GET'][$pattern] = $handler;
    }

    public function post($pattern, $handler) {
        $this->routes['POST'][$pattern] = $handler;
    }

    public function put($pattern, $handler) {
        $this->routes['PUT'][$pattern] = $handler;
    }

    public function delete($pattern, $handler) {
        $this->routes['DELETE'][$pattern] = $handler;
    }

    // 2. XỬ LÝ REQUEST
    public function dispatch() {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Bỏ /backend/ khỏi URI nếu có
        $uri = str_replace('/backend', '', $uri);

        // Tìm route phù hợp
        foreach ($this->routes[$method] as $pattern => $handler) {
            // Chuyển pattern thành regex
            // /api/movies/:id → /api/movies/([a-zA-Z0-9_-]+)
            $regex = preg_replace('/:\w+/', '([a-zA-Z0-9_-]+)', $pattern);
            $regex = '#^' . $regex . '$#';

            if (preg_match($regex, $uri, $matches)) {
                // Tìm thấy! Extract params
                array_shift($matches); // Bỏ match đầu tiên

                // Gọi controller
                return $this->callController($handler, $matches);
            }
        }

        // Không tìm thấy route → 404
        Response::notFound('Endpoint not found');
    }

    // 3. GỌI CONTROLLER
    private function callController($handler, $params) {
        // Handler format: "MovieController@show"
        list($controllerName, $method) = explode('@', $handler);

        // Tạo instance controller
        $controller = new $controllerName();

        // Gọi method với params
        return call_user_func_array([$controller, $method], $params);
    }
}
```

**Ví dụ hoạt động:**

```php
// Route đã đăng ký
$router->get('/api/movies/:id', 'MovieController@show');

// User request: GET /api/movies/123
// Router:
// 1. Match pattern: /api/movies/:id
// 2. Extract: :id = 123
// 3. Gọi: MovieController->show(123)
```

**Hỗ trợ nhiều parameters:**

```php
$router->get('/api/cinemas/:cinemaId/halls/:hallId', 'CinemaController@getHall');
// GET /api/cinemas/5/halls/12
// → CinemaController->getHall(5, 12)
```

---

### 📄 `core/Response.php` - CHUẨN HÓA JSON

**Nhiệm vụ:** Tạo response JSON đồng nhất, dễ xử lý ở Frontend

```php
<?php
class Response {
    // 1. SUCCESS RESPONSE (200)
    public static function success($data = [], $message = 'Success', $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 2. ERROR RESPONSE (400, 500)
    public static function error($message = 'Error', $code = 400, $errors = []) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 3. CREATED (201) - Tạo mới thành công
    public static function created($data = [], $message = 'Created') {
        self::success($data, $message, 201);
    }

    // 4. NOT FOUND (404)
    public static function notFound($message = 'Not found') {
        self::error($message, 404);
    }

    // 5. UNAUTHORIZED (401) - Chưa đăng nhập
    public static function unauthorized($message = 'Unauthorized') {
        self::error($message, 401);
    }

    // 6. FORBIDDEN (403) - Không có quyền
    public static function forbidden($message = 'Forbidden') {
        self::error($message, 403);
    }

    // 7. VALIDATION ERROR (422)
    public static function validationError($errors = []) {
        self::error('Validation failed', 422, $errors);
    }

    // 8. PAGINATED RESPONSE
    public static function paginated($data, $total, $page, $limit) {
        $lastPage = ceil($total / $limit);

        self::success([
            'items' => $data,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'lastPage' => $lastPage
            ]
        ]);
    }
}
```

**Sử dụng trong Controller:**

```php
class MovieController {
    public function show($id) {
        $movie = $this->movieModel->getById($id);

        if (!$movie) {
            Response::notFound('Không tìm thấy phim');
        }

        Response::success($movie, 'Lấy thông tin phim thành công');
    }
}
```

**Output JSON:**

```json
{
  "success": true,
  "message": "Lấy thông tin phim thành công",
  "data": {
    "id": 123,
    "title": "MAI",
    "duration": 131,
    "release_date": "2024-02-10"
  }
}
```

---

### 📄 `middleware/AuthMiddleware.php` - KIỂM TRA ĐĂNG NHẬP

**Nhiệm vụ:** Kiểm tra JWT token, xác thực user, phân quyền

```php
<?php
class AuthMiddleware {
    // 1. XÁC THỰC - Kiểm tra có token hợp lệ không
    public static function authenticate() {
        // Lấy token từ header
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';

        // Format: "Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            Response::unauthorized('Token không hợp lệ');
        }

        $token = $matches[1];

        // Giải mã token
        try {
            $decoded = JWT::decode($token, Config::JWT_SECRET);

            // Lưu thông tin user vào $_REQUEST để Controller dùng
            $_REQUEST['user_id'] = $decoded->user_id;
            $_REQUEST['role'] = $decoded->role;

            return $decoded;

        } catch (Exception $e) {
            Response::unauthorized('Token hết hạn hoặc không hợp lệ');
        }
    }

    // 2. PHÂN QUYỀN - Kiểm tra role
    public static function requireRole($allowedRoles = []) {
        $user = self::authenticate();

        if (!in_array($user->role, $allowedRoles)) {
            Response::forbidden('Bạn không có quyền truy cập');
        }

        return $user;
    }

    // 3. SHORTCUTS - Các helper functions
    public static function requireAdmin() {
        return self::requireRole(['Admin']);
    }

    public static function requireManager() {
        return self::requireRole(['Admin', 'Manager']);
    }

    public static function requireStaff() {
        return self::requireRole(['Admin', 'Manager', 'Staff']);
    }
}
```

**Sử dụng trong Controller:**

```php
class MovieController {
    // PUBLIC - Ai cũng xem được
    public function index() {
        $movies = $this->movieModel->getAll();
        Response::success($movies);
    }

    // CHỈ ADMIN - Thêm phim mới
    public function create() {
        // Kiểm tra phải Admin mới được thêm
        AuthMiddleware::requireAdmin();

        $data = $_POST;
        $movie = $this->movieModel->create($data);
        Response::created($movie, 'Thêm phim thành công');
    }

    // MANAGER/ADMIN - Cập nhật phim
    public function update($id) {
        AuthMiddleware::requireManager();

        $data = $_POST;
        $this->movieModel->update($id, $data);
        Response::success([], 'Cập nhật thành công');
    }
}
```

**Flow kiểm tra:**

```
Request → Middleware → Controller
   ↓
Header: Authorization: Bearer <token>
   ↓
Middleware giải mã token
   ↓
Lấy user_id = 5, role = "Member"
   ↓
Kiểm tra role có trong allowedRoles?
   ↓
   ├─ YES → Cho qua → Controller xử lý
   └─ NO  → 403 Forbidden
```

---

### 📄 `utils/JWT.php` - MÃ HÓA TOKEN

**Nhiệm vụ:** Tạo và giải mã JSON Web Token (JWT) cho authentication

```php
<?php
class JWT {
    // 1. MÃ HÓA - Tạo token từ data
    public static function encode($payload, $secret) {
        // Header: Loại token và thuật toán
        $header = json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256'  // HMAC-SHA256
        ]);

        // Payload: Dữ liệu user + thời gian hết hạn
        $payload['exp'] = time() + Config::JWT_EXPIRATION;
        $payload = json_encode($payload);

        // Base64 URL encode
        $base64Header = self::base64UrlEncode($header);
        $base64Payload = self::base64UrlEncode($payload);

        // Signature: Ký để bảo mật
        $signature = hash_hmac(
            'sha256',
            $base64Header . '.' . $base64Payload,
            $secret,
            true
        );
        $base64Signature = self::base64UrlEncode($signature);

        // Kết hợp: header.payload.signature
        return $base64Header . '.' . $base64Payload . '.' . $base64Signature;
    }

    // 2. GIẢI MÃ - Đọc token
    public static function decode($jwt, $secret) {
        // Tách token thành 3 phần
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            throw new Exception('Token không hợp lệ');
        }

        list($base64Header, $base64Payload, $base64Signature) = $parts;

        // Verify signature - Kiểm tra token có bị giả mạo không
        $signature = self::base64UrlDecode($base64Signature);
        $expectedSignature = hash_hmac(
            'sha256',
            $base64Header . '.' . $base64Payload,
            $secret,
            true
        );

        if (!hash_equals($expectedSignature, $signature)) {
            throw new Exception('Signature không hợp lệ');
        }

        // Decode payload
        $payload = json_decode(self::base64UrlDecode($base64Payload));

        // Kiểm tra hết hạn
        if (isset($payload->exp) && $payload->exp < time()) {
            throw new Exception('Token đã hết hạn');
        }

        return $payload;
    }

    // 3. HELPER - Base64 URL safe
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
```

**Ví dụ sử dụng:**

```php
// KHI ĐĂNG NHẬP - Tạo token
$payload = [
    'user_id' => 123,
    'email' => 'user@gmail.com',
    'role' => 'Member'
];
$token = JWT::encode($payload, Config::JWT_SECRET);
// → "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjox..."

// KHI GỌI API - Giải mã token
$decoded = JWT::decode($token, Config::JWT_SECRET);
echo $decoded->user_id;  // → 123
echo $decoded->role;     // → "Member"
```

**JWT Format:**

```
eyJ0eXAiOiJKV1QiLCJhbGc.eyJ1c2VyX2lkIjoxMjM.dBjftJeZ4CVP
└────────┬────────────┘ └─────┬──────┘ └────┬────┘
       Header          Payload      Signature
```

---

### 📄 `utils/Validator.php` - KIỂM TRA DỮ LIỆU

**Nhiệm vụ:** Validate input từ user, tránh dữ liệu lỗi vào database

```php
<?php
class Validator {
    private $data;
    private $errors = [];

    public function __construct($data) {
        $this->data = $data;
    }

    // 1. KIỂM TRA BẮT BUỘC
    public function required($fields) {
        foreach ($fields as $field) {
            if (!isset($this->data[$field]) || trim($this->data[$field]) === '') {
                $this->errors[$field] = "Trường {$field} là bắt buộc";
            }
        }
        return $this;
    }

    // 2. KIỂM TRA EMAIL
    public function email($field) {
        if (isset($this->data[$field])) {
            if (!filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
                $this->errors[$field] = "Email không hợp lệ";
            }
        }
        return $this;
    }

    // 3. KIỂM TRA ĐỘ DÀI TỐI THIỂU
    public function min($field, $min) {
        if (isset($this->data[$field])) {
            if (strlen($this->data[$field]) < $min) {
                $this->errors[$field] = "Tối thiểu {$min} ký tự";
            }
        }
        return $this;
    }

    // 4. KIỂM TRA ĐỘ DÀI TỐI ĐA
    public function max($field, $max) {
        if (isset($this->data[$field])) {
            if (strlen($this->data[$field]) > $max) {
                $this->errors[$field] = "Tối đa {$max} ký tự";
            }
        }
        return $this;
    }

    // 5. KIỂM TRA SỐ ĐIỆN THOẠI VIỆT NAM
    public function phone($field) {
        if (isset($this->data[$field])) {
            $pattern = '/^(0|\+84)[0-9]{9}$/';
            if (!preg_match($pattern, $this->data[$field])) {
                $this->errors[$field] = "Số điện thoại không hợp lệ";
            }
        }
        return $this;
    }

    // 6. KIỂM TRA NGÀY
    public function date($field) {
        if (isset($this->data[$field])) {
            $d = DateTime::createFromFormat('Y-m-d', $this->data[$field]);
            if (!$d || $d->format('Y-m-d') !== $this->data[$field]) {
                $this->errors[$field] = "Ngày không hợp lệ (Y-m-d)";
            }
        }
        return $this;
    }

    // 7. KIỂM TRA SỐ
    public function numeric($field) {
        if (isset($this->data[$field])) {
            if (!is_numeric($this->data[$field])) {
                $this->errors[$field] = "Phải là số";
            }
        }
        return $this;
    }

    // 8. KIỂM TRA TRONG DANH SÁCH
    public function inArray($field, $array) {
        if (isset($this->data[$field])) {
            if (!in_array($this->data[$field], $array)) {
                $this->errors[$field] = "Giá trị không hợp lệ";
            }
        }
        return $this;
    }

    // 9. KẾT QUẢ
    public function fails() {
        return !empty($this->errors);
    }

    public function passes() {
        return empty($this->errors);
    }

    public function errors() {
        return $this->errors;
    }
}
```

**Sử dụng trong Controller:**

```php
class AuthController {
    public function register() {
        $data = $_POST;

        // Validate
        $validator = new Validator($data);
        $validator->required(['email', 'password', 'full_name', 'phone'])
                  ->email('email')
                  ->min('password', 6)
                  ->phone('phone');

        // Nếu có lỗi → trả về 422
        if ($validator->fails()) {
            Response::validationError($validator->errors());
        }

        // OK → tiếp tục xử lý
        $this->userModel->create($data);
        Response::created([], 'Đăng ký thành công');
    }
}
```

**Output khi validation fail:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email không hợp lệ",
    "password": "Tối thiểu 6 ký tự",
    "phone": "Số điện thoại không hợp lệ"
  }
}
```

---

## 4. CÁCH CÁC FILE LIÊN KẾT VỚI NHAU

### 🔗 Sơ đồ quan hệ chi tiết

```
┌─────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                       │
│              (http://localhost:3000)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP Request
                     │ POST /backend/api/auth/login
                     │ Body: {email, password}
                     ↓
┌─────────────────────────────────────────────────────────┐
│                    .htaccess                            │
│  - Bắt request                                          │
│  - Rewrite: /backend/api/auth/login → /api/auth/login  │
│  - Forward to: index.php                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   index.php                             │
│  1. Include: Router, Response, Controllers, Models      │
│  2. Tạo: $router = new Router()                         │
│  3. Đăng ký routes:                                     │
│     $router->post('/api/auth/login',                    │
│                   'AuthController@login')               │
│  4. Gọi: $router->dispatch()                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              core/Router.php                            │
│  1. Nhận: POST /api/auth/login                          │
│  2. So khớp với pattern: /api/auth/login                │
│  3. Tìm thấy: 'AuthController@login'                    │
│  4. Tạo: $controller = new AuthController()             │
│  5. Gọi: $controller->login()                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│          controllers/AuthController.php                 │
│  ┌─────────────────────────────────────────────┐        │
│  │ public function login() {                   │        │
│  │   // 1. Lấy input                           │        │
│  │   $email = $_POST['email'];                 │        │
│  │   $password = $_POST['password'];           │        │
│  │                                             │        │
│  │   // 2. Validate                            │        │
│  │   $validator = new Validator($_POST);       │───┐    │
│  │   $validator->required(['email','password'])│   │    │
│  │             ->email('email');               │   │    │
│  │   if ($validator->fails()) {                │   │    │
│  │     Response::validationError(...);         │───┼──┐ │
│  │   }                                         │   │  │ │
│  │                                             │   │  │ │
│  │   // 3. Gọi Model                           │   │  │ │
│  │   $user = $this->userModel                  │   │  │ │
│  │               ->findByEmail($email);        │───┼──┼─┼─┐
│  │                                             │   │  │ │ │
│  │   // 4. Kiểm tra password                   │   │  │ │ │
│  │   if (!password_verify($password,           │   │  │ │ │
│  │                        $user['password'])) {│   │  │ │ │
│  │     Response::error('Sai mật khẩu');        │───┼──┘ │ │
│  │   }                                         │   │    │ │
│  │                                             │   │    │ │
│  │   // 5. Tạo JWT token                       │   │    │ │
│  │   $payload = [                              │   │    │ │
│  │     'user_id' => $user['id'],               │   │    │ │
│  │     'role' => $user['role']                 │   │    │ │
│  │   ];                                        │   │    │ │
│  │   $token = JWT::encode($payload,            │───┼────┼─┼─┐
│  │              Config::JWT_SECRET);           │───┼────┼─┼─┼─┐
│  │                                             │   │    │ │ │ │
│  │   // 6. Trả response                        │   │    │ │ │ │
│  │   Response::success([                       │───┼────┼─┘ │ │
│  │     'token' => $token,                      │   │    │   │ │
│  │     'user' => $user                         │   │    │   │ │
│  │   ]);                                       │   │    │   │ │
│  │ }                                           │   │    │   │ │
│  └─────────────────────────────────────────────┘   │    │   │ │
└────────────────────────────────────────────────────┼────┼───┼─┼─┘
                     │                               │    │   │ │
        ┌────────────┴────────────┐                  │    │   │ │
        ↓                         ↓                  │    │   │ │
┌─────────────────┐      ┌─────────────────┐        │    │   │ │
│ utils/          │      │  models/        │←───────┘    │   │ │
│ Validator.php   │      │  User.php       │             │   │ │
│                 │      │                 │             │   │ │
│ - required()    │      │ - findByEmail() │─────────┐   │   │ │
│ - email()       │      │ - create()      │         │   │   │ │
│ - min()         │      │ - update()      │         ↓   │   │ │
└─────────────────┘      └─────────────────┘  ┌──────────────┐│ │
                                              │  config/     ││ │
        ┌─────────────────────────────────────│ Database.php ││ │
        │                                     │              ││ │
        │                                     │ getInstance()││ │
        │                                     │ PDO connect  ││ │
        │                                     └──────────────┘│ │
        │                                            ↓        │ │
        │                                     ┌──────────────┐│ │
        │                                     │   MySQL      ││ │
        │                                     │  Database    ││ │
        │                                     └──────────────┘│ │
        │                                                     │ │
        ↓                                                     │ │
┌─────────────────┐                                          │ │
│ utils/JWT.php   │←─────────────────────────────────────────┘ │
│                 │                                            │
│ - encode()      │  ┌─────────────────┐                      │
│ - decode()      │  │ config/         │←─────────────────────┘
└─────────────────┘  │ Config.php      │
        │            │                 │
        │            │ JWT_SECRET      │
        │            │ JWT_EXPIRATION  │
        │            └─────────────────┘
        ↓
┌─────────────────┐
│ core/           │
│ Response.php    │
│                 │
│ - success()     │
│ - error()       │
│ - created()     │
└────────┬────────┘
         │
         │ JSON Response
         ↓
┌─────────────────────────────────────────────────────────┐
│                  REACT FRONTEND                         │
│  - Nhận token                                           │
│  - Lưu vào localStorage                                 │
│  - Dùng cho các request tiếp theo                       │
└─────────────────────────────────────────────────────────┘
```

### 📊 Bảng dependency (ai dùng ai)

| File               | Dùng File Nào                                                      | Mục Đích                                                                                                                  |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **index.php**      | Router.php<br>Response.php<br>Controllers<br>Models                | - Tạo router<br>- Load tất cả classes                                                                                     |
| **Router.php**     | Controllers<br>Response.php                                        | - Tạo instance Controller<br>- Trả 404 nếu không tìm thấy                                                                 |
| **Controllers**    | Models<br>Validator<br>JWT<br>Response<br>Config<br>AuthMiddleware | - Gọi Model để query DB<br>- Validate input<br>- Tạo/kiểm tra token<br>- Trả response<br>- Lấy config<br>- Kiểm tra quyền |
| **Models**         | Database<br>Config                                                 | - Kết nối DB<br>- Lấy constants                                                                                           |
| **AuthMiddleware** | JWT<br>Response<br>Config                                          | - Giải mã token<br>- Trả 401/403<br>- Lấy JWT secret                                                                      |
| **JWT.php**        | Config                                                             | - Lấy JWT_SECRET<br>- Lấy JWT_EXPIRATION                                                                                  |
| **Database.php**   | (không)                                                            | - Độc lập                                                                                                                 |
| **Config.php**     | (không)                                                            | - Chỉ chứa constants                                                                                                      |
| **Validator.php**  | (không)                                                            | - Độc lập                                                                                                                 |
| **Response.php**   | (không)                                                            | - Độc lập                                                                                                                 |

---

## 5. VÍ DỤ THỰC TẾ ĐẦY ĐỦ

### 🎬 Kịch bản: User đặt vé xem phim

#### **Bước 1: Đăng nhập** (POST /api/auth/login)

**Frontend gửi:**

```javascript
fetch("http://localhost/backend/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@gmail.com",
    password: "123456",
  }),
});
```

**Backend xử lý:**

```
.htaccess → index.php → Router → AuthController@login
                                      ↓
                                  Validator: Check email/password
                                      ↓
                                  User Model: findByEmail()
                                      ↓
                                  Database: SELECT * FROM users WHERE email=?
                                      ↓
                                  password_verify()
                                      ↓
                                  JWT::encode() → tạo token
                                      ↓
                                  Response::success()
```

**Backend trả về:**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJh...",
    "user": {
      "id": 5,
      "email": "user@gmail.com",
      "full_name": "Nguyễn Văn A",
      "role": "Member"
    }
  }
}
```

---

#### **Bước 2: Xem danh sách phim** (GET /api/movies)

**Frontend gửi:**

```javascript
fetch("http://localhost/backend/api/movies?status=Now Showing");
```

**Backend xử lý:**

```
Router → MovieController@index
            ↓
        Get $_GET['status'] = 'Now Showing'
            ↓
        Movie Model: getAll($status)
            ↓
        Database: SELECT * FROM movies WHERE status=?
            ↓
        Response::success($movies)
```

**Backend trả về:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "MAI",
      "duration": 131,
      "age_rating": "T13",
      "status": "Now Showing"
    },
    {
      "id": 2,
      "title": "Đào Phở và Piano",
      "duration": 110,
      "age_rating": "P",
      "status": "Now Showing"
    }
  ]
}
```

---

#### **Bước 3: Chọn suất chiếu** (GET /api/movies/1/showtimes)

**Frontend gửi:**

```javascript
fetch("http://localhost/backend/api/movies/1/showtimes?date=2026-02-10");
```

**Backend xử lý:**

```
Router → MovieController@getShowtimes(1)
            ↓
        Extract :id = 1
        Get $_GET['date'] = '2026-02-10'
            ↓
        Showtime Model: getByMovie($movieId, $date)
            ↓
        Database: SELECT s.*, c.name as cinema_name, ch.name as hall_name
                  FROM showtimes s
                  JOIN cinema_halls ch ON s.cinema_hall_id = ch.id
                  JOIN cinemas c ON ch.cinema_id = c.id
                  WHERE s.movie_id = ? AND DATE(s.start_time) = ?
            ↓
        Response::success($showtimes)
```

**Backend trả về:**

```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "movie_id": 1,
      "cinema_name": "Galaxy Nguyễn Du",
      "hall_name": "Rạp 1",
      "start_time": "2026-02-10 14:00:00",
      "end_time": "2026-02-10 16:11:00",
      "base_price": 75000
    },
    {
      "id": 102,
      "cinema_name": "Galaxy Nguyễn Du",
      "hall_name": "Rạp 2",
      "start_time": "2026-02-10 19:30:00",
      "end_time": "2026-02-10 21:41:00",
      "base_price": 85000
    }
  ]
}
```

---

#### **Bước 4: Xem ghế trống** (GET /api/showtimes/101/seats)

**Frontend gửi:**

```javascript
fetch("http://localhost/backend/api/showtimes/101/seats");
```

**Backend xử lý:**

```
Router → ShowtimeController@getAvailableSeats(101)
            ↓
        Showtime Model: getAvailableSeats($showtimeId)
            ↓
        Database: SELECT s.*, st.name as type_name, st.price_multiplier,
                         CASE
                           WHEN t.id IS NULL THEN 'available'
                           WHEN t.status = 'HOLDING' THEN 'holding'
                           WHEN t.status = 'SOLD' THEN 'sold'
                         END as seat_status
                  FROM seats s
                  JOIN seat_types st ON s.seat_type_id = st.id
                  LEFT JOIN tickets t ON s.id = t.seat_id
                                     AND t.showtime_id = ?
                                     AND t.status IN ('HOLDING','SOLD')
                  WHERE s.cinema_hall_id = ?
            ↓
        Response::success($seats)
```

**Backend trả về:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "row": "A",
      "number": 1,
      "type": "Standard",
      "status": "available"
    },
    {
      "id": 2,
      "row": "A",
      "number": 2,
      "type": "Standard",
      "status": "available"
    },
    {
      "id": 3,
      "row": "A",
      "number": 3,
      "type": "Standard",
      "status": "holding"
    },
    { "id": 4, "row": "A", "number": 4, "type": "Standard", "status": "sold" },
    { "id": 20, "row": "C", "number": 5, "type": "VIP", "status": "available" },
    {
      "id": 30,
      "row": "E",
      "number": 8,
      "type": "Sweetbox",
      "status": "available"
    }
  ]
}
```

---

#### **Bước 5: Đặt vé** (POST /api/bookings)

**Frontend gửi:**

```javascript
fetch("http://localhost/backend/api/bookings", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJh...", // ← Token từ bước 1
  },
  body: JSON.stringify({
    showtime_id: 101,
    seat_ids: [1, 2], // Chọn ghế A1, A2
    concession_ids: [1, 2], // Bắp và nước
    voucher_id: null,
  }),
});
```

**Backend xử lý:**

```
Router → AuthMiddleware::authenticate()
            ↓
        Decode JWT token → user_id = 5
            ↓
        BookingController@create()
            ↓
        1. Validate input (Validator)
        2. Check ghế còn trống? (Seat Model)
        3. Tính tổng tiền:
           - Giá vé: base_price × seat_type_multiplier × pricing_rules
           - Giá bắp nước: sum(concession_price × quantity)
        4. Áp dụng giảm giá: membership_discount
        5. Tạo booking (Booking Model)
        6. Tạo tickets với status='HOLDING', hold_expires_at = now + 10 phút
        7. Response::created()
```

**Backend trả về:**

```json
{
  "success": true,
  "message": "Đặt vé thành công. Vui lòng thanh toán trong 10 phút",
  "data": {
    "booking_id": 501,
    "booking_code": "GC20260210501",
    "total_amount": 180000,
    "discount_amount": 18000,
    "final_amount": 162000,
    "hold_expires_at": "2026-02-10 14:15:00",
    "tickets": [
      {
        "ticket_id": 1001,
        "ticket_code": "GC1001QRCODE",
        "seat": "A1",
        "status": "HOLDING"
      },
      {
        "ticket_id": 1002,
        "ticket_code": "GC1002QRCODE",
        "seat": "A2",
        "status": "HOLDING"
      }
    ]
  }
}
```

---

#### **Bước 6: Thanh toán** (POST /api/bookings/501/confirm)

**Frontend gửi:**

```javascript
fetch("http://localhost/backend/api/bookings/501/confirm", {
  method: "POST",
  headers: {
    Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJh...",
  },
  body: JSON.stringify({
    payment_method: "Momo",
    transaction_code: "MOMO123456789",
  }),
});
```

**Backend xử lý:**

```
Router → AuthMiddleware → BookingController@confirm(501)
            ↓
        1. Check booking thuộc về user hiện tại
        2. Check booking status = 'Pending'
        3. Check tickets chưa hết hạn HOLDING
        4. Update booking.status = 'Paid'
        5. Update tickets.status = 'SOLD'
        6. Create transaction record
        7. Add loyalty points: amount / 10000
        8. Send notification
        9. Response::success()
```

**Backend trả về:**

```json
{
  "success": true,
  "message": "Thanh toán thành công!",
  "data": {
    "booking_code": "GC20260210501",
    "tickets": [
      {
        "ticket_code": "GC1001QRCODE",
        "qr_url": "https://api.qrserver.com/v1/create-qr-code/?data=GC1001QRCODE",
        "seat": "A1"
      },
      {
        "ticket_code": "GC1002QRCODE",
        "qr_url": "https://api.qrserver.com/v1/create-qr-code/?data=GC1002QRCODE",
        "seat": "A2"
      }
    ],
    "loyalty_points_earned": 16
  }
}
```

---

#### **Bước 7: Staff quét vé tại cổng** (POST /api/tickets/check)

**Frontend gửi:**

```javascript
fetch("http://localhost/backend/api/tickets/check", {
  method: "POST",
  headers: {
    Authorization: "Bearer <staff_token>",
  },
  body: JSON.stringify({
    ticket_code: "GC1001QRCODE",
  }),
});
```

**Backend xử lý:**

```
Router → AuthMiddleware::requireStaff()
            ↓
        Check role = 'Staff' hoặc 'Manager' hoặc 'Admin'
            ↓
        TicketController@check()
            ↓
        1. Ticket Model: getByCode($code)
        2. Check ticket.status = 'SOLD'
        3. Check showtime chưa bắt đầu
        4. Update ticket.status = 'USED', used_at = NOW()
        5. Response::success()
```

**Backend trả về:**

```json
{
  "success": true,
  "message": "Vé hợp lệ! Cho khách vào",
  "data": {
    "ticket_code": "GC1001QRCODE",
    "movie": "MAI",
    "showtime": "2026-02-10 14:00",
    "seat": "A1",
    "customer": "Nguyễn Văn A"
  }
}
```

---

## 6. BEST PRACTICES

### ✅ Những điều NÊN LÀM

#### 1. **Luôn dùng Prepared Statements**

```php
// ❌ SAI - Dễ bị SQL Injection
$sql = "SELECT * FROM users WHERE email = '{$email}'";
$result = $db->query($sql);

// ✅ ĐÚNG - An toàn
$sql = "SELECT * FROM users WHERE email = ?";
$stmt = $db->prepare($sql);
$stmt->execute([$email]);
```

#### 2. **Validate tất cả input**

```php
// ✅ ĐÚNG
$validator = new Validator($_POST);
$validator->required(['email', 'password'])
          ->email('email')
          ->min('password', 6);

if ($validator->fails()) {
    Response::validationError($validator->errors());
}
```

#### 3. **Dùng try-catch cho database operations**

```php
// ✅ ĐÚNG
try {
    $db->beginTransaction();

    $booking = $bookingModel->create($data);
    $tickets = $ticketModel->createBatch($booking['id'], $seats);

    $db->commit();

} catch (Exception $e) {
    $db->rollBack();
    Response::error('Lỗi tạo booking: ' . $e->getMessage(), 500);
}
```

#### 4. **Hash passwords**

```php
// ✅ ĐÚNG - Khi tạo user
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

// ✅ ĐÚNG - Khi đăng nhập
if (password_verify($inputPassword, $user['password'])) {
    // OK
}
```

#### 5. **Chuẩn hóa response**

```php
// ✅ ĐÚNG - Luôn dùng Response class
Response::success($data, 'Success');
Response::error('Error message', 400);
Response::notFound('Resource not found');
```

#### 6. **Phân quyền rõ ràng**

```php
// ✅ ĐÚNG
public function delete($id) {
    // Chỉ Admin mới được xóa
    AuthMiddleware::requireAdmin();

    $this->movieModel->delete($id);
    Response::success([], 'Xóa thành công');
}
```

---

### ❌ Những điều KHÔNG NÊN LÀM

#### 1. **Không bao giờ lưu password dạng plain text**

```php
// ❌ SAI - Nguy hiểm!
INSERT INTO users (password) VALUES ('123456')

// ✅ ĐÚNG
$hashed = password_hash('123456', PASSWORD_BCRYPT);
INSERT INTO users (password) VALUES ('$2y$10$...')
```

#### 2. **Không hardcode credentials**

```php
// ❌ SAI
$db = new PDO('mysql:host=localhost', 'root', 'my_secret_password');

// ✅ ĐÚNG - Dùng Config hoặc .env
$db = new PDO(
    "mysql:host=" . Config::DB_HOST,
    Config::DB_USER,
    Config::DB_PASSWORD
);
```

#### 3. **Không trả về lỗi chi tiết cho user**

```php
// ❌ SAI - Lộ thông tin hệ thống
catch (Exception $e) {
    Response::error($e->getMessage()); // Có thể lộ cấu trúc DB
}

// ✅ ĐÚNG
catch (Exception $e) {
    error_log($e->getMessage()); // Log để dev xem
    Response::error('Có lỗi xảy ra, vui lòng thử lại', 500);
}
```

#### 4. **Không tin tưởng client input**

```php
// ❌ SAI - Trust user input
$role = $_POST['role']; // User có thể gửi role='Admin'!
INSERT INTO users (role) VALUES ($role)

// ✅ ĐÚNG - Luôn validate và set default
$role = 'Member'; // Default cho user mới đăng ký
```

#### 5. **Không để token vào URL**

```php
// ❌ SAI - Token trong URL có thể bị log
GET /api/movies?token=eyJ0eXAi...

// ✅ ĐÚNG - Token trong header
GET /api/movies
Authorization: Bearer eyJ0eXAi...
```

---

## 📚 TÀI LIỆU THAM KHẢO

### Đọc thêm về:

- **MVC Pattern:** https://www.tutorialspoint.com/mvc_framework/
- **RESTful API:** https://restfulapi.net/
- **JWT:** https://jwt.io/introduction
- **PDO:** https://www.php.net/manual/en/book.pdo.php
- **SQL Injection:** https://owasp.org/www-community/attacks/SQL_Injection
- **Password Hashing:** https://www.php.net/manual/en/function.password-hash.php

---

## 🎯 CHECKLIST - Bạn đã hiểu chưa?

- [ ] Tôi hiểu luồng request đi từ React → Backend → Database → Response
- [ ] Tôi biết `.htaccess` làm gì và tại sao cần nó
- [ ] Tôi hiểu `Router` match URL như thế nào
- [ ] Tôi biết cách `Controller` gọi `Model` và nhận data
- [ ] Tôi hiểu `Singleton Pattern` trong `Database.php`
- [ ] Tôi biết `JWT` hoạt động ra sao (encode/decode)
- [ ] Tôi hiểu `AuthMiddleware` kiểm tra token và phân quyền
- [ ] Tôi biết `Validator` validate input như thế nào
- [ ] Tôi hiểu `Response` chuẩn hóa JSON
- [ ] Tôi biết cách debug khi có lỗi (đọc error log, test_connection.php)

---

## 💡 LỜI KẾT

Backend này sử dụng **MVC thuần** (không dùng framework Laravel/Symfony), nên bạn sẽ hiểu rõ từng chi tiết:

- **Request routing** hoạt động như thế nào
- **Authentication** với JWT
- **Authorization** với role-based access
- **Database** với PDO và Singleton
- **Validation** đầu vào
- **Response** chuẩn hóa

Khi hiểu rõ backend này, bạn sẽ dễ dàng học các framework khác (Laravel, CodeIgniter, Symfony) vì chúng đều dựa trên các khái niệm tương tự!

---

**🚀 NEXT STEPS:**

1. Đọc lại file này 2-3 lần để nắm vững
2. Chạy thử các API endpoint với Postman
3. Bắt đầu code Controllers theo phân công
4. Test từng API sau khi code xong
5. Hỏi nếu có gì chưa hiểu!

**Good luck với backend! 💪**
