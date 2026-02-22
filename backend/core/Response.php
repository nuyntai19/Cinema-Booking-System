<?php
/**
 * Response Helper - Standardized API Responses
 */
class Response {
    public static function success($data = [], $message = 'Success', $code = 200) {
        // Clean any unexpected output
        if (ob_get_level() > 0) {
            ob_clean();
        }
        
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
    
    public static function error($message = 'Error', $code = 400, $errors = []) {
        // Clean any unexpected output
        if (ob_get_level() > 0) {
            ob_clean();
        }
        
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($code);
        $response = [
            'success' => false,
            'message' => $message
        ];
        
        if (!empty($errors)) {
            $response['errors'] = $errors;
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
    
    public static function unauthorized($message = 'Unauthorized') {
        self::error($message, 401);
    }
    
    public static function forbidden($message = 'Forbidden') {
        self::error($message, 403);
    }
    
    public static function notFound($message = 'Not Found') {
        self::error($message, 404);
    }
    
    public static function validationError($errors, $message = 'Validation Error') {
        self::error($message, 422, $errors);
    }
    
    public static function serverError($message = 'Internal Server Error') {
        self::error($message, 500);
    }
    
    public static function created($data = [], $message = 'Resource created successfully') {
        self::success($data, $message, 201);
    }
    
    public static function paginated($data, $total, $page, $limit) {
        $totalPages = ceil($total / $limit);
        
        self::success([
            'items' => $data,
            'pagination' => [
                'total' => (int)$total,
                'page' => (int)$page,
                'limit' => (int)$limit,
                'totalPages' => (int)$totalPages,
                'hasMore' => $page < $totalPages
            ]
        ]);
    }
}
