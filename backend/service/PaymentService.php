<?php
/**
 * Payment Service
 */

class PaymentService
{
    public static function createMoMoPayment($amount, $orderId, $orderInfo, $returnUrl, $notifyUrl)
    {
        $endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';

        $partnerCode = MOMO_PARTNER_CODE;
        $accessKey   = MOMO_ACCESS_KEY;
        $secretKey   = MOMO_SECRET_KEY;

        $requestId = uniqid();
        $requestType = 'payWithATM';
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

        return $response['payUrl'] ?? null;
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
        curl_close($ch);

        return json_decode($result, true);
    }
    public static function createVNPayPayment($amount, $orderId, $orderInfo, $returnUrl)
{
    $params = [
        'vnp_Version'   => '2.1.0',
        'vnp_Command'   => 'pay',
        'vnp_TmnCode'   => VNP_TMNCODE,
        'vnp_Amount'    => $amount * 100,
        'vnp_CurrCode'  => 'VND',
        'vnp_TxnRef'    => $orderId,
        'vnp_OrderInfo' => $orderInfo,
        'vnp_OrderType' => 'other',
        'vnp_Locale'    => 'vn',
        'vnp_ReturnUrl' => $returnUrl,
        'vnp_IpAddr'    => $_SERVER['REMOTE_ADDR'],
        'vnp_CreateDate'=> date('YmdHis')
    ];

    ksort($params);

    $query = http_build_query($params);
    $hash  = hash_hmac('sha512', $query, VNP_HASH_SECRET);

    return VNP_URL . '?' . $query . '&vnp_SecureHash=' . $hash;
}

}

