import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Filter, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { API_ENDPOINTS, apiCall, getImageUrl } from "@/lib/api";
import { useAuth, useBooking } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";

interface Cinema {
  id: number;
  name: string;
  address: string;
}

interface ShowtimeAPI {
  id: number;
  movie_id: number;
  cinema_hall_id: number;
  start_time: string;
  end_time: string;
  base_price?: number;
  movie_title: string;
  poster_url?: string;
  duration_minutes?: number;
  age_rating?: string;
  hall_name: string;
  cinema_id: number;
  cinema_name: string;
}

const SchedulePage: React.FC = () => {
  const { toast } = useToast();
  const { setSelectedMovie, setSelectedShowtime } = useBooking();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedCinema, setSelectedCinema] = useState<string>("all");
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [showtimes, setShowtimes] = useState<ShowtimeAPI[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate dates for the next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  // Fetch cinemas on mount
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const response = await apiCall<{ success: boolean; data: { cinemas: Cinema[] } }>(
          API_ENDPOINTS.CINEMAS
        );
        setCinemas(response.data?.cinemas || []);
      } catch (error) {
        console.error("Failed to fetch cinemas:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách rạp.",
          variant: "destructive",
        });
      }
    };

    fetchCinemas();
  }, [toast]);

  // Fetch showtimes when date or cinema changes
  useEffect(() => {
    const fetchShowtimes = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append("date", selectedDate);
        if (selectedCinema !== "all") {
          params.append("cinema_id", selectedCinema);
        }

        const response = await apiCall<{ success: boolean; data: { showtimes: ShowtimeAPI[] } }>(
          `${API_ENDPOINTS.SHOWTIMES}?${params.toString()}`
        );
        setShowtimes(response.data?.showtimes || []);
      } catch (error) {
        console.error("Failed to fetch showtimes:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải lịch chiếu.",
          variant: "destructive",
        });
        setShowtimes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShowtimes();
  }, [selectedDate, selectedCinema, toast]);

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
  };

  const getDayName = (date: Date) => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[date.getDay()];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Group showtimes by movie
  const showtimesByMovie = showtimes.reduce(
    (acc, showtime) => {
      if (!acc[showtime.movie_id]) {
        acc[showtime.movie_id] = [];
      }
      acc[showtime.movie_id].push(showtime);
      return acc;
    },
    {} as Record<number, ShowtimeAPI[]>,
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Lịch Chiếu Phim
          </h1>
          <p className="text-muted-foreground">
            Xem lịch chiếu và đặt vé ngay hôm nay
          </p>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Chọn ngày
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {dates.map((date) => {
              const dateStr = date.toISOString().split("T")[0];
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-lg border-2 transition-all ${isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/50"
                    }`}
                >
                  <span
                    className={`text-xs font-medium ${isToday(date) && !isSelected ? "text-primary" : ""}`}
                  >
                    {getDayName(date)}
                  </span>
                  <span className="text-xl font-bold">{date.getDate()}</span>
                  <span className="text-xs">
                    {date.toLocaleString("vi-VN", { month: "short" })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cinema Filter */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Chọn rạp
          </h2>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCinema === "all" ? "default" : "outline"}
              onClick={() => setSelectedCinema("all")}
            >
              Tất cả rạp
            </Button>
            {cinemas.map((cinema) => (
              <Button
                key={cinema.id}
                variant={selectedCinema === cinema.id.toString() ? "default" : "outline"}
                onClick={() => setSelectedCinema(cinema.id.toString())}
              >
                {cinema.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Đang tải lịch chiếu...</p>
            </div>
          </div>
        )}

        {/* No Showtimes */}
        {!loading && showtimes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Không có suất chiếu nào cho ngày này
            </p>
          </div>
        )}

        {/* Movies Schedule */}
        {!loading && showtimes.length > 0 && (
          <div className="space-y-6">
            {Object.entries(showtimesByMovie).map(([movieId, movieShowtimes]) => {
              const firstShowtime = movieShowtimes[0];
              const posterSrc = firstShowtime.poster_url
                ? getImageUrl(firstShowtime.poster_url)
                : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop";

              return (
                <Card key={movieId} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row gap-6 p-6">
                      {/* Movie Poster */}
                      <Link to={`/movie/${movieId}`} className="flex-shrink-0">
                        <img
                          src={posterSrc}
                          alt={firstShowtime.movie_title}
                          className="w-full md:w-32 h-48 object-cover rounded-lg hover:scale-105 transition-transform"
                        />
                      </Link>

                      {/* Movie Info & Showtimes */}
                      <div className="flex-1">
                        <Link to={`/movie/${movieId}`} className="group">
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                            {firstShowtime.movie_title}
                          </h3>
                        </Link>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          {firstShowtime.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {firstShowtime.duration_minutes} phút
                            </span>
                          )}
                          {firstShowtime.age_rating && (
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                              {firstShowtime.age_rating}
                            </span>
                          )}
                        </div>

                        {/* Showtimes Grid */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                            Suất chiếu:
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {movieShowtimes.map((showtime) => {
                              const showtimeTime = new Date(
                                showtime.start_time,
                              ).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              });

                              return (
                                <Link
                                  key={showtime.id}
                                  to={`/booking/seats?movie=${movieId}&showtime=${showtime.id}`}
                                  onClick={() => {
                                    setSelectedMovie(String(movieId));
                                    setSelectedShowtime({
                                      id: String(showtime.id),
                                      time: showtimeTime,
                                      date: showtime.start_time.split(' ')[0],
                                      start_time: showtime.start_time,
                                      hall: showtime.hall_name,
                                      cinema: showtime.cinema_name,
                                    } as any);
                                  }}
                                  className="px-3 py-2 text-center rounded-lg border-2 border-border hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all font-medium text-sm min-w-[120px]"
                                >
                                  {showtimeTime} - {new Date(new Date(showtime.start_time).getTime() + (firstShowtime.duration_minutes || 0) * 60000).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SchedulePage;
