# Docker Quick Start (Đầy đủ cho project này)

Tài liệu này hướng dẫn chạy đúng stack Docker của project Cinema-Booking-System.

## 1) Docker stack hiện tại gồm gì

File `docker.yml` đang định nghĩa 3 service:

- `db`: MySQL 8.0
- `app`: PHP 8.2 CLI chạy backend tại cổng 8000
- `api-test`: container chạy script test API (chạy xong sẽ thoát)

Thông số DB mặc định trong Docker:

- `DB_HOST`: db
- `DB_NAME`: galaxy_cinema
- `DB_USER`: root
- `DB_PASSWORD`: 12345678

Lưu ý: `schema.sql` và `seed_data.sql` chỉ tự động import khi volume DB mới được tạo lần đầu.
## 2) Điều kiện trước khi chạy

- Đã cài Docker Desktop
- Docker Desktop đang Running
- Đang dùng terminal tại thư mục gốc project (nơi có file `docker.yml`)

## 3) Chạy lần đầu (khuyến nghị)

```bash
docker compose -f docker.yml up --build -d
```

Lệnh này sẽ:

- Build image PHP từ `docker/php/Dockerfile`
- Tạo và chạy container `db` + `app` (+ `api-test` nếu không profile hóa)
- Khởi tạo database `galaxy_cinema` lần đầu

## 4) Kiểm tra hệ thống đã lên chưa

```bash
docker compose -f docker.yml ps
```

Kiểm tra log backend:

```bash
docker compose -f docker.yml logs -f app
```

Kiểm tra log DB:

```bash
docker compose -f docker.yml logs -f db
```

## 5) Địa chỉ truy cập và test nhanh

- Backend API: `http://localhost:8000`
- API movie list: `http://localhost:8000/api/movies`

Nếu frontend chạy local (Vite) thì frontend gọi API qua cổng 8000.

## 6) Lệnh sử dụng hằng ngày

Chạy stack (không build lại):

```bash
docker compose -f docker.yml up -d
```

Dừng stack (giữ dữ liệu DB):

```bash
docker compose -f docker.yml down
```

Dừng stack và xóa volume DB (mất dữ liệu):

```bash
docker compose -f docker.yml down -v
```

Build lại image app khi sửa Dockerfile hoặc package hệ thống:

```bash
docker compose -f docker.yml up --build -d
```

## 7) Quản lý database khi dùng Docker

### Cách 1: Dùng mysql client trong container (không cần mở cổng 3306)

```bash
docker compose -f docker.yml exec db mysql -uroot -p12345678 galaxy_cinema
```

### Cách 2: Vẫn dùng MySQL Workbench được

Bạn vẫn có thể dùng MySQL Workbench vì Workbench chỉ là client GUI.
Khi chạy Docker, MySQL server nằm trong container `db`.

Mặc định file `docker.yml` hiện tại map cổng theo kiểu:

```yaml
services:
  db:
    ports:
      - "3307:3306"
```

Sau đó chạy lại:

```bash
docker compose -f docker.yml up -d
```

Thông tin kết nối Workbench:

- Hostname: `127.0.0.1`
- Port: `3307`
- Username: `root`
- Password: `12345678`
- Default Schema: `galaxy_cinema`

Lưu ý: Nếu máy bạn không chạy MySQL local ở cổng 3306, bạn có thể đổi lại mapping thành `3306:3306`.

## 8) Lỗi thường gặp và cách xử lý

- `ERR_CONNECTION_REFUSED` trên frontend
  - Kiểm tra app có Up: `docker compose -f docker.yml ps`
  - Kiểm tra API bằng browser: `http://localhost:8000/api/movies`

- Đã sửa `schema.sql` hoặc `seed_data.sql` nhưng DB không đổi
  - Cần reset volume DB: `docker compose -f docker.yml down -v`
  - Chạy lại: `docker compose -f docker.yml up --build -d`

- Lỗi image/pull timeout
  - Thử lại lệnh không build: `docker compose -f docker.yml up -d`
  - Kiểm tra mạng/Docker Hub rồi build lại sau

- Port 8000 đang bị chiếm
  - Dừng tiến trình đang dùng cổng 8000 hoặc đổi port mapping trong `docker.yml`

## 9) Bổ sung: Cài ngrok và Pusher

Mục này dùng khi bạn cần callback từ cổng thanh toán (MoMo) và realtime trạng thái thanh toán.

### 9.1 Cài ngrok (cơ bản)

1. Tìm và cài `ngrok` trên Windows.
2. Đăng nhập/tạo tài khoản ngrok.
3. Lấy `authtoken` từ dashboard ngrok.
4. Cấu hình token vào máy:

```bash
ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
```

5. Mở tunnel đến backend local đang chạy cổng 8000:

```bash
ngrok http 8000
```

6. Copy URL HTTPS do ngrok cấp (ví dụ: `https://abc123.ngrok-free.app`).

### 9.2 Cài và cấu hình Pusher

1. Tạo tài khoản Pusher và tạo 1 Channels App.
2. Lấy các thông tin app:
  - `app_id`
  - `key`
  - `secret`
  - `cluster`
3. Cập nhật file `backend/.env`:

```env
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=ap1
```

4. Cập nhật file `source-code/galaxy-cinema-hub-main/.env`:

```env
VITE_PUSHER_KEY=your_key
VITE_PUSHER_CLUSTER=ap1
```

Lưu ý:

- Frontend cần đúng `VITE_PUSHER_KEY` và `VITE_PUSHER_CLUSTER` để subscribe realtime.
- Không commit key/secret thật lên Git.

### 9.3 Gắn URL ngrok vào callback thanh toán

Cập nhật file `backend/.env`:

```env
MOMO_NOTIFY_URL=https://<your-ngrok-domain>/api/transactions/momo/verify
```

Ví dụ:

```env
MOMO_NOTIFY_URL=https://abc123.ngrok-free.app/api/transactions/momo/verify
```

### 9.4 Áp dụng cấu hình sau khi sửa `.env`

```bash
docker compose -f docker.yml up -d
```

Frontend (nếu đang chạy) cần khởi động lại để nhận biến `VITE_*` mới:

```bash
cd source-code/galaxy-cinema-hub-main
npm run dev
```
