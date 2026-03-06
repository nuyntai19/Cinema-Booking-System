<?php
/**
 * Payment Service
 */

class PaymentService
{
    public static function createMoMoPayment($amount, $orderId, $orderInfo, $returnUrl, $notifyUrl)
    {
        $endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';

        $partnerCode = self::requiredConfig('MOMO_PARTNER_CODE');
        $accessKey   = self::requiredConfig('MOMO_ACCESS_KEY');
        $secretKey   = self::requiredConfig('MOMO_SECRET_KEY');

        $requestId = uniqid();
        // captureWallet returns qrCodeUrl for QR-based flow.
        $requestType = 'captureWallet';
        $extraData = '';

        $raw = "accessKey=$accessKey"
            . "&amount=$amount"
            . "&extraData=$extraData"
            . "&ipnUrl=$notifyUrl"
            . "&orderId=$orderId"
            . "&orderInfo=$orderInfo"
            . "&partnerCode=$partnerCode"
            . "&redirectUrl=$returnUrl"
            . "&requestId=$requestId"
            . "&requestType=$requestType";

        $signature = hash_hmac('sha256', $raw, $secretKey);

        $payload = [
            'partnerCode' => $partnerCode,
            'accessKey'   => $accessKey,
            'requestId'   => $requestId,
            'amount'      => $amount,
            'orderId'     => $orderId,
            'orderInfo'   => $orderInfo,
            'redirectUrl' => $returnUrl,
            'ipnUrl'      => $notifyUrl,
            'requestType' => $requestType,
            'extraData'   => $extraData,
            'signature'   => $signature
        ];

        $response = self::postJson($endpoint, $payload);
        if (!is_array($response)) {
            throw new Exception('MoMo response is invalid', 502);
        }
        if (!empty($response['qrCodeUrl']) || !empty($response['payUrl'])) {
            return [
                'pay_url' => $response['payUrl'] ?? null,
                'qr_code_url' => $response['qrCodeUrl'] ?? null,
            ];
        }

        $message = $response['message'] ?? 'MoMo did not return payment url';
        throw new Exception('MoMo error: ' . $message, 502);
    }

    private static function postJson($url, $data)
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => json_encode($data)
        ]);

        $result = curl_exec($ch);
        if ($result === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new Exception('Payment gateway request failed: ' . $error, 502);
        }
        curl_close($ch);

        return json_decode($result, true);
    }
    public static function createVNPayPayment($amount, $orderId, $orderInfo, $returnUrl)
{
    $tmnCode = self::requiredConfig('VNP_TMNCODE');
    $hashSecret = self::requiredConfig('VNP_HASH_SECRET');
    $vnpUrl = self::requiredConfig('VNP_URL');

    $params = [
        'vnp_Version'   => '2.1.0',
        'vnp_Command'   => 'pay',
        'vnp_TmnCode'   => $tmnCode,
        'vnp_Amount'    => $amount * 100,
        'vnp_CurrCode'  => 'VND',
        'vnp_TxnRef'    => $orderId,
        'vnp_OrderInfo' => $orderInfo,
        'vnp_OrderType' => 'other',
        'vnp_Locale'    => 'vn',
        'vnp_ReturnUrl' => $returnUrl,
        'vnp_IpAddr'    => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
        'vnp_CreateDate'=> date('YmdHis')
    ];

    ksort($params);

    $query = http_build_query($params);
    $hash  = hash_hmac('sha512', $query, $hashSecret);

    return $vnpUrl . '?' . $query . '&vnp_SecureHash=' . $hash;
}

    private static function requiredConfig($key)
    {
        if (defined($key)) {
            return constant($key);
        }

        $value = getenv($key);
        if ($value !== false && $value !== '') {
            return $value;
        }

        if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
            return $_ENV[$key];
        }

        throw new Exception('Missing payment config: ' . $key, 500);
    }

}
