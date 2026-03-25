import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Ticket,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, apiCall } from "@/lib/api";
import { getPusherClient } from "@/lib/pusher";
import { useAuth } from "@/contexts/AppContext";
import { CustomerService } from "@/services/customer.service";
import { POSCustomer, POSCustomerBookingHistoryItem } from "@/types/api";

type SeatStatus =
  | "Available"
  | "HOLDING"
  | "SOLD"
  | "USED"
  | "REFUNDED"
  | "Maintenance";

interface ApiShowtime {
  id: number;
  movie_id: number;
  cinema_id: number;
  cinema_name: string;
  hall_name: string;
  movie_title: string;
  start_time: string;
  total_seats?: number;
}

interface ApiSeat {
  id: number;
  row_code: string;
  number: number;
  seat_type: string;
  status: SeatStatus;
  calculated_price: number;
}

interface SeatMapResponse {
  showtime: {
    id: number;
    movie_title: string;
    hall_name: string;
    cinema_name: string;
    start_time: string;
  };
  seat_map: Record<string, ApiSeat[]>;
  summary: {
    total_seats: number;
    available: number;
    holding: number;
    sold: number;
    maintenance: number;
  };
}

type PaymentMethod = "CASH" | "QR";

interface BookingDetailResponse {
  success: boolean;
  data: {
    id: number;
    booking_code: string;
    final_price: number;
    total_price: number;
    tickets?: Array<{
      ticket_code: string;
      row_code?: string;
      number?: number;
    }>;
    movie_title?: string;
    cinema_name?: string;
    hall_name?: string;
    start_time?: string;
    concessions?: Array<{
      concession_id?: number;
      name?: string;
      quantity?: number;
      price?: number;
    }>;
  };
}

interface QrPaymentState {
  bookingId: number;
  bookingCode: string;
  payUrl?: string;
  qrCodeUrl?: string;
  generatedQrCode?: string; // QR generated from payUrl
}

interface ConcessionItem {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
}

interface SelectedConcession {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const normalizePhone = (value: string): string =>
  value.replace(/\D/g, "").slice(0, 11);

const isValidVietnamPhone = (phone: string): boolean =>
  /^0\d{9,10}$/.test(phone);

const isPastShowtime = (startTime: string): boolean => {
  const start = new Date(startTime.replace(" ", "T"));
  return !Number.isNaN(start.getTime()) && start.getTime() <= Date.now();
};

const StaffPOS: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [showtimes, setShowtimes] = useState<ApiShowtime[]>([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState<ApiShowtime | null>(
    null,
  );
  const [showtimeQuery, setShowtimeQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<
    "ALL" | "MORNING" | "AFTERNOON" | "EVENING"
  >("ALL");

  const [seatMap, setSeatMap] = useState<Record<string, ApiSeat[]>>({});
  const [loadingSeatMap, setLoadingSeatMap] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);

  // POS Customer states
  const [customerPhone, setCustomerPhone] = useState("");
  const [guestCustomer, setGuestCustomer] = useState<POSCustomer | null>(null);
  const [guestBookingHistory, setGuestBookingHistory] = useState<
    POSCustomerBookingHistoryItem[]
  >([]);
  const [loadingGuestHistory, setLoadingGuestHistory] = useState(false);
  const [reprintingBookingId, setReprintingBookingId] = useState<number | null>(
    null,
  );
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [qrPayment, setQrPayment] = useState<QrPaymentState | null>(null);

  // Concession states
  const [concessions, setConcessions] = useState<ConcessionItem[]>([]);
  const [selectedConcessions, setSelectedConcessions] = useState<
    SelectedConcession[]
  >([]);
  const [loadingConcessions, setLoadingConcessions] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const paymentHandledRef = useRef(false);

  const selectedSeats = useMemo(() => {
    const allSeats = Object.values(seatMap).flat();
    return allSeats.filter((seat) => selectedSeatIds.includes(seat.id));
  }, [seatMap, selectedSeatIds]);

  const totalAmount = useMemo(() => {
    const seatTotal = selectedSeats.reduce(
      (sum, seat) => sum + Number(seat.calculated_price || 0),
      0,
    );
    const concessionTotal = selectedConcessions.reduce(
      (sum, con) => sum + con.price * con.quantity,
      0,
    );
    return seatTotal + concessionTotal;
  }, [selectedSeats, selectedConcessions]);

  const filteredShowtimes = useMemo(() => {
    const keyword = showtimeQuery.trim().toLowerCase();

    const byKeyword = showtimes.filter((showtime) => {
      if (!keyword) {
        return true;
      }

      const haystack =
        `${showtime.movie_title} ${showtime.cinema_name} ${showtime.hall_name}`.toLowerCase();
      return haystack.includes(keyword);
    });

    const byTime = byKeyword.filter((showtime) => {
      if (timeFilter === "ALL") {
        return true;
      }

      const start = new Date(showtime.start_time.replace(" ", "T"));
      const hour = start.getHours();

      if (timeFilter === "MORNING") {
        return hour < 12;
      }

      if (timeFilter === "AFTERNOON") {
        return hour >= 12 && hour < 18;
      }

      return hour >= 18;
    });

    return byTime.sort((a, b) => {
      const aTime = new Date(a.start_time.replace(" ", "T")).getTime();
      const bTime = new Date(b.start_time.replace(" ", "T")).getTime();
      return aTime - bTime;
    });
  }, [showtimes, showtimeQuery, timeFilter]);

  useEffect(() => {
    const fetchShowtimes = async () => {
      setLoadingShowtimes(true);
      setSelectedShowtime(null);
      setSeatMap({});
      setSelectedSeatIds([]);

      try {
        const params = new URLSearchParams();
        params.append("date", selectedDate);
        params.append("limit", "200");

        const response = await apiCall<{
          success: boolean;
          data: { showtimes: ApiShowtime[] };
        }>(`${API_ENDPOINTS.SHOWTIMES}?${params.toString()}`);

        setShowtimes(response.data?.showtimes || []);
      } catch (error) {
        console.error("Error loading showtimes:", error);
        setShowtimes([]);
        toast({
          title: "Lỗi tải suất chiếu",
          description: "Không thể lấy danh sách suất chiếu từ hệ thống.",
          variant: "destructive",
        });
      } finally {
        setLoadingShowtimes(false);
      }
    };

    void fetchShowtimes();
  }, [selectedDate, toast]);

  // Load concessions on mount
  useEffect(() => {
    const fetchConcessions = async () => {
      setLoadingConcessions(true);
      try {
        const response = await apiCall<{
          success: boolean;
          data: ConcessionItem[];
        }>(API_ENDPOINTS.CONCESSIONS);

        setConcessions(response.data || []);
      } catch (error) {
        console.error("Error loading concessions:", error);
        setConcessions([]);
      } finally {
        setLoadingConcessions(false);
      }
    };

    void fetchConcessions();
  }, []);

  useEffect(() => {
    const fetchGuestHistory = async () => {
      if (!guestCustomer?.id) {
        setGuestBookingHistory([]);
        return;
      }

      setLoadingGuestHistory(true);
      try {
        const response = await CustomerService.getBookingHistory(
          guestCustomer.id,
          10,
        );
        setGuestBookingHistory(response.data?.bookings || []);
      } catch (error) {
        console.error("Error loading guest booking history:", error);
        setGuestBookingHistory([]);
      } finally {
        setLoadingGuestHistory(false);
      }
    };

    void fetchGuestHistory();
  }, [guestCustomer?.id]);

  // Listen for QR payment completion (same approach as Booking page)
  useEffect(() => {
    if (
      !qrPayment ||
      qrPayment.bookingId === undefined ||
      paymentHandledRef.current
    ) {
      return;
    }

    const completeQRPayment = async () => {
      if (paymentHandledRef.current) {
        return;
      }
      paymentHandledRef.current = true;

      try {
        // Booking is already confirmed by payment callback in backend.
        // Do not call confirm endpoint again to avoid "Booking cannot be confirmed".
        const bookingDetail = await apiCall<BookingDetailResponse>(
          API_ENDPOINTS.BOOKING_DETAIL(qrPayment.bookingId),
        );

        if (bookingDetail?.data) {
          printReceipt(bookingDetail.data);
        }

        toast({
          title: "Thanh toán QR thành công",
          description: `Đơn ${qrPayment.bookingCode} đã được xác nhận. In bill thành công.`,
        });

        // Reset form
        handleClearCustomer();
        setSelectedSeatIds([]);
        setCashConfirmed(false);
        setQrPayment(null);
        setSelectedConcessions([]);
        if (selectedShowtime) {
          await loadSeatMap(selectedShowtime);
        }
      } catch (error) {
        console.error("Error completing QR payment:", error);
        paymentHandledRef.current = false; // Allow retry
      }
    };

    const pusher = getPusherClient();
    const channelName = `booking.${qrPayment.bookingId}`;
    const channel = pusher?.subscribe(channelName);
    const onPaymentUpdated = (payload: { status?: string }) => {
      const status = (payload?.status || "").toLowerCase();
      if (status === "success") {
        void completeQRPayment();
      }
    };
    channel?.bind("payment-status-updated", onPaymentUpdated);

    // Fallback polling every 4 seconds to check transaction status
    const pollTimer = setInterval(async () => {
      if (paymentHandledRef.current) {
        clearInterval(pollTimer);
        return;
      }

      try {
        const txResponse = await apiCall<{
          success: boolean;
          data?: { status?: string };
        }>(`${API_ENDPOINTS.TRANSACTIONS}/booking/${qrPayment.bookingId}`);

        const transactionStatus = (txResponse.data?.status || "").toLowerCase();
        if (
          transactionStatus === "success" ||
          transactionStatus === "completed"
        ) {
          clearInterval(pollTimer);
          await completeQRPayment();
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
      }
    }, 4000);

    return () => {
      clearInterval(pollTimer);
      if (channel) {
        channel.unbind("payment-status-updated", onPaymentUpdated);
      }
      if (pusher) {
        pusher.unsubscribe(channelName);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrPayment?.bookingId, toast, selectedShowtime]);

  async function loadSeatMap(showtime: ApiShowtime) {
    setSelectedShowtime(showtime);
    setSelectedSeatIds([]);
    setLoadingSeatMap(true);

    try {
      const response = await apiCall<{
        success: boolean;
        data: SeatMapResponse;
      }>(API_ENDPOINTS.SHOWTIME_SEAT_MAP(showtime.id));

      setSeatMap(response.data?.seat_map || {});
    } catch (error) {
      console.error("Error loading seat map:", error);
      setSeatMap({});
      toast({
        title: "Lỗi tải sơ đồ ghế",
        description: "Không thể lấy sơ đồ ghế cho suất chiếu đã chọn.",
        variant: "destructive",
      });
    } finally {
      setLoadingSeatMap(false);
    }
  }

  const toggleSeat = (seat: ApiSeat) => {
    if (seat.status !== "Available") return;

    setSelectedSeatIds((prev) =>
      prev.includes(seat.id)
        ? prev.filter((id) => id !== seat.id)
        : [...prev, seat.id],
    );
  };

  const handleLookupCustomer = async () => {
    const phone = normalizePhone(customerPhone.trim());
    if (!phone) {
      toast({
        title: "Nhập SĐT",
        description: "Vui lòng nhập số điện thoại khách hàng",
        variant: "destructive",
      });
      return;
    }

    if (!isValidVietnamPhone(phone)) {
      toast({
        title: "SĐT không hợp lệ",
        description: "Số điện thoại phải bắt đầu bằng 0 và có 10-11 chữ số.",
        variant: "destructive",
      });
      return;
    }

    setCustomerPhone(phone);

    setLookingUpCustomer(true);
    try {
      const response = await CustomerService.lookupOrCreate(phone);
      if (response.success && response.data?.customer) {
        setGuestCustomer(response.data.customer);
        toast({
          title: "Tìm khách thành công",
          description: `${response.data.customer.name || "Khách vãng lai"} (${response.data.customer.phone})`,
        });
      } else {
        throw new Error(response.message || "Lỗi tìm kiếm khách");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tìm khách";
      toast({
        title: "Lỗi tìm kiếm",
        description: message,
        variant: "destructive",
      });
      setGuestCustomer(null);
    } finally {
      setLookingUpCustomer(false);
    }
  };

  function handleClearCustomer() {
    paymentHandledRef.current = false;
    setCustomerPhone("");
    setGuestCustomer(null);
    setGuestBookingHistory([]);
    setCashConfirmed(false);
    setQrPayment(null);
  }

  const handleAddConcession = (concession: ConcessionItem) => {
    setSelectedConcessions((prev) => {
      const existing = prev.find((c) => c.id === concession.id);
      if (existing) {
        return prev.map((c) =>
          c.id === concession.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          id: concession.id,
          name: concession.name,
          price: concession.price,
          quantity: 1,
        },
      ];
    });
  };

  const handleRemoveConcession = (concessionId: number) => {
    setSelectedConcessions((prev) => prev.filter((c) => c.id !== concessionId));
  };

  const handleUpdateConcessionQuantity = (
    concessionId: number,
    quantity: number,
  ) => {
    if (quantity <= 0) {
      handleRemoveConcession(concessionId);
      return;
    }
    setSelectedConcessions((prev) =>
      prev.map((c) => (c.id === concessionId ? { ...c, quantity } : c)),
    );
  };

  function printReceipt(booking: BookingDetailResponse["data"]) {
    const ticketCodes =
      booking.tickets?.map((t) => t.ticket_code).filter(Boolean) || [];

    const ticketRowsHtml =
      booking.tickets && booking.tickets.length > 0
        ? booking.tickets
            .map(
              (ticket, idx) => `
                <tr>
                  <td style="padding:6px 0; border-bottom:1px dashed #ddd;">#${idx + 1}</td>
                  <td style="padding:6px 0; border-bottom:1px dashed #ddd;">${ticket.row_code || ""}${ticket.number || ""}</td>
                  <td style="padding:6px 0; border-bottom:1px dashed #ddd; font-family:monospace;">${ticket.ticket_code}</td>
                </tr>`,
            )
            .join("")
        : `<tr><td colspan="3" style="padding:8px 0; color:#666;">Không có dữ liệu vé</td></tr>`;

    // Generate only ONE QR code per booking (for staff verification)
    const qrImagesHtml = `
      <div style="text-align:center; margin:10px 0; page-break-inside:avoid;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(booking.booking_code)}" style="width:200px;height:200px;border:1px solid #ddd;padding:6px;" />
        <div style="font-family:monospace; font-size:12px; margin-top:6px;"><b>${booking.booking_code}</b></div>
      </div>
    `;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Bill ${booking.booking_code}</title>
          <meta charset="UTF-8" />
        </head>
        <body style="font-family:Arial,sans-serif; padding:20px; color:#111;">
          <h2 style="margin:0 0 10px;">GALAXY CINEMA - BILL BÁN VÉ</h2>
          <div style="font-size:13px; margin-bottom:12px;">
            <div>Mã booking: <b>${booking.booking_code}</b></div>
            <div>Khách hàng: <b>${guestCustomer?.name || guestCustomer?.phone || "Khách vãng lai"}</b></div>
            <div>SĐT: <b>${guestCustomer?.phone || "-"}</b></div>
            <div>Phim: <b>${booking.movie_title || "-"}</b></div>
            <div>Rạp/Phòng: <b>${booking.cinema_name || "-"} / ${booking.hall_name || "-"}</b></div>
            <div>Suất chiếu: <b>${booking.start_time || "-"}</b></div>
            <div>Thời gian in: ${new Date().toLocaleString("vi-VN")}</div>
          </div>

          <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:10px;">
            <thead>
              <tr style="text-align:left; border-bottom:1px solid #000;">
                <th style="padding:6px 0;">STT</th>
                <th style="padding:6px 0;">Ghế</th>
                <th style="padding:6px 0;">Mã vé QR</th>
              </tr>
            </thead>
            <tbody>${ticketRowsHtml}</tbody>
          </table>

          ${
            booking.concessions && booking.concessions.length > 0
              ? `
          <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:10px;">
            <thead>
              <tr style="text-align:left; border-bottom:1px solid #000;">
                <th style="padding:6px 0;">Bắp nước</th>
                <th style="padding:6px 0; text-align:right;">Giá</th>
                <th style="padding:6px 0; text-align:right;">SL</th>
                <th style="padding:6px 0; text-align:right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${(booking.concessions || [])
                .map(
                  (con) => `
                <tr style="border-bottom:1px dashed #ddd;">
                  <td style="padding:6px 0;">${con.name || "Combo"}</td>
                  <td style="padding:6px 0; text-align:right;">${Number(con.price || 0).toLocaleString("vi-VN")}đ</td>
                  <td style="padding:6px 0; text-align:right;">${Number(con.quantity || 0)}</td>
                  <td style="padding:6px 0; text-align:right; font-weight:bold;">${(Number(con.price || 0) * Number(con.quantity || 0)).toLocaleString("vi-VN")}đ</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          `
              : ""
          }

          <div style="font-size:16px; font-weight:bold; margin:10px 0 16px; text-align:right;">
            Tổng thanh toán: ${(booking.final_price || booking.total_price || 0).toLocaleString("vi-VN")}đ (Tiền mặt)
          </div>

          <div style="border-top:1px dashed #999; padding-top:10px;">
            <h3 style="margin:0 0 8px;">Mã QR để nhân viên quét vé:</h3>
            ${qrImagesHtml || "<div>Không có mã vé QR</div>"}
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  const handleReprintBooking = async (bookingId: number) => {
    setReprintingBookingId(bookingId);
    try {
      const bookingDetail = await apiCall<BookingDetailResponse>(
        API_ENDPOINTS.BOOKING_DETAIL(bookingId),
      );

      if (bookingDetail?.data) {
        printReceipt(bookingDetail.data);
        toast({
          title: "Đã in lại vé",
          description: `In lại vé thành công cho đơn #${bookingId}.`,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể in lại vé";
      toast({
        title: "Lỗi in lại vé",
        description: message,
        variant: "destructive",
      });
    } finally {
      setReprintingBookingId(null);
    }
  };

  const handleCompleteSale = async () => {
    if (!selectedShowtime) {
      toast({
        title: "Thiếu suất chiếu",
        description: "Vui lòng chọn suất chiếu trước.",
        variant: "destructive",
      });
      return;
    }

    if (selectedSeatIds.length === 0) {
      toast({
        title: "Chưa chọn ghế",
        description: "Vui lòng chọn ít nhất một ghế.",
        variant: "destructive",
      });
      return;
    }

    if (isPastShowtime(selectedShowtime.start_time)) {
      toast({
        title: "Suất chiếu đã quá giờ",
        description:
          "Không thể bán vé cho suất chiếu đã bắt đầu hoặc đã qua giờ.",
        variant: "destructive",
      });
      return;
    }

    if (!guestCustomer) {
      toast({
        title: "Thiếu thông tin khách",
        description:
          "Vui lòng nhập SĐT và bấm Tìm để chọn khách vãng lai trước khi bán vé.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "CASH" && !cashConfirmed) {
      toast({
        title: "Chưa xác nhận tiền mặt",
        description: "Vui lòng xác nhận đã nhận đủ tiền mặt trước khi xuất vé.",
        variant: "destructive",
      });
      return;
    }

    const bookingUserId = Number(user?.id || 0);
    const guestCustomerId = Number(guestCustomer.id);

    if (!bookingUserId) {
      toast({
        title: "Chưa xác định người mua",
        description: "Không lấy được tài khoản nhân viên đang đăng nhập.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const createResponse = await apiCall<{
        success: boolean;
        data: {
          booking_id: number;
          booking_code: string;
          final_price: number;
        };
      }>(API_ENDPOINTS.BOOKINGS, {
        method: "POST",
        body: JSON.stringify({
          user_id: bookingUserId,
          guest_customer_id: guestCustomerId,
          showtime_id: selectedShowtime.id,
          seat_ids: selectedSeatIds,
          concessions: selectedConcessions.map((c) => ({
            concession_id: c.id,
            quantity: c.quantity,
          })),
        }),
      });

      const bookingId = createResponse.data?.booking_id;
      if (!bookingId) {
        throw new Error("Không lấy được booking_id sau khi tạo đơn");
      }

      if (paymentMethod === "QR") {
        const qrResponse = await apiCall<{
          success: boolean;
          data: { pay_url?: string; qr_code_url?: string };
        }>(API_ENDPOINTS.MOMO_PAYMENT, {
          method: "POST",
          body: JSON.stringify({ booking_id: bookingId, is_pos: true }),
        });

        // Generate QR code from payUrl if qrCodeUrl not provided
        const qrCodeUrl = qrResponse.data?.qr_code_url;
        const payUrl = qrResponse.data?.pay_url;
        const generatedQrCode = payUrl
          ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payUrl)}`
          : undefined;

        // Reset payment handler for new QR session
        paymentHandledRef.current = false;

        setQrPayment({
          bookingId,
          bookingCode: createResponse.data?.booking_code || `#${bookingId}`,
          payUrl,
          qrCodeUrl,
          generatedQrCode,
        });

        toast({
          title: "Đã tạo thanh toán QR",
          description:
            "Vui lòng cho khách quét mã QR. Hệ thống sẽ tự động xác nhận khi thanh toán thành công.",
        });
      } else {
        await apiCall(API_ENDPOINTS.CONFIRM_BOOKING(bookingId), {
          method: "PUT",
        });

        const bookingDetail = await apiCall<BookingDetailResponse>(
          API_ENDPOINTS.BOOKING_DETAIL(bookingId),
        );

        if (bookingDetail?.data) {
          printReceipt(bookingDetail.data);
        }

        toast({
          title: "Bán vé tiền mặt thành công",
          description: `Đã xác nhận đơn ${createResponse.data?.booking_code || `#${bookingId}`} và in bill có mã QR vé.`,
        });

        handleClearCustomer();
        setSelectedSeatIds([]);
        setCashConfirmed(false);
        setQrPayment(null);
        await loadSeatMap(selectedShowtime);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể hoàn tất bán vé";
      toast({
        title: "Lỗi bán vé",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSeatClass = (seat: ApiSeat) => {
    const isSelected = selectedSeatIds.includes(seat.id);
    const baseClass =
      "w-8 h-8 rounded text-[10px] font-medium transition-all cursor-pointer hover:scale-110";

    if (seat.status === "Maintenance") {
      return `${baseClass} bg-gray-700 text-gray-300 cursor-not-allowed`;
    }
    if (seat.status === "SOLD" || seat.status === "USED") {
      return `${baseClass} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }
    if (seat.status === "HOLDING") {
      return `${baseClass} bg-yellow-400 text-yellow-900 cursor-not-allowed`;
    }
    if (isSelected) {
      return `${baseClass} bg-primary text-primary-foreground shadow-lg`;
    }
    if (String(seat.seat_type).toLowerCase().includes("vip")) {
      return `${baseClass} bg-blue-100 text-blue-700 hover:bg-blue-200`;
    }
    if (
      String(seat.seat_type).toLowerCase().includes("sweet") ||
      String(seat.seat_type).toLowerCase().includes("couple")
    ) {
      return `${baseClass} bg-pink-100 text-pink-700 hover:bg-pink-200`;
    }
    return `${baseClass} bg-white border-2 border-gray-300 text-gray-700 hover:border-primary`;
  };

  const sortedRows = Object.keys(seatMap).sort();
  const submitDisabledReason = submitting
    ? "Đang xử lý giao dịch..."
    : !selectedShowtime
      ? "Vui lòng chọn suất chiếu."
      : selectedSeatIds.length === 0
        ? "Vui lòng chọn ít nhất 1 ghế trước khi tạo thanh toán."
        : !guestCustomer
          ? "Vui lòng nhập SĐT và bấm Tìm khách hàng."
          : paymentMethod === "CASH" && !cashConfirmed
            ? "Vui lòng xác nhận đã nhận đủ tiền mặt."
            : null;
  const isSubmitDisabled = submitDisabledReason !== null;

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Suất Chiếu Theo Ngày
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="space-y-2 mb-3">
              <Input
                placeholder="Tìm phim, rạp, phòng chiếu..."
                value={showtimeQuery}
                onChange={(e) => setShowtimeQuery(e.target.value)}
              />
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  className={cn(
                    "rounded border px-2 py-1 text-xs",
                    timeFilter === "ALL"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-gray-200",
                  )}
                  onClick={() => setTimeFilter("ALL")}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded border px-2 py-1 text-xs",
                    timeFilter === "MORNING"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-gray-200",
                  )}
                  onClick={() => setTimeFilter("MORNING")}
                >
                  Sáng
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded border px-2 py-1 text-xs",
                    timeFilter === "AFTERNOON"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-gray-200",
                  )}
                  onClick={() => setTimeFilter("AFTERNOON")}
                >
                  Chiều
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded border px-2 py-1 text-xs",
                    timeFilter === "EVENING"
                      ? "border-primary text-primary bg-primary/10"
                      : "border-gray-200",
                  )}
                  onClick={() => setTimeFilter("EVENING")}
                >
                  Tối
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Hiển thị {filteredShowtimes.length}/{showtimes.length} suất
                chiếu
              </p>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {loadingShowtimes && (
                <p className="text-sm text-muted-foreground">
                  Đang tải suất chiếu...
                </p>
              )}

              {!loadingShowtimes && showtimes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Không có suất chiếu nào trong ngày đã chọn.
                </p>
              )}

              {!loadingShowtimes &&
                showtimes.length > 0 &&
                filteredShowtimes.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Không tìm thấy suất chiếu phù hợp bộ lọc.
                  </p>
                )}

              {filteredShowtimes.map((showtime) => {
                const start = new Date(showtime.start_time.replace(" ", "T"));
                const timeText = start.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const isExpired = isPastShowtime(showtime.start_time);

                return (
                  <div
                    key={showtime.id}
                    onClick={() => {
                      if (!isExpired) {
                        void loadSeatMap(showtime);
                      }
                    }}
                    className={cn(
                      "p-4 border-2 rounded-lg transition-all",
                      isExpired
                        ? "cursor-not-allowed opacity-60 border-gray-200 bg-gray-50"
                        : "cursor-pointer hover:shadow-md",
                      selectedShowtime?.id === showtime.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-primary/50",
                    )}
                  >
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div>
                        <p className="font-semibold line-clamp-1">
                          {showtime.movie_title}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">
                            {showtime.cinema_name} - {showtime.hall_name}
                          </span>
                        </div>
                      </div>
                      <Badge className={isExpired ? "bg-gray-500" : ""}>
                        {isExpired ? "HẾT GIỜ" : timeText}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Chọn Ghế
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSeatMap ? (
              <div className="text-center py-12 text-muted-foreground">
                Đang tải sơ đồ ghế...
              </div>
            ) : !selectedShowtime ? (
              <div className="text-center py-12 text-muted-foreground">
                Chọn suất chiếu để hiển thị ghế trống
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg px-8 py-2 text-sm font-medium text-gray-700">
                    MÀN HÌNH
                  </div>
                </div>

                <div className="space-y-2 overflow-x-auto">
                  {sortedRows.map((row) => (
                    <div
                      key={row}
                      className="flex items-center gap-2 min-w-max"
                    >
                      <span className="w-6 text-center text-sm font-medium">
                        {row}
                      </span>
                      <div className="flex gap-1">
                        {seatMap[row]
                          .slice()
                          .sort((a, b) => a.number - b.number)
                          .map((seat) => (
                            <button
                              key={seat.id}
                              type="button"
                              onClick={() => toggleSeat(seat)}
                              className={getSeatClass(seat)}
                              disabled={seat.status !== "Available"}
                              title={`${row}${seat.number} - ${seat.seat_type} - ${Number(seat.calculated_price).toLocaleString("vi-VN")}đ`}
                            >
                              {seat.number}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 text-xs mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded" />
                    <span>Thường trống</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 rounded" />
                    <span>VIP trống</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-pink-100 rounded" />
                    <span>Couple/Sweetbox trống</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary rounded" />
                    <span>Đang chọn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded" />
                    <span>Đang giữ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded" />
                    <span>Đã bán/đã dùng</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Thanh Toán Tại Quầy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Guest Customer Lookup Section */}
            <div className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <label className="text-sm font-medium">
                Tìm kiếm khách hàng vãng lai
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="SĐT khách (0908765432)"
                  value={customerPhone}
                  onChange={(e) =>
                    setCustomerPhone(normalizePhone(e.target.value))
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !lookingUpCustomer &&
                      customerPhone.trim()
                    ) {
                      void handleLookupCustomer();
                    }
                  }}
                  disabled={lookingUpCustomer || guestCustomer !== null}
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                />
                <Button
                  size="sm"
                  onClick={() => void handleLookupCustomer()}
                  disabled={
                    lookingUpCustomer ||
                    !customerPhone.trim() ||
                    guestCustomer !== null
                  }
                  className="flex gap-1"
                >
                  <Search className="w-4 h-4" />
                  {lookingUpCustomer ? "..." : "Tìm"}
                </Button>
                {guestCustomer && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearCustomer}
                    className="flex gap-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Guest Customer Info */}
              {guestCustomer && (
                <div className="bg-white p-3 rounded border border-green-200 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-700">
                        {guestCustomer.name || "Khách vãng lai"}
                      </p>
                      <p className="text-xs text-gray-600">
                        {guestCustomer.phone} • {guestCustomer.total_bookings}{" "}
                        lần mua vé
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Mã: {guestCustomer.guest_customer_code}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-700"
                    >
                      Đã chọn
                    </Badge>
                  </div>
                </div>
              )}

              {guestCustomer && (
                <div className="bg-white p-3 rounded border border-gray-200 mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      Lịch sử giao dịch gần đây
                    </p>
                    {loadingGuestHistory && (
                      <span className="text-xs text-muted-foreground">
                        Đang tải...
                      </span>
                    )}
                  </div>

                  {!loadingGuestHistory && guestBookingHistory.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Chưa có lịch sử giao dịch cho khách này.
                    </p>
                  )}

                  {!loadingGuestHistory && guestBookingHistory.length > 0 && (
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {guestBookingHistory.map((item) => {
                        const canReprint =
                          (item.status || "").toLowerCase() === "paid" ||
                          (item.payment_status || "").toLowerCase() ===
                            "success";

                        return (
                          <div
                            key={item.id}
                            className="rounded border border-gray-200 p-2 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">
                                {item.booking_code}
                              </span>
                              <Badge
                                className={
                                  canReprint ? "bg-green-600" : "bg-gray-500"
                                }
                              >
                                {canReprint ? "Đã thanh toán" : item.status}
                              </Badge>
                            </div>
                            <p className="line-clamp-1">{item.movie_title}</p>
                            <p className="text-muted-foreground line-clamp-1">
                              {item.seats || "-"} •{" "}
                              {Number(item.final_price || 0).toLocaleString(
                                "vi-VN",
                              )}
                              đ
                            </p>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">
                                {new Date(
                                  item.created_at.replace(" ", "T"),
                                ).toLocaleString("vi-VN")}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={
                                  !canReprint || reprintingBookingId === item.id
                                }
                                onClick={() =>
                                  void handleReprintBooking(item.id)
                                }
                              >
                                {reprintingBookingId === item.id
                                  ? "Đang in..."
                                  : "In lại vé"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {!guestCustomer && !customerPhone && (
                <p className="text-xs text-gray-600">
                  Nhập SĐT khách để tìm kiếm hoặc tạo mới trước khi bán vé.
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Phương thức thanh toán
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm",
                    paymentMethod === "CASH"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-gray-200",
                  )}
                >
                  Tiền mặt
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("QR")}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm",
                    paymentMethod === "QR"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-gray-200",
                  )}
                >
                  QR (MoMo)
                </button>
              </div>

              {paymentMethod === "CASH" && (
                <label className="flex items-center gap-2 text-sm mt-2">
                  <input
                    type="checkbox"
                    checked={cashConfirmed}
                    onChange={(e) => setCashConfirmed(e.target.checked)}
                  />
                  Tôi xác nhận đã nhận đủ tiền mặt từ khách.
                </label>
              )}
            </div>

            {qrPayment && (
              <div className="rounded-md border-2 border-orange-300 bg-orange-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-orange-900">
                    📲 Thanh toán QR cho đơn {qrPayment.bookingCode}
                  </p>
                  <Badge className="bg-orange-500">Chờ thanh toán...</Badge>
                </div>

                {/* Display QR Code */}
                <div className="flex justify-center">
                  {qrPayment.generatedQrCode ? (
                    <div className="text-center">
                      <img
                        src={qrPayment.generatedQrCode}
                        alt="QR thanh toán MoMo"
                        className="w-56 h-56 rounded-lg border-4 border-white shadow-lg bg-white p-2"
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        Quét mã QR để thanh toán
                      </p>
                    </div>
                  ) : qrPayment.qrCodeUrl ? (
                    <img
                      src={qrPayment.qrCodeUrl}
                      alt="QR thanh toán"
                      className="w-56 h-56 rounded-lg border-4 border-white shadow-lg bg-white p-2"
                    />
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-orange-700 mb-2">
                        Không nhận được ảnh QR, dùng link thanh toán bên dưới
                      </p>
                      {qrPayment.payUrl && (
                        <a
                          href={qrPayment.payUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block bg-orange-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-orange-600"
                        >
                          Mở link thanh toán
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-600 text-center">
                  Hệ thống sẽ tự động xác nhận thanh toán sau khi khách quét
                  xong.
                </p>
              </div>
            )}

            {/* Concession Section */}
            {!qrPayment && !loadingConcessions && concessions.length > 0 && (
              <div className="rounded-md border border-purple-200 bg-purple-50 p-3 space-y-3">
                <label className="text-sm font-medium text-purple-900">
                  🍿 Bắp nước kèm vé
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {concessions.map((concession) => {
                    const selected = selectedConcessions.find(
                      (c) => c.id === concession.id,
                    );
                    return (
                      <div
                        key={concession.id}
                        className={cn(
                          "p-2 rounded border-2 cursor-pointer transition-all text-xs",
                          selected
                            ? "border-purple-500 bg-white"
                            : "border-purple-200 bg-white hover:border-purple-400",
                        )}
                        onClick={() => handleAddConcession(concession)}
                      >
                        <p className="font-medium">{concession.name}</p>
                        <p className="text-purple-700">
                          {concession.price.toLocaleString("vi-VN")}đ
                        </p>
                        {selected && (
                          <div className="flex items-center gap-1 mt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateConcessionQuantity(
                                  concession.id,
                                  selected.quantity - 1,
                                );
                              }}
                              className="w-5 h-5 bg-purple-500 text-white rounded text-xs"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-sm font-bold">
                              {selected.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateConcessionQuantity(
                                  concession.id,
                                  selected.quantity + 1,
                                );
                              }}
                              className="w-5 h-5 bg-purple-500 text-white rounded text-xs"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedConcessions.length > 0 && (
                  <div className="space-y-1 bg-white p-2 rounded">
                    <p className="text-xs font-medium">Đã chọn:</p>
                    {selectedConcessions.map((concession) => (
                      <div
                        key={concession.id}
                        className="flex justify-between text-xs text-gray-700"
                      >
                        <span>
                          {concession.name} x{concession.quantity}
                        </span>
                        <span className="font-medium">
                          {(
                            concession.price * concession.quantity
                          ).toLocaleString("vi-VN")}
                          đ
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Số ghế đã chọn</span>
                <span>{selectedSeats.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Danh sách ghế</span>
                <span>
                  {selectedSeats
                    .map((s) => `${s.row_code}${s.number}`)
                    .join(", ") || "-"}
                </span>
              </div>
              {selectedConcessions.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Bắp nước</span>
                  <span>
                    {selectedConcessions
                      .map((c) => `${c.name}(${c.quantity})`)
                      .join(", ")}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Tổng cộng</span>
                <span className="text-primary">
                  {totalAmount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            <Button
              className="w-full h-12"
              disabled={isSubmitDisabled}
              onClick={() => void handleCompleteSale()}
            >
              {submitting
                ? "Đang xử lý..."
                : paymentMethod === "CASH"
                  ? "Xác nhận tiền mặt + In bill"
                  : "Tạo thanh toán QR"}
            </Button>
            {isSubmitDisabled && (
              <p className="text-xs text-amber-700">{submitDisabledReason}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {paymentMethod === "CASH"
                ? "Luồng tiền mặt: nhân viên xác nhận đã nhận đủ tiền, hệ thống xác nhận booking và in bill có mã QR vé."
                : "Luồng QR: hệ thống tạo mã QR thanh toán, booking được xác nhận sau callback thành công từ cổng thanh toán."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffPOS;
