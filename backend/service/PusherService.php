<?php
/**
 * Pusher Service
 * Sends realtime events to frontend through Pusher Channels HTTP API.
 */
class PusherService {
    public static function triggerPaymentStatus($bookingId, $transactionCode, $status, $gateway) {
        $appId = getenv('PUSHER_APP_ID') ?: '';
        $key = getenv('PUSHER_KEY') ?: '';
        $secret = getenv('PUSHER_SECRET') ?: '';
        $cluster = getenv('PUSHER_CLUSTER') ?: 'ap1';

        if ($appId === '' || $key === '' || $secret === '') {
            // Realtime is optional. Skip silently when not configured.
            return false;
        }
        
        if (!function_exists('curl_init')) {
            error_log('Pusher trigger skipped: cURL extension is not enabled.');
            return false;
        }

        $host = 'api-' . $cluster . '.pusher.com';
        $path = '/apps/' . $appId . '/events';
        $body = json_encode([
            'name' => 'payment-status-updated',
            'channels' => ['booking.' . (int)$bookingId],
            'data' => json_encode([
                'booking_id' => (int)$bookingId,
                'transaction_code' => (string)$transactionCode,
                'status' => (string)$status,
                'gateway' => (string)$gateway,
                'updated_at' => date('c'),
            ]),
        ], JSON_UNESCAPED_UNICODE);

        if ($body === false) {
            return false;
        }

        $authTimestamp = (string)time();
        $authVersion = '1.0';
        $bodyMd5 = md5($body);
        $queryParams = [
            'auth_key' => $key,
            'auth_timestamp' => $authTimestamp,
            'auth_version' => $authVersion,
            'body_md5' => $bodyMd5,
        ];
        ksort($queryParams);
        $query = http_build_query($queryParams);

        $stringToSign = "POST\n" . $path . "\n" . $query;
        $signature = hash_hmac('sha256', $stringToSign, $secret);
        $url = 'https://' . $host . $path . '?' . $query . '&auth_signature=' . $signature;

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_TIMEOUT => 8,
        ]);

        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($response === false || $httpCode < 200 || $httpCode >= 300) {
            $error = curl_error($ch);
            curl_close($ch);
            error_log('Pusher trigger failed: ' . ($error ?: ('HTTP ' . $httpCode)));
            return false;
        }

        curl_close($ch);
        return true;
    }
}
