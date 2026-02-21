<?php
require_once __DIR__ . '/../models/Role.php';
require_once __DIR__ . '/../core/Response.php';

/**
 * RoleController
 * Quản lý roles
 * Phụ trách: THỊNH
 */
class RoleController {
    private $roleModel;
    
    public function __construct() {
        $this->roleModel = new Role();
    }
    
    /**
     * GET /api/roles
     * Lấy tất cả roles
     */
    public function index() {
        try {
            $roles = $this->roleModel->getAll();
            
            return Response::success(['roles' => $roles]);
            
        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
}
