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

    /**
     * Authorize user ID
     * @param int $userId User ID to check
     * @param bool $returnBoolean If true, return bool; if false, throw 403 on fail
     * @return bool|void Returns bool if $returnBoolean=true, else throws 403
     */
    public static function authorizeUserId($userId, $returnBoolean = false) {
        $authUserId = (int)($_REQUEST['auth_user_id'] ?? 0);
        $authRole = $_REQUEST['auth_user_role'] ?? null;

        $isAdmin = $authRole === 'Admin' || $authRole === 'Manager' || $authRole === 'Staff';
        $isSelf = $authUserId === $userId;

        if ($isAdmin || $isSelf) {
            if ($returnBoolean) return true;
            return;
        }

        if ($returnBoolean) return false;
        Response::forbidden('Insufficient permissions');
    }
}
?>
