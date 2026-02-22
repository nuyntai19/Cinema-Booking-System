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
        $data = json_decode(file_get_contents('php://input'), true);
        $ok = $this->model->update($id, $data);
        if (!$ok) return Response::error('Could not update promotion', 500);
        return Response::success(['updated' => true]);
    }

    public function delete($id) {
        $ok = $this->model->update($id, ['end_date' => date('Y-m-d', strtotime('-1 day'))]);
        if (!$ok) return Response::error('Could not delete promotion', 500);
        return Response::success(['deleted' => true]);
    }

    public function getActive() {
        return Response::success(['promotions' => $this->model->getActive()]);
    }
}
