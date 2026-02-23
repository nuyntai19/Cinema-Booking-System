<?php

class GenreController extends BaseController
{
    private $genreModel;

    public function __construct()
    {
        $this->genreModel = new Genre();
    }

    /**
     * GET /api/genres - Lấy tất cả thể loại
     */
    public function index()
    {
        try {
            $genres = $this->genreModel->getAll();
            Response::success(['genres' => $genres]);
        } catch (Exception $e) {
            error_log("Genre API Error: " . $e->getMessage());
            Response::error('Lỗi khi lấy danh sách thể loại', 500);
        }
    }

    /**
     * GET /api/genres/:id - Lấy chi tiết thể loại
     */
    public function show($id)
    {
        try {
            $genre = $this->genreModel->getById($id);
            
            if (!$genre) {
                Response::error('Không tìm thấy thể loại', 404);
                return;
            }

            Response::success(['genre' => $genre]);
        } catch (Exception $e) {
            error_log("Genre API Error: " . $e->getMessage());
            Response::error('Lỗi khi lấy chi tiết thể loại', 500);
        }
    }
}
