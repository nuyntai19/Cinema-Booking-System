<?php
/**
 * Test SMTP Email Configuration
 * Chạy file này để kiểm tra email có gửi được không
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config/Config.php';
require_once __DIR__ . '/utils/EmailService.php';

echo "<h1>🧪 Test SMTP Email Configuration</h1>";
echo "<hr>";

// Hiển thị config
echo "<h2>📋 SMTP Configuration:</h2>";
echo "<pre>";
echo "SMTP Enabled: " . (Config::$smtp_enabled ? '✓ YES' : '✗ NO') . "\n";
echo "SMTP Host: " . Config::$smtp_host . "\n";
echo "SMTP Port: " . Config::$smtp_port . "\n";
echo "SMTP Encryption: " . Config::$smtp_encryption . "\n";
echo "SMTP Username: " . Config::$smtp_username . "\n";
echo "SMTP Password: " . (Config::$smtp_password ? '****** (set)' : '(not set)') . "\n";
echo "From Email: " . Config::$smtp_from_email . "\n";
echo "From Name: " . Config::$smtp_from_name . "\n";
echo "</pre>";

// Kiểm tra extension
echo "<h2>🔧 PHP Extensions:</h2>";
echo "<pre>";
echo "OpenSSL: " . (extension_loaded('openssl') ? '✓ Enabled' : '✗ Disabled') . "\n";
echo "Sockets: " . (function_exists('fsockopen') ? '✓ Available' : '✗ Not available') . "\n";
echo "</pre>";

// Test gửi email
if (isset($_GET['send'])) {
    $testEmail = $_GET['email'] ?? 'minichicken0423@gmail.com';
    
    echo "<h2>📧 Sending Test Email...</h2>";
    echo "<p>To: <strong>{$testEmail}</strong></p>";
    echo "<pre>";
    
    $emailService = new EmailService();
    $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    
    echo "Verification Code: <strong>{$code}</strong>\n\n";
    
    $result = $emailService->sendVerificationCode($testEmail, 'Test User', $code);
    
    if ($result) {
        echo "\n<span style='color: green;'>✓ Email sent successfully!</span>\n";
        echo "\nCheck your email inbox (and spam folder).\n";
        echo "Code to verify: <strong style='color: blue; font-size: 20px;'>{$code}</strong>\n";
    } else {
        echo "\n<span style='color: red;'>✗ Failed to send email.</span>\n";
        echo "\nCheck error log above for details.\n";
    }
    
    echo "</pre>";
    
    echo "<hr>";
    echo "<a href='test_email.php'>← Back</a>";
    
} else {
    // Form để nhập email
    echo "<h2>🚀 Send Test Email</h2>";
    echo "<form method='GET'>";
    echo "<input type='hidden' name='send' value='1'>";
    echo "<label>Your Email:</label><br>";
    echo "<input type='email' name='email' value='minichicken0423@gmail.com' style='width: 300px; padding: 8px; margin: 10px 0;' required><br>";
    echo "<button type='submit' style='padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;'>Send Test Email</button>";
    echo "</form>";
    
    echo "<hr>";
    echo "<h3>💡 Troubleshooting Tips:</h3>";
    echo "<ul>";
    echo "<li>Đảm bảo <code>Config::\$smtp_enabled = true</code></li>";
    echo "<li>Kiểm tra username và password trong <code>Config.php</code></li>";
    echo "<li>Nếu dùng Gmail, cần dùng <strong>App Password</strong> (không phải password thường)</li>";
    echo "<li>Tạo App Password: <a href='https://myaccount.google.com/apppasswords' target='_blank'>Google App Passwords</a></li>";
    echo "<li>Bật 2FA cho Gmail account trước khi tạo App Password</li>";
    echo "<li>Port 587 dùng cho TLS, Port 465 dùng cho SSL</li>";
    echo "<li>Kiểm tra firewall có block port 587 không</li>";
    echo "</ul>";
}

echo "<hr>";
echo "<p><small>Galaxy Cinema Backend - Email Test Tool</small></p>";
