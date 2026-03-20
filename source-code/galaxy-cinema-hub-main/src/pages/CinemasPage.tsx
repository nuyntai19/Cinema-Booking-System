import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Calendar as CalendarIcon,
  Filter,
  Search,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { API_ENDPOINTS, apiCall, getImageUrl } from "@/lib/api";
import { Movie, AgeRating } from "@/types/cinema";

interface BackendMovie {
  id: number;
  title: string;
  poster_url: string;
  duration: number;
  age_rating: string;
  origin: string;
  release_date: string;
  status: string;
  description: string;
  trailer_url: string | null;
  genres: string | null;
}

interface ApiShowtime {
  id: number;
  movie_id: number;
  start_time: string;
  end_time?: string;
}

type ShowStatus = "now-showing" | "coming-soon" | "no-showtime";

type MovieListItem = Movie & {
  showStatus: ShowStatus;
};

const parseApiDate = (dateStr: string) => new Date(dateStr.replace(" ", "T"));

const getShowStatus = (
  movieId: number,
  showtimes: ApiShowtime[],
): ShowStatus => {
  const now = new Date();
  const movieShowtimes = showtimes.filter(
    (s) => Number(s.movie_id) === movieId,
  );

  if (movieShowtimes.length === 0) {
    return "no-showtime";
  }

  const hasNowShowing = movieShowtimes.some((s) => {
    const start = parseApiDate(s.start_time);
    if (Number.isNaN(start.getTime())) return false;

    const end = s.end_time
      ? parseApiDate(s.end_time)
      : new Date(start.getTime() + 2 * 60 * 60 * 1000);

    if (Number.isNaN(end.getTime())) return false;
    return now >= start && now < end;
  });

  if (hasNowShowing) {
    return "now-showing";
  }

  const hasUpcoming = movieShowtimes.some((s) => {
    const start = parseApiDate(s.start_time);
    if (Number.isNaN(start.getTime())) return false;
    return start > now;
  });

  return hasUpcoming ? "coming-soon" : "no-showtime";
};

const MoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<MovieListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "now-showing" | "coming-soon">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const [moviesResponse, showtimesResponse] = await Promise.all([
          apiCall<{
            success: boolean;
            data: {
              movies: BackendMovie[];
              pagination: unknown;
            };
          }>(API_ENDPOINTS.MOVIES),
          apiCall<{
            success: boolean;
            data: {
              showtimes: ApiShowtime[];
            };
          }>(`${API_ENDPOINTS.SHOWTIMES}?limit=1000&page=1`),
        ]);

        if (!moviesResponse.success || !moviesResponse.data?.movies) {
          console.error("Invalid movies API response");
          return;
        }

        const showtimes = showtimesResponse.success
          ? showtimesResponse.data?.showtimes || []
          : [];

        const mappedMovies: MovieListItem[] = moviesResponse.data.movies.map(
          (movie) => {
            const showStatus = getShowStatus(movie.id, showtimes);
            return {
              id: movie.id.toString(),
              title: movie.title,
              titleVi: movie.title,
              poster: getImageUrl(movie.poster_url),
              duration: movie.duration,
              ageRating: movie.age_rating as AgeRating,
              origin: movie.origin === "Vietnam" ? "VN" : "INT",
              genre: movie.genres
                ? movie.genres.split(",").map((g) => g.trim())
                : [],
              director: "",
              cast: [],
              releaseDate: movie.release_date,
              description: movie.description,
              trailerUrl: movie.trailer_url || undefined,
              rating: undefined,
              isNowShowing: showStatus === "now-showing",
              showStatus,
            };
          },
        );

        setMovies(mappedMovies);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch =
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.titleVi?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "now-showing") {
      return movie.showStatus === "now-showing" && matchesSearch;
    }
    if (filter === "coming-soon") {
      return movie.showStatus === "coming-soon" && matchesSearch;
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Danh Sách Phim
          </h1>
          <p className="text-muted-foreground">
            Khám phá những bộ phim đang hot
          </p>
        </div>

        {/* Filters & Search */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm phim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Tất cả phim
            </Button>
            <Button
              variant={filter === "now-showing" ? "default" : "outline"}
              onClick={() => setFilter("now-showing")}
            >
              Đang chiếu
            </Button>
            <Button
              variant={filter === "coming-soon" ? "default" : "outline"}
              onClick={() => setFilter("coming-soon")}
            >
              Sắp chiếu
            </Button>
          </div>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              Không tìm thấy phim nào
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredMovies.map((movie) => (
              <Link key={movie.id} to={`/movie/${movie.id}`}>
                <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="p-0">
                    {/* Movie Poster */}
                    <div className="relative aspect-[2/3] overflow-hidden">
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />

                      {/* Age Rating Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-primary text-primary-foreground font-bold">
                          {movie.ageRating}
                        </Badge>
                      </div>

                      {/* Status Badge */}
                      {movie.showStatus === "now-showing" ? (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500 text-white">
                            Đang chiếu
                          </Badge>
                        </div>
                      ) : movie.showStatus === "coming-soon" ? (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-blue-500 text-white">
                            Sắp chiếu
                          </Badge>
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-gray-500 text-white">
                            Chưa có suất chiếu
                          </Badge>
                        </div>
                      )}

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button className="bg-primary hover:bg-primary/90">
                          Đặt vé ngay
                        </Button>
                      </div>
                    </div>

                    {/* Movie Info */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {movie.title}
                      </h3>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {movie.duration}p
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarIcon className="w-3 h-3" />
                        <span>
                          {new Date(movie.releaseDate).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {movie.genre.slice(0, 2).map((g) => (
                          <Badge
                            key={g}
                            variant="secondary"
                            className="text-xs"
                          >
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MoviesPage;
