import React, { useState } from "react";
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
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { movies, cinemas, generateShowtimes } from "@/data/mockData";
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

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const { setSelectedMovie, setSelectedCinema, setSelectedShowtime } =
    useBooking();

  const movie = movies.find((m) => m.id === id);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [pendingShowtime, setPendingShowtime] = useState<any>(null);

  // Review states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState([
    {
      id: "1",
      userName: "Nguyễn Văn A",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user1",
      rating: 5,
      comment:
        "Phim rất hay, diễn xuất tốt. Câu chuyện cảm động và ý nghĩa. Đáng xem!",
      createdAt: "2026-01-20T10:30:00",
      helpful: 24,
    },
    {
      id: "2",
      userName: "Trần Thị B",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user2",
      rating: 4,
      comment:
        "Nội dung hay, hình ảnh đẹp. Tuy nhiên có một số phần hơi kéo dài.",
      createdAt: "2026-01-19T15:20:00",
      helpful: 18,
    },
    {
      id: "3",
      userName: "Lê Văn C",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user3",
      rating: 5,
      comment: "Xuất sắc! Âm nhạc, diễn xuất, kịch bản đều rất tốt.",
      createdAt: "2026-01-18T09:15:00",
      helpful: 12,
    },
  ]);

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

  // Generate dates for next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("vi-VN", { weekday: "short" }),
      day: d.getDate(),
      month: d.getMonth() + 1,
    };
  });

  const handleSelectShowtime = (cinemaId: string, showtime: any) => {
    // Check age restriction
    if (movie.ageRating === "T18") {
      setPendingShowtime({ cinemaId, showtime });
      setShowAgeModal(true);
      return;
    }

    proceedToBooking(cinemaId, showtime);
  };

  const proceedToBooking = (cinemaId: string, showtime: any) => {
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

  const handleSubmitReview = () => {
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

    const newReview = {
      id: Date.now().toString(),
      userName: user?.email || "Người dùng",
      userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`,
      rating,
      comment: reviewText,
      createdAt: new Date().toISOString(),
      helpful: 0,
    };

    setReviews([newReview, ...reviews]);
    setRating(0);
    setReviewText("");

    toast({
      title: "Đánh giá thành công",
      description: "Cảm ơn bạn đã chia sẻ đánh giá!",
    });
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
                  <p className="font-medium">{movie.director}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Diễn viên
                  </p>
                  <p className="font-medium">{movie.cast.join(", ")}</p>
                </div>
              </div>

              {/* Trailer Button */}
              {movie.trailerUrl && (
                <Button variant="outline" className="gap-2">
                  <Play className="w-4 h-4" />
                  Xem Trailer
                </Button>
              )}
            </div>
          </div>

          {/* Showtimes Section */}
          {movie.isNowShowing && (
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
              <Accordion
                type="multiple"
                defaultValue={cinemas.map((c) => c.id)}
                className="space-y-3"
              >
                {cinemas.map((cinema) => {
                  const showtimes = generateShowtimes(
                    movie.id,
                    cinema.id,
                  ).filter((s) => s.date === selectedDate);

                  return (
                    <AccordionItem
                      key={cinema.id}
                      value={cinema.id}
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
                        {showtimes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {showtimes.map((showtime) => (
                              <Button
                                key={showtime.id}
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleSelectShowtime(cinema.id, showtime)
                                }
                                className="hover:bg-primary hover:text-primary-foreground hover:border-primary"
                              >
                                {showtime.time}
                              </Button>
                            ))}
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
            </section>
          )}

          {/* Reviews Section */}
          <section className="mt-12 pb-12">
            <h2 className="text-2xl font-bold mb-6">Đánh Giá Phim</h2>

            {/* Review Statistics */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {(
                      reviews.reduce((sum, r) => sum + r.rating, 0) /
                      reviews.length
                    ).toFixed(1)}
                  </div>
                  <div className="flex justify-center mb-2">
                    {renderStars(
                      Math.round(
                        reviews.reduce((sum, r) => sum + r.rating, 0) /
                          reviews.length,
                      ),
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {reviews.length} đánh giá
                  </p>
                </div>
                <div className="flex-1 space-y-2 w-full">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter(
                      (r) => r.rating === star,
                    ).length;
                    const percentage = (count / reviews.length) * 100;
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
              {reviews.map((review) => (
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
              ))}
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
