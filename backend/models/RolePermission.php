<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * RolePermission Model
 * Quản lý mapping giữa roles và permissions
 */
class RolePermission
{
    private $db;
    private $table = 'role_permissions';

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Lấy tất cả permissions của một role
     */
    public function getPermissionsByRole($roleId)
    {
        try {
            $query = "SELECT p.* 
                     FROM permissions p
                     INNER JOIN {$this->table} rp ON p.id = rp.permission_id
                     WHERE rp.role_id = :role_id
                     ORDER BY p.module, p.name";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':role_id', $roleId, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("RolePermission GetPermissionsByRole Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Lấy permission names của một role (để check nhanh)
     */
    public function getPermissionNamesByRole($roleId)
    {
        try {
            $query = "SELECT p.name 
                     FROM permissions p
                     INNER JOIN {$this->table} rp ON p.id = rp.permission_id
                     WHERE rp.role_id = :role_id";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':role_id', $roleId, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            error_log("RolePermission GetPermissionNamesByRole Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Kiểm tra role có permission không
     */
    public function hasPermission($roleId, $permissionName)
    {
        try {
            $query = "SELECT COUNT(*) 
                     FROM {$this->table} rp
                     INNER JOIN permissions p ON rp.permission_id = p.id
                     WHERE rp.role_id = :role_id AND p.name = :permission_name";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':role_id', $roleId, PDO::PARAM_INT);
            $stmt->bindParam(':permission_name', $permissionName);
            $stmt->execute();

            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            error_log("RolePermission HasPermission Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Gán permission cho role
     */
    public function assignPermission($roleId, $permissionId)
    {
        try {
            $query = "INSERT INTO {$this->table} (role_id, permission_id) 
                     VALUES (:role_id, :permission_id)
                     ON DUPLICATE KEY UPDATE role_id = role_id"; // Ignore nếu đã tồn tại

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':role_id', $roleId, PDO::PARAM_INT);
            $stmt->bindParam(':permission_id', $permissionId, PDO::PARAM_INT);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("RolePermission AssignPermission Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Thu hồi permission từ role
     */
    public function revokePermission($roleId, $permissionId)
    {
        try {
            $query = "DELETE FROM {$this->table} 
                     WHERE role_id = :role_id AND permission_id = :permission_id";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':role_id', $roleId, PDO::PARAM_INT);
            $stmt->bindParam(':permission_id', $permissionId, PDO::PARAM_INT);

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("RolePermission RevokePermission Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Sync permissions cho role (xóa hết và gán lại)
     */
    public function syncPermissions($roleId, $permissionIds)
    {
        try {
            // Begin transaction
            $this->db->beginTransaction();

            // Xóa tất cả permissions hiện tại
            $deleteQuery = "DELETE FROM {$this->table} WHERE role_id = :role_id";
            $deleteStmt = $this->db->prepare($deleteQuery);
            $deleteStmt->bindParam(':role_id', $roleId, PDO::PARAM_INT);
            $deleteStmt->execute();

            // Gán permissions mới
            if (!empty($permissionIds)) {
                $insertQuery = "INSERT INTO {$this->table} (role_id, permission_id) VALUES ";
                $values = [];
                $params = [];

                foreach ($permissionIds as $index => $permissionId) {
                    $values[] = "(:role_$index, :perm_$index)";
                    $params[":role_$index"] = (int)$roleId;
                    $params[":perm_$index"] = (int)$permissionId;
                }

                $insertQuery .= implode(', ', $values);
                $insertStmt = $this->db->prepare($insertQuery);

                foreach ($params as $key => $value) {
                    $insertStmt->bindValue($key, $value, PDO::PARAM_INT);
                }

                $insertStmt->execute();
            }

            // Commit transaction
            $this->db->commit();
            return true;

        } catch (PDOException $e) {
            // Rollback on error
            $this->db->rollBack();
            error_log("RolePermission SyncPermissions Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Lấy tất cả roles có permission cụ thể
     */
    public function getRolesByPermission($permissionId)
    {
        try {
            $query = "SELECT r.* 
                     FROM roles r
                     INNER JOIN {$this->table} rp ON r.id = rp.role_id
                     WHERE rp.permission_id = :permission_id
                     ORDER BY r.id";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':permission_id', $permissionId, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("RolePermission GetRolesByPermission Error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Đếm số permissions của một role
     */
    public function countPermissions($roleId)
    {
        try {
            $query = "SELECT COUNT(*) FROM {$this->table} WHERE role_id = :role_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':role_id', $roleId, PDO::PARAM_INT);
            $stmt->execute();

            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("RolePermission CountPermissions Error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Lấy permissions được nhóm theo module cho một role
     */
    public function getPermissionsByRoleGrouped($roleId)
    {
        try {
            $query = "SELECT p.module, p.id, p.name, p.display_name, p.description
                     FROM permissions p
                     INNER JOIN {$this->table} rp ON p.id = rp.permission_id
                     WHERE rp.role_id = :role_id
                     ORDER BY p.module, p.name";

            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':role_id', $roleId, PDO::PARAM_INT);
            $stmt->execute();

            $permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Group by module
            $grouped = [];
            foreach ($permissions as $permission) {
                $module = $permission['module'];
                if (!isset($grouped[$module])) {
                    $grouped[$module] = [];
                }
                $grouped[$module][] = $permission;
            }

            return $grouped;
        } catch (PDOException $e) {
            error_log("RolePermission GetPermissionsByRoleGrouped Error: " . $e->getMessage());
            return [];
        }
    }
}
