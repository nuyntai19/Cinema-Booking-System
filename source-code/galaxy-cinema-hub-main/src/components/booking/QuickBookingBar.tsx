import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useBooking } from "@/contexts/AppContext";
import { API_ENDPOINTS, API_BASE_URL, apiCall } from "@/lib/api";
import { Showtime } from "@/types/cinema";

interface Genre {
  id: number;
  name: string;
  description?: string;
}

interface MovieFromAPI {
  id: number;
  title: string;
  poster_url?: string;
  age_rating?: string;
  status: string;
  genres?: string;
}

const QuickBookingBar: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedMovie, setSelectedCinema, setSelectedShowtime } =
    useBooking();
  const [genreId, setGenreId] = useState<string>("");
  const [movieId, setMovieId] = useState<string>("");
  const [cinemaId, setCinemaId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");

  const [genres, setGenres] = useState<Genre[]>([]);
  const [moviesFromAPI, setMoviesFromAPI] = useState<MovieFromAPI[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [loadingMovies, setLoadingMovies] = useState(false);

  // Cinema & showtime states (from API)
  interface APICinema {
    id: number;
    name: string;
    address: string;
  }
  interface APIShowtime {
    id: number;
    movie_id: number;
    cinema_id: number;
    cinema_name: string;
    hall_name: string;
    start_time: string;
    total_seats: number;
    base_price?: number;
  }
  const [apiCinemas, setApiCinemas] = useState<APICinema[]>([]);
  const [apiShowtimes, setApiShowtimes] = useState<Showtime[]>([]);
  const [loadingCinemas, setLoadingCinemas] = useState(false);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);

  // Fetch genres from API
  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true);
      try {
        const response = await fetch(API_ENDPOINTS.GENRES);
        const data = await response.json();
        if (data.success && data.data) {
          setGenres(data.data.genres || data.data);
        }
      } catch (error) {
        console.error("Error fetching genres:", error);
      } finally {
        setLoadingGenres(false);
      }
    };

    fetchGenres();
  }, []);

  // Fetch movies from API
  useEffect(() => {
    const fetchMovies = async () => {
      setLoadingMovies(true);
      try {
        let url = `${API_ENDPOINTS.MOVIES}?status=Now Showing&limit=50`;

        // Add genre filter if selected (and not "all")
        if (genreId && genreId !== "all") {
          url += `&genre_id=${genreId}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        if (data.success && data.data) {
          setMoviesFromAPI(data.data.movies || []);
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoadingMovies(false);
      }
    };

    fetchMovies();
  }, [genreId]);

  // Fetch cinemas from API
  useEffect(() => {
    const fetchCinemas = async () => {
      setLoadingCinemas(true);
      try {
        const response = await apiCall<{ success: boolean; data: { cinemas: APICinema[] } }>(
          API_ENDPOINTS.CINEMAS
        );
        setApiCinemas(response.data?.cinemas || []);
      } catch (error) {
        console.error("Error fetching cinemas:", error);
      } finally {
        setLoadingCinemas(false);
      }
    };
    fetchCinemas();
  }, []);

  // Fetch showtimes from API when movie, cinema, and date are selected
  useEffect(() => {
    const fetchShowtimes = async () => {
      if (!movieId || !cinemaId || !date) {
        setApiShowtimes([]);
        return;
      }
      setLoadingShowtimes(true);
      try {
        const params = new URLSearchParams();
        params.append("movie_id", movieId);
        params.append("cinema_id", cinemaId);
        params.append("date", date);
        params.append("limit", "50");
        const response = await apiCall<{ success: boolean; data: { showtimes: APIShowtime[] } }>(
          `${API_ENDPOINTS.SHOWTIMES}?${params.toString()}`
        );
        const rawShowtimes = response.data?.showtimes || [];
        const mapped: Showtime[] = rawShowtimes.map((s) => {
          const startDate = new Date(s.start_time);
          return {
            id: String(s.id),
            movieId: String(s.movie_id),
            cinemaId: String(s.cinema_id),
            roomId: s.hall_name,
            date: startDate.toISOString().split("T")[0],
            time: startDate.toTimeString().slice(0, 5),
            price: {
              standard: s.base_price || 90000,
              vip: (s.base_price || 90000) * 1.5,
              couple: (s.base_price || 90000) * 2,
            },
            availableSeats: s.total_seats || 0,
            totalSeats: s.total_seats || 0,
          };
        });
        setApiShowtimes(mapped);
      } catch (error) {
        console.error("Error fetching showtimes:", error);
        setApiShowtimes([]);
      } finally {
        setLoadingShowtimes(false);
      }
    };
    fetchShowtimes();
  }, [movieId, cinemaId, date]);

  // Available times from API showtimes
  const availableTimes = [...new Set(apiShowtimes.map((s) => s.time))];

  // Generate dates for next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: d.toISOString().split("T")[0],
      label:
        i === 0
          ? "Hôm nay"
          : i === 1
            ? "Ngày mai"
            : d.toLocaleDateString("vi-VN", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            }),
    };
  });

  const handleBooking = () => {
    if (!movieId || !cinemaId || !date || !time) return;

    const showtime = apiShowtimes.find((s) => s.time === time);
    if (showtime) {
      setSelectedMovie(movieId);
      setSelectedCinema(cinemaId);
      setSelectedShowtime(showtime);
      navigate(`/booking/seats`);
    }
  };

  return (
    <div className="quick-booking-bar">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Genre Select */}
        <div className="lg:col-span-1">
          <Select
            value={genreId}
            onValueChange={(value) => {
              setGenreId(value);
              setMovieId(""); // Reset movie selection when genre changes
            }}
          >
            <SelectTrigger className="h-12 bg-background">
              <SelectValue placeholder="Chọn thể loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thể loại</SelectItem>
              {genres.map((genre) => (
                <SelectItem key={genre.id} value={genre.id.toString()}>
                  {genre.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Movie Select */}
        <div className="lg:col-span-1">
          <Select
            value={movieId}
            onValueChange={setMovieId}
            disabled={loadingMovies}
          >
            <SelectTrigger className="h-12 bg-background">
              <SelectValue
                placeholder={loadingMovies ? "Đang tải..." : "Chọn phim"}
              />
            </SelectTrigger>
            <SelectContent>
              {moviesFromAPI.map((movie) => (
                <SelectItem key={movie.id} value={movie.id.toString()}>
                  <span className="flex items-center gap-2">
                    {movie.age_rating && (
                      <span
                        className={`age-badge text-[10px] px-1.5 py-0 ${movie.age_rating === "P"
                          ? "age-p"
                          : movie.age_rating === "T13"
                            ? "age-t13"
                            : movie.age_rating === "T16"
                              ? "age-t16"
                              : "age-t18"
                          }`}
                      >
                        {movie.age_rating}
                      </span>
                    )}
                    {movie.title}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cinema Select */}
        <div className="lg:col-span-1">
          <Select
            value={cinemaId}
            onValueChange={setCinemaId}
            disabled={!movieId || loadingCinemas}
          >
            <SelectTrigger className="h-12 bg-background">
              <SelectValue placeholder={loadingCinemas ? "Đang tải..." : "Chọn rạp"} />
            </SelectTrigger>
            <SelectContent>
              {apiCinemas.map((cinema) => (
                <SelectItem key={cinema.id} value={cinema.id.toString()}>
                  {cinema.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Select */}
        <div className="lg:col-span-1">
          <Select value={date} onValueChange={setDate} disabled={!cinemaId}>
            <SelectTrigger className="h-12 bg-background">
              <SelectValue placeholder="Chọn ngày" />
            </SelectTrigger>
            <SelectContent>
              {dates.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Select */}
        <div className="lg:col-span-1">
          <Select value={time} onValueChange={setTime} disabled={!date}>
            <SelectTrigger className="h-12 bg-background">
              <SelectValue placeholder="Chọn suất" />
            </SelectTrigger>
            <SelectContent>
              {availableTimes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Book Button */}
        <div className="lg:col-span-1">
          <Button
            onClick={handleBooking}
            disabled={!movieId || !cinemaId || !date || !time}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base"
          >
            <Ticket className="w-5 h-5 mr-2" />
            Mua Vé
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickBookingBar;
