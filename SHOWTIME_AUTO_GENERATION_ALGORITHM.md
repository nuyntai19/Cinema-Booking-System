# Thuật Toán Sắp Xếp Lịch Chiếu Tự Động (Auto Showtime Generation)

## 📌 Tổng Quan

Hệ thống sử dụng **Weighted Round-Robin Algorithm with Vietnamese Quota Fallback** để tự động sắp xếp lịch chiếu tối ưu.

**Mục đích**: Phân phối phim đều đặn trên các phòng & ngày, ưu tiên phim hot, và đảm bảo tỷ lệ phim Việt tối thiểu.

---

## 🎯 Tham Số Đầu Vào

```
POST /api/showtimes/auto-generate
{
  "cinema_id": 1,                          // Rạp cần sắp lịch
  "start_date": "2026-04-02",             // Ngày bắt đầu
  "end_date": "2026-04-10",               // Ngày kết thúc
  "day_start_time": "09:00",              // Giờ mở cửa (HH:mm)
  "day_end_time": "23:00",                // Giờ đóng cửa (HH:mm)
  "base_price": 90000,                    // Giá vé cơ sở (VNĐ)
  "priority_movie_ids": [1, 2, 3],        // Danh sách phim ưu tiên (chiếu nhiều)
  "excluded_movie_ids": [10, 11],         // Danh sách phim KHÔNG chiếu
  "priority_weight": 3,                   // **[CONFIG 1]** Trọng số ưu tiên (xem chi tiết)
  "max_showtimes_per_hall_per_day": 0,   // 0 = không giới hạn
  "reroll_token": "",                     // Token để "xáo trộn" và tạo lại
  "dry_run": false                        // true = xem trước, false = lưu vào DB
}
```

---

## ⚙️ 2 CONFIG CHÍNH CÓ THỂ TĂNG/GIẢM

### 1️⃣ **Cleanup Duration (Thời Gian Đơn Phòng)**

- **Tên**: `cleanup_duration`
- **Giá Trị Mặc Định**: 15 phút
- **Lưu Tại**: `backend/config/Config.php` hoặc `system_configs` table
- **Ý Nghĩa**: Thời gian cần dọn dẹp/chuẩn bị phòng giữa 2 suất chiếu liên tiếp

**Cách Tính End Time:**

```
end_time = start_time + duration_phim + cleanup_duration
```

**Ví Dụ:**

- Phim bắt đầu 09:00, thời lượng 120 phút, cleanup 15 phút
- Kết thúc: 09:00 + 120 + 15 = 10:35
- Suất tiếp theo có thể bắt đầu từ 10:35

**Cách Cấu Hình**:

```php
// backend/config/Config.php
public static $showtime_cleanup_minutes = 15; // Tăng/giảm tại đây

// Hoặc thông qua DB (động):
INSERT/UPDATE system_configs SET config_key='cleanup_duration', config_value='20';
```

---

### 2️⃣ **Min Vietnamese Quota (Tỷ Lệ Phim Việt Tối Thiểu)**

- **Tên**: `min_vietnamese_quota`
- **Giá Trị Mặc Định**: 15% (%)
- **Lưu Tại**: `backend/config/Config.php` hoặc `system_configs` table
- **Ý Nghĩa**: Đảm bảo tối thiểu X% suất chiếu mỗi ngày là phim Việt Nam

**Cách Tính:**

```
required_vn_count = CEIL((total_showtimes_today * min_quota) / 100)

Ví Dụ:
- Nếu ngày hôm nay có 10 suất chiếu
- min_quota = 15%
- required_vn_count = CEIL((10 * 15) / 100) = CEIL(1.5) = 2 suất Việt
```

**Cách Cấu Hình:**

```php
// backend/config/Config.php
public static $min_vietnamese_quota = 15; // Tăng/giảm tại đây

// Hoặc thông qua DB:
INSERT/UPDATE system_configs SET config_key='min_vietnamese_quota', config_value='20';
```

---

## 🔄 THUẬT TOÁN CHI TIẾT

### Bước 1: Chuẩn Bị Dữ Liệu

```
1. Load tất cả phim hợp lệ (age_rating ≠ 'C', duration > 0)
2. Phân loại phim:
   - priority_movies: phim trong danh sách ưu tiên
   - regular_movies: phim thường (không ưu tiên, không loại trừ)
3. Loại trừ phim nằm trong excluded_movie_ids
```

### Bước 2: Lặp Từng Ngày

Với mỗi ngày trong khoảng [start_date, end_date]:

```
FOR EACH ngày:
  dailyTotal = 0           // Tổng suất chiếu trong ngày
  dailyVN = 0              // Tổng suất Việt trong ngày
  dailyMovieCounts = {}    // Số lần mỗi phim được chiếu hôm nay
  slotMovieCounts = {}     // Số lần mỗi phim được chiếu cùng khung giờ

  FOR EACH phòng chiếu:
    current = ngày + day_start_time
    lastMovieId = null

    WHILE current < ngày + day_end_time:
      // CHỌN PHIM (xem Bước 3)
      selectedMovie = chonPhim(...)

      IF selectedMovie == null:
        break

      // KIỂM TRA XUNG ĐỘT
      IF hasConflict(phòng, start_time, end_time):
        // Xung đột → lùi 15 phút thử lại
        current += 15 phút
        continue

      // LƯU XUẤT CHIẾU
      INSERT INTO showtimes (...)

      // CẬP NHẬT ĐẾM
      dailyTotal++
      dailyMovieCounts[movieId]++
      dailyVN++ (nếu phim Việt)
      lastMovieId = movieId

      // TIẾN ĐẾN SUẤT TIẾP THEO
      current = end_time của suất vừa tạo
```

### Bước 3: Chọn Phim (Weighted Round-Robin)

**Candidate Pool:**

- Lọc phim có thể chiếu tại khung giờ hiện tại (kịp giờ đóng cửa)
- Nếu cần đảm bảo quota Việt → ưu tiên phim Việt

**Tính Điểm (Score):**

```
FOR EACH ứng cử phim:
  count = dailyMovieCounts[movieId]   // Số lần đã chiếu hôm nay
  weight = priority ? priority_weight : 1

  score = (count + 1) / weight

  // Cộng thêm: Nếu cùng khung giờ nhiều phòng chiếu cùng phim → tăng score
  if sameSlotCount > 0:
    score += 0.6 * sameSlotCount

  // Nếu có reroll_token (để xáo trộn) → thêm noise tuỳ ý
  if reroll_token:
    score += noise(0 - 0.001)
```

**Ví Dụ Tính Điểm:**

| Phim                 | Đã Chiếu Hôm Nay | Weight | Score          | Ghi Chú      |
| -------------------- | ---------------- | ------ | -------------- | ------------ |
| Spider-Man (Ưu tiên) | 1                | 3      | (1+1)/3 = 0.67 | ✅ **Thắng** |
| Godzilla (Thường)    | 1                | 1      | (1+1)/1 = 2.0  |              |
| Dune (Ưu tiên)       | 0                | 3      | (0+1)/3 = 0.33 |              |
| Avatar (Thường)      | 0                | 1      | (0+1)/1 = 1.0  |              |

→ **Chọn Dune** (score thấp nhất = ưu tiên)

**Sắp Xếp & Chọn:**

```
1. Sắp xếp theo score ASC (thấp nhất trước)
2. Nếu score bằng nhau:
   - Ưu tiên phim ít chiếu (count thấp)
   - Nếu vẫn bằng nhau: ưu tiên phim ưu tiên (weight cao)
3. Tránh lặp: Nếu phim trước = phim hiện = chọn phim thứ 2 (nếu có)
4. Return: phim có score thấp nhất
```

---

## 📊 Ví Dụ Toàn Cảnh

**Input:**

```json
{
  "cinema_id": 1,
  "start_date": "2026-04-02",
  "end_date": "2026-04-02",
  "day_start_time": "09:00",
  "day_end_time": "12:00",
  "priority_movie_ids": [1],
  "excluded_movie_ids": [],
  "priority_weight": 3,
  "max_showtimes_per_hall_per_day": 0
}
```

**Dữ Liệu:**

- Phim 1 (Spider-Man, Mỹ): 120 phút
- Phim 2 (Dune, Quốc Tế): 166 phút
- Phim 3 (Phim Việt Nam, Việt): 90 phút
- Phòng 1 (Rạp 1): Trống
- Cleanup: 15 phút

**Quá Trình Sắp Xếp:**

**Phòng 1, Ngày 02/04/2026:**

| Step | Time  | Candidates                        | Score          | Chọn       | End Time | Ghi Chú          |
| ---- | ----- | --------------------------------- | -------------- | ---------- | -------- | ---------------- |
| 1    | 09:00 | Phim 1,2,3                        | 0.33, 1.0, 0.5 | **Phim 1** | 10:35    | Ưu tiên, count=0 |
| 2    | 10:35 | Phim 2,3                          | 1.0, 0.33      | **Phim 3** | 11:40    | Tránh lặp Phim 1 |
| 3    | 11:40 | (11:40 + 90 + 15 = 12:45 > 12:00) | X              | Dừng       | -        | Không kịp        |

**Kết Quả:**

```
Suất 1: Phim 1 (Spider-Man) - 09:00 → 10:35
Suất 2: Phim 3 (Việt Nam) - 10:35 → 11:40
Tổng: 2 suất (1 Mỹ, 1 Việt) → VN ratio = 50% ≥ 15% ✅
```

---

## 🛡️ Các Cơ Chế Bảo Vệ

### 1. **Vietnamese Quota Enforcement**

```php
IF dailyVN < requiredVNCount:
  // Ép buộc chọn phim Việt trong vòng lặp hiện tại
  candidates = FILTER(candidates, origin = 'Vietnam')
  // Nếu không có phim Việt ứng cử → fallback toàn bộ pool
```

### 2. **Conflict Resolution**

```
IF hasConflict(hallId, startTime, endTime):
  // Xung đột → lùi 15 phút
  current += 15 phút
  Retry = true
```

### 3. **Reroll Token (Tạo Lại Lịch Khác)**

```
// Giống điểm noise nhỏ để tạo ra lịch khác mà vẫn hợp lý
hash = CRC32(token + slot + movieId + count)
score += (hash % 1000) / 1000000
```

---

## 📈 Cách Tăng/Giảm Cấu Hình

### A. Tăng Thời Gian Đơn Phòng (Cleanup)

**Từ 15 → 20 phút:**

| Config        | 15 phút               | 20 phút                 |
| ------------- | --------------------- | ----------------------- |
| **End Time**  | start + duration + 15 | start + duration + 20   |
| **Interval**  | 130 → 145 (15 phút)   | 130 → 150 (20 phút)     |
| **Suất/Ngày** | 6 suất (~2.5 giờ)     | 5 suất (~2.5 giờ)       |
| **Lợi Ích**   | Nhiều suất, dọn vội   | Ít suất, dọn chu đáo ✅ |

**Cách Thay Đổi:**

```php
// File: backend/config/Config.php
public static $showtime_cleanup_minutes = 20; // Từ 15 → 20
```

---

### B. Tăng Tỷ Lệ Phim Việt

**Từ 15% → 25%:**

| Config           | 15%             | 25%                      |
| ---------------- | --------------- | ------------------------ |
| **10 suất/ngày** | Min 2 phim Việt | Min 3 phim Việt          |
| **20 suất/ngày** | Min 3 phim Việt | Min 5 phim Việt          |
| **Hiệu Ứng**     | Cân bằng        | Ưu tiên phim Việt hơn ✅ |

**Cách Thay Đổi:**

```php
// File: backend/config/Config.php
public static $min_vietnamese_quota = 25; // Từ 15% → 25%
```

---

### C. Tăng Priority Weight

**Priority Weight = Trọng số phim ưu tiên**

```
score = (count + 1) / weight

Weight 1: score = (count + 1) / 1 = count + 1
Weight 2: score = (count + 1) / 2  (nhỏ hơn → ưu tiên hơn)
Weight 5: score = (count + 1) / 5  (ưu tiên nhất)
```

**Từ Weight 3 → Weight 5:**

| Phim     | Count | Weight 3      | Weight 5         |
| -------- | ----- | ------------- | ---------------- |
| Priority | 2     | (2+1)/3 = 1.0 | (2+1)/5 = 0.6 ✅ |
| Regular  | 2     | (2+1)/1 = 3.0 | (2+1)/1 = 3.0    |

→ **Priority weight quanh hơn = phim ưu tiên xuất hiện nhiều hơn**

**Cách Thay Đổi:**

```json
// UI Admin Scheduler
{
  "priority_weight": 5 // Từ 3 → 5
}
```

---

## 🎲 Ví Dụ Config Thực Tế

### Scenario 1: **Rạp Nhỏ (1-2 phòng)**

```
cleanup_duration: 10 phút (dọn nhanh)
min_vietnamese_quota: 20% (ưu tiên phim Việt)
priority_weight: 2 (phim hot chiếu hơn)
max_showtimes_per_hall_per_day: 8 (giới hạn)
```

### Scenario 2: **Rạp Lớn (4-5 phòng)**

```
cleanup_duration: 15 phút (tiêu chuẩn)
min_vietnamese_quota: 15% (cân bằng)
priority_weight: 3 (phim ưu tiên rõ ràng)
max_showtimes_per_hall_per_day: 0 (tối đa hóa)
```

### Scenario 3: **Rạp Toàn Bộ Phim Việt**

```
cleanup_duration: 15 phút
min_vietnamese_quota: 80% (majority Việt)
priority_weight: 3
excluded_movie_ids: [các phim Quốc Tế nổi tiếng ngoại trừ 1-2 cái]
```

---

## 🔍 Kiểm Tra Kết Quả

**API Response:**

```json
{
  "summary": {
    "algorithm": "weighted round-robin (priority-biased) with vietnamese-quota",
    "dry_run": false,
    "cinema_id": 1,
    "date_range": {"start_date": "2026-04-02", "end_date": "2026-04-10"},
    "halls": 3,
    "movies_considered": 12,
    "scheduling_pool_count": 11,
    "priority_movies_found": 3,
    "created_count": 87,
    "skipped_count": 5
  },
  "created_showtimes": [
    {
      "id": 123,
      "date": "2026-04-02",
      "hall_id": 1,
      "hall_name": "Room 1",
      "movie_id": 1,
      "movie_title": "Spider-Man",
      "start_time": "2026-04-02 09:00:00",
      "end_time": "2026-04-02 10:35:00",
      "priority": true
    },
    ...
  ]
}
```

---

## 📝 Tóm Tắt

| Thành Phần              | Χi Tiết                               |
| ----------------------- | ------------------------------------- |
| **Thuật Toán**          | Weighted Round-Robin + VN Quota       |
| **Config 1**            | `cleanup_duration` (15 phút mặc định) |
| **Config 2**            | `min_vietnamese_quota` (15% mặc định) |
| **Score**               | `(count+1) / weight + bonus`          |
| **Tránh Xung Đột**      | Lùi 15 phút, thử lại                  |
| **Đảm Bảo VN Quota**    | Ép buộc chọn phim Việt nếu thiếu      |
| **Tránh Lặp Liên Tiếp** | Chọn phim khác nếu có                 |
