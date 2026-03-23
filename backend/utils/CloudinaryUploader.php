<?php

class CloudinaryUploader
{
    public static function isEnabled(): bool
    {
        $enabled = strtolower((string) getenv('CLOUDINARY_ENABLED'));
        return in_array($enabled, ['1', 'true', 'yes', 'on'], true);
    }

    public static function isConfigured(): bool
    {
        return !empty(getenv('CLOUDINARY_CLOUD_NAME'))
            && !empty(getenv('CLOUDINARY_API_KEY'))
            && !empty(getenv('CLOUDINARY_API_SECRET'));
    }

    public static function uploadImage(string $localFilePath, string $publicId, string $subFolder = ''): ?string
    {
        if (!self::isEnabled() || !self::isConfigured()) {
            return null;
        }

        if (!file_exists($localFilePath)) {
            return null;
        }

        return self::upload($localFilePath, true, $publicId, $subFolder);
    }

    public static function uploadImageFromUrl(string $sourceUrl, string $publicId, string $subFolder = ''): ?string
    {
        if (!self::isEnabled() || !self::isConfigured()) {
            return null;
        }

        $sourceUrl = trim($sourceUrl);
        if (!filter_var($sourceUrl, FILTER_VALIDATE_URL)) {
            return null;
        }

        $scheme = strtolower((string) parse_url($sourceUrl, PHP_URL_SCHEME));
        if (!in_array($scheme, ['http', 'https'], true)) {
            return null;
        }

        return self::upload($sourceUrl, false, $publicId, $subFolder);
    }

    private static function upload(string $fileInput, bool $isLocalFile, string $publicId, string $subFolder = ''): ?string
    {
        if (!self::isEnabled() || !self::isConfigured()) {
            return null;
        }

        $cloudName = (string) getenv('CLOUDINARY_CLOUD_NAME');
        $apiKey = (string) getenv('CLOUDINARY_API_KEY');
        $apiSecret = (string) getenv('CLOUDINARY_API_SECRET');
        $baseFolder = trim((string) getenv('CLOUDINARY_FOLDER'));
        $subFolder = trim($subFolder, " /\\");
        $folder = $baseFolder;
        if ($subFolder !== '') {
            $folder = $folder !== '' ? ($folder . '/' . $subFolder) : $subFolder;
        }
        $timestamp = time();

        $signatureParams = [
            'public_id' => $publicId,
            'timestamp' => (string) $timestamp,
        ];
        if ($folder !== '') {
            $signatureParams['folder'] = $folder;
        }
        ksort($signatureParams);

        $signaturePairs = [];
        foreach ($signatureParams as $key => $value) {
            $signaturePairs[] = $key . '=' . $value;
        }
        $signature = sha1(implode('&', $signaturePairs) . $apiSecret);

        $uploadUrl = 'https://api.cloudinary.com/v1_1/' . rawurlencode($cloudName) . '/image/upload';

        $postFields = [
            'file' => $isLocalFile ? new CURLFile($fileInput) : $fileInput,
            'api_key' => $apiKey,
            'timestamp' => (string) $timestamp,
            'public_id' => $publicId,
            'signature' => $signature,
        ];

        if ($folder !== '') {
            $postFields['folder'] = $folder;
        }

        $ch = curl_init($uploadUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postFields,
            CURLOPT_TIMEOUT => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false || $curlError !== '') {
            error_log('Cloudinary upload cURL error: ' . $curlError);
            return null;
        }

        $decoded = json_decode($response, true);
        if ($httpCode >= 200 && $httpCode < 300 && !empty($decoded['secure_url'])) {
            return $decoded['secure_url'];
        }

        $err = isset($decoded['error']['message']) ? $decoded['error']['message'] : $response;
        error_log('Cloudinary upload failed: HTTP ' . $httpCode . ' - ' . $err);
        return null;
    }
}
