# 🔐 PERMISSION MANAGEMENT SYSTEM

## Tổng Quan

Hệ thống **Permission-Based Access Control** cho phép Admin tùy chỉnh linh hoạt quyền hạn của từng Role mà không cần thay đổi code.

---

## 🎯 CHỨC NĂNG MỚI

### ✅ Admin có thể:
1. **Xem tất cả permissions** trong hệ thống
2. **Tạo permission mới** (nếu cần mở rộng chức năng)
3. **Cập nhật/xóa permissions**
4. **Gán permissions cho bất kỳ role nào**
5. **Thu hồi permissions từ role**
6. **Đồng bộ toàn bộ permissions** của role

---

## 📊 DATABASE SCHEMA

### Bảng: `permissions`
```sql
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,        -- VD: movies.create
    display_name VARCHAR(255) NOT NULL,        -- VD: Tạo phim
    description TEXT,                          -- Mô tả chi tiết
    module VARCHAR(50) NOT NULL,               -- VD: movies
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Bảng: `role_permissions`
```sql
CREATE TABLE role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);
```

---

## 📝 DANH SÁCH PERMISSIONS (70+ quyền)

### Module: MOVIES
| Permission | Display Name | Mô Tả |
|-----------|--------------|-------|
| movies.view | Xem danh sách phim | Xem danh sách và chi tiết phim |
| movies.create | Tạo phim | Thêm phim mới vào hệ thống |
| movies.update | Cập nhật phim | Chỉnh sửa thông tin phim |
| movies.delete | Xóa phim | Xóa phim khỏi hệ thống |
| movies.upload_poster | Upload poster | Upload/thay đổi poster phim |
| movies.import | Import phim hàng loạt | Import nhiều phim cùng lúc |

### Module: USERS
| Permission | Display Name | Mô Tả |
|-----------|--------------|-------|
| users.view_all | Xem tất cả users | Xem danh sách tất cả người dùng |
| users.create | Tạo user | Tạo tài khoản người dùng mới |
| users.update_all | Cập nhật tất cả users | Chỉnh sửa thông tin bất kỳ user nào |
| users.delete | Xóa user | Xóa tài khoản người dùng |
| users.change_role | Thay đổi role | Thay đổi vai trò của user |
| users.view_own | Xem profile cá nhân | Xem và chỉnh sửa profile của chính mình |

### Module: BOOKINGS
| Permission | Display Name | Mô Tả |
|-----------|--------------|-------|
| bookings.view_own | Xem booking cá nhân | Xem các booking của chính mình |
| bookings.view_all | Xem tất cả bookings | Xem tất cả bookings trong hệ thống |
| bookings.create | Tạo booking | Đặt vé mới |
| bookings.cancel | Hủy booking | Hủy đặt vé |
| bookings.refund | Hoàn tiền | Hoàn tiền cho booking |
| bookings.pos | Bán vé POS | Bán vé tại quầy |

### Module: REPORTS
| Permission | Display Name | Mô Tả |
|-----------|--------------|-------|
| reports.dashboard | Xem dashboard | Xem bảng điều khiển thống kê |
| reports.revenue | Báo cáo doanh thu | Xem báo cáo doanh thu |
| reports.occupancy | Báo cáo công suất | Xem báo cáo tỷ lệ lấp đầy |
| reports.export | Export báo cáo | Xuất báo cáo ra file |

### Module: SYSTEM
| Permission | Display Name | Mô Tả |
|-----------|--------------|-------|
| system.settings | Quản lý cấu hình | Thay đổi cấu hình hệ thống |
| system.permissions | Quản lý quyền hạn | Quản lý permissions và gán cho roles |
| system.roles | Quản lý roles | Tạo/sửa/xóa roles |

**+ 50+ permissions khác** cho modules: cinemas, halls, showtimes, tickets, transactions, promotions, concessions, reviews

---

## 🔑 API ENDPOINTS

### 1. Quản Lý Permissions

#### GET /api/permissions
Lấy danh sách tất cả permissions

**Authorization**: Admin only

```bash
curl -X GET http://localhost:8000/api/permissions \
  -H "Authorization: Bearer <admin_token>"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "permissions": [...],
    "grouped": {
      "movies": [...],
      "users": [...],
      "bookings": [...]
    },
    "modules": ["movies", "users", "bookings", "..."]
  }
}
```

#### POST /api/permissions
Tạo permission mới

**Body**:
```json
{
  "name": "movies.export",
  "display_name": "Export danh sách phim",
  "description": "Xuất danh sách phim ra Excel/CSV",
  "module": "movies"
}
```

#### PUT /api/permissions/:id
Cập nhật permission

#### DELETE /api/permissions/:id
Xóa permission (chỉ xóa được nếu chưa gán cho role nào)

---

### 2. Quản Lý Role Permissions

#### GET /api/roles/:roleId/permissions
Xem tất cả permissions của một role

```bash
curl -X GET http://localhost:8000/api/roles/3/permissions \
  -H "Authorization: Bearer <admin_token>"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "role": {
      "id": 3,
      "name": "Staff"
    },
    "permissions": [...],
    "grouped": {
      "bookings": [
        {
          "id": 15,
          "name": "bookings.view_all",
          "display_name": "Xem tất cả bookings"
        }
      ]
    },
    "total": 25
  }
}
```

#### POST /api/roles/:roleId/permissions
Gán permission cho role

```bash
curl -X POST http://localhost:8000/api/roles/3/permissions \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_id": 15
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Đã gán permission 'Xem tất cả bookings' cho role 'Staff'"
  }
}
```

#### DELETE /api/roles/:roleId/permissions/:permissionId
Thu hồi permission từ role

```bash
curl -X DELETE http://localhost:8000/api/roles/3/permissions/15 \
  -H "Authorization: Bearer <admin_token>"
```

#### PUT /api/roles/:roleId/permissions/sync
Đồng bộ toàn bộ permissions cho role (xóa hết, gán lại)

```bash
curl -X PUT http://localhost:8000/api/roles/3/permissions/sync \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_ids": [1, 2, 3, 15, 16, 20]
  }'
```

---

## 💡 USE CASES

### Use Case 1: Thêm quyền mới cho Staff

**Tình huống**: Staff hiện không được xem báo cáo, Admin muốn cho phép

**Các bước**:
```bash
# 1. Xem permissions hiện tại của Staff (role_id=3)
GET /api/roles/3/permissions

# 2. Tìm permission "reports.dashboard" (giả sử id=45)
GET /api/permissions?module=reports

# 3. Gán permission cho Staff
POST /api/roles/3/permissions
Body: { "permission_id": 45 }

# ✅ Kết quả: Staff giờ có thể xem dashboard
```

### Use Case 2: Thu hồi quyền xóa phim của Manager

**Tình huống**: Manager không nên có quyền xóa phim

**Các bước**:
```bash
# 1. Xem permissions của Manager (role_id=4)
GET /api/roles/4/permissions

# 2. Tìm permission "movies.delete" (giả sử id=4, permission_id ở trong role)
# Permission ID cần xem trong response của bước 1

# 3. Thu hồi permission
DELETE /api/roles/4/permissions/4

# ✅ Kết quả: Manager không còn xóa được phim
```

### Use Case 3: Tạo role mới "Accountant" chỉ xem báo cáo

**Các bước**:
```bash
# 1. Tạo role mới (cần API tạo role - có thể thêm sau)
POST /api/roles
Body: { "name": "Accountant" }
# Response: { "id": 6 }

# 2. Gán chỉ permissions về reports
PUT /api/roles/6/permissions/sync
Body: {
  "permission_ids": [45, 46, 47, 48]
  // 45: reports.dashboard
  // 46: reports.revenue
  // 47: reports.occupancy
  // 48: reports.export
}

# ✅ Kết quả: Role Accountant chỉ xem được báo cáo
```

---

## 🛠️ CÁCH SỬ DỤNG TRONG CODE

### Kiểm tra permission trong Controller

```php
class MovieController {
    public function create() {
        // Cách 1: Check permission cụ thể
        AuthMiddleware::requirePermission('movies.create');
        
        // Hoặc Cách 2: Check role (giữ nguyên code cũ)
        AuthMiddleware::requireAdmin();
        
        // Logic tạo phim
    }
    
    public function delete($id) {
        // Check permission động
        AuthMiddleware::requirePermission('movies.delete');
        
        // Logic xóa phim
    }
}
```

### Cập nhật AuthMiddleware (cần implement)

```php
class AuthMiddleware {
    public static function requirePermission($permissionName) {
        self::authenticate();
        
        $roleId = $_REQUEST['auth_user_role_id'];
        
        // Check trong database
        $rolePermissionModel = new RolePermission();
        $hasPermission = $rolePermissionModel->hasPermission($roleId, $permissionName);
        
        if (!$hasPermission) {
            Response::forbidden("Bạn không có quyền: $permissionName");
        }
    }
}
```

---

## 📦 CÀI ĐẶT

### Bước 1: Chạy Migration
```bash
mysql -u root -p galaxy_cinema < backend/database/migrations/001_add_permissions_system.sql
```

### Bước 2: Thêm Routes vào index.php
```php
// PERMISSION ROUTES (Admin only)
$router->get('/api/permissions', 'PermissionController@index');
$router->post('/api/permissions', 'PermissionController@create');
$router->put('/api/permissions/:id', 'PermissionController@update');
$router->delete('/api/permissions/:id', 'PermissionController@delete');

// ROLE PERMISSIONS ROUTES (Admin only)
$router->get('/api/roles/:roleId/permissions', 'PermissionController@getRolePermissions');
$router->post('/api/roles/:roleId/permissions', 'PermissionController@assignPermission');
$router->delete('/api/roles/:roleId/permissions/:permissionId', 'PermissionController@revokePermission');
$router->put('/api/roles/:roleId/permissions/sync', 'PermissionController@syncPermissions');
```

### Bước 3: Test
```bash
# Login as admin
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@galaxy.vn","password":"password"}'

# Get token from response, then test
curl -X GET http://localhost:8000/api/permissions \
  -H "Authorization: Bearer <token>"
```

---

## 🔐 BẢO MẬT

### 1. Chỉ Admin mới quản lý được permissions
```php
AuthMiddleware::requireAdmin(); // Trong mọi method của PermissionController
```

### 2. Transaction khi sync permissions
```php
// Đảm bảo atomicity
$this->db->beginTransaction();
// ... xóa và thêm lại
$this->db->commit();
```

### 3. Validate permission format
```php
// Permission name phải theo format: module.action
if (!preg_match('/^[a-z_]+\.[a-z_]+$/', $data['name'])) {
    return Response::error('Format không hợp lệ');
}
```

### 4. Không cho xóa permission đang được dùng
```php
$roles = $this->rolePermissionModel->getRolesByPermission($id);
if (!empty($roles)) {
    return Response::error('Permission đang được sử dụng');
}
```

---

## 📊 PERMISSIONS MẶC ĐỊNH SAU MIGRATION

| Role | Số Permissions | Ví Dụ |
|------|----------------|-------|
| Guest | 6 | movies.view, cinemas.view, showtimes.view |
| Member | 15 | + bookings.create, reviews.create |
| Staff | 20 | + bookings.pos, tickets.scan |
| Manager | 35 | + showtimes.create, reports.revenue |
| Admin | 70+ | TẤT CẢ permissions |

---

## 🎯 LỢI ÍCH

### ✅ Trước (Hardcoded):
```php
// Phải sửa code nếu muốn thay đổi quyền
if (!$this->isAdmin()) {
    Response::forbidden();
}
```

### ✅ Sau (Dynamic):
```php
// Admin chỉ cần vào UI, click gán/thu hồi permission
AuthMiddleware::requirePermission('movies.create');
```

### Ưu điểm:
- ✅ Linh hoạt: Thay đổi quyền không cần deploy code
- ✅ Audit trail: Biết role nào có quyền gì
- ✅ Fine-grained: Quyền chi tiết từng action
- ✅ Scalable: Dễ thêm permissions mới
- ✅ UI-friendly: Có thể làm giao diện quản lý đẹp

---

## 📁 FILES

- **Migration**: `backend/database/migrations/001_add_permissions_system.sql`
- **Models**: 
  - `backend/models/Permission.php`
  - `backend/models/RolePermission.php`
- **Controller**: `backend/controllers/PermissionController.php`
- **Routes**: Cần thêm vào `backend/index.php`

---

## 🚀 NEXT STEPS

1. ✅ Chạy migration SQL
2. ✅ Thêm routes vào index.php
3. ⏳ Cập nhật AuthMiddleware với requirePermission()
4. ⏳ Xây dựng UI admin để quản lý permissions
5. ⏳ Thay thế dần các hardcoded checks bằng permission checks

---

**Tạo bởi**: Permission Management Feature - 2026-04-02  
**Version**: 1.0
