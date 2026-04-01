<?php

require_once(__DIR__ . '/../models/POSCustomer.php');
require_once(__DIR__ . '/../core/Response.php');

class CustomerController {
    private $posCustomerModel;
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->posCustomerModel = new POSCustomer($this->db);
    }

    /**
     * POST /api/customers/lookup-or-create
     * Tìm hoặc tạo mới khách vãng lai theo SĐT
     * 
     * Body:
     * {
     *   "phone": "0908765432",
     *   "name": "Nguyễn Văn A" (optional)
     * }
     */
    public function lookupOrCreate() {
        try {
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Validate phone
            if (empty($data['phone'])) {
                return Response::error('Vui lòng nhập số điện thoại', 400);
            }

            $phone = trim($data['phone']);
            $name = $data['name'] ?? null;
            $staffUserId = $_REQUEST['auth_user_id'] ?? null;

            $customer = $this->posCustomerModel->lookupOrCreate(
                $phone,
                $name,
                $staffUserId ? (int)$staffUserId : null
            );

            return Response::success([
                'customer' => $customer,
                'is_new' => false,  // Note: Không thể biết là mới hay cũ từ đây, client phải xử lý
                'message' => 'Tìm thấy hoặc tạo khách hàng thành công'
            ]);

        } catch (Exception $e) {
            return Response::error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/customers/by-phone/:phone
     * Lấy thông tin khách vãng lai theo SĐT
     */
    public function getByPhone($phone = null) {
        try {
            if (!$phone) {
                $phone = $_GET['phone'] ?? null;
            }

            if (empty($phone)) {
                return Response::error('Vui lòng cung cấp số điện thoại', 400);
            }

            $customer = $this->posCustomerModel->getByPhone($phone);

            if (!$customer) {
                return Response::success([
                    'customer' => null,
                    'message' => 'Không tìm thấy khách'
                ]);
            }

            return Response::success([
                'customer' => $customer,
                'message' => 'Tìm thấy khách hàng'
            ]);

        } catch (Exception $e) {
            return Response::error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/customers/:id
     * Lấy thông tin khách vãng lai theo ID
     */
    public function getById($id = null) {
        try {
            if (!$id) {
                $id = $_GET['id'] ?? null;
            }

            if (empty($id)) {
                return Response::error('Vui lòng cung cấp ID khách', 400);
            }

            $customer = $this->posCustomerModel->getById((int)$id);

            if (!$customer) {
                return Response::error('Không tìm thấy khách', 404);
            }

            return Response::success([
                'customer' => $customer
            ]);

        } catch (Exception $e) {
            return Response::error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/customers/stats
     * Lấy thống kê khách vãng lai
     */
    public function getStats() {
        try {
            $stats = $this->posCustomerModel->getStats();
            return Response::success([
                'stats' => $stats
            ]);
        } catch (Exception $e) {
            return Response::error($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/customers/:id/bookings
     * Lấy lịch sử giao dịch của khách vãng lai (dùng cho in lại vé)
     */
    public function getBookingHistory($id = null) {
        try {
            AuthMiddleware::authenticate();

            $authRole = $_REQUEST['auth_user_role'] ?? null;
            if (!in_array($authRole, ['Admin', 'Manager', 'Staff'], true)) {
                return Response::forbidden('Insufficient permissions');
            }

            if (empty($id)) {
                return Response::error('Vui lòng cung cấp ID khách', 400);
            }

            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $history = $this->posCustomerModel->getBookingHistory((int)$id, $limit);

            return Response::success([
                'bookings' => $history,
                'total' => count($history),
            ]);
        } catch (Exception $e) {
            return Response::error($e->getMessage(), 400);
        }
    }
}
