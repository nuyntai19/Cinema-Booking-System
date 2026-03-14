import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clock, X, AlertCircle, Shield, Loader } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useAuth, useBooking } from "@/contexts/AppContext";
import {
  systemConfig,
} from "@/data/mockData";
import { Seat } from "@/types/cinema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  validateAge,
  validateCurfew,
  calculateShowtimeEnd,
  formatAgeRating,
  getAgeRatingColor,
} from "@/lib/validation";
import AgeWarningDialog from "@/components/booking/AgeWarningDialog";
import CurfewWarningDialog from "@/components/booking/CurfewWarningDialog";
import { Badge } from "@/components/ui/badge";
import { API_ENDPOINTS, apiCall } from "@/lib/api";
import { BookingService } from "@/services/booking.service";

interface SeatFromAPI {
  id: number;
  row_code: string;
  number: number;
  seat_type: string;
  price_multiplier: number;
  status: string;
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
  seat_map: {
    [key: string]: SeatFromAPI[];
  };
  summary: {
    total_seats: number;
    available: number;
    holding: number;
    sold: number;
    maintenance: number;
  };
}

const SeatSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    selectedMovie,
    selectedShowtime,
    selectedSeats,
    addSeat,
    removeSeat,
    clearBooking,
    setSelectedMovie,
    setSelectedShowtime,
  } = useBooking();

  const [seatMap, setSeatMap] = useState<Seat[][]>([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [ageWarningOpen, setAgeWarningOpen] = useState(false);
  const [curfewWarningOpen, setCurfewWarningOpen] = useState(false);
  const [ageValidation, setAgeValidation] = useState<any>(null);
  const [curfewValidation, setCurfewValidation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [movie, setMovie] = useState<any>(null);

  // Initialize from query params if context is empty
  useEffect(() => {
    const movieParam = searchParams.get("movie");
    const showtimeParam = searchParams.get("showtime");

    if (movieParam && !selectedMovie) {
      setSelectedMovie(movieParam);
    }

    if (showtimeParam && !selectedShowtime) {
      // We don't have the full showtime object yet, but we'll fetch its data
      // For now, minimal object to satisfy the context check
      setSelectedShowtime({ id: showtimeParam } as any);
    }
  }, [searchParams, selectedMovie, selectedShowtime, setSelectedMovie, setSelectedShowtime]);

  // Fetch movie data from API
  useEffect(() => {
    const movieId = selectedMovie || searchParams.get("movie");
    if (!movieId) return;

    const fetchMovie = async () => {
      try {
        const response = await apiCall<{ success: boolean; data: { movie: any } }>(
          API_ENDPOINTS.MOVIE_DETAIL(parseInt(movieId))
        );
        if (response.success && response.data?.movie) {
          const m = response.data.movie;
          setMovie({
            id: String(m.id),
            title: m.title,
            poster: m.poster_url ? `${API_ENDPOINTS.MOVIES.replace('/api/movies', '')}/uploads/posters/${m.poster_url}` : '',
            duration: m.duration || m.duration_minutes,
            ageRating: m.age_rating || 'P',
          });
        }
      } catch (error) {
        console.error('Failed to fetch movie:', error);
      }
    };
    fetchMovie();
  }, [selectedMovie, searchParams]);

  // Convert API response to component format
  const convertSeatMap = (apiResponse: SeatMapResponse): Seat[][] => {
    const rows = Object.keys(apiResponse.seat_map).sort();
    return rows.map((rowCode) => {
      return apiResponse.seat_map[rowCode].map((seat) => {
        const seatTypeLower = seat.seat_type.toLowerCase();
        let type: 'standard' | 'vip' | 'couple' = 'standard';
        if (seatTypeLower === 'vip') type = 'vip';
        else if (seatTypeLower === 'sweetbox' || seatTypeLower === 'couple') type = 'couple';

        return ({
          // Use DB seat id for booking API; render row/number for display.
          id: String(seat.id),
          row: seat.row_code,
          number: seat.number,
          type,
          status: seat.status === 'Available' ? 'available' :
            seat.status === 'HOLDING' ? 'held' :
              seat.status === 'SOLD' ? 'sold' :
                seat.status === 'Maintenance' ? 'maintenance' : 'available',
          price: Number(seat.calculated_price) || 0,
        });
      });
    });
  };

  useEffect(() => {
    const movieId = selectedMovie || searchParams.get("movie");
    const showtimeId = selectedShowtime?.id || searchParams.get("showtime");

    if (!movieId || !showtimeId) {
      // Only redirect if both are missing after initialization
      const timer = setTimeout(() => {
        if (!selectedMovie && !searchParams.get("movie")) {
          navigate("/");
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    const fetchSeatMap = async () => {
      try {
        setLoading(true);
        const response = await apiCall<{ success: boolean; data: SeatMapResponse }>(
          API_ENDPOINTS.SHOWTIME_SEAT_MAP(parseInt(showtimeId))
        );

        const seatMapData = response.data || response as unknown as SeatMapResponse;

        // If we initialized from query params, update the showtime object in context with real data
        if (seatMapData.showtime && (!selectedShowtime || !selectedShowtime.start_time)) {
          setSelectedShowtime({
            id: String(seatMapData.showtime.id),
            time: new Date(seatMapData.showtime.start_time).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            date: seatMapData.showtime.start_time.split(' ')[0],
            start_time: seatMapData.showtime.start_time,
            hall: seatMapData.showtime.hall_name,
            cinema: seatMapData.showtime.cinema_name,
          } as any);
        }

        const convertedSeatMap = convertSeatMap(seatMapData);
        setSeatMap(convertedSeatMap);
      } catch (error) {
        console.error("Failed to fetch seat map:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải sơ đồ ghế. Vui lòng thử lại.",
          variant: "destructive",
        });
        navigate("/schedule");
      } finally {
        setLoading(false);
      }
    };

    fetchSeatMap();
  }, [selectedMovie, selectedShowtime, searchParams, navigate, toast, setSelectedShowtime]);

  // Track whether pending booking has been synced to avoid re-syncing on every render
  const hasSyncedPendingBooking = useRef(false);
  // Track seat IDs that belong to the user's own pending booking
  const pendingBookingSeatIds = useRef<Set<string>>(new Set());

  // if user has an active booking for this showtime, sync seats once
  useEffect(() => {
    const showtimeId = selectedShowtime?.id || searchParams.get("showtime");
    const userId = user?.id;
    if (!showtimeId || !userId) return;
    if (hasSyncedPendingBooking.current) return;

    let isCancelled = false;

    const syncPendingBookingSeats = async () => {
      try {
        const hasPendingBooking = await BookingService.checkBookingPending(userId, showtimeId);
        if (!hasPendingBooking || isCancelled) return;

        const booking = await BookingService.getBookingByUserAndShowtime(userId, showtimeId);
        const seatOfBooking = booking.data?.seats || [];

        const seatIds = new Set<string>();

        seatOfBooking.forEach((seat) => {
          const seatTypeLower = seat.seat_type.toLowerCase();
          let type: "standard" | "vip" | "couple" = "standard";
          if (seatTypeLower === "vip") type = "vip";
          else if (seatTypeLower === "sweetbox" || seatTypeLower === "couple") type = "couple";

          const seatId = String(seat.id);
          seatIds.add(seatId);
          removeSeat(seatId);

          addSeat({
            id: seatId,
            row: seat.row_number,
            number: Number(seat.seat_number) || 0,
            type,
            status: "selected" as const,
            price: Number(seat.price) || 0,
          });
        });

        if (!isCancelled) {
          pendingBookingSeatIds.current = seatIds;
          hasSyncedPendingBooking.current = true;

          // Update seatMap: change user's own held seats to "available" so toggle works visually
          setSeatMap(prev => prev.map(row =>
            row.map(s => seatIds.has(s.id) ? { ...s, status: "available" as const } : s)
          ));
        }
      } catch (error) {
        console.error("Failed to sync pending booking seats:", error);
      }
    };

    void syncPendingBookingSeats();

    return () => {
      isCancelled = true;
    };
  }, [selectedShowtime, searchParams, user, addSeat, removeSeat]);


  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: "Hết thời gian giữ ghế",
            description: "Vui lòng chọn lại ghế để tiếp tục",
            variant: "destructive",
          });
          clearBooking();
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [clearBooking, navigate, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeatClick = (seat: Seat | Seat[]) => {
    const seats = Array.isArray(seat) ? seat : [seat];

    // Check if any of the seats are already selected (e.g., synced from pending booking)
    const anySelected = seats.some(s => selectedSeats.find((ss) => ss.id === s.id));

    // If selected → allow deselect
    if (anySelected) {
      seats.forEach(s => removeSeat(s.id));
      return;
    }

    // Block sold/maintenance seats
    if (seats.some(s => s.status === "sold" || s.status === "maintenance")) return;

    // Block held seats (from other users)
    if (seats.some(s => s.status === "held")) return;

    // Add available seat
    seats.forEach(s => addSeat({ ...s, status: "selected" }));
  };

  const getSeatClass = (seat: Seat | Seat[]) => {
    const seats = Array.isArray(seat) ? seat : [seat];
    const isMerged = Array.isArray(seat);
    const isSelected = seats.some(s => selectedSeats.find((ss) => ss.id === s.id));

    if (isSelected) return cn("seat seat-selected", isMerged && "seat-couple-merged");
    if (seats.some(s => s.status === "sold")) return cn("seat seat-sold", isMerged && "seat-couple-merged");
    if (seats.some(s => s.status === "held")) return cn("seat seat-held", isMerged && "seat-couple-merged");
    if (seats.some(s => s.status === "maintenance")) return cn("seat seat-maintenance", isMerged && "seat-couple-merged");
    if (seats.some(s => s.type === "vip")) return cn("seat seat-vip seat-available", isMerged && "seat-couple-merged");
    if (seats.some(s => s.type === "couple")) return cn("seat seat-couple seat-available", isMerged && "seat-couple-merged");
    return cn("seat seat-available", isMerged && "seat-couple-merged");
  };

  const groupSeats = (row: Seat[]) => {
    const grouped: (Seat | Seat[])[] = [];
    for (let i = 0; i < row.length; i++) {
      const current = row[i];
      const next = row[i + 1];

      if (current.type === 'couple' && next && next.type === 'couple') {
        grouped.push([current, next]);
        i++; // skip next
      } else {
        grouped.push(current);
      }
    }
    return grouped;
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const formatSeatCode = (seat: Seat) => `${seat.row}${seat.number}`;

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "Vui lòng chọn ghế",
        description: "Bạn cần chọn ít nhất 1 ghế để tiếp tục",
        variant: "destructive",
      });
      return;
    }

    // Check age validation
    if (movie && user?.dob) {
      const ageCheck = validateAge(user.dob, movie.ageRating);
      if (!ageCheck.isValid) {
        setAgeValidation(ageCheck);
        setAgeWarningOpen(true);
        return;
      }
    }

    // Check curfew validation
    if (movie && selectedShowtime && user?.dob) {
      const showtimeEnd = calculateShowtimeEnd(
        selectedShowtime.date,
        selectedShowtime.time,
        movie.duration,
        systemConfig.defaultCleanupDuration,
      );
      const curfewCheck = validateCurfew(user.dob, showtimeEnd, systemConfig);
      if (!curfewCheck.isValid) {
        setCurfewValidation(curfewCheck);
        setCurfewWarningOpen(true);
        return;
      }
    }

    navigate("/booking/concessions");
  };

  if (!movie || !selectedShowtime) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Đang tải sơ đồ ghế...</p>
          </div>
        </main>
      </div>
    );
  }

  if (seatMap.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-muted-foreground mb-4">Không thể tải sơ đồ ghế</p>
            <Button onClick={() => navigate("/schedule")}>
              Quay lại
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-2 md:px-4 py-4 md:py-6">
        {/* Movie Info & Timer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 mb-4 md:mb-6 p-3 md:p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3 md:gap-4">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-10 h-15 md:w-12 md:h-18 object-cover rounded-lg"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-bold text-base md:text-lg">
                  {movie.title}
                </h1>
                <Badge
                  className={`${getAgeRatingColor(movie.ageRating)} text-white text-xs`}
                >
                  {movie.ageRating}
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                {selectedShowtime.time} •{" "}
                {new Date(selectedShowtime.date).toLocaleDateString("vi-VN")}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Shield className="w-3 h-3" />
                {formatAgeRating(movie.ageRating)}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-mono text-base md:text-lg font-bold",
              timeLeft <= 60
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary",
            )}
          >
            <Clock className="w-4 h-4 md:w-5 md:h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,300px] gap-4 md:gap-6">
          {/* Seat Map */}
          <div className="bg-card rounded-xl border border-border p-3 md:p-6">
            {/* Screen */}
            <div className="relative mb-6 md:mb-8">
              <div className="w-4/5 mx-auto h-1.5 md:h-2 bg-gradient-to-b from-primary/50 to-transparent rounded-t-full" />
              <div className="w-3/5 mx-auto py-1.5 md:py-2 text-center text-xs md:text-sm text-muted-foreground bg-gradient-to-b from-muted to-transparent rounded-b-lg">
                MÀN HÌNH
              </div>
            </div>

            {/* Seats */}
            <div className="flex flex-col items-center gap-1.5 md:gap-2 overflow-x-auto pb-4">
              {seatMap.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex items-center gap-1.5 md:gap-2"
                >
                  <span className="w-5 md:w-6 text-center text-xs md:text-sm font-medium text-muted-foreground">
                    {row[0]?.row}
                  </span>
                  <div className="flex gap-0.5 md:gap-1">
                    {groupSeats(row).map((seat, seatIdx) => {
                      const isMerged = Array.isArray(seat);
                      const seats = isMerged ? seat : [seat];
                      const firstSeat = seats[0];
                      const isSold = seats.some(s => s.status === "sold");
                      const isMaintenance = seats.some(s => s.status === "maintenance");
                      const isHeld = seats.some(s => s.status === "held");
                      const isInSelectedSeats = seats.some(s => selectedSeats.find(ss => ss.id === s.id));
                      const seatNumbers = isMerged ? `${seats[0].number}-${seats[1].number}` : firstSeat.number;
                      const seatIds = isMerged ? `${seats[0].id},${seats[1].id}` : firstSeat.id;
                      const price = isMerged ? seats[0].price + seats[1].price : firstSeat.price;

                      // Disable only if: sold, maintenance, or held by OTHER user (not in our selectedSeats)
                      const isDisabled = isSold || isMaintenance || (isHeld && !isInSelectedSeats);

                      return (
                        <button
                          key={isMerged ? `merged-${seats[0].id}` : firstSeat.id}
                          onClick={() => handleSeatClick(seat)}
                          className={cn(
                            getSeatClass(seat),
                            !isMerged && "w-6 md:w-8",
                            "text-[10px] md:text-xs",
                          )}
                          title={isMaintenance ? "Khu vực không ngồi" : `${seatIds} - ${price.toLocaleString("vi-VN")}đ`}
                        >
                          {isSold ? (
                            <X className="w-2 h-2 md:w-3 md:h-3" />
                          ) : isMaintenance ? null : (
                            seatNumbers
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <span className="w-5 md:w-6 text-center text-xs md:text-sm font-medium text-muted-foreground">
                    {row[0]?.row}
                  </span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-border">
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="seat seat-available w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xs md:text-sm">Trống</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="seat seat-selected w-6 h-6" />
                <span className="text-sm">Đang chọn</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="seat seat-held w-6 h-6" />
                <span className="text-sm">Đang giữ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="seat seat-sold w-6 h-6">
                  <X className="w-3 h-3" />
                </div>
                <span className="text-sm">Đã bán</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="seat seat-vip seat-available w-6 h-6" />
                <span className="text-sm">VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="seat seat-couple seat-available seat-couple-merged !w-12 !h-5" />
                <span className="text-sm">Couple</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-xl border border-border p-6 h-fit sticky top-20">
            <h2 className="font-bold text-lg mb-4">Chi Tiết Đặt Vé</h2>

            {selectedSeats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Chưa chọn ghế nào</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {selectedSeats.map((seat) => (
                    <div
                      key={seat.id}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            seat.type === "vip"
                              ? "bg-purple-100 text-purple-700"
                              : seat.type === "couple"
                                ? "bg-pink-100 text-pink-700"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {seat.type.toUpperCase()}
                        </span>
                        <span className="font-medium">{formatSeatCode(seat)}</span>
                      </div>
                      <span>{seat.price.toLocaleString("vi-VN")}đ</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 mb-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Tạm tính</span>
                    <span className="text-primary">
                      {totalPrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              </>
            )}

            <Button
              onClick={handleContinue}
              disabled={selectedSeats.length === 0}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Tiếp Tục
            </Button>
          </div>
        </div>
      </main>

      {/* Age Warning Dialog */}
      {ageValidation && (
        <AgeWarningDialog
          open={ageWarningOpen}
          onOpenChange={setAgeWarningOpen}
          userAge={ageValidation.userAge}
          requiredAge={ageValidation.requiredAge}
          message={ageValidation.message || ""}
        />
      )}

      {/* Curfew Warning Dialog */}
      {curfewValidation && (
        <CurfewWarningDialog
          open={curfewWarningOpen}
          onOpenChange={setCurfewWarningOpen}
          userAge={curfewValidation.userAge}
          showtimeEnd={curfewValidation.showtimeEnd}
          curfewTime={curfewValidation.curfewTime}
          message={curfewValidation.message || ""}
        />
      )}
    </div>
  );
};

export default SeatSelectionPage;
