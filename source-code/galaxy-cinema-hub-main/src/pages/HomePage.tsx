import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroBanner from "@/components/home/HeroBanner";
import QuickBookingBar from "@/components/booking/QuickBookingBar";
import MovieCard from "@/components/movie/MovieCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AppContext";
import { API_ENDPOINTS, apiCall, getImageUrl } from "@/lib/api";
import { Movie, AgeRating } from "@/types/cinema";
import { Loader2 } from "lucide-react";

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

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await apiCall<{
        success: boolean;
        data: { movies: BackendMovie[] };
      }>(API_ENDPOINTS.MOVIES, {
        method: "GET",
      });

      if (response.success && response.data?.movies) {
        const mappedMovies: Movie[] = response.data.movies.map((m) => ({
          id: m.id.toString(),
          title: m.title,
          titleVi: m.title,
          poster: getImageUrl(m.poster_url),
          duration: m.duration,
          ageRating: m.age_rating as AgeRating,
          origin: m.origin === "Vietnam" ? "VN" : "INT",
          genre: m.genres ? m.genres.split(",").map((g) => g.trim()) : [],
          director: "",
          cast: [],
          releaseDate: m.release_date,
          description: m.description || "",
          trailerUrl: m.trailer_url || undefined,
          isNowShowing: m.status === "Now Showing",
        }));
        setMovies(mappedMovies);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const nowShowingMovies = movies.filter((m) => m.isNowShowing);
  const comingSoonMovies = movies.filter((m) => !m.isNowShowing);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Quick Booking Bar */}
        <div className="container mx-auto px-4">
          <QuickBookingBar />
        </div>

        {/* Movie Section */}
        <section className="container mx-auto px-4 py-12">
          <Tabs defaultValue="now-showing" className="w-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Phim
              </h2>
              <TabsList className="bg-muted">
                <TabsTrigger
                  value="now-showing"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Đang Chiếu
                </TabsTrigger>
                <TabsTrigger
                  value="coming-soon"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Sắp Chiếu
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="now-showing" className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : nowShowingMovies.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Hiện chưa có phim đang chiếu
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
                  {nowShowingMovies.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="coming-soon" className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : comingSoonMovies.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Chưa có phim sắp chiếu
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
                  {comingSoonMovies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      showBookButton={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Promotions Banner */}
        <section className="bg-gradient-to-r from-secondary via-cinema-blue-light to-secondary py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-secondary-foreground mb-4">
              Ưu Đãi Đặc Biệt
            </h2>
            <p className="text-secondary-foreground/80 mb-6 max-w-2xl mx-auto">
              {isAuthenticated
                ? "Tận hưởng các ưu đãi đặc biệt dành riêng cho thành viên Galaxy!"
                : "Đăng ký thành viên Galaxy để nhận ngay voucher giảm 50.000đ cho lần đặt vé đầu tiên!"}
            </p>
            {isAuthenticated ? (
              <Link to="/promotions">
                <button className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                  Xem Ưu Đãi
                </button>
              </Link>
            ) : (
              <Link to="/register">
                <button className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                  Đăng Ký Ngay
                </button>
              </Link>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
