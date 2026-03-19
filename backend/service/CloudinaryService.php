<?php

require_once __DIR__ . '/../config/Config.php';

class CloudinaryService
{
    private $cloudName;
    private $apiKey;
    private $apiSecret;

    public function __construct()
    {
        if (!Config::isCloudinaryConfigured()) {
            throw new RuntimeException('Cloudinary chưa được cấu hình đầy đủ.');
        }

        $this->cloudName = Config::$cloudinary_cloud_name;
        $this->apiKey = Config::$cloudinary_api_key;
        $this->apiSecret = Config::$cloudinary_api_secret;
    }

    public function uploadImage(array $file, $folder, $publicIdPrefix)
    {
        if (!extension_loaded('curl')) {
            throw new RuntimeException('PHP cURL extension chưa được bật.');
        }

        if (empty($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            throw new RuntimeException('File upload không hợp lệ.');
        }

        $timestamp = time();
        $params = [
            'folder' => Config::getCloudinaryFolder($folder),
            'invalidate' => 'true',
            'overwrite' => 'true',
            'public_id' => $this->buildPublicId($publicIdPrefix),
            'timestamp' => (string) $timestamp,
        ];

        $signature = $this->signParameters($params);
        $endpoint = sprintf('https://api.cloudinary.com/v1_1/%s/image/upload', $this->cloudName);

        $postFields = $params;
        $postFields['api_key'] = $this->apiKey;
        $postFields['signature'] = $signature;
        $postFields['file'] = new CURLFile(
            $file['tmp_name'],
            $file['type'] ?? 'application/octet-stream',
            $file['name'] ?? basename($file['tmp_name'])
        );

        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postFields,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $curlError = curl_error($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false) {
            throw new RuntimeException('Cloudinary request failed: ' . $curlError);
        }

        $data = json_decode($response, true);
        if (!is_array($data)) {
            throw new RuntimeException('Cloudinary trả về dữ liệu không hợp lệ.');
        }

        if ($httpCode >= 400 || empty($data['secure_url'])) {
            $errorMessage = $data['error']['message'] ?? 'Upload ảnh lên Cloudinary thất bại.';
            throw new RuntimeException($errorMessage);
        }

        return [
            'url' => $data['secure_url'],
            'public_id' => $data['public_id'] ?? null,
            'format' => $data['format'] ?? null,
        ];
    }

    private function buildPublicId($prefix)
    {
        $sanitizedPrefix = preg_replace('/[^A-Za-z0-9_\/-]+/', '_', (string) $prefix);
        $sanitizedPrefix = trim((string) $sanitizedPrefix, '_/');

        if ($sanitizedPrefix === '') {
            $sanitizedPrefix = 'image';
        }

        return sprintf('%s_%s', $sanitizedPrefix, uniqid());
    }

    private function signParameters(array $params)
    {
        ksort($params);

        $parts = [];
        foreach ($params as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            $parts[] = $key . '=' . $value;
        }

        return sha1(implode('&', $parts) . $this->apiSecret);
    }
}
