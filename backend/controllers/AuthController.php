<?php
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/UserProfile.php';
require_once __DIR__ . '/../utils/EmailService.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../config/Config.php';

class AuthController {
    private $userModel;
    private $userProfileModel;
    private $emailService;
    
    // File path để lưu verification codes
    private $codesFilePath;
    
    public function __construct() {
        $this->userModel = new User();
        $this->userProfileModel = new UserProfile();
        $this->emailService = new EmailService();
        $this->codesFilePath = __DIR__ . '/../uploads/verification_codes.json';
        
        // Tạo thư mục uploads nếu chưa có
        if (!file_exists(__DIR__ . '/../uploads')) {
            mkdir(__DIR__ . '/../uploads', 0777, true);
        }
    }
    
    /**
     * Đọc verification codes từ file
     */
    private function getVerificationCodes() {
        if (!file_exists($this->codesFilePath)) {
            return [];
        }
        $content = file_get_contents($this->codesFilePath);
        return json_decode($content, true) ?: [];
    }
    
    /**
     * Lưu verification codes vào file
     */
    private function saveVerificationCodes($codes) {
        file_put_contents($this->codesFilePath, json_encode($codes, JSON_PRETTY_PRINT));
    }
    
    /**
     * Xóa codes đã hết hạn
     */
    private function cleanExpiredCodes() {
        $codes = $this->getVerificationCodes();
        $now = time();
        $codes = array_filter($codes, function($item) use ($now) {
            return $item['expires_at'] > $now;
        });
        $this->saveVerificationCodes($codes);
    }
    
    /**
     * POST /api/auth/send-verification
     * Gửi mã xác minh email
     */
    public function sendVerification() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate input
            $required = ['email', 'fullName', 'phone', 'dob', 'password'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return Response::error("Thiếu thông tin: $field", 400);
                }
            }
            
            $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
            
            // Validate email format
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return Response::error('Email không hợp lệ', 400);
            }
            
            // Kiểm tra email đã tồn tại chưa
            if ($this->userModel->findByEmail($email)) {
                return Response::error('Email đã được sử dụng', 409);
            }
            
            // Validate phone
            if (!preg_match('/^[0-9]{10,11}$/', $data['phone'])) {
                return Response::error('Số điện thoại không hợp lệ (10-11 số)', 400);
            }
            
            // Validate DOB
            $dob = new DateTime($data['dob']);
            $today = new DateTime();
            $age = $today->diff($dob)->y;
            
            if ($age < 13) {
                return Response::error('Bạn phải đủ 13 tuổi để đăng ký', 400);
            }
            
            // Validate password
            if (strlen($data['password']) < 6) {
                return Response::error('Mật khẩu phải có ít nhất 6 ký tự', 400);
            }
            
            // Generate 6-digit verification code
            $verificationCode = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // Lưu code vào file (expire sau 5 phút)
            $codes = $this->getVerificationCodes();
            $codes[$email] = [
                'code' => $verificationCode,
                'data' => $data,
                'expires_at' => time() + 300 // 5 minutes
            ];
            $this->saveVerificationCodes($codes);
            $this->cleanExpiredCodes(); // Dọn dẹp codes cũ
            
            // Gửi email
            $sent = $this->emailService->sendVerificationCode($email, $data['fullName'], $verificationCode);
            
            if (!$sent) {
                return Response::error('Không thể gửi email. Vui lòng thử lại', 500);
            }
            
            return Response::success([
                'message' => 'Mã xác minh đã được gửi đến email của bạn',
                'expiresIn' => 300
            ]);
            
        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * POST /api/auth/verify-email
     * Xác minh mã và tạo tài khoản
     */
    public function verifyEmail() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['email']) || empty($data['code'])) {
                return Response::error('Email và mã xác minh không được để trống', 400);
            }
            
            $email = $data['email'];
            $code = $data['code'];
            
            // Đọc codes từ file
            $codes = $this->getVerificationCodes();
            
            // Kiểm tra code có tồn tại không
            if (!isset($codes[$email])) {
                return Response::error('Mã xác minh không tồn tại hoặc đã hết hạn', 400);
            }
            
            $verification = $codes[$email];
            
            // Kiểm tra code đã hết hạn chưa
            if (time() > $verification['expires_at']) {
                unset($codes[$email]);
                $this->saveVerificationCodes($codes);
                return Response::error('Mã xác minh đã hết hạn', 400);
            }
            
            // Kiểm tra code có đúng không
            if ($code !== $verification['code']) {
                return Response::error('Mã xác minh không đúng', 400);
            }
            
            // Code hợp lệ - Tạo tài khoản
            $userData = $verification['data'];
            
            // Hash password
            $passwordHash = password_hash($userData['password'], PASSWORD_BCRYPT, ['cost' => 10]);
            
            // Tạo user
            $userId = $this->userModel->create([
                'email' => $email,
                'password_hash' => $passwordHash,
                'role_id' => 2, // Member (default)
                'status' => 'Active'
            ]);
            
            if (!$userId) {
                return Response::error('Không thể tạo tài khoản', 500);
            }
            
            // Tạo user profile
            $profileCreated = $this->userProfileModel->create([
                'user_id' => $userId,
                'full_name' => $userData['fullName'],
                'phone' => $userData['phone'],
                'dob' => $userData['dob'],
                'membership_id' => 1 // Bronze (default)
            ]);
            
            if (!$profileCreated) {
                // Rollback user creation nếu tạo profile thất bại
                $this->userModel->delete($userId);
                return Response::error('Không thể tạo hồ sơ người dùng', 500);
            }
            
            // Xóa verification code khỏi file
            $codes = $this->getVerificationCodes();
            unset($codes[$email]);
            $this->saveVerificationCodes($codes);
            
            return Response::success([
                'message' => 'Đăng ký tài khoản thành công!',
                'userId' => $userId
            ], 201);
            
        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * POST /api/auth/login
     * Đăng nhập
     */
    public function login() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['email']) || empty($data['password'])) {
                return Response::error('Email và mật khẩu không được để trống', 400);
            }
            
            $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
            
            // Tìm user theo email
            $user = $this->userModel->findByEmail($email);
            
            if (!$user) {
                return Response::error('Email hoặc mật khẩu không đúng', 401);
            }
            
            // Kiểm tra status
            if ($user['status'] !== 'Active') {
                return Response::error('Tài khoản đã bị khóa', 403);
            }
            
            // Verify password
            if (!password_verify($data['password'], $user['password_hash'])) {
                return Response::error('Email hoặc mật khẩu không đúng', 401);
            }
            
            // Generate JWT token
            $token = JWT::encode([
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role_id' => $user['role_id'],
                'exp' => time() + Config::$jwt_expiration
            ], Config::$jwt_secret);
            
            // Lấy thông tin profile
            $profile = $this->userProfileModel->getByUserId($user['id']);
            
            return Response::success([
                'message' => 'Đăng nhập thành công',
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'role_id' => $user['role_id'],
                    'full_name' => $profile['full_name'] ?? '',
                    'avatar' => $profile['avatar'] ?? null,
                    'current_points' => $user['current_points']
                ]
            ]);
            
        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * POST /api/auth/logout
     * Đăng xuất (invalidate token - client side)
     */
    public function logout() {
        return Response::success([
            'message' => 'Đăng xuất thành công'
        ]);
    }
    
    /**
     * GET /api/auth/me
     * Lấy thông tin user hiện tại (cần JWT token)
     */
    public function getCurrentUser() {
        try {
            // Get token from header
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (empty($authHeader)) {
                return Response::error('Không tìm thấy token xác thực', 401);
            }
            
            // Extract token
            $token = str_replace('Bearer ', '', $authHeader);
            
            // Decode JWT
            $payload = JWT::decode($token, Config::$jwt_secret);
            
            if (!$payload) {
                return Response::error('Token không hợp lệ', 401);
            }
            
            // Get user info
            $user = $this->userModel->findById($payload['user_id']);
            
            if (!$user) {
                return Response::error('Người dùng không tồn tại', 404);
            }
            
            $profile = $this->userProfileModel->getByUserId($user['id']);
            
            return Response::success([
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'role_id' => $user['role_id'],
                    'full_name' => $profile['full_name'] ?? '',
                    'phone' => $profile['phone'] ?? '',
                    'dob' => $profile['dob'] ?? null,
                    'avatar' => $profile['avatar'] ?? null,
                    'current_points' => $user['current_points'],
                    'membership_id' => $profile['membership_id'] ?? 1
                ]
            ]);
            
        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * POST /api/auth/refresh-token
     * Refresh JWT token khi hết hạn
     */
    public function refreshToken() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['token'])) {
                return Response::error('Token không được để trống', 400);
            }
            
            // Decode token (không verify expiration để có thể refresh token đã hết hạn)
            // Note: Trong production nên có cơ chế refresh token riêng (refresh token & access token)
            $token = str_replace('Bearer ', '', $data['token']);
            
            // Try to decode without expiration check
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                return Response::error('Token không hợp lệ', 401);
            }
            
            $payload = json_decode(base64_decode($parts[1]), true);
            
            if (!$payload || !isset($payload['user_id'])) {
                return Response::error('Token không hợp lệ', 401);
            }
            
            // Check user vẫn còn active
            $user = $this->userModel->findById($payload['user_id']);
            
            if (!$user) {
                return Response::error('Người dùng không tồn tại', 404);
            }
            
            if ($user['status'] !== 'Active') {
                return Response::error('Tài khoản đã bị khóa', 403);
            }
            
            // Generate new token
            $newToken = JWT::encode([
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role_id' => $user['role_id'],
                'exp' => time() + Config::$jwt_expiration
            ], Config::$jwt_secret);
            
            return Response::success([
                'token' => $newToken,
                'message' => 'Token đã được làm mới'
            ]);
            
        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Gửi mã reset password qua email
     * POST /api/auth/forgot-password
     */
    public function forgotPassword() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate
            if (empty($data['email'])) {
                return Response::error('Email không được để trống', 400);
            }
            
            $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return Response::error('Email không hợp lệ', 400);
            }
            
            // Kiểm tra email có tồn tại không
            $user = $this->userModel->findByEmail($email);
            
            if (!$user) {
                // Vẫn trả về success để tránh leak thông tin email có tồn tại hay không
                return Response::success([
                    'message' => 'Nếu email tồn tại trong hệ thống, mã xác nhận đã được gửi đến email của bạn'
                ]);
            }
            
            // Kiểm tra user có active không
            if ($user['status'] !== 'Active') {
                return Response::error('Tài khoản đã bị khóa', 403);
            }
            
            // Tạo mã reset 6 số
            $resetCode = sprintf('%06d', rand(0, 999999));
            
            // Lưu mã reset (expire sau 15 phút)
            $codes = $this->getVerificationCodes();
            $codes[$email] = [
                'type' => 'reset_password',
                'code' => $resetCode,
                'user_id' => $user['id'],
                'expires_at' => time() + (15 * 60) // 15 minutes
            ];
            $this->saveVerificationCodes($codes);
            
            // Gửi email
            $result = $this->emailService->sendPasswordResetCode($email, $resetCode, $user['full_name'] ?? 'Người dùng');
            
            if (!$result) {
                return Response::error('Không thể gửi email. Vui lòng thử lại sau', 500);
            }
            
            return Response::success([
                'message' => 'Mã xác nhận đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư'
            ]);
            
        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Reset password với mã xác nhận
     * POST /api/auth/reset-password
     */
    public function resetPassword() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate
            if (empty($data['email']) || empty($data['code']) || empty($data['new_password'])) {
                return Response::error('Vui lòng điền đầy đủ thông tin', 400);
            }
            
            $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
            $code = $data['code'];
            $newPassword = $data['new_password'];
            
            // Validate password
            if (strlen($newPassword) < 6) {
                return Response::error('Mật khẩu phải có ít nhất 6 ký tự', 400);
            }
            
            // Đọc codes
            $codes = $this->getVerificationCodes();
            
            // Kiểm tra code có tồn tại không
            if (!isset($codes[$email])) {
                return Response::error('Mã xác nhận không hợp lệ hoặc đã hết hạn', 400);
            }
            
            $savedData = $codes[$email];
            
            // Kiểm tra type
            if ($savedData['type'] !== 'reset_password') {
                return Response::error('Mã xác nhận không hợp lệ', 400);
            }
            
            // Kiểm tra code có đúng không
            if ($savedData['code'] !== $code) {
                return Response::error('Mã xác nhận không đúng', 400);
            }
            
            // Kiểm tra hết hạn chưa
            if (time() > $savedData['expires_at']) {
                // Xóa code đã hết hạn
                unset($codes[$email]);
                $this->saveVerificationCodes($codes);
                return Response::error('Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới', 400);
            }
            
            // Update password
            $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
            $result = $this->userModel->update($savedData['user_id'], [
                'password_hash' => $hashedPassword,
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            
            if (!$result) {
                return Response::error('Không thể cập nhật mật khẩu', 500);
            }
            
            // Xóa code đã sử dụng
            unset($codes[$email]);
            $this->saveVerificationCodes($codes);
            
            return Response::success([
                'message' => 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới'
            ]);
            
        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
}
