import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Search, Film as FilmIcon, Calendar, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface MovieFromAPI {
  id: number;
  title: string;
  poster_url?: string;
  duration_minutes?: number;
  duration?: number;
  release_date?: string;
  age_rating?: string;
  genres?: string;
  director?: string;
  cast?: string;
  description?: string;
  avg_rating?: string | number;
  status?: string;
}

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<MovieFromAPI[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = searchParams.get("q") || "";
    setSearchQuery(query);

    const fetchMovies = async () => {
      setLoading(true);
      try {
        let url = `${API_ENDPOINTS.MOVIES}?limit=100`;

        // Add search query if exists
        if (query) {
          url += `&search=${encodeURIComponent(query)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.data) {
          setResults(data.data.movies || []);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [searchParams]);

  // Handle search input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQuery = searchParams.get("q") || "";
      if (searchQuery !== currentQuery) {
        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.set("q", searchQuery.trim());
          navigate(`/search?${params.toString()}`, { replace: true });
        } else if (currentQuery) {
          // Clear query if searchQuery is empty
          navigate("/search", { replace: true });
        }
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [searchQuery, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Tìm Kiếm Phim
          </h1>

          {/* Search Box */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Tìm phim theo tên, thể loại, đạo diễn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>

          {searchQuery && (
            <p className="text-muted-foreground mt-4">
              Tìm thấy{" "}
              <span className="font-bold text-foreground">
                {results.length}
              </span>{" "}
              kết quả cho "{searchQuery}"
            </p>
          )}
        </div>

        {/* Search Results */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Đang tìm kiếm...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((movie) => {
              const genreArray = movie.genres ? movie.genres.split(", ") : [];
              const duration = movie.duration_minutes || movie.duration || 0;
              const posterUrl = movie.poster_url
                ? movie.poster_url.startsWith("http")
                  ? movie.poster_url
                  : `${API_BASE_URL}/${movie.poster_url}`
                : "https://via.placeholder.com/400x600?text=No+Poster";

              return (
                <Link key={movie.id} to={`/movie/${movie.id}`}>
                  <Card className="group hover:shadow-lg transition-all">
                    <CardContent className="p-0">
                      <div className="flex gap-4 p-4">
                        {/* Movie Poster */}
                        <div className="flex-shrink-0">
                          <img
                            src={posterUrl}
                            alt={movie.title}
                            className="w-24 h-36 object-cover rounded-lg group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "https://via.placeholder.com/400x600?text=No+Poster";
                            }}
                          />
                        </div>

                        {/* Movie Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {movie.title}
                            </h3>
                            {movie.age_rating && (
                              <Badge className="bg-primary text-primary-foreground flex-shrink-0">
                                {movie.age_rating}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                            {duration > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {duration} phút
                              </span>
                            )}
                            {movie.release_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(
                                  movie.release_date,
                                ).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                            {movie.avg_rating &&
                              Number(movie.avg_rating) > 0 && (
                                <span className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  {Number(movie.avg_rating).toFixed(1)}
                                </span>
                              )}
                          </div>

                          {genreArray.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {genreArray.map((g) => (
                                <Badge
                                  key={g}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {g}
                                </Badge>
                              ))}
                              {movie.status === "Now Showing" && (
                                <Badge className="bg-green-500 text-white text-xs">
                                  Đang chiếu
                                </Badge>
                              )}
                              {movie.status === "Coming Soon" && (
                                <Badge className="bg-blue-500 text-white text-xs">
                                  Sắp chiếu
                                </Badge>
                              )}
                            </div>
                          )}

                          {movie.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {movie.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <FilmIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              Không tìm thấy kết quả
            </h3>
            <p className="text-muted-foreground">
              Không tìm thấy phim nào với từ khóa "{searchQuery}". Vui lòng thử
              lại với từ khóa khác.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default SearchPage;
