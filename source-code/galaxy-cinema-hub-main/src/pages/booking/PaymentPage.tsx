import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Smartphone,
  Building2,
  Tag,
  Clock,
  QrCode,
  Check,
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
import { PaymentMethod } from "@/types/cinema";
import { cn } from "@/lib/utils";
import { BookingService } from "@/services/booking.service";
import { TransactionService } from "@/services/transacsion.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("momo");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTimeLeft, setQRTimeLeft] = useState(300); // 5 minutes
  const [isProcessing, setIsProcessing] = useState(false);
  const [momoQrImageUrl, setMomoQrImageUrl] = useState<string | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<number | null>(null);
  const [appliedVoucherId, setAppliedVoucherId] = useState<number | null>(null);

  // Promotions & vouchers for display
  const [activePromos, setActivePromos] = useState<any[]>([]);
  const [userVouchers, setUserVouchers] = useState<any[]>([]);
  const [userTier, setUserTier] = useState<any>(null);

  const [movie, setMovie] = useState<any>(null);
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
          data: { movie: any };
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
        const promoRes: any = await apiCall(API_ENDPOINTS.PROMOTIONS_ACTIVE);
        const promos = promoRes?.data?.promotions || promoRes?.promotions || [];
        setActivePromos(promos);
      } catch {
        /* ignore */
      }

      if (user?.id) {
        try {
          // Fetch ALL vouchers (including expired, used) to show but disable ineligible ones
          const vRes: any = await apiCall(
            `${API_ENDPOINTS.USER_VOUCHERS(parseInt(user.id))}?status=all`,
          );
          const vouchers = vRes?.data?.vouchers || vRes?.vouchers || [];

          // Helper function to parse date string (YYYY-MM-DD) to local date
          const parseLocalDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split("-").map(Number);
            return new Date(year, month - 1, day);
          };

          // Sort vouchers: ACTIVE+valid dates first, then others
          const sortedVouchers = [...vouchers].sort((a: any, b: any) => {
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
          const tierRes: any = await apiCall(
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

  // QR Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showQRModal && qrTimeLeft > 0) {
      timer = setInterval(() => {
        setQRTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowQRModal(false);
            toast({
              title: "Hết thời gian thanh toán",
              description: "Giao dịch đã bị hủy do quá thời gian",
              variant: "destructive",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showQRModal, qrTimeLeft, toast]);

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
      const response = await BookingService.create(bookingRequest);
      const createdBookingId = toPositiveInt(
        (response as any)?.data?.booking_id,
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
    } catch (error: any) {
      toast({
        title: "Lỗi hệ thống",
        description: error?.message || "Có lỗi xảy ra khi xử lý đơn hàng.",
        variant: "destructive",
      });
      return null;
    }
  };

  const processPayment = async (method: PaymentMethod) => {
    setIsProcessing(true);
    try {
      const bookingId = await createBooking();
      if (!bookingId) {
        return;
      }
      // Save booking ID for later confirmation
      setCurrentBookingId(bookingId);
      if (method === "momo") {
        const momoResponse = await TransactionService.momoPayment({
          booking_id: bookingId,
        });
        const qrCodeUrl = momoResponse?.data?.qr_code_url;
        const payUrl = momoResponse?.data?.pay_url;
        const qrPayload = qrCodeUrl || payUrl;
        if (!qrPayload) {
          toast({
            title: "Không tạo được mã QR MoMo",
            description: "Hệ thống không trả về dữ liệu QR thanh toán.",
            variant: "destructive",
          });
          return;
        }
        setMomoQrImageUrl(buildQrImageUrl(normalizeQrPayload(qrPayload)));
      } else if (method === "atm") {
        await TransactionService.vnpayPayment({ booking_id: bookingId });
        setMomoQrImageUrl(null);
      } else {
        setMomoQrImageUrl(null);
      }

      setShowQRModal(true);
      setQRTimeLeft(300);
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
      const res: any = await apiCall(API_ENDPOINTS.APPLY_VOUCHER, {
        method: "POST",
        body: JSON.stringify({
          code: codeToApply,
          user_id: user?.id ? parseInt(user.id) : undefined,
          amount: subtotal,
        }),
      });
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
    } catch (err: any) {
      const msg = err?.message || "Vui lòng kiểm tra lại mã giảm giá";
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

  const isVoucherValid = (voucher: any) => {
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

  const isPromoEligible = (promo: any) => {
    const minOrder = Number(promo.min_order_value || 0);
    return subtotal >= minOrder;
  };

  const handlePayment = () => {
    setShowQRModal(true);
    setQRTimeLeft(300);
  };

  const handleSimulateSuccess = async () => {
    if (!currentBookingId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin đặt vé",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm booking to update status from Pending -> Paid and tickets from HOLDING -> SOLD
      await BookingService.confirm(currentBookingId.toString());

      // Earn loyalty points for this purchase (backend uses final_price from DB)
      let earnedPoints = 0;
      if (user?.id) {
        try {
          const pointsRes: any = await apiCall(API_ENDPOINTS.EARN_POINTS, {
            method: "POST",
            body: JSON.stringify({
              user_id: parseInt(user.id),
              booking_id: currentBookingId,
            }),
          });
          earnedPoints = pointsRes?.data?.earned_points || 0;
        } catch {
          // Non-blocking
        }
      }

      // Check for tier upgrade after earning points
      let upgraded = false;
      let newTierName = "";
      let newDiscount = 0;
      if (user?.id) {
        try {
          const upgradeRes: any = await apiCall(
            API_ENDPOINTS.MEMBERSHIP_CHECK_UPGRADE(parseInt(user.id)),
          );
          if (upgradeRes?.data?.upgraded) {
            upgraded = true;
            newTierName = upgradeRes.data.eligible_tier?.rank_name || "";
            newDiscount = parseFloat(
              upgradeRes.data.eligible_tier?.discount_rate || "0",
            );
          }
        } catch {
          // Non-blocking
        }
      }

      if (earnedPoints > 0) {
        toast({
          title: "🎉 Tích điểm thành công!",
          description: `Bạn nhận được ${earnedPoints.toLocaleString("vi-VN")} điểm thưởng cho đơn hàng này.`,
        });
      }

      if (upgraded) {
        setTimeout(() => {
          toast({
            title: "🏆 Chúc mừng lên hạng!",
            description: `Bạn đã được thăng hạng lên ${newTierName}! Giảm ${newDiscount}% cho mỗi vé xem phim.`,
          });
        }, 1000);
      }

      setTimeout(() => {
        setShowQRModal(false);
        navigate("/booking/success", {
          state: {
            ticketCode: `GXY-2024-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            movie,
            seats: selectedSeats,
            total: grandTotal,
            discount: discount + membershipDiscountAmount,
            promoCode: discount > 0 ? promoCode : null,
          },
        });
        clearBooking();
        setCurrentBookingId(null);
      }, 1500);
    } catch (error) {
      console.error("Failed to confirm booking:", error);
      toast({
        title: "Lỗi xác nhận đặt vé",
        description: "Có lỗi xảy ra khi xác nhận đặt vé",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleSimulateFailure = () => {
    setShowQRModal(false);
    navigate("/booking/failed");
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
      label: "Visa / Mastercard",
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
          <h1 className="text-2xl font-bold">Thanh Toán</h1>
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
                  {userVouchers.map((v: any) => {
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
                    const isApplied = promoCode === (v.code || v.promo_code);

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
                    .filter((p: any) => {
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
                      (p: any) =>
                        !userVouchers.some(
                          (v: any) =>
                            v.promotion_id === p.id || v.promo_code === p.code,
                        ),
                    )
                    .filter(
                      (p: any) =>
                        !p.is_auto_apply &&
                        !/^(REWARD_20K|REWARD_50K|TIER_|BIRTHDAY)/.test(p.code),
                    )
                    .map((p: any) => {
                      // Check remaining quantity
                      const hasLimit = p.usage_limit && p.usage_limit > 0;
                      const remaining = hasLimit
                        ? Math.max(0, p.usage_limit - (p.used_count || 0))
                        : Infinity;
                      const isOutOfStock = hasLimit && remaining <= 0;

                      const eligible = isPromoEligible(p) && !isOutOfStock;
                      const isApplied = promoCode === p.code;
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
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Quét Mã QR Để Thanh Toán</DialogTitle>
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
              Mở ứng dụng {paymentMethod.toUpperCase()} và quét mã bên dưới
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-6">
            {/* QR Code */}
            <div className="w-48 h-48 bg-white rounded-xl p-4 shadow-lg mb-4">
              {paymentMethod === "momo" && momoQrImageUrl ? (
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
              Galaxy Cinema - {movie.title}
            </p>
          </div>

          {/* Simulation Buttons */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Demo: Mô phỏng kết quả thanh toán
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleSimulateSuccess}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <span className="animate-pulse">Đang xử lý...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Thành công
                  </>
                )}
              </Button>
              <Button
                onClick={handleSimulateFailure}
                variant="destructive"
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-2" />
                Thất bại
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentPage;
