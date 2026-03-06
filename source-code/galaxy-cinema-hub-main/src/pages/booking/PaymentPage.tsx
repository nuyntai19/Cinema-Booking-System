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
} from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBooking } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AppContext";
import { movies } from "@/data/mockData";
import { API_ENDPOINTS, apiCall } from "@/lib/api";
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

  const [movie, setMovie] = useState<any>(null);

  // Fetch movie from API
  useEffect(() => {
    const fetchMovie = async () => {
      if (!selectedMovie) return;
      try {
        const response = await apiCall<{
          success: boolean;
          data: { movie: any };
        }>(API_ENDPOINTS.MOVIE_DETAIL(parseInt(selectedMovie)));
        if (response.success && response.data?.movie) {
          const m = response.data.movie;
          setMovie({
            id: String(m.id),
            title: m.title,
            poster: m.poster_url
              ? `${API_ENDPOINTS.MOVIES.replace("/api/movies", "")}/uploads/posters/${m.poster_url}`
              : "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch movie:", error);
      }
    };
    fetchMovie();
  }, [selectedMovie]);

  const { user } = useAuth();

  const ticketTotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const concessionTotal = concessions.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const subtotal = ticketTotal + concessionTotal;
  const grandTotal = subtotal - discount;
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
      user_voucher_id: discount > 0 ? 123 : undefined, // Example voucher ID
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
    } catch (error) {
      toast({
        title: "Lỗi hệ thống",
        description: "Có lỗi xảy ra khi xử lý đơn hàng.",
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

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === "SUMMER20") {
      setDiscount(20000);
      toast({
        title: "Áp dụng thành công!",
        description: "Giảm 20.000đ cho đơn hàng",
      });
    } else {
      toast({
        title: "Mã không hợp lệ",
        description: "Vui lòng kiểm tra lại mã giảm giá",
        variant: "destructive",
      });
    }
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

      setTimeout(() => {
        setShowQRModal(false);
        navigate("/booking/success", {
          state: {
            ticketCode: `GXY-2024-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            movie,
            seats: selectedSeats,
            total: grandTotal,
            discount,
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

  if (!movie) {
    navigate("/");
    return null;
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
                  className="flex-1"
                />
                <Button onClick={handleApplyPromo} variant="outline">
                  Áp dụng
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Thử mã:{" "}
                <span className="font-mono bg-muted px-1 rounded">
                  SUMMER20
                </span>
              </p>
            </div>
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
