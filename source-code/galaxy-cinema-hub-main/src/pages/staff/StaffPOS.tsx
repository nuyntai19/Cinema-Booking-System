import React, { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CreditCard,
  Ticket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Seat {
  id: string;
  row: string;
  number: number;
  type: "standard" | "vip" | "couple";
  status: "available" | "selected" | "held" | "sold";
  price: number;
}

interface Showtime {
  id: string;
  movieTitle: string;
  time: string;
  room: string;
  format: string;
  ageRating: string;
}

const StaffPOS: React.FC = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState("2026-01-25");
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(
    null,
  );
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Mock data
  const showtimes: Showtime[] = [
    {
      id: "1",
      movieTitle: "MAI",
      time: "10:00",
      room: "Phòng 1",
      format: "2D",
      ageRating: "T16",
    },
    {
      id: "2",
      movieTitle: "MAI",
      time: "14:30",
      room: "Phòng 1",
      format: "2D",
      ageRating: "T16",
    },
    {
      id: "3",
      movieTitle: "Kung Fu Panda 4",
      time: "11:00",
      room: "Phòng 2",
      format: "3D",
      ageRating: "P",
    },
    {
      id: "4",
      movieTitle: "Dune: Part Two",
      time: "16:00",
      room: "Phòng 3 - IMAX",
      format: "IMAX",
      ageRating: "T13",
    },
    {
      id: "5",
      movieTitle: "Đào, Phở và Piano",
      time: "19:30",
      room: "Phòng 2",
      format: "2D",
      ageRating: "T13",
    },
  ];

  const generateSeats = (): Seat[] => {
    const rows = ["A", "B", "C", "D", "E", "F", "G"];
    const seats: Seat[] = [];

    rows.forEach((row, rowIndex) => {
      for (let num = 1; num <= 10; num++) {
        let type: "standard" | "vip" | "couple" = "standard";
        let status: "available" | "held" | "sold" = "available";
        let price = 90000;

        // VIP rows (E, F, G)
        if (rowIndex >= 4) {
          type = "vip";
          price = 120000;
        }

        // Couple seats (center seats in row G)
        if (row === "G" && num >= 4 && num <= 7) {
          type = "couple";
          price = 150000;
        }

        // Simulate some held seats (online bookings)
        if (
          (row === "D" && [3, 4, 5].includes(num)) ||
          (row === "F" && [7, 8].includes(num))
        ) {
          status = "held";
        }

        // Simulate some sold seats
        if (
          (row === "B" && [5, 6].includes(num)) ||
          (row === "C" && num === 3)
        ) {
          status = "sold";
        }

        seats.push({
          id: `${row}${num}`,
          row,
          number: num,
          type,
          status,
          price,
        });
      }
    });

    return seats;
  };

  const [seats] = useState<Seat[]>(generateSeats());

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "sold" || seat.status === "held") return;

    const isSelected = selectedSeats.find((s) => s.id === seat.id);
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleSelectShowtime = (showtimeId: string) => {
    const showtime = showtimes.find((s) => s.id === showtimeId);
    setSelectedShowtime(showtime || null);
    setSelectedSeats([]);
  };

  const handleCompleteSale = () => {
    if (!selectedShowtime) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn suất chiếu",
        variant: "destructive",
      });
      return;
    }

    if (selectedSeats.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ghế",
        variant: "destructive",
      });
      return;
    }

    if (!customerPhone) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số điện thoại khách hàng",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Thanh toán thành công",
      description: `Đã bán ${selectedSeats.length} vé - Tổng: ${totalAmount.toLocaleString("vi-VN")}đ`,
    });

    // Reset form
    setSelectedSeats([]);
    setCustomerPhone("");
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const getSeatClass = (seat: Seat) => {
    const isSelected = selectedSeats.find((s) => s.id === seat.id);

    const baseClass =
      "w-8 h-8 rounded text-xs font-medium transition-all cursor-pointer hover:scale-110";

    if (seat.status === "sold") {
      return `${baseClass} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }

    if (seat.status === "held") {
      return `${baseClass} bg-yellow-400 text-yellow-900 cursor-not-allowed`;
    }

    if (isSelected) {
      return `${baseClass} bg-primary text-primary-foreground shadow-lg`;
    }

    if (seat.type === "vip") {
      return `${baseClass} bg-blue-100 text-blue-700 hover:bg-blue-200`;
    }

    if (seat.type === "couple") {
      return `${baseClass} bg-pink-100 text-pink-700 hover:bg-pink-200`;
    }

    return `${baseClass} bg-white border-2 border-gray-300 text-gray-700 hover:border-primary`;
  };

  const getRatingBadge = (rating: string) => {
    const configs: Record<string, { color: string }> = {
      P: { color: "bg-green-500" },
      T13: { color: "bg-blue-500" },
      T16: { color: "bg-yellow-500" },
      T18: { color: "bg-red-500" },
    };
    const config = configs[rating] || configs.P;
    return <Badge className={`${config.color} text-white`}>{rating}</Badge>;
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Left Panel - Showtimes */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Suất Chiếu Hôm Nay
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

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {showtimes.map((showtime) => (
                <div
                  key={showtime.id}
                  onClick={() => handleSelectShowtime(showtime.id)}
                  className={cn(
                    "p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                    selectedShowtime?.id === showtime.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/50",
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg">{showtime.movieTitle}</h3>
                    {getRatingBadge(showtime.ageRating)}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-bold text-primary">
                        {showtime.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {showtime.room} - {showtime.format}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Seat Map & Checkout */}
      <div className="lg:col-span-3 space-y-4">
        {/* Seat Map */}
        <Card>
          <CardHeader>
            <CardTitle>Chọn Ghế</CardTitle>
            {selectedShowtime && (
              <p className="text-sm text-muted-foreground">
                {selectedShowtime.movieTitle} - {selectedShowtime.time} -{" "}
                {selectedShowtime.room}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {!selectedShowtime ? (
              <div className="text-center py-12 text-muted-foreground">
                <Ticket className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Vui lòng chọn suất chiếu bên trái</p>
              </div>
            ) : (
              <div>
                {/* Screen */}
                <div className="mb-8">
                  <div className="bg-gradient-to-b from-gray-300 to-gray-400 h-2 rounded-t-3xl mx-8 mb-2" />
                  <p className="text-center text-sm text-muted-foreground">
                    MÀN HÌNH
                  </p>
                </div>

                {/* Seat Grid */}
                <div className="space-y-2 mb-6">
                  {["A", "B", "C", "D", "E", "F", "G"].map((row) => (
                    <div
                      key={row}
                      className="flex items-center gap-2 justify-center"
                    >
                      <span className="w-6 text-center font-bold text-sm text-muted-foreground">
                        {row}
                      </span>
                      {seats
                        .filter((seat) => seat.row === row)
                        .map((seat) => (
                          <button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat)}
                            disabled={
                              seat.status === "sold" || seat.status === "held"
                            }
                            className={getSeatClass(seat)}
                            title={`${seat.id} - ${seat.type} - ${seat.price.toLocaleString()}đ - ${seat.status}`}
                          >
                            {seat.number}
                          </button>
                        ))}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 justify-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded" />
                    <span>Trống</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded" />
                    <span>Đang chọn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-400 rounded" />
                    <span>Đang giữ (Online)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-300 rounded" />
                    <span>Đã bán</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300 rounded" />
                    <span>VIP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-pink-100 border-2 border-pink-300 rounded" />
                    <span>Đôi</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checkout */}
        <Card>
          <CardHeader>
            <CardTitle>Thanh Toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Số điện thoại khách hàng
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nhập số điện thoại..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Phương thức thanh toán
              </label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="card">Thẻ tín dụng</SelectItem>
                  <SelectItem value="transfer">Chuyển khoản</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Selected Seats Summary */}
            {selectedSeats.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Ghế đã chọn:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((seat) => (
                    <Badge
                      key={seat.id}
                      variant="secondary"
                      className="text-sm"
                    >
                      {seat.id} ({seat.price.toLocaleString("vi-VN")}đ)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-lg font-bold pt-4 border-t">
              <span>Tổng cộng:</span>
              <span className="text-primary">
                {totalAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>

            <Button
              onClick={handleCompleteSale}
              className="w-full"
              size="lg"
              disabled={selectedSeats.length === 0 || !customerPhone}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Hoàn Tất Thanh Toán
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffPOS;
