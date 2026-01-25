import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, X, AlertCircle, Shield } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useAuth, useBooking } from "@/contexts/AppContext";
import {
  movies,
  cinemas,
  generateSeatMap,
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

const SeatSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    selectedMovie,
    selectedShowtime,
    selectedSeats,
    addSeat,
    removeSeat,
    clearBooking,
  } = useBooking();

  const [seatMap, setSeatMap] = useState<Seat[][]>([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [ageWarningOpen, setAgeWarningOpen] = useState(false);
  const [curfewWarningOpen, setCurfewWarningOpen] = useState(false);
  const [ageValidation, setAgeValidation] = useState<any>(null);
  const [curfewValidation, setCurfewValidation] = useState<any>(null);

  const movie = movies.find((m) => m.id === selectedMovie);

  useEffect(() => {
    if (!selectedMovie || !selectedShowtime) {
      navigate("/");
      return;
    }
    setSeatMap(generateSeatMap(8, 12));
  }, [selectedMovie, selectedShowtime, navigate]);

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

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "sold" || seat.status === "held") return;

    const isSelected = selectedSeats.find((s) => s.id === seat.id);
    if (isSelected) {
      removeSeat(seat.id);
    } else {
      addSeat({ ...seat, status: "selected" });
    }
  };

  const getSeatClass = (seat: Seat) => {
    const isSelected = selectedSeats.find((s) => s.id === seat.id);

    if (isSelected) return "seat seat-selected";
    if (seat.status === "sold") return "seat seat-sold";
    if (seat.status === "held") return "seat seat-held";
    if (seat.type === "vip") return "seat seat-vip seat-available";
    if (seat.type === "couple") return "seat seat-couple seat-available";
    return "seat seat-available";
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

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
                    {row.map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat)}
                        disabled={
                          seat.status === "sold" || seat.status === "held"
                        }
                        className={cn(
                          getSeatClass(seat),
                          seat.type === "couple"
                            ? "w-12 md:w-16"
                            : "w-6 md:w-8",
                          "text-[10px] md:text-xs",
                        )}
                        title={`${seat.id} - ${seat.price.toLocaleString("vi-VN")}đ`}
                      >
                        {seat.status === "sold" ? (
                          <X className="w-2 h-2 md:w-3 md:h-3" />
                        ) : (
                          seat.number
                        )}
                      </button>
                    ))}
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
                <div className="seat seat-couple seat-available w-10 h-6" />
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
                        <span className="font-medium">{seat.id}</span>
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
