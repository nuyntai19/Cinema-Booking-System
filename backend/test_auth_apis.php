<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Auth APIs - Galaxy Cinema</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { 
            color: #333; 
            margin-bottom: 10px;
            font-size: 32px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .test-section {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .test-section h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .test-section p {
            color: #666;
            margin-bottom: 15px;
            line-height: 1.6;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-weight: 500;
        }
        input, button {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            margin-top: 10px;
        }
        button:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        .response {
            margin-top: 15px;
            padding: 15px;
            background: white;
            border-radius: 6px;
            border: 1px solid #ddd;
            max-height: 300px;
            overflow-y: auto;
        }
        .response pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            color: #333;
        }
        .success { border-left: 4px solid #28a745; background: #d4edda; }
        .error { border-left: 4px solid #dc3545; background: #f8d7da; }
        .info { border-left: 4px solid #17a2b8; background: #d1ecf1; }
        .token-display {
            margin-top: 10px;
            padding: 10px;
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 6px;
            font-size: 12px;
            word-break: break-all;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        @media (max-width: 768px) {
            .grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 Test Auth APIs - Galaxy Cinema</h1>
        <p class="subtitle">Test các chức năng Authentication mà Thịnh đã làm</p>

        <div class="grid">
            <!-- TEST 1: GỬI MÃ XÁC MINH -->
            <div class="test-section">
                <h2>📧 Test 1: Gửi mã xác minh (Thịnh)</h2>
                <p>Nhập thông tin để nhận mã xác minh 6 số qua email</p>
                
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="reg_email" value="test@gmail.com" placeholder="your@email.com">
                </div>
                <div class="form-group">
                    <label>Họ tên:</label>
                    <input type="text" id="reg_fullname" value="Nguyễn Văn Test" placeholder="Họ và tên">
                </div>
                <div class="form-group">
                    <label>Số điện thoại:</label>
                    <input type="text" id="reg_phone" value="0912345678" placeholder="0912345678">
                </div>
                <div class="form-group">
                    <label>Ngày sinh (YYYY-MM-DD):</label>
                    <input type="date" id="reg_dob" value="2000-01-01">
                </div>
                <div class="form-group">
                    <label>Mật khẩu:</label>
                    <input type="password" id="reg_password" value="123456" placeholder="Mật khẩu">
                </div>
                
                <button onclick="sendVerification()">📤 Gửi mã xác minh</button>
                <div id="send_result" class="response" style="display:none;"></div>
            </div>

            <!-- TEST 2: XÁC MINH MÃ -->
            <div class="test-section">
                <h2>✅ Test 2: Xác minh mã và tạo tài khoản</h2>
                <p>Nhập mã 6 số đã nhận để hoàn tất đăng ký</p>
                
                <div class="form-group">
                    <label>Email (phải giống bước 1):</label>
                    <input type="email" id="verify_email" value="test@gmail.com">
                </div>
                <div class="form-group">
                    <label>Mã xác minh (6 số):</label>
                    <input type="text" id="verify_code" placeholder="123456" maxlength="6">
                </div>
                
                <button onclick="verifyEmail()">🔐 Xác minh và tạo tài khoản</button>
                <div id="verify_result" class="response" style="display:none;"></div>
            </div>

            <!-- TEST 3: ĐĂNG NHẬP -->
            <div class="test-section">
                <h2>🔑 Test 3: Đăng nhập</h2>
                <p>Đăng nhập với tài khoản vừa tạo hoặc tài khoản có sẵn</p>
                
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="login_email" value="admin@galaxycinema.vn" placeholder="Email">
                </div>
                <div class="form-group">
                    <label>Mật khẩu:</label>
                    <input type="password" id="login_password" value="admin123" placeholder="Password">
                </div>
                
                <button onclick="login()">🚀 Đăng nhập</button>
                <div id="login_result" class="response" style="display:none;"></div>
                <div id="token_display" class="token-display" style="display:none;">
                    <strong>🎫 Token JWT:</strong><br>
                    <span id="token_value"></span>
                </div>
            </div>

            <!-- TEST 4: LẤY THÔNG TIN USER -->
            <div class="test-section">
                <h2>👤 Test 4: Lấy thông tin user hiện tại</h2>
                <p>Dùng token từ bước 3 để lấy thông tin user</p>
                
                <button onclick="getCurrentUser()">📋 Lấy thông tin user</button>
                <div id="user_result" class="response" style="display:none;"></div>
            </div>
        </div>

        <!-- HƯỚNG DẪN -->
        <div class="test-section info">
            <h2>📖 Hướng dẫn sử dụng:</h2>
            <ol style="margin-left: 20px; line-height: 1.8;">
                <li><strong>Bước 1:</strong> Click "Gửi mã xác minh" → Kiểm tra console log để lấy mã 6 số</li>
                <li><strong>Bước 2:</strong> Nhập mã vào ô "Xác minh mã" → Click "Xác minh và tạo tài khoản"</li>
                <li><strong>Bước 3:</strong> Dùng email/password vừa đăng ký để login</li>
                <li><strong>Bước 4:</strong> Click "Lấy thông tin user" với token vừa nhận</li>
            </ol>
            <p style="margin-top: 15px;"><strong>💡 Lưu ý:</strong> Mã xác minh sẽ được log ra console (F12) vì đang dùng test mode.</p>
        </div>
    </div>

    <script>
        let currentToken = '';

        async function sendVerification() {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '⏳ Đang gửi...';

            const data = {
                email: document.getElementById('reg_email').value,
                fullName: document.getElementById('reg_fullname').value,
                phone: document.getElementById('reg_phone').value,
                dob: document.getElementById('reg_dob').value,
                password: document.getElementById('reg_password').value
            };

            try {
                const response = await fetch('send_verification_direct.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                displayResult('send_result', result, response.ok);
            } catch (error) {
                displayResult('send_result', { success: false, message: error.message }, false);
            } finally {
                btn.disabled = false;
                btn.textContent = '📤 Gửi mã xác minh';
            }
        }

        async function verifyEmail() {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '⏳ Đang xác minh...';

            const data = {
                email: document.getElementById('verify_email').value,
                code: document.getElementById('verify_code').value
            };

            try {
                const response = await fetch('verify_email_direct.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                displayResult('verify_result', result, response.ok);
            } catch (error) {
                displayResult('verify_result', { success: false, message: error.message }, false);
            } finally {
                btn.disabled = false;
                btn.textContent = '🔐 Xác minh và tạo tài khoản';
            }
        }

        async function login() {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '⏳ Đang đăng nhập...';

            const data = {
                email: document.getElementById('login_email').value,
                password: document.getElementById('login_password').value
            };

            try {
                const response = await fetch('login_direct.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                displayResult('login_result', result, response.ok);

                if (result.success && result.data && result.data.token) {
                    currentToken = result.data.token;
                    document.getElementById('token_value').textContent = currentToken;
                    document.getElementById('token_display').style.display = 'block';
                }
            } catch (error) {
                displayResult('login_result', { success: false, message: error.message }, false);
            } finally {
                btn.disabled = false;
                btn.textContent = '🚀 Đăng nhập';
            }
        }

        async function getCurrentUser() {
            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '⏳ Đang lấy dữ liệu...';

            if (!currentToken) {
                displayResult('user_result', { 
                    success: false, 
                    message: 'Vui lòng đăng nhập trước để lấy token!' 
                }, false);
                btn.disabled = false;
                btn.textContent = '📋 Lấy thông tin user';
                return;
            }

            try {
                const response = await fetch('get_current_user_direct.php', {
                    method: 'GET',
                    headers: { 
                        'Authorization': 'Bearer ' + currentToken
                    }
                });

                const result = await response.json();
                displayResult('user_result', result, response.ok);
            } catch (error) {
                displayResult('user_result', { success: false, message: error.message }, false);
            } finally {
                btn.disabled = false;
                btn.textContent = '📋 Lấy thông tin user';
            }
        }

        function displayResult(elementId, result, isSuccess) {
            const element = document.getElementById(elementId);
            element.style.display = 'block';
            element.className = 'response ' + (isSuccess ? 'success' : 'error');
            element.innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
        }
    </script>
</body>
</html>
