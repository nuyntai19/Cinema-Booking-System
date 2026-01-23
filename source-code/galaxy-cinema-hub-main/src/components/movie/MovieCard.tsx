import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Flag } from 'lucide-react';
import { Movie, AgeRating } from '@/types/cinema';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  movie: Movie;
  showBookButton?: boolean;
}

const getAgeRatingClass = (rating: AgeRating): string => {
  const classes: Record<AgeRating, string> = {
    'P': 'age-p',
    'T13': 'age-t13',
    'T16': 'age-t16',
    'T18': 'age-t18',
    'C': 'bg-gray-500 text-white',
  };
  return classes[rating];
};

const MovieCard: React.FC<MovieCardProps> = ({ movie, showBookButton = true }) => {
  return (
    <div className="group relative bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 animate-fade-in">
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3">
          <span className={cn('age-badge', getAgeRatingClass(movie.ageRating))}>
            {movie.ageRating}
          </span>
        </div>
        
        {movie.origin === 'VN' && (
          <div className="absolute top-3 right-3">
            <div className="w-8 h-6 bg-red-600 rounded flex items-center justify-center">
              <Flag className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-4 gap-3">
          {movie.trailerUrl && (
            <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Play className="w-4 h-4 mr-2" />
              Xem Trailer
            </Button>
          )}
          {showBookButton && movie.isNowShowing && (
            <Link to={`/movie/${movie.id}`} className="w-full">
              <Button className="w-full bg-primary hover:bg-primary/90">
                Đặt Vé Ngay
              </Button>
            </Link>
          )}
          {!movie.isNowShowing && (
            <span className="text-white/80 text-sm">Sắp khởi chiếu</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{movie.duration} phút</span>
          <span className="mx-1">•</span>
          <span className="line-clamp-1">{movie.genre.join(', ')}</span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
