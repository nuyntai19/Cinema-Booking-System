import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Film as FilmIcon, Calendar, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { movies } from "@/data/mockData";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState(movies);

  useEffect(() => {
    const query = searchParams.get("q") || "";
    setSearchQuery(query);

    if (query) {
      const filtered = movies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(query.toLowerCase()) ||
          movie.titleVi?.toLowerCase().includes(query.toLowerCase()) ||
          movie.genre.some((g) =>
            g.toLowerCase().includes(query.toLowerCase()),
          ) ||
          movie.director.toLowerCase().includes(query.toLowerCase()),
      );
      setResults(filtered);
    } else {
      setResults(movies);
    }
  }, [searchParams]);

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
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((movie) => (
              <Link key={movie.id} to={`/movie/${movie.id}`}>
                <Card className="group hover:shadow-lg transition-all">
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      {/* Movie Poster */}
                      <div className="flex-shrink-0">
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-24 h-36 object-cover rounded-lg group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Movie Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {movie.title}
                          </h3>
                          <Badge className="bg-primary text-primary-foreground flex-shrink-0">
                            {movie.ageRating}
                          </Badge>
                        </div>

                        {movie.titleVi && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                            {movie.titleVi}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {movie.duration} phút
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(movie.releaseDate).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                          {movie.rating && (
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              {movie.rating}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {movie.genre.map((g) => (
                            <Badge
                              key={g}
                              variant="secondary"
                              className="text-xs"
                            >
                              {g}
                            </Badge>
                          ))}
                          {movie.isNowShowing ? (
                            <Badge className="bg-green-500 text-white text-xs">
                              Đang chiếu
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-500 text-white text-xs">
                              Sắp chiếu
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {movie.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
