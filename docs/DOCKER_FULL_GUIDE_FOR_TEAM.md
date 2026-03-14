# Docker Full Guide - Cinema Booking System

Tài liệu này dùng để hướng dẫn đầy đủ cho người mới:

- Cài Docker trên Windows
- Chạy backend + MySQL bằng Docker
- Chạy frontend
- Chuyển từ local MySQL/MySQL Workbench sang Docker
- Xử lý các lỗi đã gặp trong quá trình setup

Guide này được viết theo cách đã setup thành công trên máy hiện tại.

## 1) Tổng quan kiến trúc khi chạy

Project hiện tại dùng:

- Backend PHP: container `galaxy_cinema_app` (port host `8000`)
- Database MySQL 8: container `galaxy_cinema_db` (port host `3307` -> container `3306`)
- API test container: `galaxy_cinema_api_test`
- Frontend Vite: chạy local bên ngoài Docker (mặc định port `8080`)

## 2) Cài Docker Desktop (hướng dẫn cơ bản, không cần link)

### Trên Windows

1. Mở trình duyệt, tìm `Docker Desktop for Windows`.
2. Tải bản cài đặt phù hợp (Windows 10/11, 64-bit).
3. Chạy file cài đặt với quyền Administrator.
4. Nếu được hỏi về WSL2, chấp nhận bật WSL2.
5. Khởi động lại máy nếu installer yêu cầu.
6. Mở Docker Desktop và đợi đến khi ứng dụng hiển thị trạng thái Running.

Kiểm tra nhanh trong terminal:

```bash
docker --version
docker compose version
```

Nếu 2 lệnh trên in ra version là ổn.

## 3) Chuẩn bị source code

1. Mở terminal tại thư mục gốc project (nơi có file `docker.yml`).
2. Kiểm tra có file/thư mục quan trọng:

- `docker.yml`
- `docker/php/Dockerfile`
- `backend/database/schema.sql`
- `backend/database/seed_data.sql`
- `source-code/galaxy-cinema-hub-main`

## 4) Chạy backend + database bằng Docker

### Chạy lần đầu (khuyến nghị)

```bash
docker compose -f docker.yml up --build -d
```

### Chạy những lần sau

```bash
docker compose -f docker.yml up -d
```

### Kiểm tra service

```bash
docker compose -f docker.yml ps
```

Kỳ vọng thấy:

- `galaxy_cinema_db` Up
- `galaxy_cinema_app` Up

### Kiểm tra log

```bash
docker compose -f docker.yml logs -f app
docker compose -f docker.yml logs -f db
```

### Test backend

Mở browser:

- `http://localhost:8000/api/movies`
- `http://localhost:8000/api/genres`

Nếu trả về JSON là backend + DB đang chạy tốt.

## 5) Chạy frontend

Frontend hiện tại chạy local, không nằm trong `docker.yml`.

```bash
cd source-code/galaxy-cinema-hub-main
npm install
npm run dev
```

Sau đó mở:

- `http://localhost:8080`

## 6) Cần 1 terminal hay 2 terminal?

Bạn có 2 cách:

### Cách A - Dễ theo dõi log (dễ debug)

- Terminal 1: `docker compose -f docker.yml up`
- Terminal 2: vào frontend và chạy `npm run dev`

### Cách B - Gọn hơn (có thể dùng 1 terminal)

- Chạy Docker detached: `docker compose -f docker.yml up -d`
- Dùng lại terminal đó để chạy frontend `npm run dev`

Kết luận:

- Nếu dùng `up -d` thì KHÔNG bắt buộc 2 terminal.
- Nếu dùng `up` (không `-d`) thì CẦN terminal thứ 2 cho frontend.

## 7) Bạn đang dùng MySQL Workbench thì giờ thế nào?

Trả lời ngắn gọn: vẫn dùng Workbench bình thường.

- Docker chỉ thay đổi nơi MySQL server chạy (từ local machine sang container).
- MySQL Workbench vẫn là công cụ GUI client để kết nối DB.

### Thông số kết nối Workbench cho project này

- Hostname: `127.0.0.1`
- Port: `3307`
- Username: `root`
- Password: `12345678`
- Default Schema: `galaxy_cinema`

### Tại sao là 3307 mà không phải 3306?

Vì trên máy đã gặp xung đột cổng 3306 (thường do MySQL local đang chạy).
Do đó `docker.yml` map cổng theo cách an toàn:

- Host: `3307`
- Container MySQL: `3306`

Nếu máy không dùng local MySQL 3306, có thể đổi lại `3306:3306`.

## 8) Chuyển từ local MySQL sang Docker MySQL (gợi ý)

Nếu trước đây bạn đã có data ở local MySQL:

1. Export schema/data bằng Workbench (hoặc mysqldump).
2. Chạy Docker stack lên.
3. Import dump vào DB Docker qua Workbench (kết nối `127.0.0.1:3307`).

Nếu bạn muốn dùng dữ liệu mẫu của project:

- Project đã tự động chạy `schema.sql` + `seed_data.sql` khi volume MySQL mới được tạo lần đầu.

## 9) Các lệnh quan trọng cần nhớ

### Dừng stack nhưng giữ dữ liệu DB

```bash
docker compose -f docker.yml down
```

### Dừng stack và xóa dữ liệu DB (reset)

```bash
docker compose -f docker.yml down -v
```

### Rebuild lại image app

```bash
docker compose -f docker.yml up --build -d
```

## 10) Lỗi thường gặp và cách xử lý

### Lỗi: `Database Connection Error ... getaddrinfo for db failed`

Nguyên nhân phổ biến:

- Container `db` không lên được
- Thường do xung đột cổng 3306

Cách xử lý:

1. Kiểm tra status:

```bash
docker compose -f docker.yml ps
```

2. Nếu `db` không Up, kiểm tra log:

```bash
docker compose -f docker.yml logs db
```

3. Đảm bảo đang dùng mapping `3307:3306` trong `docker.yml`.
4. Chạy lại:

```bash
docker compose -f docker.yml up -d
```

### Lỗi: `Route not found` khi gọi genres

Dùng endpoint đúng:

- `http://localhost:8000/api/genres`

Không dùng endpoint cũ:

- `/api/genres/index.php`

### Lỗi frontend không gọi được backend (`ERR_CONNECTION_REFUSED`)

1. Kiểm tra app container:

```bash
docker compose -f docker.yml ps
```

2. Kiểm tra backend API:

- `http://localhost:8000/api/movies`

3. Đảm bảo frontend đang chạy `npm run dev`.

### Sửa schema.sql/seed_data.sql nhưng DB không thay đổi

Cần reset volume DB rồi khởi tạo lại:

```bash
docker compose -f docker.yml down -v
docker compose -f docker.yml up --build -d
```

## 11) Checklist setup nhanh cho người mới

1. Cài Docker Desktop, mở lên và đợi Running.
2. Mở terminal tại thư mục gốc project.
3. Chạy: `docker compose -f docker.yml up --build -d`
4. Kiểm tra: `docker compose -f docker.yml ps`
5. Test API: `http://localhost:8000/api/movies`
6. Chạy frontend:

```bash
cd source-code/galaxy-cinema-hub-main
npm install
npm run dev
```

7. Mở `http://localhost:8080`
8. Nếu cần xem DB, mở Workbench kết nối `127.0.0.1:3307`.

## 12) Bổ sung: Cài ngrok và Pusher

Mục này dành cho các tính năng cần webhook/public callback (ví dụ MoMo notify) và realtime trạng thái thanh toán.

### 12.1 Cài ngrok trên Windows (cơ bản)

1. Tìm và cài công cụ `ngrok`.
2. Đăng ký/đăng nhập tài khoản ngrok.
3. Lấy `authtoken` trong dashboard.
4. Cấu hình token vào máy:

```bash
ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
```

5. Mở tunnel cho backend local (cổng 8000):

```bash
ngrok http 8000
```

6. Lấy URL HTTPS ngrok cấp, ví dụ `https://abc123.ngrok-free.app`.

### 12.2 Cấu hình callback MoMo bằng ngrok

Cập nhật trong `backend/.env`:

```env
MOMO_NOTIFY_URL=https://<your-ngrok-domain>/api/transactions/momo/verify
```

Ví dụ:

```env
MOMO_NOTIFY_URL=https://abc123.ngrok-free.app/api/transactions/momo/verify
```

Lưu ý: URL ngrok miễn phí thường thay đổi sau mỗi lần mở lại tunnel, cần cập nhật lại biến này khi URL đổi.

### 12.3 Cài và cấu hình Pusher

1. Tạo tài khoản Pusher.
2. Tạo 1 app trong Pusher Channels.
3. Lấy thông tin app gồm:
	- `app_id`
	- `key`
	- `secret`
	- `cluster`

4. Cập nhật backend `backend/.env`:

```env
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=ap1
```

5. Cập nhật frontend `source-code/galaxy-cinema-hub-main/.env`:

```env
VITE_PUSHER_KEY=your_key
VITE_PUSHER_CLUSTER=ap1
```

Lưu ý bảo mật:

- Không chia sẻ `PUSHER_SECRET`.
- Không commit file `.env` chứa key thật lên Git.

### 12.4 Áp dụng cấu hình mới

Sau khi sửa `.env` backend:

```bash
docker compose -f docker.yml up -d
```

Sau khi sửa `.env` frontend (biến `VITE_*`), cần chạy lại frontend:

```bash
cd source-code/galaxy-cinema-hub-main
npm run dev
```

### 12.5 Kiểm tra nhanh sau cấu hình

1. Backend vẫn hoạt động:
	- `http://localhost:8000/api/movies`
2. Frontend mở được:
	- `http://localhost:8080`
3. Ngrok đang chạy và có URL HTTPS hợp lệ.
4. Khi test thanh toán, backend nhận callback tại `/api/transactions/momo/verify`.
5. Frontend nhận realtime qua Pusher (không báo thiếu `VITE_PUSHER_KEY`).

---

Nếu người setup gặp lỗi, gửi lại 3 thông tin sau để debug nhanh:

- Output `docker compose -f docker.yml ps`
- Output `docker compose -f docker.yml logs --tail 100 db`
- Ảnh chụp lỗi trên browser console/network
