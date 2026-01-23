import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { movies, cinemas } from "@/data/mockData";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const SchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedCinema, setSelectedCinema] = useState<string>("all");

  // Generate dates for the next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  // Mock showtimes data
  const showtimes = [
    { time: "09:00", available: true },
    { time: "11:30", available: true },
    { time: "14:00", available: false },
    { time: "16:30", available: true },
    { time: "19:00", available: true },
    { time: "21:30", available: true },
  ];

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
  };

  const getDayName = (date: Date) => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[date.getDay()];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Lịch Chiếu Phim
          </h1>
          <p className="text-muted-foreground">
            Xem lịch chiếu và đặt vé ngay hôm nay
          </p>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Chọn ngày
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {dates.map((date) => {
              const dateStr = date.toISOString().split("T")[0];
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span
                    className={`text-xs font-medium ${isToday(date) && !isSelected ? "text-primary" : ""}`}
                  >
                    {getDayName(date)}
                  </span>
                  <span className="text-xl font-bold">{date.getDate()}</span>
                  <span className="text-xs">
                    {date.toLocaleString("vi-VN", { month: "short" })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cinema Filter */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Chọn rạp
          </h2>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCinema === "all" ? "default" : "outline"}
              onClick={() => setSelectedCinema("all")}
            >
              Tất cả rạp
            </Button>
            {cinemas.map((cinema) => (
              <Button
                key={cinema.id}
                variant={selectedCinema === cinema.id ? "default" : "outline"}
                onClick={() => setSelectedCinema(cinema.id)}
              >
                {cinema.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Movies Schedule */}
        <div className="space-y-6">
          {movies
            .filter((m) => m.isNowShowing)
            .map((movie) => (
              <Card key={movie.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row gap-6 p-6">
                    {/* Movie Poster */}
                    <Link to={`/movie/${movie.id}`} className="flex-shrink-0">
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full md:w-32 h-48 object-cover rounded-lg hover:scale-105 transition-transform"
                      />
                    </Link>

                    {/* Movie Info & Showtimes */}
                    <div className="flex-1">
                      <Link to={`/movie/${movie.id}`} className="group">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                          {movie.title}
                        </h3>
                      </Link>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {movie.duration} phút
                        </span>
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                          {movie.ageRating}
                        </span>
                        <span>{movie.genre.join(", ")}</span>
                      </div>

                      {/* Showtimes Grid */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                          Suất chiếu:
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {showtimes.map((showtime) => (
                            <Link
                              key={showtime.time}
                              to={`/booking/seats?movie=${movie.id}&time=${showtime.time}`}
                              className={`px-4 py-2 text-center rounded-lg border-2 font-medium transition-all ${
                                showtime.available
                                  ? "border-border hover:border-primary hover:bg-primary hover:text-primary-foreground"
                                  : "border-border bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                              }`}
                            >
                              {showtime.time}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SchedulePage;
