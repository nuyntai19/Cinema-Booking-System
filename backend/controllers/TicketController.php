<?php

/**
 * Ticket Controller - Quản lý vé xem phim
 */
require_once __DIR__ . '/../models/Ticket.php';
require_once __DIR__ . '/../core/Response.php';

class TicketController
{
    private $ticketModel;

    public function __construct()
    {
        $this->ticketModel = new Ticket();
    }

    /**
     * Lấy danh sách tất cả vé (Admin)
     * GET /api/tickets
     */
    public function index()
    {
        try {
            // Get query parameters for pagination
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

            $tickets = $this->ticketModel->getAll($limit, $offset);

            Response::success(['tickets' => $tickets], 'Lấy danh sách vé thành công');
        } catch (Exception $e) {
            Response::serverError('Lỗi khi lấy danh sách vé: ' . $e->getMessage());
        }
    }

    /**
     * Tìm vé bằng QR code
     * GET /api/tickets/code/:code
     */
    public function getByCode($code)
    {
        try {
            $ticket = $this->ticketModel->getByCode($code);

            if (!$ticket) {
                Response::notFound('Không tìm thấy vé với mã này');
            }

            Response::success($ticket, 'Lấy thông tin vé thành công');
        } catch (Exception $e) {
            Response::serverError('Lỗi khi tìm vé: ' . $e->getMessage());
        }
    }

    /**
     * Lấy danh sách vé của một booking
     * GET /api/tickets/booking/:bookingId
     */
    public function getByBooking($bookingId)
    {
        try {
            $tickets = $this->ticketModel->getByBooking($bookingId);

            Response::success($tickets, 'Lấy danh sách vé thành công');
        } catch (Exception $e) {
            Response::serverError('Lỗi khi lấy danh sách vé: ' . $e->getMessage());
        }
    }

    /**
     * Quét vé tại cổng (Staff)
     * POST /api/tickets/check
     * Body: { "code": "TICKET123" }
     */
    public function check()
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['code'])) {
                Response::validationError(['code' => 'Mã vé là bắt buộc']);
            }

            $code = $input['code'];
            $bundle = [];

            // Backward-compatible: accept both legacy ticket_code and new booking_code.
            $ticket = $this->ticketModel->getByCode($code);
            if ($ticket) {
                $bundle = $this->ticketModel->getScanBundleByBookingId((int)$ticket['booking_id']);
            } else {
                $bundle = $this->ticketModel->getScanBundleByBookingCode($code);
            }

            if (empty($bundle)) {
                Response::notFound('Vé không tồn tại');
            }

            $primaryTicket = $bundle[0];
            $statuses = array_values(array_unique(array_map(function ($item) {
                return $item['status'] ?? '';
            }, $bundle)));
            $hasSoldTicket = in_array('SOLD', $statuses, true);
            $hasHoldingTicket = in_array('HOLDING', $statuses, true);

            // Validate ticket status
            if ($hasHoldingTicket) {
                Response::error('Vé chưa được thanh toán hoặc đã được sử dụng', 400, [
                    'current_status' => implode(', ', $statuses)
                ]);
            }

            if (!$hasSoldTicket) {
                Response::error('Vé chưa được thanh toán hoặc đã được sử dụng', 400, [
                    'current_status' => implode(', ', $statuses)
                ]);
            }

            // Check showtime chưa bắt đầu
            $showtimeStart = strtotime($primaryTicket['showtime_start']);
            $now = time();

            // Cho phép quét vé trước giờ chiếu 30 phút
            if ($now < ($showtimeStart - 1800)) {
                Response::error('Suất chiếu chưa mở cửa', 400, [
                    'showtime_start' => $primaryTicket['showtime_start'],
                    'can_enter_at' => date('Y-m-d H:i:s', $showtimeStart - 1800)
                ]);
            }

            // Không cho quét sau khi suất chiếu đã kết thúc
            $showtimeEnd = !empty($primaryTicket['showtime_end'])
                ? strtotime($primaryTicket['showtime_end'])
                : null;

            if ($showtimeEnd !== null && $now > $showtimeEnd) {
                Response::error('Suất chiếu đã kết thúc - vé đã hết hạn quét', 400, [
                    'showtime_start' => $primaryTicket['showtime_start'],
                    'showtime_end' => $primaryTicket['showtime_end']
                ]);
            }

            // Mark all tickets in the booking as USED with one scan.
            $updatedCount = $this->ticketModel->markBookingAsUsed((int)$primaryTicket['booking_id']);

            if ($updatedCount > 0) {
                $seatCodes = array_values(array_map(function ($item) {
                    return trim(($item['row_number'] ?? '') . ($item['seat_number'] ?? ''));
                }, $bundle));

                Response::success([
                    'ticket' => $primaryTicket,
                    'booking' => [
                        'booking_code' => $primaryTicket['booking_code'] ?? null,
                        'ticket_count' => count($bundle),
                        'seats' => $seatCodes,
                    ],
                    'message' => 'Vé hợp lệ - Cho phép vào'
                ], 'Quét vé thành công');
            } else {
                Response::serverError('Không thể cập nhật trạng thái vé');
            }
        } catch (Exception $e) {
            Response::serverError('Lỗi khi quét vé: ' . $e->getMessage());
        }
    }

    /**
     * Đánh dấu vé đã sử dụng (Staff)
     * PUT /api/tickets/:id/use
     */
    public function markAsUsed($id)
    {
        try {
            $ticket = $this->ticketModel->getById($id);

            if (!$ticket) {
                Response::notFound('Vé không tồn tại');
            }

            if ($ticket['status'] !== 'SOLD') {
                Response::error('Chỉ có thể đánh dấu vé đã thanh toán', 400);
            }

            $result = $this->ticketModel->markAsUsed($id);

            if ($result) {
                Response::success(['id' => $id], 'Đánh dấu vé đã sử dụng thành công');
            } else {
                Response::serverError('Không thể cập nhật vé');
            }
        } catch (Exception $e) {
            Response::serverError('Lỗi khi đánh dấu vé: ' . $e->getMessage());
        }
    }

    /**
     * Hoàn vé
     * POST /api/tickets/:id/refund
     */
    public function refund($id)
    {
        try {
            $ticket = $this->ticketModel->getById($id);

            if (!$ticket) {
                Response::notFound('Vé không tồn tại');
            }

            // Chỉ cho phép hoàn vé chưa sử dụng
            if ($ticket['status'] === 'USED') {
                Response::error('Không thể hoàn vé đã sử dụng', 400);
            }

            if ($ticket['status'] === 'REFUNDED') {
                Response::error('Vé đã được hoàn trước đó', 400);
            }

            // Kiểm tra thời gian hoàn vé (ít nhất 2 giờ trước suất chiếu)
            $showtimeStart = strtotime($ticket['showtime_start']);
            $now = time();

            if ($now > ($showtimeStart - 7200)) {
                Response::error('Không thể hoàn vé trong vòng 2 giờ trước suất chiếu', 400);
            }

            $result = $this->ticketModel->updateStatus($id, 'REFUNDED');

            if ($result) {
                Response::success([
                    'id' => $id,
                    'refund_amount' => $ticket['price']
                ], 'Hoàn vé thành công');
            } else {
                Response::serverError('Không thể hoàn vé');
            }
        } catch (Exception $e) {
            Response::serverError('Lỗi khi hoàn vé: ' . $e->getMessage());
        }
    }

    /**
     * Gửi email vé
     * POST /api/tickets/:id/send-email
     */
    public function sendEmail($id)
    {
        try {
            $ticket = $this->ticketModel->getById($id);

            if (!$ticket) {
                Response::notFound('Vé không tồn tại');
            }

            // TODO: Implement email sending logic
            // - Generate QR code image
            // - Create HTML email template
            // - Send via SMTP/mail service

            Response::success([
                'id' => $id,
                'email_sent_to' => $ticket['user_email'] ?? 'N/A'
            ], 'Email vé đã được gửi thành công');
        } catch (Exception $e) {
            Response::serverError('Lỗi khi gửi email: ' . $e->getMessage());
        }
    }
}
