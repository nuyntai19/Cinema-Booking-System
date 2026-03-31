import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Smartphone,
  Building2,
  Tag,
  Clock,
  QrCode,
  X,
  ArrowLeft,
  Ticket,
  Percent,
  BadgeCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBooking } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AppContext";
import { movies } from "@/data/mockData";
import { API_ENDPOINTS, apiCall, getImageUrl } from "@/lib/api";
import { getPusherClient } from "@/lib/pusher";
import { PaymentMethod } from "@/types/cinema";
import { cn } from "@/lib/utils";
import { BookingService } from "@/services/booking.service";
import { TicketService } from "@/services/ticket.service";
import { TransactionService } from "@/services/transacsion.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useHoldTimer, formatHoldTime } from "@/hooks/useHoldTimer";

interface MovieInfo {
  id: string;
  title: string;
  poster: string;
}

interface MovieApiData {
  id: number;
  title: string;
  poster_url?: string;
}

interface PromotionItem {
  id: number;
  code: string;
  title?: string;
  description?: string;
  discount_type?: string;
  discount_value?: number;
  discount_amount?: number;
  min_order_value?: number;
  start_date: string;
  end_date: string;
  usage_limit?: number;
  used_count?: number;
  is_auto_apply?: boolean;
  status?: string;
}

interface VoucherItem extends PromotionItem {
  promo_code?: string;
  promotion_id?: number;
}

interface TierInfo {
  id: number;
  name: string;
  rank_name?: string;
  discount_rate: string;
}

interface TicketData {
  ticket_code?: string;
  ticketCode?: string;
}

interface BookingData {
  booking_code?: string;
  bookingCode?: string;
  booking_id?: number;
}

interface VoucherApplyResponse {
  success: boolean;
  message?: string;
  data?: {
    discount: number;
    voucher_id: number;
  };
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    selectedMovie,
    selectedSeats,
    concessions,
    clearBooking,
    selectedShowtime,
  } = useBooking();

  const { timeLeft: holdTimeLeft, isActive: holdTimerActive } = useHoldTimer();
  const { pauseHoldTimer, resumeHoldTimer } = useBooking();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("momo");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTimeLeft, setQRTimeLeft] = useState(300); // 5 minutes
  const [isProcessing, setIsProcessing] = useState(false);
  const [momoQrImageUrl, setMomoQrImageUrl] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<number | null>(null);
  const [currentBookingCode, setCurrentBookingCode] = useState<string | null>(
    null,
  );
  const [appliedVoucherId, setAppliedVoucherId] = useState<number | null>(null);
  const [showCancelPaymentConfirm, setShowCancelPaymentConfirm] =
    useState(false);
  const [isCancellingPayment, setIsCancellingPayment] = useState(false);
  const [isVnpayMode, setIsVnpayMode] = useState(false);
  const [isVisaMode, setIsVisaMode] = useState(false);
  const vnpayPopupRef = useRef<Window | null>(null);
  const visaPopupRef = useRef<Window | null>(null);
  const paymentHandledRef = useRef(false);
  const timeoutHandledRef = useRef(false);

  // Promotions & vouchers for display
  const [activePromos, setActivePromos] = useState<PromotionItem[]>([]);
  const [userVouchers, setUserVouchers] = useState<VoucherItem[]>([]);
  const [userTier, setUserTier] = useState<TierInfo | null>(null);

  const [movie, setMovie] = useState<MovieInfo | null>(null);
  const [loadingMovie, setLoadingMovie] = useState(true);

  // Fetch movie from API
  useEffect(() => {
    const fetchMovie = async () => {
      if (!selectedMovie) {
        setLoadingMovie(false);
        return;
      }
      try {
        setLoadingMovie(true);
        const response = await apiCall<{
          success: boolean;
          data: { movie: MovieApiData };
        }>(API_ENDPOINTS.MOVIE_DETAIL(parseInt(selectedMovie)));
        if (response.success && response.data?.movie) {
          const m = response.data.movie;
          setMovie({
            id: String(m.id),
            title: m.title,
            poster: m.poster_url ? getImageUrl(m.poster_url) : "",
          });
        } else {
          // API succeeded but no movie data – use fallback
          setMovie({
            id: selectedMovie,
            title: `Phim #${selectedMovie}`,
            poster: "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch movie:", error);
        // Use fallback so page is not stuck
        setMovie({
          id: selectedMovie,
          title: `Phim #${selectedMovie}`,
          poster: "",
        });
      } finally {
        setLoadingMovie(false);
      }
    };
    fetchMovie();
  }, [selectedMovie]);

  const { user } = useAuth();

  // Fetch active promotions, user vouchers, and membership tier
  useEffect(() => {
    const fetchPromosAndVouchers = async () => {
      try {
        const promoRes = await apiCall<{
          data?: { promotions?: PromotionItem[] };
          promotions?: PromotionItem[];
        }>(API_ENDPOINTS.PROMOTIONS_ACTIVE);
        const promos = promoRes?.data?.promotions || promoRes?.promotions || [];
        setActivePromos(promos);
      } catch {
        /* ignore */
      }

      if (user?.id) {
        try {
          // Fetch ALL vouchers (including expired, used) to show but disable ineligible ones
          const vRes = await apiCall<{
            data?: { vouchers?: VoucherItem[] };
            vouchers?: VoucherItem[];
          }>(`${API_ENDPOINTS.USER_VOUCHERS(parseInt(user.id))}?status=all`);
          const vouchers = vRes?.data?.vouchers || vRes?.vouchers || [];

          // Helper function to parse date string (YYYY-MM-DD) to local date
          const parseLocalDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split("-").map(Number);
            return new Date(year, month - 1, day);
          };

          // Sort vouchers: ACTIVE+valid dates first, then others
          const sortedVouchers = [...vouchers].sort((a, b) => {
            // Check status
            const aActive = a.status === "ACTIVE";
            const bActive = b.status === "ACTIVE";

            // Check date validity for ACTIVE vouchers
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const aValidDate =
              aActive && a.start_date && a.end_date
                ? today >= parseLocalDate(a.start_date) &&
                  today <= parseLocalDate(a.end_date)
                : false;

            const bValidDate =
              bActive && b.start_date && b.end_date
                ? today >= parseLocalDate(b.start_date) &&
                  today <= parseLocalDate(b.end_date)
                : false;

            // ACTIVE + valid dates first
            if (aValidDate && !bValidDate) return -1;
            if (!aValidDate && bValidDate) return 1;

            // Then ACTIVE but expired
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;

            return 0;
          });

          setUserVouchers(sortedVouchers);
        } catch {
          /* ignore */
        }

        try {
          const tierRes = await apiCall<{ data?: { tier?: TierInfo } }>(
            API_ENDPOINTS.MEMBERSHIP_USER_TIER(parseInt(user.id)),
          );
          if (tierRes?.data?.tier) setUserTier(tierRes.data.tier);
        } catch {
          /* ignore */
        }
      }
    };
    fetchPromosAndVouchers();
  }, [user?.id]);

  const ticketTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const concessionTotal = concessions.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const subtotal = ticketTotal + concessionTotal;
  const membershipDiscountRate = userTier
    ? parseFloat(userTier.discount_rate || "0")
    : 0;
  const membershipDiscountAmount = Math.round(
    subtotal * (membershipDiscountRate / 100),
  );
  const grandTotal = subtotal - discount - membershipDiscountAmount;
  const seatCodes = selectedSeats.map((s) => `${s.row}${s.number}`);

  const resetPaymentSession = () => {
    setShowQRModal(false);
    setMomoQrImageUrl(null);
    setPaymentUrl(null);
    setCurrentBookingId(null);
    setCurrentBookingCode(null);
    setQRTimeLeft(300);
    setIsVnpayMode(false);
    setIsVisaMode(false);
    paymentHandledRef.current = false;
    timeoutHandledRef.current = false;
    resumeHoldTimer();
  };

  const cancelPaymentSession = async (title: string, description: string) => {
    if (isCancellingPayment) {
      return;
    }

    setIsCancellingPayment(true);
    try {
      // Cancel the booking on server
      if (currentBookingId) {
        try {
          await BookingService.cancel(String(currentBookingId));
        } catch {
          // Ignore cancel errors: hold will still expire server-side.
        }
      }

      // Release held seats on server
      if (selectedShowtime) {
        try {
          const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
          if (token) {
            await fetch(
              API_ENDPOINTS.SHOWTIME_RELEASE_SEATS(
                parseInt(selectedShowtime.id),
              ),
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}),
              },
            );
          }
        } catch {
          // Ignore release errors
        }
      }

      // Reset modal state
      setShowQRModal(false);
      setMomoQrImageUrl(null);
      setPaymentUrl(null);
      setCurrentBookingId(null);
      setCurrentBookingCode(null);
      setQRTimeLeft(300);
      setIsVnpayMode(false);
      setIsVisaMode(false);
      paymentHandledRef.current = false;
      timeoutHandledRef.current = false;

      // Full reset: clear all booking state (seats, timer, concessions)
      clearBooking();

      toast({
        title,
        description,
        variant: "destructive",
      });

      // Navigate back to seat selection
      setTimeout(() => navigate("/booking/seats"), 150);
    } finally {
      setIsCancellingPayment(false);
    }
  };

  // QR Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showQRModal && qrTimeLeft > 0) {
      timer = setInterval(() => {
        setQRTimeLeft((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showQRModal, qrTimeLeft]);

  useEffect(() => {
    if (!showQRModal || qrTimeLeft > 0 || timeoutHandledRef.current) {
      return;
    }

    timeoutHandledRef.current = true;

    const releaseHoldOnTimeout = async () => {
      await cancelPaymentSession(
        "Thanh toán thất bại",
        "Đã hết 5 phút thanh toán. Ghế đã được giải phóng. Vui lòng chọn lại.",
      );
    };

    void releaseHoldOnTimeout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQRModal, qrTimeLeft, currentBookingId, toast]);

  // Guard against accidental leave while waiting for payment confirmation.
  useEffect(() => {
    if (!showQRModal || !currentBookingId || paymentHandledRef.current) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (paymentHandledRef.current) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    const handlePopState = () => {
      if (paymentHandledRef.current) {
        return;
      }

      setShowCancelPaymentConfirm(true);
      window.history.pushState(
        { paymentGuard: true },
        "",
        window.location.href,
      );
    };

    // Insert a guarded history entry so browser Back triggers confirmation first.
    window.history.pushState({ paymentGuard: true }, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [showQRModal, currentBookingId]);

  useEffect(() => {
    if (!showQRModal || !currentBookingId || paymentHandledRef.current) {
      return;
    }

    const completeFromGateway = async () => {
      if (paymentHandledRef.current) {
        return;
      }
      paymentHandledRef.current = true;

      toast({
        title: "Thanh toán thành công",
        description: "Đã nhận xác nhận thanh toán từ cổng thanh toán.",
      });

      let ticketCodes: string[] = [];
      let resolvedBookingCode: string | null = currentBookingCode;
      try {
        const ticketRes = await TicketService.getByBooking(
          String(currentBookingId),
        );
        const rawTickets = Array.isArray(ticketRes?.data) ? ticketRes.data : [];
        ticketCodes = rawTickets
          .map(
            (ticket: TicketData) =>
              ticket?.ticket_code || ticket?.ticketCode || null,
          )
          .filter((code: string | null): code is string => Boolean(code));
      } catch {
        // Non-blocking: success page can still show booking info without ticket list.
      }

      if (!resolvedBookingCode) {
        try {
          const bookingRes = await BookingService.getById(
            String(currentBookingId),
          );
          const bd = bookingRes?.data as unknown as BookingData;
          resolvedBookingCode = bd?.booking_code || bd?.bookingCode || null;
        } catch {
          // Ignore booking code fetch errors; we still have fallback ticket code.
        }
      }

      setShowQRModal(false);
      navigate("/booking/success", {
        state: {
          bookingId: currentBookingId,
          bookingCode: resolvedBookingCode,
          ticketCode: resolvedBookingCode || ticketCodes[0] || null,
          ticketCodes,
          movie,
          seats: selectedSeats,
          total: grandTotal,
          discount: discount + membershipDiscountAmount,
          promoCode: discount > 0 ? promoCode : null,
          showtime: selectedShowtime,
        },
      });
      clearBooking();
      setCurrentBookingId(null);
      setShowCancelPaymentConfirm(false);
    };

    const pusher = getPusherClient();
    const channelName = `booking.${currentBookingId}`;
    const channel = pusher?.subscribe(channelName);
    const onPaymentUpdated = (payload: { status?: string }) => {
      const status = (payload?.status || "").toLowerCase();
      if (status === "success") {
        void completeFromGateway();
      }
    };
    channel?.bind("payment-status-updated", onPaymentUpdated);

    const pollTimer = setInterval(async () => {
      if (paymentHandledRef.current || !currentBookingId) {
        return;
      }
      try {
        const tx = await TransactionService.getTransactionDetails(
          String(currentBookingId),
        );
        const txStatus = (tx?.data?.status || "").toLowerCase();
        if (txStatus === "success") {
          void completeFromGateway();
        }
      } catch {
        // Ignore intermittent network errors while waiting for callback.
      }
    }, 4000);

    return () => {
      clearInterval(pollTimer);
      if (channel) {
        channel.unbind("payment-status-updated", onPaymentUpdated);
      }
      if (pusher && channelName) {
        pusher.unsubscribe(channelName);
      }
    };
  }, [
    showQRModal,
    currentBookingId,
    currentBookingCode,
    toast,
    navigate,
    movie,
    selectedSeats,
    grandTotal,
    discount,
    membershipDiscountAmount,
    promoCode,
    selectedShowtime,
    clearBooking,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const buildQrImageUrl = (payUrl: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(payUrl)}`;

  const normalizeQrPayload = (value: string) => {
    const raw = value.trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  };

  const toPositiveInt = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      return value;
    }
    if (typeof value === "string" && /^\d+$/.test(value)) {
      const parsed = Number(value);
      return parsed > 0 ? parsed : null;
    }
    return null;
  };

  const createBooking = async (): Promise<number | null> => {
    const showTimeId = toPositiveInt(selectedShowtime?.id);
    const seatIds = selectedSeats
      .map((s) => toPositiveInt(s.id))
      .filter((id): id is number => id !== null);
    const concessionsData = concessions
      .map((c) => ({
        concession_id: toPositiveInt(c.id),
        quantity: c.quantity,
      }))
      .filter(
        (c) =>
          c.concession_id !== null &&
          typeof c.concession_id === "number" &&
          c.quantity > 0,
      );
    const userId = toPositiveInt(user?.id);
    const validationErrors: string[] = [];
    if (!userId) validationErrors.push("Bạn cần đăng nhập để thanh toán.");
    if (!showTimeId) validationErrors.push("Không tìm thấy suất chiếu hợp lệ.");
    if (seatIds.length === 0)
      validationErrors.push("Vui lòng chọn ít nhất 1 ghế.");

    if (validationErrors.length > 0) {
      toast({
        title: "Thông tin không hợp lệ",
        description: validationErrors.join(" "),
        variant: "destructive",
      });
      return null;
    }
    const bookingRequest = {
      user_id: userId,
      showtime_id: showTimeId,
      seat_ids: seatIds,
      concessions: concessionsData,
      user_voucher_id: appliedVoucherId || undefined,
    };

    try {
      const existingBooking = await BookingService.getBookingByUserAndShowtime(
        userId,
        showTimeId,
      );

      if (
        existingBooking.success &&
        existingBooking.data?.status === "Pending"
      ) {
        const existingBookingId = toPositiveInt(existingBooking.data.id);
        if (existingBookingId) {
          const updateResponse = await BookingService.updateBooking(
            existingBookingId,
            {
              seat_ids: seatIds,
              concessions: concessionsData,
              user_voucher_id: appliedVoucherId || undefined,
            },
          );

          if (!updateResponse.success) {
            toast({
              title: "Cập nhật đơn giữ ghế thất bại",
              description:
                updateResponse.message ||
                "Không thể cập nhật đơn giữ ghế hiện tại.",
              variant: "destructive",
            });
            return null;
          }

          return existingBookingId;
        }
      }

      const response = await BookingService.create(bookingRequest);
      const createdBookingId = toPositiveInt(
        (response.data as unknown as BookingData)?.booking_id,
      );
      if (!response.success || !createdBookingId) {
        toast({
          title: "Đặt vé thất bại",
          description: response.message || "Có lỗi xảy ra khi đặt vé.",
          variant: "destructive",
        });
        return null;
      }
      return createdBookingId;
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      const errErrors = err?.errors as Record<string, string> | undefined;
      const fieldErrors = errErrors
        ? Object.values(errErrors).filter(Boolean).join(" ")
        : "";
      const detail =
        fieldErrors ||
        (err?.message as string) ||
        "Có lỗi xảy ra khi xử lý đơn hàng.";

      console.error("Create booking failed", {
        statusCode: err?.statusCode,
        message: err?.message,
        errors: err?.errors,
        payload: bookingRequest,
      });

      toast({
        title: "Lỗi hệ thống",
        description: detail,
        variant: "destructive",
      });
      return null;
    }
  };

  const processPayment = async (method: PaymentMethod) => {
    setIsProcessing(true);
    let bookingId: number | null = currentBookingId;
    try {
      paymentHandledRef.current = false;

      if (!bookingId) {
        bookingId = await createBooking();
        if (!bookingId) {
          return;
        }
        // Save booking ID for retrying payment without creating duplicate holds.
        setCurrentBookingId(bookingId);

        try {
          const bookingRes = await BookingService.getById(String(bookingId));
          const bd = bookingRes?.data as unknown as BookingData;
          const resolvedBookingCode =
            bd?.booking_code || bd?.bookingCode || null;
          setCurrentBookingCode(resolvedBookingCode);
        } catch {
          setCurrentBookingCode(null);
        }
      }

      if (method === "momo") {
        const momoResponse = await TransactionService.momoPayment({
          booking_id: bookingId,
        });
        const qrCodeUrl = momoResponse?.data?.qr_code_url;
        const payUrl = momoResponse?.data?.pay_url;
        const qrPayload = qrCodeUrl || payUrl;
        if (!qrPayload) {
          await BookingService.cancel(String(bookingId));
          setCurrentBookingId(null);
          toast({
            title: "Không tạo được mã QR MoMo",
            description:
              "Giao dịch đã được hủy vì hệ thống không trả về dữ liệu QR.",
            variant: "destructive",
          });
          return;
        }
        setMomoQrImageUrl(buildQrImageUrl(normalizeQrPayload(qrPayload)));
        if (payUrl) setPaymentUrl(payUrl);
        setShowQRModal(true);
        pauseHoldTimer();
        setQRTimeLeft(300);
        timeoutHandledRef.current = false;
      } else if (method === "atm") {
        // VNPay: tạo transaction để lấy pay_url, mở popup VNPay và hiển thị màn hình chờ
        const vnpayResponse = await TransactionService.vnpayPayment({
          booking_id: bookingId,
        });
        const payUrl = vnpayResponse?.data?.pay_url;
        if (!payUrl) {
          await BookingService.cancel(String(bookingId));
          setCurrentBookingId(null);
          toast({
            title: "Không tạo được mã VNPay",
            description:
              "Giao dịch đã được hủy vì hệ thống không trả về liên kết thanh toán.",
            variant: "destructive",
          });
          return;
        }
        // Mở popup VNPay ngay lập tức, hiển thị màn hình chờ xác nhận
        setIsVnpayMode(true);
        setPaymentUrl(payUrl);
        setShowQRModal(true);
        pauseHoldTimer();
        setQRTimeLeft(300);
        timeoutHandledRef.current = false;
        // Tự động mở popup VNPay
        const popup = window.open(
          payUrl,
          "vnpay_popup",
          "width=600,height=700,scrollbars=yes,resizable=yes,left=" +
            Math.round((window.screen.width - 600) / 2) +
            ",top=" +
            Math.round((window.screen.height - 700) / 2),
        );
        if (popup) {
          vnpayPopupRef.current = popup;
        } else {
          // Popup bị block — thông báo user
          toast({
            title: "Vui lòng cho phép popup",
            description:
              "Trình duyệt đã chặn cửa sổ thanh toán. Nhấn 'Mở lại VNPay' để thử lại.",
          });
        }
      } else if (method === "visa") {
        // Visa nội địa qua VNPAY — mở popup và hiển thị màn hình chờ giống VNPay
        const visaResponse = await TransactionService.visaPayment({
          booking_id: bookingId,
        });
        const payUrl = visaResponse?.data?.pay_url;
        if (!payUrl) {
          await BookingService.cancel(String(bookingId));
          setCurrentBookingId(null);
          toast({
            title: "Không tạo được liên kết thanh toán Visa",
            description:
              "Giao dịch đã được hủy vì hệ thống không trả về liên kết thanh toán.",
            variant: "destructive",
          });
          return;
        }
        // Mở popup Visa ngay lập tức, hiển thị màn hình chờ xác nhận
        setIsVisaMode(true);
        setIsVnpayMode(false);
        setPaymentUrl(payUrl);
        setShowQRModal(true);
        pauseHoldTimer();
        setQRTimeLeft(300);
        timeoutHandledRef.current = false;
        // Tự động mở popup Visa
        const visaPopup = window.open(
          payUrl,
          "visa_popup",
          "width=600,height=700,scrollbars=yes,resizable=yes,left=" +
            Math.round((window.screen.width - 600) / 2) +
            ",top=" +
            Math.round((window.screen.height - 700) / 2),
        );
        if (visaPopup) {
          visaPopupRef.current = visaPopup;
        } else {
          toast({
            title: "Vui lòng cho phép popup",
            description:
              "Trình duyệt đã chặn cửa sổ thanh toán. Nhấn 'Mở lại cửa sổ thanh toán' để thử lại.",
          });
        }
      }
    } catch (error) {
      if (bookingId) {
        try {
          await BookingService.cancel(String(bookingId));
        } catch {
          // Ignore cancellation error in client-side recovery.
        }
      }
      setCurrentBookingId(null);
      setShowQRModal(false);
      setMomoQrImageUrl(null);
      setPaymentUrl(null);
      toast({
        title: "Thanh toán thất bại",
        description: "Không thể khởi tạo giao dịch. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyPromo = async (codeOverride?: string) => {
    const codeToApply = (codeOverride || promoCode).trim();
    if (!codeToApply) {
      toast({ title: "Vui lòng nhập mã giảm giá", variant: "destructive" });
      return;
    }
    try {
      const res = await apiCall<VoucherApplyResponse>(
        API_ENDPOINTS.APPLY_VOUCHER,
        {
          method: "POST",
          body: JSON.stringify({
            code: codeToApply,
            user_id: user?.id ? parseInt(user.id) : undefined,
            amount: subtotal,
          }),
        },
      );
      if (res.success && res.data) {
        setDiscount(res.data.discount || 0);
        setAppliedVoucherId(res.data.voucher_id || null);
        setPromoCode(codeToApply);
        toast({
          title: "Áp dụng thành công!",
          description: `Giảm ${Number(res.data.discount).toLocaleString("vi-VN")}đ cho đơn hàng`,
        });
      } else {
        toast({
          title: "Mã không hợp lệ",
          description: res.message || "Vui lòng kiểm tra lại",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      const msg =
        ((err as Record<string, unknown>)?.message as string) ||
        "Vui lòng kiểm tra lại mã giảm giá";
      toast({
        title: "Không thể áp dụng",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const handleSelectPromoCard = (code: string) => {
    setPromoCode(code);
    handleApplyPromo(code);
  };

  const isVoucherValid = (voucher: VoucherItem) => {
    // Check if voucher status is ACTIVE
    if (voucher.status && voucher.status !== "ACTIVE") {
      return false;
    }

    // Check if voucher is within valid date range
    // Parse date strings (YYYY-MM-DD) to avoid timezone issues
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [sYear, sMonth, sDay] = voucher.start_date.split("-").map(Number);
    const startDate = new Date(sYear, sMonth - 1, sDay);

    const [eYear, eMonth, eDay] = voucher.end_date.split("-").map(Number);
    const endDate = new Date(eYear, eMonth - 1, eDay);

    return today >= startDate && today <= endDate;
  };

  const isPromoEligible = (promo: PromotionItem | VoucherItem) => {
    const minOrder = Number(promo.min_order_value || 0);
    return subtotal >= minOrder;
  };

  if (!selectedMovie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin phim. Vui lòng quay lại trang chủ.
        </p>
      </div>
    );
  }

  if (loadingMovie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  const paymentMethods = [
    { value: "momo", label: "Ví MoMo", icon: Smartphone, color: "bg-pink-500" },
    { value: "atm", label: "VNPay", icon: Building2, color: "bg-blue-500" },
    {
      value: "visa",
      label: "Visa nội địa",
      icon: CreditCard,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/booking/concessions")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold flex-1">Thanh Toán</h1>
          {holdTimerActive && !showQRModal && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-base font-bold",
                holdTimeLeft <= 60
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
              )}
            >
              <Clock className="w-4 h-4" />
              {formatHoldTime(holdTimeLeft)}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr,400px] gap-6">
          {/* Payment Methods */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-bold text-lg mb-4">Phương Thức Thanh Toán</h2>

              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                className="space-y-3"
              >
                {paymentMethods.map((method) => (
                  <div
                    key={method.value}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      paymentMethod === method.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                    onClick={() =>
                      setPaymentMethod(method.value as PaymentMethod)
                    }
                  >
                    <RadioGroupItem value={method.value} id={method.value} />
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        method.color,
                      )}
                    >
                      <method.icon className="w-5 h-5 text-white" />
                    </div>
                    <Label
                      htmlFor={method.value}
                      className="cursor-pointer font-medium"
                    >
                      {method.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Promo Code */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Mã Giảm Giá
              </h2>
              <div className="flex gap-3">
                <Input
                  placeholder="Nhập mã giảm giá"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                  className="flex-1"
                />
                <Button onClick={() => handleApplyPromo()} variant="outline">
                  Áp dụng
                </Button>
              </div>
              {discount > 0 && (
                <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <BadgeCheck className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                    Đã áp dụng mã <span className="font-mono">{promoCode}</span>{" "}
                    — Giảm {discount.toLocaleString("vi-VN")}đ
                  </span>
                  <button
                    onClick={() => {
                      setDiscount(0);
                      setPromoCode("");
                      setAppliedVoucherId(null);
                    }}
                    className="ml-auto text-green-600 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {/* Available Promotions & Vouchers */}
            {(activePromos.length > 0 || userVouchers.length > 0) && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Khuyến Mãi & Voucher Của Bạn
                </h2>
                <div className="space-y-3">
                  {/* User vouchers - showing all, eligible ones first */}
                  {userVouchers.map((v) => {
                    // Check if voucher is usable
                    const isUsed = v.status === "USED";
                    const isValid = isVoucherValid(v);
                    const meetsMinOrder = isPromoEligible(v);

                    // Check remaining quantity (if usage_limit is set)
                    const hasLimit = v.usage_limit && v.usage_limit > 0;
                    const remaining = hasLimit
                      ? Math.max(0, v.usage_limit - (v.used_count || 0))
                      : Infinity;
                    const isOutOfStock = hasLimit && remaining <= 0;

                    const eligible =
                      !isUsed && isValid && meetsMinOrder && !isOutOfStock;
                    const isApplied = appliedVoucherId
                      ? appliedVoucherId === Number(v.id)
                      : promoCode && promoCode === (v.code || v.promo_code);

                    // Determine status for display
                    let statusLabel = "";
                    if (isUsed) statusLabel = "Đã sử dụng";
                    else if (isOutOfStock) statusLabel = "Hết lượt";
                    else if (v.status === "EXPIRED" || !isValid)
                      statusLabel = "Hết hạn";
                    else if (!meetsMinOrder) statusLabel = "Chưa đủ điều kiện";
                    return (
                      <div
                        key={`uv-${v.id}`}
                        onClick={() =>
                          eligible &&
                          !isApplied &&
                          handleSelectPromoCard(v.code || v.promo_code)
                        }
                        style={{ pointerEvents: eligible ? "auto" : "none" }}
                        className={cn(
                          "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                          isApplied
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : eligible
                              ? "border-border hover:border-primary/50 cursor-pointer"
                              : "border-border opacity-50 cursor-not-allowed",
                        )}
                      >
                        <div
                          className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                            eligible ? "bg-orange-500" : "bg-gray-400",
                          )}
                        >
                          <Ticket className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sm">
                              {v.code || v.promo_code}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Voucher
                            </Badge>
                            {isApplied && (
                              <BadgeCheck className="w-4 h-4 text-green-600" />
                            )}
                            {statusLabel && !isApplied && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-red-100 text-red-600 dark:bg-red-900/20"
                              >
                                {statusLabel}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {v.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-semibold text-primary">
                              {v.discount_type === "PERCENT"
                                ? `Giảm ${v.discount_amount}%`
                                : `Giảm ${Number(v.discount_amount).toLocaleString("vi-VN")}đ`}
                            </span>
                            {Number(v.min_order_value) > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Đơn tối thiểu{" "}
                                {Number(v.min_order_value).toLocaleString(
                                  "vi-VN",
                                )}
                                đ
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Public active promotions (exclude system & user vouchers) */}
                  {activePromos
                    .filter((p) => {
                      // Check date validity - fix timezone issue
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const [sYear, sMonth, sDay] = p.start_date
                        .split("-")
                        .map(Number);
                      const startDate = new Date(sYear, sMonth - 1, sDay);
                      const [eYear, eMonth, eDay] = p.end_date
                        .split("-")
                        .map(Number);
                      const endDate = new Date(eYear, eMonth - 1, eDay);
                      return today >= startDate && today <= endDate;
                    })
                    .filter(
                      (p) =>
                        !userVouchers.some(
                          (v) =>
                            v.promotion_id === p.id || v.promo_code === p.code,
                        ),
                    )
                    .filter(
                      (p) =>
                        !p.is_auto_apply &&
                        !/^(REWARD_20K|REWARD_50K|TIER_|BIRTHDAY)/.test(p.code),
                    )
                    .map((p) => {
                      // Check remaining quantity
                      const hasLimit = p.usage_limit && p.usage_limit > 0;
                      const remaining = hasLimit
                        ? Math.max(0, p.usage_limit - (p.used_count || 0))
                        : Infinity;
                      const isOutOfStock = hasLimit && remaining <= 0;

                      const eligible = isPromoEligible(p) && !isOutOfStock;
                      const isApplied =
                        promoCode === p.code && !appliedVoucherId;
                      return (
                        <div
                          key={`promo-${p.id}`}
                          onClick={() =>
                            eligible &&
                            !isApplied &&
                            handleSelectPromoCard(p.code)
                          }
                          className={cn(
                            "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                            isApplied
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                              : eligible
                                ? "border-border hover:border-primary/50 cursor-pointer"
                                : "border-border opacity-50 cursor-not-allowed",
                          )}
                        >
                          <div
                            className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                              eligible ? "bg-primary" : "bg-gray-400",
                            )}
                          >
                            <Percent className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm">
                                {p.code}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                Khuyến mãi
                              </Badge>
                              {isApplied && (
                                <BadgeCheck className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {p.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm font-semibold text-primary">
                                {p.discount_type === "PERCENT"
                                  ? `Giảm ${p.discount_amount}%`
                                  : `Giảm ${Number(p.discount_amount).toLocaleString("vi-VN")}đ`}
                              </span>
                              {Number(p.min_order_value) > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  Đơn tối thiểu{" "}
                                  {Number(p.min_order_value).toLocaleString(
                                    "vi-VN",
                                  )}
                                  đ
                                </span>
                              )}
                            </div>
                          </div>
                          {!eligible && (
                            <span className="text-xs text-red-500 shrink-0">
                              Chưa đủ điều kiện
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-xl border border-border p-6 h-fit sticky top-20">
            <h2 className="font-bold text-lg mb-4">Chi Tiết Đơn Hàng</h2>

            {/* Movie Info */}
            <div className="flex gap-4 pb-4 mb-4 border-b border-border">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-16 h-24 object-cover rounded-lg"
              />
              <div>
                <p className="font-semibold">{movie.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ghế: {seatCodes.join(", ")}
                </p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Vé ({selectedSeats.length})
                </span>
                <span>{ticketTotal.toLocaleString("vi-VN")}đ</span>
              </div>
              {concessionTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Combo & Bắp nước
                  </span>
                  <span>{concessionTotal.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá ({promoCode})</span>
                  <span>-{discount.toLocaleString("vi-VN")}đ</span>
                </div>
              )}
              {userTier && membershipDiscountAmount > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>
                    Ưu đãi thành viên {userTier.rank_name} (
                    {userTier.discount_rate}%)
                  </span>
                  <span>
                    -{membershipDiscountAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Tổng thanh toán</span>
                <span className="text-primary">
                  {grandTotal.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            <Button
              onClick={() => processPayment(paymentMethod)}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Tiến Hành Thanh Toán
            </Button>
          </div>
        </div>
      </main>

      {/* QR Payment Modal */}
      <Dialog
        open={showQRModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCancelPaymentConfirm(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {isVnpayMode
                  ? "Chờ Xác Nhận Thanh Toán VNPay"
                  : isVisaMode
                    ? "Chờ Xác Nhận Thanh Toán Visa"
                    : "Quét Mã QR Để Thanh Toán"}
              </DialogTitle>
              <div
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-full font-mono text-sm font-bold",
                  qrTimeLeft <= 60
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary",
                )}
              >
                <Clock className="w-4 h-4" />
                {formatTime(qrTimeLeft)}
              </div>
            </div>
            <DialogDescription>
              {isVnpayMode
                ? "Cửa sổ thanh toán VNPay đã được mở. Vui lòng hoàn tất thanh toán trong cửa sổ đó."
                : isVisaMode
                  ? "Cửa sổ thanh toán Visa đã được mở. Vui lòng chọn ngân hàng và hoàn tất thanh toán."
                  : "Mở ứng dụng MoMo và quét mã bên dưới"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-6">
            {isVnpayMode || isVisaMode ? (
              /* VNPay / Visa waiting screen */
              <div className="flex flex-col items-center gap-5 py-4">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isVisaMode ? (
                      <CreditCard className="w-10 h-10 text-primary" />
                    ) : (
                      <Building2 className="w-10 h-10 text-primary" />
                    )}
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-base font-semibold">
                    {isVisaMode
                      ? "Đang chờ xác nhận thanh toán Visa..."
                      : "Đang chờ xác nhận từ VNPay..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isVisaMode
                      ? "Chọn ngân hàng và hoàn tất thanh toán trong cửa sổ đã mở"
                      : "Hoàn tất thanh toán trong cửa sổ VNPay đã mở"}
                  </p>
                </div>
                {paymentUrl && (
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-10",
                      isVisaMode
                        ? "border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        : "border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                    )}
                    onClick={() => {
                      if (isVisaMode) {
                        if (
                          visaPopupRef.current &&
                          !visaPopupRef.current.closed
                        ) {
                          visaPopupRef.current.focus();
                        } else {
                          const popup = window.open(
                            paymentUrl,
                            "visa_popup",
                            "width=600,height=700,scrollbars=yes,resizable=yes,left=" +
                              Math.round((window.screen.width - 600) / 2) +
                              ",top=" +
                              Math.round((window.screen.height - 700) / 2),
                          );
                          if (popup) visaPopupRef.current = popup;
                          else
                            window.open(
                              paymentUrl,
                              "_blank",
                              "noopener,noreferrer",
                            );
                        }
                      } else {
                        if (
                          vnpayPopupRef.current &&
                          !vnpayPopupRef.current.closed
                        ) {
                          vnpayPopupRef.current.focus();
                        } else {
                          const popup = window.open(
                            paymentUrl,
                            "vnpay_popup",
                            "width=600,height=700,scrollbars=yes,resizable=yes,left=" +
                              Math.round((window.screen.width - 600) / 2) +
                              ",top=" +
                              Math.round((window.screen.height - 700) / 2),
                          );
                          if (popup) vnpayPopupRef.current = popup;
                          else
                            window.open(
                              paymentUrl,
                              "_blank",
                              "noopener,noreferrer",
                            );
                        }
                      }
                    }}
                  >
                    {isVisaMode
                      ? "Mở lại cửa sổ thanh toán Visa"
                      : "Mở lại cửa sổ VNPay"}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Hệ thống tự động xác nhận sau khi cổng thanh toán phản hồi.
                </p>
              </div>
            ) : (
              /* MoMo QR screen */
              <>
                <div className="w-48 h-48 bg-white rounded-xl p-4 shadow-lg mb-4">
                  {momoQrImageUrl ? (
                    <img
                      src={momoQrImageUrl}
                      alt="MoMo QR"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-lg font-bold text-primary">
                  {grandTotal.toLocaleString("vi-VN")}đ
                </p>
                <p className="text-sm text-muted-foreground">
                  Galaxy Cinema - {movie?.title}
                </p>
              </>
            )}
          </div>

          <div className="border-t border-border pt-4 flex flex-col gap-3">
            {/* Single switch payment method button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm text-muted-foreground border border-border hover:bg-muted/50"
              onClick={() => {
                // Chỉ đóng modal và reset trạng thái UI — KHÔNG hủy booking.
                // Ghế vẫn được giữ, currentBookingId vẫn còn để tái sử dụng
                // khi user chọn phương thức khác và nhấn "Tiến hành thanh toán".
                setShowQRModal(false);
                setMomoQrImageUrl(null);
                setPaymentUrl(null);
                setIsVnpayMode(false);
                setIsVisaMode(false);
                paymentHandledRef.current = false;
                timeoutHandledRef.current = false;
                // Giữ nguyên: currentBookingId, currentBookingCode, qrTimeLeft
                // Resume hold timer so countdown continues
                resumeHoldTimer();
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Chọn phương thức thanh toán khác
            </Button>
            {!isVnpayMode && !isVisaMode && (
              <p className="text-xs text-muted-foreground text-center">
                Hệ thống sẽ tự động cập nhật khi MoMo xác nhận thanh toán.
              </p>
            )}
            <Button
              variant="outline"
              className="w-full text-muted-foreground"
              onClick={() => setShowCancelPaymentConfirm(true)}
            >
              Huỷ giao dịch
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showCancelPaymentConfirm}
        onOpenChange={setShowCancelPaymentConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn xác nhận huỷ giao dịch chứ?</AlertDialogTitle>
            <AlertDialogDescription>
              Nếu đồng ý, giao dịch sẽ bị hủy, ghế của bạn sẽ được giải phóng và
              bạn sẽ quay lại trang chọn ghế.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancellingPayment}>
              Không
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isCancellingPayment}
              onClick={async () => {
                setShowCancelPaymentConfirm(false);
                await cancelPaymentSession(
                  "Đã huỷ giao dịch",
                  "Bạn đã hủy giao dịch. Ghế đã được giải phóng.",
                );
              }}
            >
              {isCancellingPayment ? "Đang xử lý..." : "Đồng ý"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PaymentPage;
