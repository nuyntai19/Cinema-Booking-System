import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  CreditCard,
  Download,
  QrCode,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AppContext";
import { API_ENDPOINTS, getImageUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Concession {
  id: number;
  concession_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
  category?: string;
}

interface BookingHistory {
  id: string;
  bookingCode: string;
  movie: {
    title: string;
    poster: string;
    duration: number;
    ageRating: string;
  };
  cinema: string;
  room: string;
  date: string;
  time: string;
  seats: string[];
  concessions: Concession[];
  originalPrice: number;
  discountAmount: number;
  totalPrice: number;
  status: "completed" | "upcoming" | "cancelled";
  paymentMethod: string;
  bookingDate: string;
  ticketCodes: string[];
  qrCode?: string;
}

const BookingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<BookingHistory | null>(
    null,
  );
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [bookings, setBookings] = useState<BookingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [isDownloadingTicket, setIsDownloadingTicket] = useState(false);
  // Delay auth check by 1 render cycle to give AuthProvider time to read localStorage
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!authChecked) return; // Wait until auth state is settled
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchBookings = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch(
          API_ENDPOINTS.USER_BOOKINGS(Number(user.id)),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch bookings");
        }

        const result = await response.json();

        const sourceItems = Array.isArray(result?.data?.items)
          ? result.data.items
          : [];

        // Only include bookings that have completed payment.
        const mappedBookings: BookingHistory[] = sourceItems
          .filter((booking: { status: string; payment_status?: string }) => {
            const paymentStatus = (booking.payment_status || "").toLowerCase();
            const isPaidBooking = booking.status === "Paid";
            const isCancelledAfterPaid =
              booking.status === "Cancelled" && paymentStatus === "success";
            return isPaidBooking || isCancelledAfterPaid;
          })
          .map(
            (booking: {
              id: number;
              booking_code?: string;
              movie_title: string;
              poster_url: string;
              duration_minutes: number;
              age_rating: string;
              start_time: string;
              status: string;
              cinema_name: string;
              hall_name: string;
              seats?: string;
              concessions?: Concession[];
              total_price?: string;
              discount_amount?: string;
              final_price?: string;
              payment_method?: string;
              payment_status?: string;
              ticket_codes?: string[];
              created_at: string;
              [key: string]: unknown;
            }) => {
              const startTime = new Date(booking.start_time);
              const bookingDate = booking.start_time.split(" ")[0]; // YYYY-MM-DD
              const bookingTime = startTime.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              // Determine booking status
              let status: "completed" | "upcoming" | "cancelled" = "upcoming";
              const now = new Date();
              if (booking.status === "Cancelled") {
                status = "cancelled";
              } else if (booking.status === "Paid" && startTime < now) {
                status = "completed";
              }

              const isPaymentSuccess =
                booking.status === "Paid" ||
                (booking.payment_status || "").toLowerCase() === "success";
              const paymentMethodText = booking.payment_method
                ? isPaymentSuccess
                  ? `${booking.payment_method} (Đã thanh toán)`
                  : booking.payment_method
                : isPaymentSuccess
                  ? "Đã thanh toán"
                  : "Chưa thanh toán";
              const ticketCodes = Array.isArray(booking.ticket_codes)
                ? booking.ticket_codes.filter(Boolean)
                : [];
              const qrPayload = booking.booking_code || ticketCodes[0] || "";

              const bookingLevelTicketCodes = qrPayload ? [qrPayload] : [];

              return {
                id: booking.id.toString(),
                bookingCode: booking.booking_code || "",
                movie: {
                  title: booking.movie_title,
                  poster: getImageUrl(booking.poster_url),
                  duration: booking.duration_minutes,
                  ageRating: booking.age_rating,
                },
                cinema: booking.cinema_name,
                room: booking.hall_name,
                date: bookingDate,
                time: bookingTime,
                seats: booking.seats ? booking.seats.split(", ") : [],
                concessions: booking.concessions || [],
                originalPrice: parseFloat(booking.total_price || "0"),
                discountAmount: parseFloat(booking.discount_amount || "0"),
                totalPrice: parseFloat(
                  booking.final_price || booking.total_price,
                ),
                status: status,
                paymentMethod: paymentMethodText,
                bookingDate: booking.created_at,
                ticketCodes: bookingLevelTicketCodes,
                qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`,
              };
            },
          );

        setBookings(mappedBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user, isAuthenticated, navigate, authChecked]);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.bookingCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "upcoming")
      return booking.status === "upcoming" && matchesSearch;
    if (activeTab === "completed")
      return booking.status === "completed" && matchesSearch;
    if (activeTab === "cancelled")
      return booking.status === "cancelled" && matchesSearch;
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Sắp chiếu";
      case "completed":
        return "Đã xem";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewTicket = (booking: BookingHistory) => {
    setSelectedBooking(booking);
    setSelectedTicketIndex(0);
    setShowTicketDialog(true);
  };

  const handleViewDetail = (booking: BookingHistory) => {
    setSelectedBooking(booking);
    setShowDetailDialog(true);
  };

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

  const buildExportTicketNode = (booking: BookingHistory): HTMLDivElement => {
    const root = document.createElement("div");
    root.style.width = "760px";
    root.style.padding = "28px";
    root.style.borderRadius = "24px";
    root.style.background = "linear-gradient(150deg, #061438, #0b2a66)";
    root.style.color = "#ffffff";
    root.style.fontFamily = "Segoe UI, Arial, sans-serif";
    root.style.boxSizing = "border-box";

    const poster = booking.movie.poster
      ? `<img src="${booking.movie.poster}" crossorigin="anonymous" style="width:100%;height:220px;object-fit:cover;border-radius:16px;opacity:.82;" />`
      : "";
    const qr = booking.qrCode
      ? `<img src="${booking.qrCode}" crossorigin="anonymous" style="width:200px;height:200px;background:#fff;border-radius:14px;padding:12px;" />`
      : "";

    const concessionsHtml = booking.concessions.length
      ? `<div style="margin-top:12px;font-size:20px;line-height:1.45;color:#d6ddf7;"><div style="font-weight:700;color:#fff;margin-bottom:4px;">Bắp nước</div>${booking.concessions
          .map(
            (item) =>
              `<div>${item.concession_name} x${item.quantity} - ${parseFloat(item.subtotal).toLocaleString("vi-VN")}đ</div>`,
          )
          .join("")}</div>`
      : "";

    root.innerHTML = `
      <div style="display:flex;gap:24px;align-items:flex-start;">
        <div style="flex:1;min-width:0;">
          ${poster}
          <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
            <div>
              <div style="font-size:40px;font-weight:800;line-height:1.2;">${booking.movie.title}</div>
              <div style="margin-top:6px;font-size:21px;color:#b9c6f5;">Mã booking: <span style="font-family:Consolas, monospace;color:#fff;font-weight:700;">${booking.bookingCode}</span></div>
            </div>
            <div style="padding:8px 14px;border-radius:999px;background:#19c37d22;border:1px solid #19c37d;font-weight:700;">VÉ HỢP LỆ</div>
          </div>

          <div style="margin-top:16px;padding-top:16px;border-top:1px dashed rgba(255,255,255,.28);display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;font-size:22px;line-height:1.4;">
            <div><span style="color:#9fb2ee;">Rạp:</span> ${booking.cinema}</div>
            <div><span style="color:#9fb2ee;">Phòng:</span> ${booking.room}</div>
            <div><span style="color:#9fb2ee;">Ngày chiếu:</span> ${formatDate(booking.date)}</div>
            <div><span style="color:#9fb2ee;">Suất chiếu:</span> ${booking.time}</div>
            <div style="grid-column:1 / -1;"><span style="color:#9fb2ee;">Ghế:</span> ${booking.seats.join(", ")}</div>
          </div>

          ${concessionsHtml}

          <div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.2);font-size:28px;font-weight:800;color:#ff7a1a;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:22px;color:#d7dff9;font-weight:600;">Tổng thanh toán</span>
            <span>${booking.totalPrice.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>
        <div style="width:220px;display:flex;justify-content:center;">
          ${qr}
        </div>
      </div>
    `;

    return root;
  };

  const handleDownloadTicket = async (booking: BookingHistory) => {
    if (isDownloadingTicket) return;

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.style.zIndex = "-1";

    const ticketNode = buildExportTicketNode(booking);
    container.appendChild(ticketNode);
    document.body.appendChild(container);

    try {
      setIsDownloadingTicket(true);
      await waitForImages(container);

      const canvas = await html2canvas(ticketNode, {
        scale: Math.min(4, Math.max(2.5, (window.devicePixelRatio || 1) * 2)),
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const imageData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imageData;
      link.download = `ve-${booking.bookingCode}.png`;
      link.click();
    } catch (error) {
      console.error("Failed to download ticket image:", error);
      toast({
        title: "Không thể tải vé",
        description: "Vui lòng thử lại sau ít phút.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingTicket(false);
      container.remove();
    }
  };

  const handleRebook = (booking: BookingHistory) => {
    navigate("/movies");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Lịch Sử Đặt Vé
          </h1>
          <p className="text-muted-foreground">
            Quản lý và xem lại các vé đã đặt
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã đặt vé hoặc tên phim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="upcoming">Sắp tới</TabsTrigger>
            <TabsTrigger value="completed">Đã xem</TabsTrigger>
            <TabsTrigger value="cancelled">Đã hủy</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">
                  Đang tải lịch sử đặt vé...
                </p>
              </div>
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Movie Poster */}
                      <div className="md:w-32 flex-shrink-0">
                        <img
                          src={booking.movie.poster}
                          alt={booking.movie.title}
                          className="w-full h-48 md:h-full object-cover"
                        />
                      </div>

                      {/* Booking Details */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold">
                                {booking.movie.title}
                              </h3>
                              <Badge
                                className={`${getStatusColor(booking.status)} text-white`}
                              >
                                {getStatusText(booking.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Mã đặt vé: {booking.bookingCode}
                            </p>
                          </div>
                          {booking.status === "upcoming" && booking.qrCode && (
                            <div className="flex flex-col items-center gap-2">
                              <img
                                src={booking.qrCode}
                                alt="QR Code"
                                className="w-20 h-20"
                              />
                              <span className="text-xs text-muted-foreground">
                                Quét vé
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {booking.cinema} - {booking.room}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {formatDate(booking.date)} - {booking.time}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Ticket className="w-4 h-4 text-muted-foreground" />
                              <span>Ghế: {booking.seats.join(", ")}</span>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-muted-foreground" />
                              <span>{booking.paymentMethod}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>
                                Đặt lúc: {formatDateTime(booking.bookingDate)}
                              </span>
                            </div>
                            <div className="font-bold text-primary text-lg">
                              {booking.totalPrice.toLocaleString("vi-VN")}đ
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          {booking.status === "upcoming" && (
                            <>
                              <Button
                                variant="default"
                                className="gap-2"
                                onClick={() => handleViewTicket(booking)}
                              >
                                <QrCode className="w-4 h-4" />
                                Xem vé
                              </Button>
                              <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => handleDownloadTicket(booking)}
                                disabled={isDownloadingTicket}
                              >
                                <Download className="w-4 h-4" />
                                {isDownloadingTicket ? "Đang tải..." : "Tải vé"}
                              </Button>
                            </>
                          )}
                          {booking.status === "completed" && (
                            <Button
                              variant="outline"
                              onClick={() => handleRebook(booking)}
                            >
                              Đặt lại
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            onClick={() => handleViewDetail(booking)}
                          >
                            Chi tiết
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20">
                <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  Chưa có đặt vé nào
                </h3>
                <p className="text-muted-foreground mb-6">
                  Bạn chưa có lịch sử đặt vé. Hãy đặt vé ngay!
                </p>
                <Button>Đặt vé ngay</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Ticket Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vé Điện Tử</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">
                  {selectedBooking.movie.title}
                </h3>
                <Badge
                  className={`${getStatusColor(selectedBooking.status)} text-white mb-4`}
                >
                  {getStatusText(selectedBooking.status)}
                </Badge>
              </div>

              {/* QR Code */}
              {(selectedBooking.qrCode ||
                selectedBooking.ticketCodes.length > 0) && (
                <div className="flex justify-center bg-white p-6 rounded-lg">
                  {selectedBooking.ticketCodes.length > 1 && (
                    <div className="w-full mb-4 flex flex-wrap gap-2 justify-center">
                      {selectedBooking.ticketCodes.map((_, index) => (
                        <Button
                          key={`ticket-${index}`}
                          size="sm"
                          variant={
                            selectedTicketIndex === index
                              ? "default"
                              : "outline"
                          }
                          onClick={() => setSelectedTicketIndex(index)}
                        >
                          Vé {index + 1}
                        </Button>
                      ))}
                    </div>
                  )}
                  <img
                    src={
                      selectedBooking.ticketCodes.length > 0
                        ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedBooking.ticketCodes[Math.min(selectedTicketIndex, selectedBooking.ticketCodes.length - 1)])}`
                        : selectedBooking.qrCode
                    }
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              )}

              {/* Booking Info */}
              <div className="space-y-2 text-sm bg-muted p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã đặt vé:</span>
                  <span className="font-mono font-bold">
                    {selectedBooking.bookingCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rạp:</span>
                  <span>{selectedBooking.cinema}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phòng:</span>
                  <span>{selectedBooking.room}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày:</span>
                  <span>{formatDate(selectedBooking.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giờ:</span>
                  <span>{selectedBooking.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ghế:</span>
                  <span>{selectedBooking.seats.join(", ")}</span>
                </div>
                {selectedBooking.concessions &&
                  selectedBooking.concessions.length > 0 && (
                    <div className="pt-2 border-t">
                      <span className="text-muted-foreground block mb-1">
                        Bắp nước:
                      </span>
                      {selectedBooking.concessions.map((item, index) => (
                        <div key={index} className="flex justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            {item.concession_name} x{item.quantity}
                          </span>
                          <span className="text-xs">
                            {parseFloat(item.subtotal).toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      ))}
                    </div>
                  )}{" "}
                {selectedBooking.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Tạm tính:</span>
                      <span>
                        {selectedBooking.originalPrice.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá:</span>
                      <span>
                        -
                        {selectedBooking.discountAmount.toLocaleString("vi-VN")}
                        đ
                      </span>
                    </div>
                  </>
                )}{" "}
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>Tổng tiền:</span>
                  <span className="text-primary">
                    {selectedBooking.totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => handleDownloadTicket(selectedBooking)}
                disabled={isDownloadingTicket}
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloadingTicket ? "Đang tải..." : "Tải vé"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi Tiết Đặt Vé</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Movie Info */}
              <div className="flex gap-4">
                <img
                  src={selectedBooking.movie.poster}
                  alt={selectedBooking.movie.title}
                  className="w-24 h-36 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    {selectedBooking.movie.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary text-primary-foreground">
                      {selectedBooking.movie.ageRating}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedBooking.movie.duration} phút
                    </span>
                  </div>
                  <Badge
                    className={`${getStatusColor(selectedBooking.status)} text-white`}
                  >
                    {getStatusText(selectedBooking.status)}
                  </Badge>
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Thông tin suất chiếu</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedBooking.cinema}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedBooking.room}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(selectedBooking.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedBooking.time}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Thông tin thanh toán</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mã đặt vé:</span>
                      <span className="font-mono">
                        {selectedBooking.bookingCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Phương thức:
                      </span>
                      <span>{selectedBooking.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Thời gian đặt:
                      </span>
                      <span>{formatDateTime(selectedBooking.bookingDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ghế:</span>
                      <span className="font-semibold">
                        {selectedBooking.seats.join(", ")}
                      </span>
                    </div>
                    {selectedBooking.concessions &&
                      selectedBooking.concessions.length > 0 && (
                        <div className="pt-2 border-t">
                          <span className="text-muted-foreground text-sm block mb-2">
                            Bắp nước:
                          </span>
                          {selectedBooking.concessions.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm mb-1"
                            >
                              <span className="text-muted-foreground">
                                {item.concession_name} x{item.quantity}
                              </span>
                              <span>
                                {parseFloat(item.subtotal).toLocaleString(
                                  "vi-VN",
                                )}
                                đ
                              </span>
                            </div>
                          ))}
                        </div>
                      )}{" "}
                    {selectedBooking.discountAmount > 0 && (
                      <>
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-muted-foreground">
                            Tạm tính:
                          </span>
                          <span>
                            {selectedBooking.originalPrice.toLocaleString(
                              "vi-VN",
                            )}
                            đ
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600 font-semibold">
                          <span>🎟️ Giảm giá:</span>
                          <span>
                            -
                            {selectedBooking.discountAmount.toLocaleString(
                              "vi-VN",
                            )}
                            đ
                          </span>
                        </div>
                      </>
                    )}{" "}
                    <div className="flex justify-between font-bold text-base pt-2 border-t">
                      <span>Tổng tiền:</span>
                      <span className="text-primary text-lg">
                        {selectedBooking.totalPrice.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                {selectedBooking.status === "upcoming" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetailDialog(false);
                        handleViewTicket(selectedBooking);
                      }}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Xem vé
                    </Button>
                    <Button
                      onClick={() => handleDownloadTicket(selectedBooking)}
                      disabled={isDownloadingTicket}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isDownloadingTicket ? "Đang tải..." : "Tải vé"}
                    </Button>
                  </>
                )}
                {selectedBooking.status === "completed" && (
                  <Button onClick={() => handleRebook(selectedBooking)}>
                    Đặt lại
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default BookingHistoryPage;
