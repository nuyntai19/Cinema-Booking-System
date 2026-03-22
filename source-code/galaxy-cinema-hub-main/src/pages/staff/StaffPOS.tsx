import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, MapPin, CreditCard, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS, apiCall } from "@/lib/api";
import { useAuth } from "@/contexts/AppContext";

type SeatStatus = "Available" | "HOLDING" | "SOLD" | "USED" | "REFUNDED" | "Maintenance";

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
  const [selectedShowtime, setSelectedShowtime] = useState<ApiShowtime | null>(null);

  const [seatMap, setSeatMap] = useState<Record<string, ApiSeat[]>>({});
  const [loadingSeatMap, setLoadingSeatMap] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedSeats = useMemo(() => {
    const allSeats = Object.values(seatMap).flat();
    return allSeats.filter((seat) => selectedSeatIds.includes(seat.id));
  }, [seatMap, selectedSeatIds]);

  const totalAmount = useMemo(
    () => selectedSeats.reduce((sum, seat) => sum + Number(seat.calculated_price || 0), 0),
    [selectedSeats],
  );

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

  const loadSeatMap = async (showtime: ApiShowtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeatIds([]);
    setLoadingSeatMap(true);

    try {
      const response = await apiCall<{ success: boolean; data: SeatMapResponse }>(
        API_ENDPOINTS.SHOWTIME_SEAT_MAP(showtime.id),
      );

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
  };

  const toggleSeat = (seat: ApiSeat) => {
    if (seat.status !== "Available") return;

    setSelectedSeatIds((prev) =>
      prev.includes(seat.id) ? prev.filter((id) => id !== seat.id) : [...prev, seat.id],
    );
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

    if (!user?.id) {
      toast({
        title: "Chưa xác định tài khoản",
        description: "Không lấy được tài khoản đăng nhập hiện tại.",
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
          user_id: Number(user.id),
          showtime_id: selectedShowtime.id,
          seat_ids: selectedSeatIds,
        }),
      });

      const bookingId = createResponse.data?.booking_id;
      if (!bookingId) {
        throw new Error("Không lấy được booking_id sau khi tạo đơn");
      }

      await apiCall(API_ENDPOINTS.CONFIRM_BOOKING(bookingId), {
        method: "PUT",
      });

      toast({
        title: "Bán vé thành công",
        description: `Đã xác nhận đơn ${createResponse.data?.booking_code || `#${bookingId}`}. Khách có thể vào lịch sử để lấy mã vé QR.`,
      });

      setCustomerPhone("");
      setSelectedSeatIds([]);
      await loadSeatMap(selectedShowtime);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể hoàn tất bán vé";
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
    if (String(seat.seat_type).toLowerCase().includes("sweet") || String(seat.seat_type).toLowerCase().includes("couple")) {
      return `${baseClass} bg-pink-100 text-pink-700 hover:bg-pink-200`;
    }
    return `${baseClass} bg-white border-2 border-gray-300 text-gray-700 hover:border-primary`;
  };

  const sortedRows = Object.keys(seatMap).sort();

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

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {loadingShowtimes && <p className="text-sm text-muted-foreground">Đang tải suất chiếu...</p>}

              {!loadingShowtimes && showtimes.length === 0 && (
                <p className="text-sm text-muted-foreground">Không có suất chiếu nào trong ngày đã chọn.</p>
              )}

              {showtimes.map((showtime) => {
                const start = new Date(showtime.start_time.replace(" ", "T"));
                const timeText = start.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={showtime.id}
                    onClick={() => void loadSeatMap(showtime)}
                    className={cn(
                      "p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                      selectedShowtime?.id === showtime.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-primary/50",
                    )}
                  >
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div>
                        <p className="font-semibold line-clamp-1">{showtime.movie_title}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">
                            {showtime.cinema_name} - {showtime.hall_name}
                          </span>
                        </div>
                      </div>
                      <Badge>{timeText}</Badge>
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
              <div className="text-center py-12 text-muted-foreground">Đang tải sơ đồ ghế...</div>
            ) : !selectedShowtime ? (
              <div className="text-center py-12 text-muted-foreground">Chọn suất chiếu để hiển thị ghế trống</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg px-8 py-2 text-sm font-medium text-gray-700">
                    MÀN HÌNH
                  </div>
                </div>

                <div className="space-y-2 overflow-x-auto">
                  {sortedRows.map((row) => (
                    <div key={row} className="flex items-center gap-2 min-w-max">
                      <span className="w-6 text-center text-sm font-medium">{row}</span>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Số điện thoại khách hàng (tuỳ chọn)</label>
              <Input
                placeholder="090xxxxxxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Số ghế đã chọn</span>
                <span>{selectedSeats.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Danh sách ghế</span>
                <span>{selectedSeats.map((s) => `${s.row_code}${s.number}`).join(", ") || "-"}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Tổng cộng</span>
                <span className="text-primary">{totalAmount.toLocaleString("vi-VN")}đ</span>
              </div>
            </div>

            <Button
              className="w-full h-12"
              disabled={submitting || !selectedShowtime || selectedSeatIds.length === 0}
              onClick={() => void handleCompleteSale()}
            >
              {submitting ? "Đang xử lý..." : "Xác nhận bán vé"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Hệ thống sẽ tạo booking thực và xác nhận thanh toán ngay. Tài khoản khách đang được ghi nhận theo user hiện đăng nhập.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffPOS;
