<?php

class BaseController{
    public static function getRequestData() {
        $data = $_POST;
        if (empty($data)) {
            $raw = file_get_contents('php://input');
            $data = json_decode($raw, true) ?: [];
        }
        return $data;
    }
    public static function authorizeUserId($userId) {
        $authUserId = (int)($_REQUEST['auth_user_id'] ?? 0);
        $authRole = $_REQUEST['auth_user_role'] ?? null;

        if ($authRole === 'Admin' || $authRole === 'Manager') {
            return;
        }

        if ($authUserId !== $userId) {
            Response::forbidden('Insufficient permissions');
        }
    }
}
?>
