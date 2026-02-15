# 📝 HƯỚNG DẪN TEST - USER MANAGEMENT APIs

**Phụ trách:** THỊNH  
**Date:** 14/02/2026

---

## 🚀 SETUP

1. **Start PHP Server:**
```bash
cd backend
php -S localhost:8000
```

2. **Test Database Connection:**
```bash
php test_connection.php
```

---

## 📋 DANH SÁCH APIs ĐÃ HOÀN THÀNH

### **Authentication APIs** (AuthController)
- ✅ POST `/api/auth/send-verification` - Gửi mã xác minh
- ✅ POST `/api/auth/verify-email` - Xác minh email
- ✅ POST `/api/auth/login` - Đăng nhập
- ✅ POST `/api/auth/logout` - Đăng xuất
- ✅ GET `/api/auth/me` - Lấy thông tin user hiện tại
- ✅ POST `/api/auth/refresh-token` - Refresh token

### **User Management APIs** (UserController)

#### Admin APIs:
- ✅ GET `/api/users` - List toàn bộ users (pagination, filter)
- ✅ POST `/api/users` - Tạo user mới
- ✅ GET `/api/users/:id` - Chi tiết user
- ✅ PUT `/api/users/:id` - Update user
- ✅ DELETE `/api/users/:id` - Xóa user (soft delete)
- ✅ PUT `/api/users/:id/role` - Đổi role user

#### User APIs:
- ✅ GET `/api/users/:id/profile` - Xem profile
- ✅ PUT `/api/users/:id/profile` - Update profile
- ✅ POST `/api/users/:id/change-password` - Đổi mật khẩu
- ✅ POST `/api/users/:id/upload-avatar` - Upload avatar

### **Role APIs** (RoleController)
- ✅ GET `/api/roles` - List toàn bộ roles

---

## 🧪 TEST CASES

### 1. **Đăng nhập Admin** (để lấy token)

```bash
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "email": "admin@galaxy.vn",
  "password": "password"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Đăng nhập thành công",
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": 1,
      "email": "admin@galaxy.vn",
      "role_id": 5,
      "full_name": "Admin Galaxy"
    }
  }
}
```

**Note:** Copy token để dùng cho các requests tiếp theo!

---

### 2. **List Users (Admin Only)**

```bash
GET http://localhost:8000/api/users?page=1&limit=10&role_id=2&search=nguyen
Authorization: Bearer YOUR_TOKEN_HERE
```

**Query Parameters:**
- `page` (int): Trang hiện tại (default: 1)
- `limit` (int): Số lượng/trang (default: 20)
- `role_id` (int): Filter theo role (1=Guest, 2=Member, 3=Staff, 4=Manager, 5=Admin)
- `status` (string): Filter theo status (Active, Banned, Deleted)
- `search` (string): Tìm kiếm theo email, tên, SĐT
- `sort_by` (string): Sắp xếp theo (created_at, email, current_points, status)
- `sort_order` (string): ASC hoặc DESC

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 4,
        "email": "nguyenvana@gmail.com",
        "role_id": 2,
        "role_name": "Member",
        "status": "Active",
        "current_points": 1500,
        "full_name": "Nguyễn Văn A",
        "phone": "0904567890",
        "rank_name": "Bronze",
        "created_at": "2024-01-15 10:30:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 6,
      "total_pages": 1
    }
  }
}
```

---

### 3. **Get User Detail**

```bash
GET http://localhost:8000/api/users/4
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 4,
      "email": "nguyenvana@gmail.com",
      "role_id": 2,
      "role_name": "Member",
      "status": "Active",
      "current_points": 1500,
      "created_at": "2024-01-15 10:30:00",
      "profile": {
        "full_name": "Nguyễn Văn A",
        "phone": "0904567890",
        "dob": "2000-03-10",
        "avatar": null,
        "rank_name": "Bronze",
        "discount_rate": "0.00"
      }
    }
  }
}
```

---

### 4. **Create User (Admin Only)**

```bash
POST http://localhost:8000/api/users
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "full_name": "Test User",
  "phone": "0987654321",
  "role_id": 2,
  "status": "Active",
  "dob": "1995-05-15"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Tạo người dùng thành công",
    "user_id": 7
  }
}
```

---

### 5. **Update User (Admin Only)**

```bash
PUT http://localhost:8000/api/users/7
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "status": "Banned",
  "current_points": 500
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Cập nhật thành công"
  }
}
```

---

### 6. **Update Role (Admin Only)**

```bash
PUT http://localhost:8000/api/users/7/role
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "role_id": 3
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Đổi role thành công",
    "new_role": "Staff"
  }
}
```

---

### 7. **Delete User (Admin Only)**

```bash
DELETE http://localhost:8000/api/users/7
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Xóa người dùng thành công"
  }
}
```

**Note:** Đây là soft delete, user sẽ có status = 'Deleted'

---

### 8. **Get Own Profile**

```bash
GET http://localhost:8000/api/users/4/profile
Authorization: Bearer USER_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": 4,
      "email": "nguyenvana@gmail.com",
      "full_name": "Nguyễn Văn A",
      "phone": "0904567890",
      "dob": "2000-03-10",
      "avatar": null,
      "current_points": 1500,
      "rank_name": "Bronze",
      "discount_rate": "0.00",
      "age": 25
    }
  }
}
```

---

### 9. **Update Own Profile**

```bash
PUT http://localhost:8000/api/users/4/profile
Authorization: Bearer USER_TOKEN_HERE
Content-Type: application/json

{
  "full_name": "Nguyễn Văn A Updated",
  "phone": "0901234567",
  "address": "123 Nguyễn Huệ, Q.1, TP.HCM",
  "gender": "Male"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Cập nhật profile thành công"
  }
}
```

---

### 10. **Change Password**

```bash
POST http://localhost:8000/api/users/4/change-password
Authorization: Bearer USER_TOKEN_HERE
Content-Type: application/json

{
  "old_password": "password",
  "new_password": "newpassword123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Đổi mật khẩu thành công"
  }
}
```

---

### 11. **Upload Avatar**

```bash
POST http://localhost:8000/api/users/4/upload-avatar
Authorization: Bearer USER_TOKEN_HERE
Content-Type: multipart/form-data

avatar: [FILE]
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Upload avatar thành công",
    "avatar_url": "/uploads/avatars/avatar_4_1645123456.jpg"
  }
}
```

---

### 12. **Refresh Token**

```bash
POST http://localhost:8000/api/auth/refresh-token
Content-Type: application/json

{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "message": "Token đã được làm mới"
  }
}
```

---

### 13. **Get All Roles**

```bash
GET http://localhost:8000/api/roles
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      { "id": 1, "name": "Guest" },
      { "id": 2, "name": "Member" },
      { "id": 3, "name": "Staff" },
      { "id": 4, "name": "Manager" },
      { "id": 5, "name": "Admin" }
    ]
  }
}
```

---

## ⚠️ ERROR RESPONSES

### 1. **Unauthorized (401)**
```json
{
  "success": false,
  "message": "Chưa đăng nhập",
  "code": 401
}
```

### 2. **Forbidden (403)**
```json
{
  "success": false,
  "message": "Không có quyền truy cập",
  "code": 403
}
```

### 3. **Not Found (404)**
```json
{
  "success": false,
  "message": "Không tìm thấy người dùng",
  "code": 404
}
```

### 4. **Validation Error (400)**
```json
{
  "success": false,
  "message": "Số điện thoại không hợp lệ (10-11 số)",
  "code": 400
}
```

---

## 🔐 AUTHORIZATION MATRIX

| API Endpoint | Guest | Member | Staff | Manager | Admin |
|--------------|-------|--------|-------|---------|-------|
| GET /api/users | ❌ | ❌ | ❌ | ❌ | ✅ |
| POST /api/users | ❌ | ❌ | ❌ | ❌ | ✅ |
| GET /api/users/:id | ❌ | Self | Self | Self | ✅ |
| PUT /api/users/:id | ❌ | Self | Self | Self | ✅ |
| DELETE /api/users/:id | ❌ | ❌ | ❌ | ❌ | ✅ |
| PUT /api/users/:id/role | ❌ | ❌ | ❌ | ❌ | ✅ |
| GET /api/users/:id/profile | ❌ | Self | Self | Self | Self |
| PUT /api/users/:id/profile | ❌ | Self | Self | Self | Self |
| POST /api/users/:id/change-password | ❌ | Self | Self | Self | Self |
| POST /api/users/:id/upload-avatar | ❌ | Self | Self | Self | Self |

**Self:** Chỉ được thao tác với chính user đó

---

## 📊 TEST CHECKLIST

### ✅ Admin Functions:
- [ ] List users với pagination
- [ ] List users với filter (role, status)
- [ ] Search users (email, tên, SĐT)
- [ ] Sort users (date, points)
- [ ] Create new user
- [ ] View user detail
- [ ] Update user (status, points)
- [ ] Update user role
- [ ] Delete user (soft delete)
- [ ] Cannot delete self

### ✅ User Functions:
- [ ] View own profile
- [ ] Update own profile
- [ ] Change password (verify old password)
- [ ] Upload avatar (validate file type & size)
- [ ] Cannot view other user's profile
- [ ] Cannot update other user's profile

### ✅ Security:
- [ ] All protected routes require JWT token
- [ ] Invalid token returns 401
- [ ] Insufficient permission returns 403
- [ ] Input validation works correctly
- [ ] SQL injection protection (prepared statements)
- [ ] XSS protection (sanitized input)

---

## 🐛 KNOWN ISSUES & TODO

### Currently Working:
- ✅ All CRUD operations
- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ File upload (avatar)
- ✅ Pagination & filtering
- ✅ Soft delete

### Future Improvements:
- [ ] Bulk operations (delete/update multiple users)
- [ ] Export users to CSV/Excel
- [ ] Activity logs (audit trail)
- [ ] Email notifications
- [ ] Password reset flow
- [ ] 2FA authentication
- [ ] Rate limiting
- [ ] API versioning

---

## 📞 SUPPORT

**Slack/Zalo:** @Thịnh  
**Email:** thinh@galaxy.vn

**Last Updated:** 14/02/2026
