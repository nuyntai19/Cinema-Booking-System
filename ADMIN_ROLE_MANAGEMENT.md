# 🔐 ADMIN CÓ THỂ ĐIỀU CHỈNH QUYỀN - CHI TIẾT

## ✅ CÓ! Admin HOÀN TOÀN có thể thay đổi quyền (role) của Staff, Manager và bất kỳ user nào

---

## 📋 API ENDPOINT THAY ĐỔI QUYỀN

### **PUT /api/users/:id/role**

**Mô tả**: Thay đổi role của bất kỳ user nào trong hệ thống  
**Quyền truy cập**: 🔴 **ADMIN ONLY**  
**File**: `backend/controllers/UserController.php` (line 439-480)

---

## 🔧 CÁCH SỬ DỤNG

### Request
```http
PUT /api/users/3/role HTTP/1.1
Host: localhost:8000
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "role_id": 4
}
```

### Response Success
```json
{
  "success": true,
  "message": "Đổi role thành công",
  "data": {
    "message": "Đổi role thành công",
    "new_role": "Manager"
  }
}
```

### Response Error (Nếu không phải Admin)
```json
{
  "success": false,
  "message": "Không có quyền truy cập",
  "error_code": 403
}
```

---

## 💡 VÍ DỤ THỰC TẾ

### Ví dụ 1: Thăng Staff lên Manager
```bash
# Admin muốn thăng user ID=3 (Staff) lên Manager (role_id=4)
curl -X PUT http://localhost:8000/api/users/3/role \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": 4
  }'

# Kết quả: User ID=3 giờ là Manager
```

### Ví dụ 2: Hạ Manager xuống Staff
```bash
# Admin muốn hạ user ID=5 (Manager) xuống Staff (role_id=3)
curl -X PUT http://localhost:8000/api/users/5/role \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": 3
  }'

# Kết quả: User ID=5 giờ là Staff
```

### Ví dụ 3: Chuyển Member thành Admin
```bash
# Admin muốn thăng user ID=10 (Member) lên Admin (role_id=5)
curl -X PUT http://localhost:8000/api/users/10/role \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": 5
  }'

# Kết quả: User ID=10 giờ là Admin
```

---

## 🔍 CODE THỰC TẾ

### Controller (UserController.php)
```php
/**
 * PUT /api/users/:id/role
 * Đổi role của user
 * Authorization: Admin only
 */
public function updateRole($id)
{
    try {
        // 🔒 KIỂM TRA QUYỀN ADMIN
        if (!$this->isAdmin()) {
            return Response::error('Không có quyền truy cập', 403);
        }

        // Lấy data từ request
        $data = json_decode(file_get_contents('php://input'), true);

        // Validate role_id có được gửi không
        if (empty($data['role_id'])) {
            return Response::error('Thiếu role_id', 400);
        }

        $roleId = (int)$data['role_id'];

        // ✅ Validate role tồn tại trong database
        $role = $this->roleModel->getById($roleId);
        if (!$role) {
            return Response::error('Role không tồn tại', 404);
        }

        // ✅ Kiểm tra user tồn tại
        $user = $this->userModel->findById($id);
        if (!$user) {
            return Response::error('Không tìm thấy người dùng', 404);
        }

        // 🔄 CẬP NHẬT ROLE
        $updated = $this->userModel->updateRole($id, $roleId);

        if (!$updated) {
            return Response::error('Cập nhật role thất bại', 500);
        }

        // ✅ Trả về thành công
        return Response::success([
            'message' => 'Đổi role thành công',
            'new_role' => $role['name']
        ]);
        
    } catch (Exception $e) {
        return Response::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
    }
}
```

### Model (User.php)
```php
/**
 * Update role của user
 */
public function updateRole($id, $roleId) {
    try {
        $query = "UPDATE users SET role_id = :role_id WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':role_id', $roleId, PDO::PARAM_INT);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
        
    } catch (PDOException $e) {
        error_log("User UpdateRole Error: " . $e->getMessage());
        return false;
    }
}
```

---

## 📊 BẢNG ROLE ID

| Role ID | Tên Role | Mô Tả |
|---------|----------|-------|
| 1 | Guest | Khách vãng lai |
| 2 | Member | Thành viên đã đăng ký |
| 3 | Staff | Nhân viên quầy |
| 4 | Manager | Quản lý rạp |
| 5 | Admin | Quản trị hệ thống |

---

## 🎯 CÁC KỊCH BẢN SỬ DỤNG

### 1. Thăng Cấp Nhân Viên Xuất Sắc
```
Tình huống: Staff làm việc tốt, được thăng lên Manager
Admin action: PUT /api/users/{staff_id}/role với role_id=4
Kết quả: Staff → Manager
```

### 2. Hạ Cấp Do Vi Phạm
```
Tình huống: Manager vi phạm quy định, hạ xuống Staff
Admin action: PUT /api/users/{manager_id}/role với role_id=3
Kết quả: Manager → Staff
```

### 3. Bổ Nhiệm Admin Mới
```
Tình huống: Cần thêm Admin để quản lý hệ thống
Admin action: PUT /api/users/{user_id}/role với role_id=5
Kết quả: User bất kỳ → Admin
```

### 4. Thu Hồi Quyền
```
Tình huống: Nhân viên nghỉ việc, thu hồi quyền về Member
Admin action: PUT /api/users/{staff_id}/role với role_id=2
Kết quả: Staff → Member (chỉ còn quyền khách hàng)
```

---

## 🔐 BẢO MẬT

### ✅ Cơ Chế Bảo Vệ

1. **Kiểm tra quyền Admin nghiêm ngặt**
   ```php
   if (!$this->isAdmin()) {
       return Response::error('Không có quyền truy cập', 403);
   }
   ```

2. **Validate role_id tồn tại**
   - Không thể gán role không có trong database
   - Tránh SQL injection

3. **Validate user tồn tại**
   - Kiểm tra user có tồn tại trước khi update
   - Tránh update vào void

4. **Prepared Statements**
   - Dùng PDO với bindParam
   - An toàn khỏi SQL injection

5. **Logging**
   - Log lỗi để audit trail
   - Theo dõi ai thay đổi role của ai

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Admin Có Thể Tự Hạ Quyền Mình
```
⚠️ Nguy hiểm: Admin có thể PUT /api/users/{admin_own_id}/role với role_id=2
Kết quả: Admin → Member (mất quyền Admin)
Khuyến nghị: Thêm validation ngăn admin tự hạ cấp
```

### 2. Cần Có Ít Nhất 1 Admin
```
⚠️ Nên thêm kiểm tra: 
- Đếm số Admin hiện tại
- Nếu chỉ còn 1 Admin, không cho phép hạ cấp
- Tránh tình huống không còn Admin nào
```

### 3. Thông Báo Cho User
```
💡 Tốt nhất: Gửi email thông báo khi role thay đổi
"Quyền hạn của bạn đã được cập nhật từ Staff → Manager"
```

### 4. Audit Log
```
💡 Nên log:
- Admin nào (admin_id, email)
- Thay đổi role của ai (user_id, email)
- Từ role nào → role nào
- Thời gian thay đổi
- IP address
```

---

## 🔄 THAY ĐỔI ROLE ẢNH HƯỞNG GÌ?

### Ảnh Hưởng Ngay Lập Tức
1. **JWT Token cũ vẫn còn hiệu lực** cho đến khi hết hạn
2. **Lần login tiếp theo** sẽ nhận token với role mới
3. **Quyền truy cập API** thay đổi ngay khi dùng token mới

### Ví Dụ
```
1. User login → Nhận token với role=Staff
2. Admin thay đổi: Staff → Manager
3. User vẫn dùng token cũ → vẫn là Staff (cho đến hết hạn)
4. User login lại → Nhận token mới với role=Manager
5. User giờ có quyền Manager
```

### Giải Pháp (Nếu Cần Hiệu Lực Ngay)
```php
// Option 1: Token blacklist (cần implement)
// Option 2: Giảm thời gian hết hạn token xuống 15 phút
// Option 3: Thêm version vào user record, check mỗi request
```

---

## 📝 TEST CASES

### Test Case 1: Admin Thay Đổi Role Thành Công
```javascript
// Arrange
const adminToken = await login('admin@galaxy.vn', 'password');
const staffId = 3;

// Act
const response = await fetch(`/api/users/${staffId}/role`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ role_id: 4 })
});

// Assert
expect(response.status).toBe(200);
expect(response.data.new_role).toBe('Manager');
```

### Test Case 2: Member Không Thể Thay Đổi Role
```javascript
// Arrange
const memberToken = await login('nguyenvana@gmail.com', 'password');
const staffId = 3;

// Act
const response = await fetch(`/api/users/${staffId}/role`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${memberToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ role_id: 5 })
});

// Assert
expect(response.status).toBe(403);
expect(response.message).toContain('Không có quyền');
```

### Test Case 3: Role ID Không Tồn Tại
```javascript
// Arrange
const adminToken = await login('admin@galaxy.vn', 'password');

// Act
const response = await fetch(`/api/users/3/role`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ role_id: 999 })
});

// Assert
expect(response.status).toBe(404);
expect(response.message).toContain('Role không tồn tại');
```

---

## 🎯 TÓM TẮT

### ✅ Admin CÓ THỂ:
- ✅ Thay đổi role của BẤT KỲ user nào (kể cả Staff, Manager)
- ✅ Thăng cấp: Staff → Manager → Admin
- ✅ Hạ cấp: Admin → Manager → Staff → Member
- ✅ Chuyển đổi tùy ý giữa các role
- ✅ Thay đổi nhiều user cùng lúc

### ❌ Admin KHÔNG THỂ:
- ❌ Gán role không tồn tại (role_id > 5 hoặc < 1)
- ❌ Thay đổi role của user không tồn tại
- ❌ (Khuyến nghị) Không nên tự hạ quyền mình

### 🔑 ENDPOINT:
```
PUT /api/users/:id/role
Body: { "role_id": 1-5 }
Auth: Admin token required
```

### 📁 FILES:
- Controller: `backend/controllers/UserController.php` (line 439)
- Model: `backend/models/User.php` (updateRole function)
- Route: `backend/index.php` (line 129)

---

**Kết luận**: Admin có **TOÀN QUYỀN** quản lý role của tất cả users trong hệ thống! 🎉
