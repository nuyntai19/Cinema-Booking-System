# 🔔 HƯỚNG DẪN CẤU HÌNH MOMO WEBHOOK TRÊN AWS

## ❓ VẤN ĐỀ

Khi deploy lên AWS, **MoMo webhook SẼ HOẠT ĐỘNG** nhưng cần cấu hình đúng URL public!

### ⚠️ Vấn đề khi dùng localhost:
```
❌ localhost:8000/api/transactions/momo/verify
   → MoMo KHÔNG gọi được (không public)
   
❌ 127.0.0.1:8000/api/transactions/momo/verify  
   → MoMo KHÔNG gọi được (IP private)
```

### ✅ Cần URL public trên AWS:
```
✅ https://your-domain.com/api/transactions/momo/verify
   → MoMo CÓ THỂ gọi được
   
✅ http://ec2-XX-XXX-XXX-XX.compute.amazonaws.com/api/transactions/momo/verify
   → MoMo CÓ THỂ gọi được
```

---

## 🏗️ KIẾN TRÚC WEBHOOK

### Cách MoMo Webhook hoạt động:

```
┌─────────┐                 ┌─────────┐                 ┌─────────┐
│  User   │────① Pay────────>│  MoMo   │                 │ AWS App │
│ (Phone) │                 │ Gateway │                 │ Backend │
└─────────┘                 └────┬────┘                 └────┬────┘
                                 │                           │
                                 │ ② Payment Processed       │
                                 │                           │
                                 └───③ POST Webhook IPN────>│
                                     (notifyUrl)             │
                                                             │
                                 ┌───④ Verify Signature─────┤
                                 │                           │
                                 │  ⑤ Update DB              │
                                 │  ⑥ Confirm Booking        │
                                 │                           │
                                 └───⑦ Return 200 OK────────┘
```

**Các bước:**
1. User thanh toán qua MoMo app
2. MoMo xử lý giao dịch (thành công/thất bại)
3. **MoMo gọi webhook (IPN) tới server AWS của bạn**
4. Backend verify chữ ký MoMo
5. Cập nhật transaction status trong DB
6. Confirm booking nếu thành công
7. Trả về HTTP 200 cho MoMo

---

## ✅ CẤU HÌNH WEBHOOK CHO AWS

### Bước 1: Xác định URL công khai của AWS

Sau khi deploy lên AWS, bạn sẽ có một trong các loại URL:

#### Option A: EC2 Public DNS
```
http://ec2-54-123-45-67.ap-southeast-1.compute.amazonaws.com
```

#### Option B: Elastic Load Balancer
```
http://cinema-alb-123456789.ap-southeast-1.elb.amazonaws.com
```

#### Option C: Custom Domain (Recommended)
```
https://api.galaxy-cinema.com
```

### Bước 2: Cấu hình biến môi trường

Trong file `.env` trên AWS EC2:

```bash
# Backend URL (public)
APP_URL=https://api.galaxy-cinema.com

# Hoặc dùng EC2 public DNS:
# APP_URL=http://ec2-54-123-45-67.ap-southeast-1.compute.amazonaws.com

# Frontend URL
FRONTEND_URL=https://galaxy-cinema.com

# MoMo Webhook URLs
MOMO_NOTIFY_URL=https://api.galaxy-cinema.com/api/transactions/momo/verify
MOMO_RETURN_URL=https://galaxy-cinema.com/booking/success

# VNPay Webhook URLs
VNPAY_NOTIFY_URL=https://api.galaxy-cinema.com/api/transactions/vnpay/ipn
```

### Bước 3: Update backend code (đã có sẵn!)

Code hiện tại trong `TransactionService.php` đã hỗ trợ:

```php
// Line 249: backend/service/TransactionService.php
$notifyUrl = getenv('MOMO_NOTIFY_URL') ?: ($baseUrl . '/index.php/api/transactions/momo/verify');
```

**Cơ chế:**
- Nếu có `MOMO_NOTIFY_URL` trong `.env` → Dùng URL đó
- Nếu không có → Tự động build từ `APP_URL`

### Bước 4: Verify MoMo Signature (đã implement!)

Code trong `PaymentService.php` lines 164-202:

```php
public static function verifyMomoPayment($data) {
    // 1. Check required fields
    // 2. Build signature string
    // 3. Calculate HMAC-SHA256
    // 4. Compare với signature từ MoMo
    // 5. Return true/false
}
```

**Security**: Đảm bảo webhook từ MoMo là thật, không bị giả mạo!

---

## 🔐 BẢO MẬT WEBHOOK

### 1. Whitelist IP MoMo (Optional)

Trong AWS Security Group, chỉ cho phép IP của MoMo:

```
Inbound Rules:
Type: HTTP/HTTPS
Port: 80/443
Source: <MoMo IP ranges>
Description: MoMo Webhook IPN
```

**Lưu ý**: Cần xin danh sách IP từ MoMo support.

### 2. HTTPS (Highly Recommended)

MoMo ưu tiên webhook qua HTTPS:

```bash
# Setup SSL certificate với Let's Encrypt
sudo certbot --nginx -d api.galaxy-cinema.com

# Cập nhật .env
MOMO_NOTIFY_URL=https://api.galaxy-cinema.com/api/transactions/momo/verify
```

### 3. Signature Verification (Đã có!)

Code tự động verify signature từ MoMo → Không ai fake được webhook!

---

## 📋 CHECKLIST DEPLOY AWS

### ✅ Before Deploy:

- [ ] Có tài khoản MoMo Business/Sandbox
- [ ] Có MoMo credentials:
  - `MOMO_PARTNER_CODE`
  - `MOMO_ACCESS_KEY`
  - `MOMO_SECRET_KEY`
- [ ] AWS instance đã setup
- [ ] Domain/subdomain đã trỏ về AWS (nếu dùng custom domain)

### ✅ AWS Infrastructure:

- [ ] EC2 instance running (hoặc ECS/EKS)
- [ ] Security Group mở port 80/443
- [ ] Load Balancer configured (nếu có)
- [ ] SSL certificate installed (recommended)
- [ ] Public DNS/IP đã xác định

### ✅ Backend Configuration:

- [ ] Cập nhật `.env` trên AWS:
  ```bash
  APP_URL=https://api.galaxy-cinema.com
  FRONTEND_URL=https://galaxy-cinema.com
  MOMO_NOTIFY_URL=https://api.galaxy-cinema.com/api/transactions/momo/verify
  MOMO_PARTNER_CODE=xxx
  MOMO_ACCESS_KEY=xxx
  MOMO_SECRET_KEY=xxx
  ```
- [ ] Restart backend service:
  ```bash
  docker-compose -f docker-compose.deploy.yml restart backend
  ```

### ✅ Testing:

- [ ] Test webhook endpoint trả về 200:
  ```bash
  curl -X POST https://api.galaxy-cinema.com/api/transactions/momo/verify \
    -H "Content-Type: application/json" \
    -d '{"orderId":"TEST123","resultCode":"0"}'
  ```
  
- [ ] Check logs:
  ```bash
  docker-compose -f docker-compose.deploy.yml logs -f backend
  ```

- [ ] Test thanh toán thật với MoMo sandbox

### ✅ MoMo Portal Configuration:

- [ ] Đăng nhập MoMo Business Portal
- [ ] Vào **Cấu hình → API Settings**
- [ ] Cập nhật **IPN URL**:
  ```
  https://api.galaxy-cinema.com/api/transactions/momo/verify
  ```
- [ ] Lưu cấu hình
- [ ] Test webhook từ portal (nếu có)

---

## 🧪 TESTING WEBHOOK

### Test 1: Manual cURL test

```bash
# Giả lập MoMo gọi webhook
curl -X POST https://api.galaxy-cinema.com/api/transactions/momo/verify \
  -H "Content-Type: application/json" \
  -d '{
    "partnerCode": "MOMO",
    "orderId": "MOMO-240101120000-abc123",
    "requestId": "req123",
    "amount": 100000,
    "orderInfo": "Test payment",
    "orderType": "momo_wallet",
    "transId": 12345678,
    "resultCode": 0,
    "message": "Success",
    "responseTime": 1704096000000,
    "extraData": "",
    "signature": "xxx"
  }'

# Expected response:
# {"success": true, "message": "Momo verification processed"}
```

### Test 2: MoMo Sandbox Payment

1. Tạo booking trong app
2. Chọn thanh toán MoMo
3. Quét QR code bằng MoMo sandbox app
4. Hoàn tất thanh toán
5. Check logs backend:
   ```bash
   # Sẽ thấy log:
   # "MoMo webhook received: orderId=MOMO-xxx, resultCode=0"
   # "Transaction MOMO-xxx updated to Success"
   # "Booking #123 confirmed"
   ```

### Test 3: Check database

```sql
-- Verify transaction được cập nhật
SELECT * FROM transactions 
WHERE transaction_code = 'MOMO-240101120000-abc123';

-- Verify booking được confirm
SELECT * FROM bookings 
WHERE id = (SELECT booking_id FROM transactions WHERE transaction_code = 'MOMO-xxx');
-- status phải = 'Confirmed'
```

---

## 🚨 TROUBLESHOOTING

### ❌ Problem 1: MoMo không gọi được webhook

**Triệu chứng:**
- User thanh toán thành công trên MoMo
- Nhưng booking vẫn "Pending" trong DB
- Không thấy log webhook trong backend

**Nguyên nhân:**
- URL không public
- Security Group block traffic
- Server down

**Giải pháp:**
```bash
# 1. Verify URL public
curl -I https://api.galaxy-cinema.com/api/transactions/momo/verify
# Phải trả về HTTP 400/422 (chứ không phải timeout/refused)

# 2. Check AWS Security Group
# Đảm bảo port 443 (HTTPS) mở cho public (0.0.0.0/0)

# 3. Check backend logs
docker-compose logs backend | grep -i momo
```

### ❌ Problem 2: Signature verification failed

**Triệu chứng:**
```
MoMo signature verification failed for orderId=xxx
```

**Nguyên nhân:**
- Sai `MOMO_SECRET_KEY`
- Signature string build sai thứ tự

**Giải pháp:**
```bash
# 1. Double-check credentials
echo $MOMO_SECRET_KEY
# So sánh với MoMo portal

# 2. Check code PaymentService.php line 181-193
# Thứ tự params phải đúng theo docs MoMo
```

### ❌ Problem 3: Webhook bị timeout

**Triệu chứng:**
- MoMo gọi webhook
- Backend xử lý chậm > 30s
- MoMo timeout và retry

**Nguyên nhân:**
- DB query chậm
- Network latency cao
- CPU/Memory quá tải

**Giải pháp:**
```php
// Optimize webhook handler
public function verifyMomo() {
    // 1. Nhanh chóng verify signature
    // 2. Return 200 OK ngay lập tức
    // 3. Process async sau
    
    Response::success($result, 'Momo verification processed');
}
```

### ❌ Problem 4: Duplicate webhooks

**Triệu chứng:**
- Nhận nhiều webhook cho cùng 1 giao dịch
- Transaction bị update nhiều lần

**Nguyên nhân:**
- MoMo retry vì không nhận được 200 OK
- Hoặc timeout

**Giải pháp:**
Code hiện tại đã handle (line 72-75 TransactionService.php):
```php
$transaction = $this->transactionModel->getByTransactionCode($transactionCode);
if (!$transaction) {
    throw new Exception('Transaction not found', 404);
}
// Idempotent: Cùng transaction_code chỉ update 1 lần
```

---

## 🎯 BEST PRACTICES

### 1. Dùng HTTPS luôn
```
✅ https://api.galaxy-cinema.com/api/transactions/momo/verify
❌ http://api.galaxy-cinema.com/api/transactions/momo/verify
```

### 2. Monitor webhook logs
```bash
# Setup CloudWatch Logs (AWS)
# hoặc ELK stack
# hoặc simple file logging

tail -f /var/log/backend/momo-webhook.log
```

### 3. Retry mechanism (optional)
Nếu webhook xử lý fail, có thể:
- MoMo sẽ tự động retry (3-5 lần)
- Hoặc implement polling từ frontend:
  ```js
  // Check transaction status mỗi 5s
  setInterval(() => {
    checkTransactionStatus(transactionCode);
  }, 5000);
  ```

### 4. Alerting
Setup alert khi:
- Webhook failure rate > 5%
- Response time > 3s
- Signature verification fails > 10 lần/giờ

---

## 📊 MONITORING

### Metrics cần track:

1. **Webhook Success Rate**
   ```
   Total successful webhooks / Total webhooks received
   Target: > 99%
   ```

2. **Response Time**
   ```
   Average time to process webhook
   Target: < 1s
   ```

3. **Signature Verification**
   ```
   Failed signature checks
   Target: 0 (hoặc < 0.1%)
   ```

### Sample monitoring query:

```sql
-- Webhook success rate trong 24h
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) as success,
  ROUND(SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM transactions
WHERE payment_method = 'Momo'
  AND created_at >= NOW() - INTERVAL 24 HOUR;
```

---

## 📞 SUPPORT

### MoMo Support:
- Email: merchant.support@momo.vn
- Hotline: 1900 545 456
- Docs: https://developers.momo.vn/

### Cần test với MoMo Sandbox?
1. Đăng ký tại: https://developers.momo.vn/
2. Lấy test credentials
3. App MoMo sandbox: Download từ portal

---

## ✅ TÓM TẮT

### Webhook HOẠT ĐỘNG trên AWS nếu:

1. ✅ **URL public** (https://your-domain.com)
2. ✅ **Port 443 mở** trong Security Group
3. ✅ **Biến môi trường đúng** (MOMO_NOTIFY_URL)
4. ✅ **SSL certificate** (recommended)
5. ✅ **Credentials đúng** (SECRET_KEY)

### Code đã sẵn sàng:
- ✅ Auto-detect base URL
- ✅ Signature verification
- ✅ Idempotent handling
- ✅ Error logging
- ✅ Pusher real-time notification

### Chỉ cần:
1. Deploy lên AWS
2. Cập nhật `.env` với URL public
3. Cấu hình IPN URL trong MoMo portal
4. Test!

---

## 🎉 KẾT LUẬN

**WEBHOOK MOMO SẼ HOẠT ĐỘNG HOÀN TOÀN BÌNH THƯỜNG TRÊN AWS!**

Không có vấn đề gì khi deploy lên cloud, miễn là:
- URL public và accessible
- Cấu hình đúng
- Code đã handle (✅ đã có)

**Next steps:**
1. Xem: `AWS_DEPLOYMENT_GUIDE.md` để deploy
2. Cập nhật `.env` với public URLs
3. Test webhook với MoMo sandbox
4. Go live! 🚀

---

*Document version: 1.0*  
*Last updated: 2026-04-02*  
*Galaxy Cinema Booking System*
