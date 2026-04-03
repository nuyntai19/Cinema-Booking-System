<?php
require_once __DIR__ . '/../models/Permission.php';
require_once __DIR__ . '/../models/RolePermission.php';
require_once __DIR__ . '/../models/Role.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../core/Response.php';

/**
 * PermissionController
 * Admin quản lý permissions và gán cho roles
 */
class PermissionController
{
    private $permissionModel;
    private $rolePermissionModel;
    private $roleModel;

    public function __construct()
    {
        $this->permissionModel = new Permission();
        $this->rolePermissionModel = new RolePermission();
        $this->roleModel = new Role();
    }

    // ============================================
    // PERMISSIONS MANAGEMENT
    // ============================================

    /**
     * GET /api/permissions
     * Lấy danh sách tất cả permissions
     * Authorization: Admin only
     */
    public function index()
    {
        try {
            AuthMiddleware::requireAdmin();

            $filters = [
                'module' => $_GET['module'] ?? null,
                'search' => $_GET['search'] ?? null
            ];

            $permissions = $this->permissionModel->getAll($filters);

            // Group by module
            $grouped = [];
            foreach ($permissions as $permission) {
                $module = $permission['module'];
                if (!isset($grouped[$module])) {
                    $grouped[$module] = [];
                }
                $grouped[$module][] = $permission;
            }

            return Response::success([
                'permissions' => $permissions,
                'grouped' => $grouped,
                'modules' => $this->permissionModel->getAllModules()
            ]);

        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/permissions
     * Tạo permission mới
     * Authorization: Admin only
     */
    public function create()
    {
        try {
            AuthMiddleware::requireAdmin();

            $data = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            $required = ['name', 'display_name', 'module'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return Response::error("Thiếu thông tin: $field", 400);
                }
            }

            // Validate permission name format (module.action)
            if (!preg_match('/^[a-z_]+\.[a-z_]+$/', $data['name'])) {
                return Response::error('Tên permission phải theo format: module.action (vd: movies.create)', 400);
            }

            // Check duplicate
            if ($this->permissionModel->exists($data['name'])) {
                return Response::error('Permission name đã tồn tại', 409);
            }

            $permissionId = $this->permissionModel->create([
                'name' => $data['name'],
                'display_name' => $data['display_name'],
                'description' => $data['description'] ?? '',
                'module' => $data['module']
            ]);

            if (!$permissionId) {
                return Response::error('Tạo permission thất bại', 500);
            }

            $permission = $this->permissionModel->getById($permissionId);

            return Response::success([
                'message' => 'Tạo permission thành công',
                'permission' => $permission
            ], 201);

        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/permissions/:id
     * Cập nhật permission
     * Authorization: Admin only
     */
    public function update($id)
    {
        try {
            AuthMiddleware::requireAdmin();

            $permission = $this->permissionModel->getById($id);
            if (!$permission) {
                return Response::error('Không tìm thấy permission', 404);
            }

            $data = json_decode(file_get_contents('php://input'), true);

            $updated = $this->permissionModel->update($id, [
                'display_name' => $data['display_name'] ?? $permission['display_name'],
                'description' => $data['description'] ?? $permission['description'],
                'module' => $data['module'] ?? $permission['module']
            ]);

            if (!$updated) {
                return Response::error('Cập nhật thất bại', 500);
            }

            $permission = $this->permissionModel->getById($id);

            return Response::success([
                'message' => 'Cập nhật permission thành công',
                'permission' => $permission
            ]);

        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/permissions/:id
     * Xóa permission
     * Authorization: Admin only
     */
    public function delete($id)
    {
        try {
            AuthMiddleware::requireAdmin();

            $permission = $this->permissionModel->getById($id);
            if (!$permission) {
                return Response::error('Không tìm thấy permission', 404);
            }

            // Check if permission is assigned to any roles
            $roles = $this->rolePermissionModel->getRolesByPermission($id);
            if (!empty($roles)) {
                $roleNames = array_column($roles, 'name');
                return Response::error(
                    'Không thể xóa permission đang được sử dụng bởi roles: ' . implode(', ', $roleNames), 
                    409
                );
            }

            $deleted = $this->permissionModel->delete($id);

            if (!$deleted) {
                return Response::error('Xóa thất bại', 500);
            }

            return Response::success([
                'message' => 'Xóa permission thành công'
            ]);

        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    // ============================================
    // TOGGLE ACTIVE (KHÓA/MỞ KHÓA)
    // ============================================

    /**
     * PUT /api/permissions/:id/toggle-active
     * Khóa/mở khóa permission
     * Authorization: Admin only
     */
    public function toggleActive($id)
    {
        try {
            AuthMiddleware::requireAdmin();

            $permission = $this->permissionModel->getById($id);
            if (!$permission) {
                return Response::error('Không tìm thấy permission', 404);
            }

            $updated = $this->permissionModel->toggleActive($id);

            if (!$updated) {
                return Response::error('Không thể cập nhật trạng thái', 500);
            }

            $status = $updated['is_active'] ? 'mở khóa' : 'khóa';
            return Response::success([
                'permission' => $updated,
                'message' => "Đã {$status} permission: {$updated['display_name']}"
            ]);

        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    // ============================================
    // ROLE PERMISSIONS MANAGEMENT
    // ============================================

    /**
     * GET /api/roles/:roleId/permissions
     * Lấy tất cả permissions của một role
     * Authorization: Admin only
     */
    public function getRolePermissions($roleId)
    {
        try {
            AuthMiddleware::requireAdmin();

            $role = $this->roleModel->getById($roleId);
            if (!$role) {
                return Response::error('Không tìm thấy role', 404);
            }

            $permissions = $this->rolePermissionModel->getPermissionsByRole($roleId);
            $grouped = $this->rolePermissionModel->getPermissionsByRoleGrouped($roleId);

            return Response::success([
                'role' => $role,
                'permissions' => $permissions,
                'grouped' => $grouped,
                'total' => count($permissions)
            ]);

        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/roles/:roleId/permissions
     * Gán permission cho role
     * Authorization: Admin only
     */
    public function assignPermission($roleId)
    {
        try {
            AuthMiddleware::requireAdmin();

            $role = $this->roleModel->getById($roleId);
            if (!$role) {
                return Response::error('Không tìm thấy role', 404);
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['permission_id'])) {
                return Response::error('Thiếu permission_id', 400);
            }

            $permission = $this->permissionModel->getById($data['permission_id']);
            if (!$permission) {
                return Response::error('Không tìm thấy permission', 404);
            }

            $assigned = $this->rolePermissionModel->assignPermission($roleId, $data['permission_id']);

            if (!$assigned) {
                return Response::error('Gán permission thất bại', 500);
            }

            return Response::success([
                'message' => "Đã gán permission '{$permission['display_name']}' cho role '{$role['name']}'",
                'role' => $role,
                'permission' => $permission
            ]);

        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/roles/:roleId/permissions/:permissionId
     * Thu hồi permission từ role
     * Authorization: Admin only
     */
    public function revokePermission($roleId, $permissionId)
    {
        try {
            AuthMiddleware::requireAdmin();

            $role = $this->roleModel->getById($roleId);
            if (!$role) {
                return Response::error('Không tìm thấy role', 404);
            }

            $permission = $this->permissionModel->getById($permissionId);
            if (!$permission) {
                return Response::error('Không tìm thấy permission', 404);
            }

            $revoked = $this->rolePermissionModel->revokePermission($roleId, $permissionId);

            if (!$revoked) {
                return Response::error('Thu hồi permission thất bại', 500);
            }

            return Response::success([
                'message' => "Đã thu hồi permission '{$permission['display_name']}' từ role '{$role['name']}'"
            ]);

        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/roles/:roleId/permissions/sync
     * Đồng bộ toàn bộ permissions cho role
     * Authorization: Admin only
     */
    public function syncPermissions($roleId)
    {
        try {
            AuthMiddleware::requireAdmin();

            $role = $this->roleModel->getById($roleId);
            if (!$role) {
                return Response::error('Không tìm thấy role', 404);
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['permission_ids']) || !is_array($data['permission_ids'])) {
                return Response::error('Thiếu hoặc sai định dạng permission_ids (phải là array)', 400);
            }

            // Validate all permission IDs exist
            foreach ($data['permission_ids'] as $permissionId) {
                if (!$this->permissionModel->getById($permissionId)) {
                    return Response::error("Permission ID $permissionId không tồn tại", 404);
                }
            }

            $synced = $this->rolePermissionModel->syncPermissions($roleId, $data['permission_ids']);

            if (!$synced) {
                return Response::error('Đồng bộ permissions thất bại', 500);
            }

            $permissions = $this->rolePermissionModel->getPermissionsByRole($roleId);

            return Response::success([
                'message' => 'Đồng bộ permissions thành công',
                'role' => $role,
                'permissions' => $permissions,
                'total' => count($permissions)
            ]);

        } catch (Exception $e) {
            return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }
}
