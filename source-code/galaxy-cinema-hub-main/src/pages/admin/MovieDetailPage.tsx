import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  Film,
  Star,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { API_ENDPOINTS, apiCall, getImageUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Genre {
  id: number;
  name: string;
}

interface Movie {
  id: number;
  title: string;
  duration: number;
  age_rating: string;
  origin: string;
  poster_url: string | null;
  trailer_url: string | null;
  description: string | null;
  release_date: string;
  status: string;
  director?: string | null;
  cast?: string | null;
  genres?: Genre[] | string;
  rating?: number;
  avg_rating?: number;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
}

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMovieDetail(parseInt(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchMovieDetail = async (movieId: number) => {
    try {
      setLoading(true);
      const response = await apiCall<{
        success: boolean;
        data: { movie: Movie };
      }>(API_ENDPOINTS.MOVIE_DETAIL(movieId), {
        method: "GET",
      });

      if (response.success && response.data && response.data.movie) {
        setMovie(response.data.movie);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Không thể tải thông tin phim";
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAgeRatingClass = (rating: string) => {
    const classes: Record<string, string> = {
      P: "bg-green-500",
      K: "bg-blue-500",
      T13: "bg-yellow-500",
      T16: "bg-orange-500",
      T18: "bg-red-500",
      C: "bg-gray-500",
    };
    return classes[rating] || "bg-gray-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getGenresString = (genres: Genre[] | string | undefined) => {
    if (typeof genres === "string") {
      return genres || "Chưa có thể loại";
    } else if (Array.isArray(genres)) {
      return genres.map((g: Genre) => g.name).join(", ");
    }
    return "Chưa có thể loại";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Không tìm thấy phim</p>
            <Button
              onClick={() => navigate("/admin/movies")}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate("/admin/movies")}
          variant="outline"
          size="icon"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Chi Tiết Phim</h1>
          <p className="text-muted-foreground">Thông tin chi tiết về phim</p>
        </div>
      </div>

      {/* Movie Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Poster */}
        <Card>
          <CardContent className="p-6">
            <img
              src={
                getImageUrl(movie.poster_url) ||
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'%3E%3Crect fill='%23ddd' width='400' height='600'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Poster%3C/text%3E%3C/svg%3E"
              }
              alt={movie.title}
              className="w-full rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='600' viewBox='0 0 400 600'%3E%3Crect fill='%23ddd' width='400' height='600'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='24' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Poster%3C/text%3E%3C/svg%3E";
                e.currentTarget.onerror = null;
              }}
            />
          </CardContent>
        </Card>

        {/* Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-3xl">{movie.title}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge
                className={cn(
                  "text-white",
                  getAgeRatingClass(movie.age_rating),
                )}
              >
                {movie.age_rating}
              </Badge>
              <Badge
                variant={
                  movie.status === "Now Showing" ? "default" : "secondary"
                }
              >
                {movie.status === "Now Showing"
                  ? "Đang chiếu"
                  : movie.status === "Coming Soon"
                    ? "Sắp chiếu"
                    : "Đã kết thúc"}
              </Badge>
              <Badge variant="outline">
                {movie.origin === "Vietnam" ? "Việt Nam" : "Quốc Tế"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Thời lượng</p>
                  <p className="font-medium">{movie.duration} phút</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phát hành</p>
                  <p className="font-medium">
                    {formatDate(movie.release_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nguồn gốc</p>
                  <p className="font-medium">
                    {movie.origin === "Vietnam" ? "Việt Nam" : "Quốc Tế"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Đánh giá</p>
                  <p className="font-medium">
                    {movie.avg_rating
                      ? `${parseFloat(movie.avg_rating.toString()).toFixed(1)}/5`
                      : "Chưa có"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Genres */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Film className="w-4 h-4" />
                Thể loại
              </h3>
              <p className="text-muted-foreground">
                {getGenresString(movie.genres)}
              </p>
            </div>

            {/* Director */}
            {movie.director && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Đạo diễn</h3>
                  <p className="text-muted-foreground">{movie.director}</p>
                </div>
              </>
            )}

            {/* Cast */}
            {movie.cast && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Diễn viên</h3>
                  <p className="text-muted-foreground">{movie.cast}</p>
                </div>
              </>
            )}

            {/* Description */}
            {movie.description && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Mô tả</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {movie.description}
                  </p>
                </div>
              </>
            )}

            {/* Trailer */}
            {movie.trailer_url && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Trailer</h3>
                  <a
                    href={movie.trailer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {movie.trailer_url}
                  </a>
                </div>
              </>
            )}

            {/* Meta Info */}
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              {movie.created_at && (
                <div>
                  <span className="font-medium">Ngày tạo:</span>{" "}
                  {formatDate(movie.created_at)}
                </div>
              )}
              {movie.updated_at && (
                <div>
                  <span className="font-medium">Cập nhật:</span>{" "}
                  {formatDate(movie.updated_at)}
                </div>
              )}
              {movie.review_count !== undefined && (
                <div>
                  <span className="font-medium">Số đánh giá:</span>{" "}
                  {movie.review_count}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MovieDetailPage;
