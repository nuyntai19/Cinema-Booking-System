import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { movies, cinemas, generateShowtimes } from '@/data/mockData';
import { useBooking } from '@/contexts/AppContext';

const QuickBookingBar: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedMovie, setSelectedCinema, setSelectedShowtime } = useBooking();
  const [movieId, setMovieId] = useState<string>('');
  const [cinemaId, setCinemaId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');

  const nowShowingMovies = movies.filter(m => m.isNowShowing);
  
  // Generate dates for next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: d.toISOString().split('T')[0],
      label: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }),
    };
  });

  // Generate showtimes based on selection
  const showtimes = movieId && cinemaId ? generateShowtimes(movieId, cinemaId) : [];
  const availableTimes = date
    ? [...new Set(showtimes.filter(s => s.date === date).map(s => s.time))]
    : [];

  const handleBooking = () => {
    if (!movieId || !cinemaId || !date || !time) return;
    
    const showtime = showtimes.find(s => s.date === date && s.time === time);
    if (showtime) {
      setSelectedMovie(movieId);
      setSelectedCinema(cinemaId);
      setSelectedShowtime(showtime);
      navigate(`/booking/seats`);
    }
  };

  return (
    <div className="quick-booking-bar">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Movie Select */}
        <div className="lg:col-span-1">
          <Select value={movieId} onValueChange={setMovieId}>
            <SelectTrigger className="h-12 bg-background">
              <SelectValue placeholder="Chọn phim" />
            </SelectTrigger>
            <SelectContent>
              {nowShowingMovies.map((movie) => (
                <SelectItem key={movie.id} value={movie.id}>
                  <span className="flex items-center gap-2">
                    <span className={`age-badge text-[10px] px-1.5 py-0 ${movie.ageRating === 'P' ? 'age-p' : movie.ageRating === 'T13' ? 'age-t13' : movie.ageRating === 'T16' ? 'age-t16' : 'age-t18'}`}>
                      {movie.ageRating}
                    </span>
                    {movie.title}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cinema Select */}
        <div className="lg:col-span-1">
          <Select value={cinemaId} onValueChange={setCinemaId} disabled={!movieId}>
            <SelectTrigger className="h-12 bg-background">
              <SelectValue placeholder="Chọn rạp" />
            </SelectTrigger>
            <SelectContent>
              {cinemas.map((cinema) => (
                <SelectItem key={cinema.id} value={cinema.id}>
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
