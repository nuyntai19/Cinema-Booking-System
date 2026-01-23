import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  totalPrice: number;
  status: "completed" | "upcoming" | "cancelled";
  paymentMethod: string;
  bookingDate: string;
  qrCode?: string;
}

const BookingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<BookingHistory | null>(
    null,
  );
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const bookings: BookingHistory[] = [
    {
      id: "booking-1",
      bookingCode: "GC2026012301",
      movie: {
        title: "MAI",
        poster:
          "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
        duration: 131,
        ageRating: "T18",
      },
      cinema: "Galaxy Nguyễn Du",
      room: "Phòng 3",
      date: "2026-01-25",
      time: "19:00",
      seats: ["G7", "G8"],
      totalPrice: 240000,
      status: "upcoming",
      paymentMethod: "Momo",
      bookingDate: "2026-01-23T10:30:00",
      qrCode:
        "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GC2026012301",
    },
    {
      id: "booking-2",
      bookingCode: "GC2026012002",
      movie: {
        title: "Kung Fu Panda 4",
        poster:
          "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&h=600&fit=crop",
        duration: 94,
        ageRating: "P",
      },
      cinema: "Galaxy Tân Bình",
      room: "Phòng 1",
      date: "2026-01-20",
      time: "14:00",
      seats: ["E5", "E6"],
      totalPrice: 180000,
      status: "completed",
      paymentMethod: "Thẻ tín dụng",
      bookingDate: "2026-01-18T15:20:00",
    },
    {
      id: "booking-3",
      bookingCode: "GC2026011503",
      movie: {
        title: "Dune: Part Two",
        poster:
          "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=400&h=600&fit=crop",
        duration: 166,
        ageRating: "T16",
      },
      cinema: "Galaxy Quang Trung",
      room: "IMAX",
      date: "2026-01-15",
      time: "20:30",
      seats: ["F7", "F8", "F9"],
      totalPrice: 360000,
      status: "completed",
      paymentMethod: "Momo",
      bookingDate: "2026-01-14T09:15:00",
    },
    {
      id: "booking-4",
      bookingCode: "GC2026010804",
      movie: {
        title: "Đào, Phở và Piano",
        poster:
          "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=400&h=600&fit=crop",
        duration: 95,
        ageRating: "T13",
      },
      cinema: "Galaxy Nguyễn Du",
      room: "Phòng 2",
      date: "2026-01-10",
      time: "16:30",
      seats: ["D4", "D5"],
      totalPrice: 180000,
      status: "cancelled",
      paymentMethod: "Thẻ tín dụng",
      bookingDate: "2026-01-08T11:45:00",
    },
  ];

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
    setShowTicketDialog(true);
  };

  const handleViewDetail = (booking: BookingHistory) => {
    setSelectedBooking(booking);
    setShowDetailDialog(true);
  };

  const handleDownloadTicket = (booking: BookingHistory) => {
    // Simulate download
    const link = document.createElement("a");
    link.href = booking.qrCode || "";
    link.download = `ticket-${booking.bookingCode}.png`;
    link.click();
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
            {filteredBookings.length > 0 ? (
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
                              >
                                <Download className="w-4 h-4" />
                                Tải vé
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
              {selectedBooking.qrCode && (
                <div className="flex justify-center bg-white p-6 rounded-lg">
                  <img
                    src={selectedBooking.qrCode}
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
              >
                <Download className="w-4 h-4 mr-2" />
                Tải vé
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
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Tải vé
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
