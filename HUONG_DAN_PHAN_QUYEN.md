# 📘 HƯỚNG DẪN ĐIỀU CHỈNH PERMISSIONS CHO ROLES

## 🎯 MỤC LỤC
1. [Qua Giao Diện (Recommended)](#1-qua-giao-diện-web-recommended)
2. [Qua API (Advanced)](#2-qua-api-advanced)
3. [Ví Dụ Thực Tế](#3-ví-dụ-thực-tế)
4. [Tips & Tricks](#4-tips--tricks)

---

## 1️⃣ QUA GIAO DIỆN WEB (Recommended)

### 📍 Đường dẫn: `/admin/role-permissions`

### Bước 1: Đăng nhập với tài khoản Admin
```
Email: admin@galaxy.vn
Password: password
```

### Bước 2: Vào trang Phân Quyền
```
Menu Admin → Phân Quyền
hoặc truy cập: http://localhost:8080/admin/role-permissions
```

### Bước 3: Chọn Role muốn chỉnh sửa

Bạn sẽ thấy 5 cards đại diện cho 5 roles:

```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ 👤      │ │ 👤      │ │ 👤      │ │ 👤      │ │ 👤      │
│ GUEST   │ │ MEMBER  │ │ STAFF   │ │ MANAGER │ │ ADMIN   │
│ Khách   │ │ Thành   │ │ Nhân    │ │ Quản lý │ │ Quản trị│
│ vãng lai│ │ viên    │ │ viên    │ │ rạp     │ │ hệ thống│
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

**Click vào card** của role bạn muốn chỉnh sửa (ví dụ: STAFF)

### Bước 4: Xem Permissions hiện tại

Sau khi chọn role, bạn sẽ thấy dashboard với stats:

```
┌────────────────┬────────────────┬────────────────┬────────────────┐
│ Đã Chọn        │ Thay Đổi       │ Phần Trăm      │ Modules        │
│ 15 / 70        │ 0 (Chưa lưu)   │ 21%            │ 8 / 13         │
└────────────────┴────────────────┴────────────────┴────────────────┘
```

### Bước 5: Thêm/Xóa Permissions

Bạn có 2 cách:

#### Cách A: Tick/Untick từng permission

```
▼ 🟣 movies (4/6)
  ☑️ movies.view - Xem danh sách phim
  ☑️ movies.view_detail - Xem chi tiết phim
  ☐ movies.create - Tạo phim mới          ← Click để thêm quyền
  ☐ movies.update - Cập nhật phim         ← Click để thêm quyền
  ☑️ movies.delete - Xóa phim             ← Click để thu hồi
  ☑️ movies.export - Export danh sách
```

#### Cách B: Chọn cả module

Click checkbox bên cạnh tên module để chọn/bỏ chọn tất cả permissions trong module đó:

```
▼ [☑️] 🟣 movies (6/6)    ← Click đây để chọn/bỏ chọn tất cả
  ☑️ movies.view
  ☑️ movies.create
  ☑️ movies.update
  ☑️ movies.delete
  ☑️ movies.export
  ☑️ movies.import
```

### Bước 6: Lưu thay đổi

Khi bạn thay đổi permissions, sẽ xuất hiện:

1. **Stats card cập nhật**:
```
Thay Đổi: +3 permissions
```

2. **Floating button** ở góc dưới phải:
```
┌──────────────────────────────────┐
│ Có thay đổi chưa lưu             │
│ +3 permissions                   │
│ [Hủy]  [💾 Lưu Ngay]            │
└──────────────────────────────────┘
```

Click **[💾 Lưu Ngay]** để apply thay đổi!

### Bước 7: Xác nhận

Sau khi lưu thành công, sẽ hiện thông báo:

```
✅ Thành công
Đã cập nhật permissions cho role Staff
```

**LƯU Ý**: User với role này phải **đăng xuất và đăng nhập lại** để permissions mới có hiệu lực!

---

## 2️⃣ QUA API (Advanced)

Nếu bạn muốn điều chỉnh qua code hoặc script:

### 🔑 Lấy Access Token

```bash
# Đăng nhập với admin
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@galaxy.vn",
    "password": "password"
  }'

# Response:
# {
#   "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "user": {...}
# }
```

Lưu token vào biến:
```bash
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### 📋 Xem Permissions hiện tại của Role

```bash
# Ví dụ: Xem permissions của Staff (role_id = 3)
curl -X GET http://localhost:8000/api/roles/3/permissions \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "success": true,
#   "data": {
#     "role_id": 3,
#     "role_name": "Staff",
#     "permissions": [
#       {
#         "id": 1,
#         "name": "movies.view",
#         "display_name": "Xem danh sách phim",
#         ...
#       },
#       ...
#     ]
#   }
# }
```

### ➕ Thêm 1 Permission cho Role

```bash
# Gán quyền "reports.dashboard" (id: 25) cho Staff
curl -X POST http://localhost:8000/api/roles/3/permissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_id": 25
  }'

# Response:
# {
#   "success": true,
#   "message": "Permission assigned to role successfully"
# }
```

### ➖ Xóa 1 Permission khỏi Role

```bash
# Thu hồi quyền "movies.delete" (id: 4) từ Staff
curl -X DELETE http://localhost:8000/api/roles/3/permissions/4 \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "success": true,
#   "message": "Permission revoked from role successfully"
# }
```

### 🔄 Sync tất cả Permissions (Recommended)

**Cách tốt nhất**: Gửi danh sách đầy đủ các permission IDs mà role cần có:

```bash
# Set permissions cho Staff = [1, 2, 3, 7, 8, 25, 26]
curl -X PUT http://localhost:8000/api/roles/3/permissions/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_ids": [1, 2, 3, 7, 8, 25, 26]
  }'

# Response:
# {
#   "success": true,
#   "message": "Permissions synced successfully",
#   "data": {
#     "role_id": 3,
#     "assigned_count": 7,
#     "permission_ids": [1, 2, 3, 7, 8, 25, 26]
#   }
# }
```

**Ưu điểm của Sync API**:
- ✅ Atomic operation (tất cả hoặc không gì)
- ✅ Không lo duplicate
- ✅ Đơn giản hơn việc add/remove nhiều lần
- ✅ Đây là API mà UI sử dụng

---

## 3️⃣ VÍ DỤ THỰC TẾ

### Use Case 1: Cho Staff quyền xem báo cáo doanh thu

**Yêu cầu**: Staff cần xem dashboard và báo cáo revenue

**Bước thực hiện qua UI**:

1. Đăng nhập admin → Vào `/admin/role-permissions`
2. Click card **"Staff"**
3. Tìm accordion **"reports"** và mở ra
4. Tick ☑️ các permissions:
   - `reports.dashboard` - Xem dashboard
   - `reports.revenue` - Xem báo cáo doanh thu
5. Click **[💾 Lưu]**
6. ✅ Xong! Staff giờ xem được báo cáo

**Hoặc qua API**:

```bash
# Lấy permission IDs
# reports.dashboard = 25
# reports.revenue = 26

# Lấy permissions hiện tại của Staff
CURRENT_PERMS=$(curl -s http://localhost:8000/api/roles/3/permissions \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.permissions[].id')

# Thêm 25, 26 vào danh sách
NEW_PERMS=$(echo "$CURRENT_PERMS" | jq -s '. + [25, 26] | unique')

# Sync
curl -X PUT http://localhost:8000/api/roles/3/permissions/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"permission_ids\": $NEW_PERMS}"
```

### Use Case 2: Thu hồi quyền xóa phim từ Manager

**Yêu cầu**: Manager không được phép xóa phim nữa, chỉ sửa

**Bước thực hiện qua UI**:

1. Vào `/admin/role-permissions`
2. Click card **"Manager"**
3. Tìm `movies.delete` trong accordion "movies"
4. Untick ☐ `movies.delete`
5. Click **[💾 Lưu]**
6. ✅ Xong! Manager không xóa được phim

**Hoặc qua API**:

```bash
# movies.delete = 4
# Manager role_id = 4

# Xóa permission
curl -X DELETE http://localhost:8000/api/roles/4/permissions/4 \
  -H "Authorization: Bearer $TOKEN"
```

### Use Case 3: Tạo role "Cashier" với permissions hạn chế

**Yêu cầu**: Role mới chỉ được:
- Xem phim
- Tạo booking
- Xem tickets
- In vé

**Cách làm**:

1. **Tạo role mới trong database** (hiện chưa có UI):
```sql
INSERT INTO roles (name, description) VALUES 
('Cashier', 'Thu ngân quầy vé');
-- role_id = 6
```

2. **Gán permissions qua UI**:
   - Vào `/admin/role-permissions`
   - Chọn role "Cashier" (sau khi thêm vào code ROLES array)
   - Tick các permissions cần thiết
   - Lưu

3. **Hoặc qua API**:
```bash
# Permission IDs:
# - movies.view = 1
# - bookings.create = 7
# - tickets.view = 10
# - tickets.print = 14

curl -X PUT http://localhost:8000/api/roles/6/permissions/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_ids": [1, 7, 10, 14]
  }'
```

### Use Case 4: Clone permissions từ role này sang role khác

**Yêu cầu**: Copy toàn bộ permissions của Staff sang role mới "Intern"

```bash
# 1. Lấy permissions của Staff (role_id=3)
STAFF_PERMS=$(curl -s http://localhost:8000/api/roles/3/permissions \
  -H "Authorization: Bearer $TOKEN" | \
  jq -r '[.data.permissions[].id]')

# 2. Gán cho Intern (giả sử role_id=7)
curl -X PUT http://localhost:8000/api/roles/7/permissions/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"permission_ids\": $STAFF_PERMS}"
```

---

## 4️⃣ TIPS & TRICKS

### 💡 Tip 1: Sử dụng Search khi có nhiều permissions
```
Trong trang role-permissions, gõ vào ô search:
"revenue" → Tự động filter chỉ hiện permissions liên quan
```

### 💡 Tip 2: Chọn/bỏ chọn tất cả nhanh
```
Click [Chọn Tất Cả] → Sau đó untick những cái không cần
Hoặc ngược lại: [Bỏ Chọn Tất Cả] → Tick những cái cần
```

### 💡 Tip 3: Gán cả module cùng lúc
```
Thay vì tick từng permission trong module "movies",
Click checkbox [☑️] bên cạnh tên module → Tất cả permissions trong module được chọn!
```

### 💡 Tip 4: Check permissions trước khi gán
Vào `/admin/permissions` để:
- Xem danh sách tất cả permissions có sẵn
- Tìm hiểu mỗi permission làm gì
- Tạo permission mới nếu cần

### 💡 Tip 5: User phải đăng xuất/nhập lại
```
Sau khi thay đổi permissions:
1. Thông báo cho user affected
2. Yêu cầu họ logout và login lại
3. Hoặc clear JWT token trong browser
```

**Tại sao?** JWT token chứa role info được mã hóa, không tự động update!

### 💡 Tip 6: Backup trước khi thay đổi lớn
```bash
# Export permissions hiện tại ra file
curl -s http://localhost:8000/api/roles/3/permissions \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.permissions[].id' > staff_permissions_backup.json

# Restore nếu cần:
BACKUP=$(cat staff_permissions_backup.json | jq -s '.')
curl -X PUT http://localhost:8000/api/roles/3/permissions/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"permission_ids\": $BACKUP}"
```

### 💡 Tip 7: Test permissions sau khi thay đổi
```
1. Tạo tài khoản test với role vừa sửa
2. Đăng nhập với tài khoản đó
3. Thử các chức năng → Verify permissions hoạt động đúng
4. Nếu sai → Quay lại sửa
```

### 💡 Tip 8: Document lại quyền của từng role
```
Tạo file ROLES_PERMISSIONS.md:

## Staff
- movies: view, view_detail
- bookings: create, view_own
- tickets: view, print
- ...

## Manager
- movies: view, view_detail, create, update
- users: view_all
- reports: dashboard, revenue
- ...
```

### 💡 Tip 9: Audit log (Nên có)
Hiện chưa có audit log, nên implement:
```sql
CREATE TABLE permission_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT,
  role_id INT,
  action VARCHAR(50), -- 'assign', 'revoke', 'sync'
  permission_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 💡 Tip 10: Permission naming convention
Khi tạo permission mới, tuân theo format:
```
{module}.{action}

✅ Good:
- movies.export_excel
- users.reset_password
- bookings.cancel

❌ Bad:
- exportMovies
- user-reset-pwd
- CancelBooking
```

---

## 🎓 TỔNG KẾT

### Qua UI (Dễ nhất):
1. Vào `/admin/role-permissions`
2. Chọn role
3. Tick/untick permissions
4. Lưu
5. Done!

### Qua API (Linh hoạt):
1. Login → Lấy token
2. GET current permissions
3. Thêm/xóa permission IDs
4. PUT sync với danh sách mới
5. Done!

### Best Practices:
- ✅ Test trước khi apply lên production
- ✅ Backup permissions trước khi thay đổi lớn
- ✅ Document lại quyền của từng role
- ✅ Thông báo cho users khi thay đổi
- ✅ Yêu cầu re-login sau khi thay đổi
- ✅ Audit log cho security

---

## 📚 TÀI LIỆU THAM KHẢO

- **Backend API**: `PERMISSION_MANAGEMENT_GUIDE.md`
- **Frontend UI**: `FRONTEND_PERMISSIONS_UI.md`
- **Authorization**: `AUTHORIZATION_SYSTEM.md`
- **Admin Management**: `ADMIN_ROLE_MANAGEMENT.md`

---

## 🆘 TROUBLESHOOTING

### ❓ Permissions không có hiệu lực sau khi thay đổi?
→ User cần logout và login lại để JWT refresh

### ❓ Không thấy role trong UI?
→ Check file `AdminRolePermissions.tsx`, thêm role vào array `ROLES`

### ❓ API trả về 401 Unauthorized?
→ Token hết hạn hoặc không phải admin. Re-login!

### ❓ Permissions bị duplicate?
→ Dùng sync API thay vì assign nhiều lần

### ❓ Muốn xóa permission khỏi hệ thống?
→ Vào `/admin/permissions` → Click [🗑️] → Confirm

---

*Hướng dẫn được tạo ngày 2026-04-02*  
*Cinema Booking System - Permission Management v1.0*
