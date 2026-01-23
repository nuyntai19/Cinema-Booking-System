import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  Clock,
  Calendar as CalendarIcon,
  Filter,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { movies } from "@/data/mockData";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const MoviesPage: React.FC = () => {
  const [filter, setFilter] = useState<"all" | "now-showing" | "coming-soon">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch =
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.titleVi?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "now-showing") return movie.isNowShowing && matchesSearch;
    if (filter === "coming-soon") return !movie.isNowShowing && matchesSearch;
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
                    {movie.isNowShowing ? (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500 text-white">
                          Đang chiếu
                        </Badge>
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-blue-500 text-white">
                          Sắp chiếu
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
                      {movie.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {movie.rating}
                        </span>
                      )}
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
                        <Badge key={g} variant="secondary" className="text-xs">
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

        {/* No Results */}
        {filteredMovies.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              Không tìm thấy phim nào
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MoviesPage;
