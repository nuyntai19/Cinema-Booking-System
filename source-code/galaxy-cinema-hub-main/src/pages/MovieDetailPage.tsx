import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Clock,
  Calendar,
  Star,
  Play,
  AlertTriangle,
  MapPin,
  ChevronRight,
  Send,
  Loader2,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { API_ENDPOINTS, apiCall, getImageUrl } from "@/lib/api";
import { Movie, AgeRating, Showtime } from "@/types/cinema";
import { useBooking, useAuth } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface BackendMovie {
  id: number;
  title: string;
  description: string;
  duration: number;
  release_date: string;
  poster_url: string;
  trailer_url: string | null;
  age_rating: string;
  origin: string;
  status: string;
  genres: string | null;
  avg_rating: string | null;
  review_count: number;
  director: string | null;
  cast: string | null;
}

interface BackendReview {
  id: number;
  user_id: number;
  movie_id: number;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string | null;
  avatar: string | null;
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    "5": number;
    "4": number;
    "3": number;
    "2": number;
    "1": number;
  };
}

interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

interface APICinema {
  id: number;
  name: string;
  address: string;
  hotline?: string;
}

interface APIShowtime {
  id: number;
  movie_title: string;
  movie_id: number;
  cinema_id: number;
  cinema_name: string;
  hall_name: string;
  start_time: string;
  total_seats: number;
  base_price?: number;
}

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const { setSelectedMovie, setSelectedCinema, setSelectedShowtime } =
    useBooking();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [pendingShowtime, setPendingShowtime] = useState<{
    cinemaId: string;
    showtime: Showtime;
  } | null>(null);

  // Cinema & showtime states (from API)
  const [apiCinemas, setApiCinemas] = useState<APICinema[]>([]);
  const [showtimesByCinema, setShowtimesByCinema] = useState<
    Record<string, Showtime[]>
  >({});
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);

  // Review states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const normalizeTrailerUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await apiCall<{
          success: boolean;
          data: { movie: BackendMovie };
        }>(API_ENDPOINTS.MOVIE_DETAIL(parseInt(id)));

        if (response.success && response.data?.movie) {
          const m = response.data.movie;
          const castList = (m.cast || "")
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean);

          const mappedMovie: Movie = {
            id: m.id.toString(),
            title: m.title,
            titleVi: m.title,
            poster: getImageUrl(m.poster_url),
            duration: m.duration,
            ageRating: m.age_rating as AgeRating,
            origin: m.origin === "Vietnam" ? "VN" : "INT",
            genre: m.genres ? m.genres.split(",").map((g) => g.trim()) : [],
            director: (m.director || "").trim(),
            cast: castList,
            releaseDate: m.release_date,
            description: m.description || "",
            trailerUrl: m.trailer_url || undefined,
            rating: m.avg_rating ? parseFloat(m.avg_rating) : 0,
            isNowShowing: m.status === "Now Showing",
          };
          setMovie(mappedMovie);
        }
      } catch (error) {
        console.error("Error fetching movie:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  // Fetch cinemas and showtimes from API
  useEffect(() => {
    const fetchCinemasAndShowtimes = async () => {
      if (!id) return;

      const toLocalYmd = (dateInput: string) => {
        const d = new Date(dateInput.replace(" ", "T"));
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      try {
        setLoadingShowtimes(true);

        // Fetch cinemas
        const cinemasRes = await apiCall<{
          success: boolean;
          data: { cinemas: APICinema[] };
        }>(API_ENDPOINTS.CINEMAS);
        const cinemaList = cinemasRes.data?.cinemas || [];
        setApiCinemas(cinemaList);

        // Fetch all showtimes for this movie, then filter by selectedDate on frontend.
        const params = new URLSearchParams();
        params.append("movie_id", id);
        params.append("limit", "300");
        const showtimesRes = await apiCall<{
          success: boolean;
          data: { showtimes: APIShowtime[] };
        }>(`${API_ENDPOINTS.SHOWTIMES}?${params.toString()}`);

        const rawShowtimes = showtimesRes.data?.showtimes || [];
        const dates = Array.from(
          new Set(rawShowtimes.map((s) => toLocalYmd(s.start_time))),
        ).sort();
        setAvailableDates(dates);

        if (dates.length > 0 && !dates.includes(selectedDate)) {
          setSelectedDate(dates[0]);
          return;
        }

        const filteredShowtimes = rawShowtimes.filter(
          (s) => toLocalYmd(s.start_time) === selectedDate,
        );

        // Group showtimes by cinema_id
        const grouped: Record<string, Showtime[]> = {};
        filteredShowtimes.forEach((s) => {
          const cinemaKey = String(s.cinema_id);
          const startDate = new Date(s.start_time.replace(" ", "T"));
          const mapped: Showtime = {
            id: String(s.id),
            movieId: String(s.movie_id),
            cinemaId: cinemaKey,
            roomId: s.hall_name,
            date: startDate.toISOString().split("T")[0],
            time: startDate.toTimeString().slice(0, 5),
            start_time: s.start_time,
            price: {
              standard: s.base_price || 90000,
              vip: (s.base_price || 90000) * 1.5,
              couple: (s.base_price || 90000) * 2,
            },
            availableSeats: s.total_seats || 0,
            totalSeats: s.total_seats || 0,
          };
          if (!grouped[cinemaKey]) {
            grouped[cinemaKey] = [];
          }
          grouped[cinemaKey].push(mapped);
        });
        setShowtimesByCinema(grouped);
      } catch (error) {
        console.error("Error fetching cinemas/showtimes:", error);
      } finally {
        setLoadingShowtimes(false);
      }
    };

    fetchCinemasAndShowtimes();
  }, [id, selectedDate]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;

      try {
        setLoadingReviews(true);
        const response = await apiCall<{
          success: boolean;
          data: {
            movie_id: number;
            reviews: BackendReview[];
            rating_stats: ReviewStats;
          };
        }>(API_ENDPOINTS.MOVIE_REVIEWS(parseInt(id)));

        if (response.success && response.data) {
          // Map backend reviews to frontend format
          const mappedReviews = response.data.reviews.map((r) => ({
            id: r.id.toString(),
            userName: r.full_name || r.email.split("@")[0],
            userAvatar:
              r.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.email}`,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.created_at,
            helpful: 0,
          }));
          setReviews(mappedReviews);
          setReviewStats(response.data.rating_stats);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Không tìm thấy phim</h1>
            <Link to="/">
              <Button>Về trang chủ</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Prefer real dates that have showtimes. Fallback to next 7 days if no data yet.
  const dates =
    availableDates.length > 0
      ? availableDates.map((value) => {
          const d = new Date(`${value}T00:00:00`);
          return {
            value,
            dayName: d.toLocaleDateString("vi-VN", { weekday: "short" }),
            day: d.getDate(),
            month: d.getMonth() + 1,
          };
        })
      : Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return {
            value: `${y}-${m}-${day}`,
            dayName: d.toLocaleDateString("vi-VN", { weekday: "short" }),
            day: d.getDate(),
            month: d.getMonth() + 1,
          };
        });

  const handleSelectShowtime = (cinemaId: string, showtime: Showtime) => {
    if (getShowtimeTimestamp(showtime) <= Date.now()) {
      toast({
        title: "Suất chiếu đã qua giờ",
        description: "Vui lòng chọn suất chiếu khác còn hiệu lực.",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Vui lòng đăng nhập",
        description:
          "Bạn cần đăng nhập để đặt vé. Khách chỉ có thể xem lịch chiếu.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Check age restriction
    if (movie.ageRating === "T18") {
      setPendingShowtime({ cinemaId, showtime });
      setShowAgeModal(true);
      return;
    }

    proceedToBooking(cinemaId, showtime);
  };

  const proceedToBooking = (cinemaId: string, showtime: Showtime) => {
    setSelectedMovie(movie.id);
    setSelectedCinema(cinemaId);
    setSelectedShowtime(showtime);
    navigate("/booking/seats");
  };

  const handleAgeConfirm = () => {
    if (pendingShowtime) {
      proceedToBooking(pendingShowtime.cinemaId, pendingShowtime.showtime);
    }
    setShowAgeModal(false);
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để đánh giá phim",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (rating === 0) {
      toast({
        title: "Chưa chọn đánh giá",
        description: "Vui lòng chọn số sao đánh giá",
        variant: "destructive",
      });
      return;
    }

    if (!reviewText.trim()) {
      toast({
        title: "Chưa có nội dung",
        description: "Vui lòng nhập nội dung đánh giá",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiCall<{
        success: boolean;
        message: string;
        data?: { review_id: number };
      }>(API_ENDPOINTS.CREATE_REVIEW, {
        method: "POST",
        body: JSON.stringify({
          movie_id: parseInt(id!),
          rating: rating,
          comment: reviewText.trim(),
        }),
      });

      if (response.success) {
        toast({
          title: "Gửi đánh giá thành công",
          description: "Đánh giá của bạn đang được xem xét. Cảm ơn bạn!",
        });

        // Reset form
        setRating(0);
        setReviewText("");

        // Refresh reviews list after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: "Không thể gửi đánh giá",
          description: response.message || "Đã có lỗi xảy ra",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Error submitting review:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể gửi đánh giá. Vui lòng thử lại sau.";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderStars = (count: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "w-5 h-5 transition-all",
              interactive && "cursor-pointer",
              star <= (interactive ? hoverRating || rating : count)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300",
            )}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          />
        ))}
      </div>
    );
  };

  const getAgeRatingClass = (rating: string) => {
    const classes: Record<string, string> = {
      P: "bg-green-500",
      T13: "bg-yellow-500",
      T16: "bg-orange-500",
      T18: "bg-red-500",
      C: "bg-gray-500",
    };
    return classes[rating] || "bg-gray-500";
  };

  const hasAnyShowtimes =
    availableDates.length > 0 ||
    Object.values(showtimesByCinema).some((times) => times.length > 0);

  const getShowtimeTimestamp = (showtime: Showtime): number => {
    if (showtime.start_time) {
      const ts = new Date(showtime.start_time.replace(" ", "T")).getTime();
      if (!Number.isNaN(ts)) return ts;
    }

    const fallbackTs = new Date(
      `${showtime.date}T${showtime.time}:00`,
    ).getTime();
    return Number.isNaN(fallbackTs) ? 0 : fallbackTs;
  };

  const handleWatchTrailer = () => {
    if (!movie?.trailerUrl) return;

    const trailerUrl = normalizeTrailerUrl(movie.trailerUrl);
    try {
      const parsed = new URL(trailerUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Invalid protocol");
      }
      window.open(parsed.toString(), "_blank", "noopener,noreferrer");
    } catch {
      toast({
        title: "URL trailer không hợp lệ",
        description: "Vui lòng kiểm tra lại link trailer của phim này.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-[300px] lg:h-[400px]">
          <img
            src={movie.backdrop || movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <div className="grid lg:grid-cols-[300px,1fr] gap-4 md:gap-8">
            {/* Poster */}
            <div className="hidden lg:block">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full rounded-xl shadow-2xl"
              />
            </div>

            {/* Info */}
            <div className="space-y-6">
              {/* Title & Badges */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    className={cn(
                      "text-white",
                      getAgeRatingClass(movie.ageRating),
                    )}
                  >
                    {movie.ageRating}
                  </Badge>
                  {movie.origin === "VN" && (
                    <Badge
                      variant="outline"
                      className="border-red-500 text-red-500"
                    >
                      🇻🇳 Phim Việt
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {movie.title}
                </h1>
                {movie.titleVi && movie.titleVi !== movie.title && (
                  <p className="text-lg md:text-xl text-muted-foreground">
                    {movie.titleVi}
                  </p>
                )}
              </div>

              {/* Age Warning */}
              {movie.ageRating === "T18" && (
                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">
                      Cảnh báo: Phim dành cho người từ 18 tuổi trở lên
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Vui lòng mang theo CMND/CCCD khi đến rạp để xác minh tuổi.
                    </p>
                  </div>
                </div>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{movie.duration} phút</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(movie.releaseDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                {movie.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{movie.rating}/5</span>
                  </div>
                )}
              </div>

              {/* Genre */}
              <div className="flex flex-wrap gap-2">
                {movie.genre.map((g) => (
                  <Badge key={g} variant="secondary">
                    {g}
                  </Badge>
                ))}
              </div>

              {/* Description */}
              <p className="text-foreground/80 leading-relaxed">
                {movie.description}
              </p>

              {/* Cast & Crew */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Đạo diễn</p>
                  <p className="font-medium">{movie.director || "Đang cập nhật"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Diễn viên
                  </p>
                  <p className="font-medium">
                    {movie.cast.length > 0
                      ? movie.cast.join(", ")
                      : "Đang cập nhật"}
                  </p>
                </div>
              </div>

              {/* Trailer Button */}
              {movie.trailerUrl && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleWatchTrailer}
                >
                  <Play className="w-4 h-4" />
                  Xem Trailer
                </Button>
              )}
            </div>
          </div>

          {/* Showtimes Section */}
          {(movie.isNowShowing || loadingShowtimes || hasAnyShowtimes) && (
            <section className="mt-12 pb-12">
              <h2 className="text-2xl font-bold mb-6">Lịch Chiếu</h2>

              {/* Date Picker */}
              <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
                {dates.map((date) => (
                  <button
                    key={date.value}
                    onClick={() => setSelectedDate(date.value)}
                    className={cn(
                      "flex flex-col items-center min-w-[70px] px-4 py-3 rounded-xl transition-all",
                      selectedDate === date.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-card hover:bg-muted border border-border",
                    )}
                  >
                    <span className="text-xs uppercase">{date.dayName}</span>
                    <span className="text-lg font-bold">{date.day}</span>
                    <span className="text-xs">Th{date.month}</span>
                  </button>
                ))}
              </div>

              {/* Cinema List */}
              {loadingShowtimes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <Accordion
                  type="multiple"
                  defaultValue={apiCinemas.map((c) => String(c.id))}
                  className="space-y-3"
                >
                  {apiCinemas.map((cinema) => {
                    const cinemaKey = String(cinema.id);
                    const cinemaShowtimes = showtimesByCinema[cinemaKey] || [];

                    return (
                      <AccordionItem
                        key={cinemaKey}
                        value={cinemaKey}
                        className="bg-card rounded-xl border border-border overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                          <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{cinema.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {cinema.address}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          {cinemaShowtimes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {cinemaShowtimes.map((showtime) => {
                                const isPastShowtime =
                                  getShowtimeTimestamp(showtime) <= Date.now();

                                return (
                                  <Button
                                    key={showtime.id}
                                    variant="outline"
                                    size="sm"
                                    disabled={isPastShowtime}
                                    onClick={() =>
                                      handleSelectShowtime(cinemaKey, showtime)
                                    }
                                    className="hover:bg-primary hover:text-primary-foreground hover:border-primary"
                                  >
                                    {showtime.time}
                                  </Button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              Không có suất chiếu cho ngày đã chọn
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </section>
          )}

          {/* Reviews Section */}
          <section className="mt-12 pb-12">
            <h2 className="text-2xl font-bold mb-6">Đánh Giá Phim</h2>

            {/* Review Statistics */}
            {loadingReviews ? (
              <div className="bg-card rounded-xl border border-border p-6 mb-6 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : reviewStats &&
              reviewStats.average_rating &&
              reviews.length > 0 ? (
              <div className="bg-card rounded-xl border border-border p-6 mb-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {reviewStats.average_rating.toFixed(1)}
                    </div>
                    <div className="flex justify-center mb-2">
                      {renderStars(Math.round(reviewStats.average_rating))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {reviewStats.total_reviews} đánh giá
                    </p>
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count =
                        reviewStats.rating_distribution[
                          star.toString() as keyof typeof reviewStats.rating_distribution
                        ] || 0;
                      const percentage =
                        reviewStats.total_reviews > 0
                          ? (count / reviewStats.total_reviews) * 100
                          : 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-sm w-8">{star} ⭐</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Write Review Form */}
            {isAuthenticated ? (
              <div className="bg-card rounded-xl border border-border p-6 mb-6">
                <h3 className="font-bold text-lg mb-4">
                  Viết đánh giá của bạn
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Đánh giá của bạn
                    </label>
                    {renderStars(rating, true)}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Nội dung đánh giá
                    </label>
                    <Textarea
                      placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleSubmitReview}
                    className="w-full sm:w-auto"
                    disabled={rating === 0 || !reviewText.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Gửi đánh giá
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-xl border border-border p-6 mb-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Vui lòng đăng nhập để đánh giá phim
                </p>
                <Button onClick={() => navigate("/login")}>Đăng nhập</Button>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              {loadingReviews ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá phim này!
                </div>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-card rounded-xl border border-border p-6"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={review.userAvatar} />
                        <AvatarFallback>
                          {review.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold">{review.userName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(review.createdAt)}
                            </p>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-sm text-foreground mb-3">
                          {review.comment}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-muted-foreground hover:text-foreground"
                          >
                            👍 Hữu ích ({review.helpful})
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Age Confirmation Modal */}
      <Dialog open={showAgeModal} onOpenChange={setShowAgeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <DialogTitle className="text-center">
              Phim dành cho người từ 18 tuổi
            </DialogTitle>
            <DialogDescription className="text-center">
              Phim này được phân loại T18 - chỉ dành cho khán giả từ 18 tuổi trở
              lên. Vui lòng mang theo CMND/CCCD để xác minh tuổi tại rạp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAgeModal(false)}
              className="flex-1"
            >
              Quay Lại
            </Button>
            <Button
              onClick={handleAgeConfirm}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Tôi Đã Hiểu & Tiếp Tục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MovieDetailPage;
