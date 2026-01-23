import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroBannerProps {
  slides?: {
    image: string;
    title?: string;
  }[];
}

const defaultSlides = [
  {
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&h=600&fit=crop',
    title: 'Experience Cinema',
  },
  {
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=600&fit=crop',
    title: 'Premium Movies',
  },
  {
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1920&h=600&fit=crop',
    title: 'IMAX Experience',
  },
];

const HeroBanner: React.FC<HeroBannerProps> = ({ slides = defaultSlides }) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden bg-secondary">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="min-w-full h-full relative"
          >
            <img
              src={slide.image}
              alt={slide.title || `Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay - keeps center clear */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white hover:bg-black/50"
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white hover:bg-black/50"
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-primary w-8'
                : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;
