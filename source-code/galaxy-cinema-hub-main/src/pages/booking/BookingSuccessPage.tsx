import React, { useState, useEffect } from "react";
import { useLocation, Link, useSearchParams, useNavigate } from "react-router-dom";
import { Check, Calendar, MapPin, Clock, Download, Home, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookingService } from "@/services/booking.service";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api-config";

const BookingSuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const urlStatus = searchParams.get("status");
  const hasUrlParams = !location.state && (searchParams.has("booking_id") || searchParams.has("status") || searchParams.has("transaction_code"));
  const isFailedCallback = hasUrlParams && urlStatus !== null && urlStatus !== "Success";
  // Khi VNPay/Visa redirect về với status=Success và không có state (popup flow),
  // đóng popup để main PaymentPage tự detect qua polling/Pusher
  const gateway = searchParams.get("gateway");
  const isGatewaySuccessCallback = hasUrlParams && urlStatus === "Success" && (gateway === "VNPay" || gateway === "Visa");


  useEffect(() => {
    if (isFailedCallback) {
      navigate("/booking/failed", { replace: true });
      return;
    }
    if (isGatewaySuccessCallback) {
      // Nếu đang chạy trong popup window (window.opener = main PaymentPage),
      // đóng popup để main window tự detect qua polling/Pusher
      if (window.opener && !window.opener.closed) {
        window.close();
        return;
      }
      // Nếu là main window (không có popup) — redirect sang trang vé
      toast({
        title: "Thanh toán thành công!",
        description: "Vé đã được xác nhận. Bạn có thể xem vé trong mục Vé của tôi.",
      });
      navigate("/profile/my-tickets", { replace: true });
    }
  }, [isFailedCallback, isGatewaySuccessCallback, navigate, toast]);

  const [bookingData, setBookingData] = useState<any>(location.state || null);
  const [isLoading, setIsLoading] = useState(!location.state && searchParams.has("booking_id") && !isFailedCallback && !isGatewaySuccessCallback);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (location.state) return;
      
      const bookingId = searchParams.get("booking_id");
      if (!bookingId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const token = localStorage.getItem("token") || localStorage.getItem("galaxy_cinema_token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.DETAIL(bookingId)}`, {
          method: "GET",
          headers,
        });

        if (response.ok) {
          const res = await response.json();
          if (res.success && res.data) {
            const b = res.data;
            setBookingData({
              bookingCode: b.booking_code,
              ticketCode: null,
              movie: {
                title: b.movie_title,
                poster: b.movie_poster || "",
                backdrop: b.movie_poster || "",
              },
              seats: b.seats || [],
              total: b.total_price,
              discount: 0,
              promoCode: null,
              showtime: {
                date: b.showtime_date,
                time: b.showtime_start_time,
                cinema: b.cinema_name,
                hall: b.hall_name
              }
            });
          }
        }
      } catch (err) {
         // Let the UI handle missing bookingData seamlessly
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [location.state, searchParams]);

  const {
    bookingCode,
    ticketCode,
    movie,
    seats,
    total,
    discount,
    promoCode,
    showtime,
  } = bookingData || {};
  const [isSavingImage, setIsSavingImage] = useState(false);

  const activeTicketCode = bookingCode || ticketCode || null;

  const qrImageUrl = activeTicketCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(activeTicketCode)}`
    : null;

  const seatText = Array.isArray(seats)
    ? seats
        .map((seat: any) =>
          seat?.row && seat?.number
            ? `${seat.row}${seat.number}`
            : seat?.id || "",
        )
        .filter(Boolean)
        .join(", ")
    : "";

  const showtimeDate = showtime?.date || showtime?.start_time || null;
  const showtimeHall =
    showtime?.hall ||
    showtime?.hall_name ||
    showtime?.room ||
    showtime?.room_name ||
    "";
  const showtimeCinema =
    showtime?.cinema || showtime?.cinema_name || showtime?.cinemaName || "";
  const showtimeTimeText =
    showtime?.time && showtimeHall
      ? `${showtime.time} - ${showtimeHall}`
      : showtime?.time || "";
  const cinemaText = showtimeCinema || "Đang cập nhật";

  const waitForImages = async (container: HTMLElement) => {
    const images = Array.from(container.querySelectorAll("img"));
    if (images.length === 0) return;

    await Promise.all(
      images.map((img) => {
        if (img.complete) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
          const cleanup = () => {
            img.removeEventListener("load", cleanup);
            img.removeEventListener("error", cleanup);
            resolve();
          };
          img.addEventListener("load", cleanup);
          img.addEventListener("error", cleanup);
          setTimeout(cleanup, 2500);
        });
      }),
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const buildExportTicketNode = (): HTMLDivElement => {
    const root = document.createElement("div");
    root.style.width = "760px";
    root.style.padding = "28px";
    root.style.borderRadius = "24px";
    root.style.background = "linear-gradient(150deg, #061438, #0b2a66)";
    root.style.color = "#ffffff";
    root.style.fontFamily = "Segoe UI, Arial, sans-serif";
    root.style.boxSizing = "border-box";

    const posterUrl = movie?.backdrop || movie?.poster || "";
    const poster = posterUrl
      ? `<img src="${posterUrl}" crossorigin="anonymous" style="width:100%;height:220px;object-fit:cover;border-radius:16px;opacity:.82;" />`
      : "";
    const qr = qrImageUrl
      ? `<img src="${qrImageUrl}" crossorigin="anonymous" style="width:200px;height:200px;background:#fff;border-radius:14px;padding:12px;" />`
      : "";

    const discountHtml =
      Number(discount) > 0
        ? `<div style="margin-top:12px;font-size:20px;line-height:1.45;color:#54e3a6;">Bạn đã tiết kiệm ${Number(discount).toLocaleString("vi-VN")}đ${promoCode ? ` với mã ${promoCode}` : ""}</div>`
        : "";

    root.innerHTML = `
      <div style="display:flex;gap:24px;align-items:flex-start;">
        <div style="flex:1;min-width:0;">
          ${poster}
          <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
            <div>
              <div style="font-size:40px;font-weight:800;line-height:1.2;">${movie?.title || "Vé xem phim"}</div>
              <div style="margin-top:6px;font-size:21px;color:#b9c6f5;">Mã booking: <span style="font-family:Consolas, monospace;color:#fff;font-weight:700;">${activeTicketCode || "N/A"}</span></div>
            </div>
            <div style="padding:8px 14px;border-radius:999px;background:#19c37d22;border:1px solid #19c37d;font-weight:700;">VÉ HỢP LỆ</div>
          </div>

          <div style="margin-top:16px;padding-top:16px;border-top:1px dashed rgba(255,255,255,.28);display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;font-size:22px;line-height:1.4;">
            <div><span style="color:#9fb2ee;">Rạp:</span> ${cinemaText}</div>
            <div><span style="color:#9fb2ee;">Phòng:</span> ${showtimeHall || "Đang cập nhật"}</div>
            <div><span style="color:#9fb2ee;">Ngày chiếu:</span> ${showtimeDate ? formatDate(showtimeDate) : formatDate(new Date().toISOString())}</div>
            <div><span style="color:#9fb2ee;">Suất chiếu:</span> ${showtime?.time || "Đang cập nhật"}</div>
            <div style="grid-column:1 / -1;"><span style="color:#9fb2ee;">Ghế:</span> ${seatText || "Đang cập nhật"}</div>
          </div>

          ${discountHtml}

          <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.2);font-size:28px;font-weight:800;color:#ff7a1a;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:22px;color:#d7dff9;font-weight:600;">Tổng thanh toán</span>
            <span>${Number(total || 0).toLocaleString("vi-VN")}đ</span>
          </div>
        </div>
        <div style="width:220px;display:flex;justify-content:center;">
          ${qr}
        </div>
      </div>
    `;

    return root;
  };

  const handleSaveTicketImage = async () => {
    if (!activeTicketCode || isSavingImage) {
      return;
    }

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.style.zIndex = "-1";

    const ticketNode = buildExportTicketNode();
    container.appendChild(ticketNode);
    document.body.appendChild(container);

    try {
      setIsSavingImage(true);

      await waitForImages(container);

      const exportScale = Math.min(
        4,
        Math.max(2.5, (window.devicePixelRatio || 1) * 2),
      );

      const canvas = await html2canvas(ticketNode, {
        scale: exportScale,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const imageData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imageData;
      link.download = `ve-${activeTicketCode}.png`;
      link.click();

      toast({
        title: "Đã lưu ảnh vé",
        description: "Ảnh vé đã được tải xuống thiết bị của bạn.",
      });
    } catch (error) {
      console.error("Failed to save ticket image:", error);
      toast({
        title: "Không thể lưu ảnh vé",
        description: "Vui lòng thử lại sau ít phút.",
        variant: "destructive",
      });
    } finally {
      setIsSavingImage(false);
      container.remove();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-white/80">Đang tải thông tin vé...</p>
        </div>
      </div>
    );
  }

  if (!activeTicketCode) {
    if (searchParams.get("status") === "Success") {
      return (
        <div className="min-h-screen bg-gradient-cinema flex items-center justify-center p-4">
          <div className="w-full max-w-md animate-scale-in text-center">
            <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center glow-success mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Giao Dịch Thành Công!
            </h1>
            <p className="text-white/80 text-lg leading-relaxed mb-2">
              Chân thành cảm ơn quý khách.
            </p>
            <p className="text-white/70 leading-relaxed mb-2">
              Chúc quý khách có một trải nghiệm xem phim thật tuyệt vời.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Vui lòng trở về trang trước để xem lịch sử đặt vé. Xin cảm ơn.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Không tìm thấy thông tin vé
          </h1>
          <Link to="/">
            <Button>Về trang chủ</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-cinema flex items-center justify-center p-4">
      {/* Glassmorphism Container */}
      <div className="w-full max-w-md animate-scale-in">
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center glow-success mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Đặt Vé Thành Công!
          </h1>
          <p className="text-white/70">Vé của bạn đã được xác nhận</p>
        </div>

        {/* E-Ticket Card */}
        <div className="glass-dark rounded-2xl overflow-hidden">
          {/* Movie Banner */}
          <div className="relative h-32">
            <img
              src={movie?.backdrop || movie?.poster}
              alt={movie?.title}
              crossOrigin="anonymous"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-xl font-bold text-white">{movie?.title}</h2>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-6">
            <div className="bg-white rounded-xl p-4 shadow-2xl">
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="QR vé"
                  crossOrigin="anonymous"
                  className="w-32 h-32 object-contain"
                />
              ) : null}
            </div>
          </div>

          {/* Ticket Code */}
          <div className="text-center pb-4">
            <p className="text-white/60 text-sm mb-1">Mã booking</p>
            <p className="text-white text-xl font-mono font-bold tracking-wider">
              {activeTicketCode}
            </p>
          </div>

          {/* Valid Badge */}
          <div className="flex justify-center pb-4">
            <span className="px-4 py-1 bg-green-500/20 border border-green-500 text-green-400 rounded-full text-sm font-semibold glow-success">
              ✓ VÉ HỢP LỆ
            </span>
          </div>

          {/* Divider */}
          <div className="relative px-6">
            <div className="border-t border-dashed border-white/20" />
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-cinema rounded-full" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-cinema rounded-full" />
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="text-white/60 text-xs">Rạp</p>
                <p className="text-white font-medium">{cinemaText}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-white/60 text-xs">Ngày chiếu</p>
                <p className="text-white font-medium">
                  {(showtimeDate
                    ? new Date(showtimeDate)
                    : new Date()
                  ).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-white/60 text-xs">Suất chiếu</p>
                <p className="text-white font-medium">
                  {showtimeTimeText || "Đang cập nhật"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-primary rounded flex items-center justify-center text-xs text-white font-bold">
                {seats?.length}
              </div>
              <div>
                <p className="text-white/60 text-xs">Ghế</p>
                <p className="text-white font-medium">
                  {seatText || "Đang cập nhật"}
                </p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="px-6 pb-6">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Tổng thanh toán</span>
                <span className="text-2xl font-bold text-primary">
                  {total?.toLocaleString("vi-VN")}đ
                </span>
              </div>
              {discount > 0 && (
                <p className="text-green-400 text-sm mt-1">
                  🎉 Bạn đã tiết kiệm {discount.toLocaleString("vi-VN")}đ với mã{" "}
                  {promoCode}!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Button
            onClick={handleSaveTicketImage}
            disabled={isSavingImage}
            className="w-full h-12 bg-white text-secondary hover:bg-white/90 font-semibold"
          >
            <Download className="w-5 h-5 mr-2" />
            {isSavingImage ? "Đang lưu ảnh..." : "Lưu Ảnh Vé"}
          </Button>
          <Link to="/" className="block">
            <Button
              variant="outline"
              className="w-full h-12 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Home className="w-5 h-5 mr-2" />
              <span>Quay về trang chủ</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
