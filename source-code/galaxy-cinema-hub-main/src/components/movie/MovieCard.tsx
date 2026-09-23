import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Play, Clock, Flag, Star } from "lucide-react";
import { Movie, AgeRating } from "@/types/cinema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  movie: Movie;
  showBookButton?: boolean;
}

// Fix: Fully exhaustive Record<AgeRating, string> including "K" so TypeScript never reports error
const getAgeRatingClass = (rating: AgeRating): string => {
  const classes: Record<AgeRating, string> = {
    P: "bg-emerald-600 text-white border-emerald-400/40",
    K: "bg-blue-600 text-white border-blue-400/40",
    T13: "bg-amber-500 text-black border-amber-300/40",
    T16: "bg-orange-600 text-white border-orange-400/40",
    T18: "bg-rose-600 text-white border-rose-400/40",
    C: "bg-zinc-700 text-white border-zinc-500/40",
  };
  return classes[rating] || "bg-zinc-700 text-white border-zinc-500/40";
};

// Derive format tag (IMAX / 3D / ATMOS) inspired by Reference Image 2
const getCinemaFormat = (movie: Movie): string => {
  const idNum = parseInt(movie.id, 10) || movie.title.length;
  if (idNum % 3 === 0) return "IMAX";
  if (idNum % 3 === 1) return "DOLBY ATMOS";
  return "3D DIGITAL";
};

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  showBookButton = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    setTilt({
      x: rotateX,
      y: rotateY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  const handleWatchTrailer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (movie.trailerUrl) {
      window.open(movie.trailerUrl, "_blank");
    }
  };

  const format = getCinemaFormat(movie);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: isHovered
          ? "transform 0.1s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s"
          : "transform 0.5s ease-out, box-shadow 0.5s ease-out",
        transformStyle: "preserve-3d",
      }}
      className="group relative bg-[#0f141c] rounded-2xl overflow-hidden border border-zinc-800/80 hover:border-primary/50 shadow-md hover:shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition-all duration-300 select-none flex flex-col"
    >
      {/* Glare Highlight Overlay on Hover (Soft and subtle) */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none z-30 opacity-20 transition-opacity duration-200"
          style={{
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.4) 0%, transparent 65%)`,
          }}
        />
      )}

      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-950">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Top Badges (Age + Format + Rating) with 3D Depth */}
        <div
          className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none transition-transform duration-300"
          style={{ transform: isHovered ? "translateZ(20px)" : "translateZ(0)" }}
        >
          {/* Left: Age Badge & Subtle Format */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase shadow-md border backdrop-blur-md",
                getAgeRatingClass(movie.ageRating),
              )}
            >
              {movie.ageRating}
            </span>

            <span className="text-[10px] font-bold tracking-wider uppercase text-sky-300 bg-black/75 px-2 py-0.5 rounded border border-sky-400/25 backdrop-blur-md shadow-sm">
              {format}
            </span>

            {movie.statusType === "coming-soon" ? (
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-300 bg-black/80 px-2 py-0.5 rounded border border-amber-400/40 backdrop-blur-md shadow-sm">
                Sắp chiếu
              </span>
            ) : movie.statusType === "no-showtimes" ? (
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-300 bg-black/80 px-2 py-0.5 rounded border border-zinc-700/50 backdrop-blur-md shadow-sm">
                Chưa có suất
              </span>
            ) : null}
          </div>

          {/* Right: Star Rating & VN Flag */}
          <div className="flex items-center gap-1.5">
            {movie.origin === "VN" && (
              <div
                className="w-6 h-4.5 bg-red-600/90 rounded flex items-center justify-center shadow border border-red-400/30 backdrop-blur-sm"
                title="Phim Việt Nam"
              >
                <Flag className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300" />
              </div>
            )}

            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/75 text-amber-300 border border-amber-400/25 backdrop-blur-md text-[10px] font-bold">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>8.1</span>
            </div>
          </div>
        </div>

        {/* Hover Action Overlay (3D Floating Action) */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end p-4 gap-2.5 z-20"
          style={{ transform: isHovered ? "translateZ(25px)" : "translateZ(0)" }}
        >
          {movie.trailerUrl && (
            <button
              type="button"
              onClick={handleWatchTrailer}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
            >
              <div className="w-5 h-5 rounded-full border border-white/80 flex items-center justify-center shrink-0">
                <Play className="w-2.5 h-2.5 fill-white text-white" />
              </div>
              <span>Xem Trailer</span>
            </button>
          )}

          {showBookButton && (
            <Link to={`/movie/${movie.id}`} className="w-full">
              <Button className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(255,107,0,0.3)] transition-all active:scale-95">
                {movie.statusType === "now-showing" ? "Đặt Vé Ngay" : "Xem Chi Tiết"}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3.5 bg-gradient-to-b from-[#0f141c] to-[#0a0e14] flex-1 flex flex-col justify-between">
        <Link to={`/movie/${movie.id}`} className="block">
          <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 hover:text-primary transition-colors tracking-tight">
            {movie.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1.5">
          <div className="flex items-center gap-1 text-primary/90 font-medium">
            <Clock className="w-3 h-3" />
            <span>{movie.duration}p</span>
          </div>
          <span className="text-zinc-600">•</span>
          <span className="line-clamp-1 text-[11px] text-zinc-400">
            {movie.genre.join(", ")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;

