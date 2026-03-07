<?php
require_once __DIR__ . '/../models/Promotion.php';
require_once __DIR__ . '/../core/Response.php';

class PromotionController {
    private $model;

    public function __construct() {
        $this->model = new Promotion();
    }

    public function index() {
        $filters = [];
        $q = $_GET ?? [];
        if (isset($q['active'])) $filters['active'] = filter_var($q['active'], FILTER_VALIDATE_BOOLEAN);
        if (isset($q['type'])) $filters['type'] = $q['type'];
        $promos = $this->model->getAll($filters);
        return Response::success(['promotions' => $promos]);
    }

    public function show($id) {
        $p = $this->model->getById($id);
        if (!$p) return Response::error('Promotion not found', 404);
        return Response::success(['promotion' => $p]);
    }

    public function create() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $id = $this->model->create($data);
            if (!$id) return Response::error('Could not create promotion', 500);
            return Response::success(['id' => $id], 201);
        } catch (Exception $e) {
            return Response::error('Lỗi: '.$e->getMessage(), 500);
        }
    }

    public function update($id) {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Debug logging
            error_log("=== Promotion Update Request ===");
            error_log("ID: " . $id);
            error_log("Data: " . json_encode($data));
            
            $ok = $this->model->update($id, $data);
            
            error_log("Update result: " . ($ok ? "SUCCESS" : "FAILED"));
            
            if (!$ok) {
                error_log("Update failed for promotion ID: " . $id);
                return Response::error('Could not update promotion', 500);
            }
            
            return Response::success(['updated' => true]);
        } catch (Exception $e) {
            error_log("Exception in PromotionController::update: " . $e->getMessage());
            return Response::error('Error: ' . $e->getMessage(), 500);
        }
    }

    public function delete($id) {
        // Hard delete the promotion from database. This will also cascade to user_vouchers
        // because the foreign key in `user_vouchers` is defined with ON DELETE CASCADE.
        $ok = $this->model->delete($id);
        if (!$ok) return Response::error('Could not delete promotion', 500);
        return Response::success(['deleted' => true]);
    }

    public function getActive() {
        return Response::success(['promotions' => $this->model->getActive()]);
    }
}
