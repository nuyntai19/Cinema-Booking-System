import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { apiCall, API_ENDPOINTS, getImageUrl } from '@/lib/api';

interface HeroBannerProps {
  slides?: {
    image_url: string;
    title?: string | null;
    target_url?: string | null;
  }[];
}

const defaultSlides = [
  {
    image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&h=600&fit=crop',
    title: 'Experience Cinema',
  },
  {
    image_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=600&fit=crop',
    title: 'Premium Movies',
  },
  {
    image_url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1920&h=600&fit=crop',
    title: 'IMAX Experience',
  },
];

const HeroBanner: React.FC<HeroBannerProps> = ({ slides: initialSlides }) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [activeSlides, setActiveSlides] = React.useState(initialSlides || defaultSlides);

  React.useEffect(() => {
    if (initialSlides) return; // If manually passed
    const fetchBanners = async () => {
      try {
        const res = await apiCall<{ success: boolean; data: { posters: any[] } }>(API_ENDPOINTS.POSTERS);
        if (res.success && res.data?.posters?.length > 0) {
          setActiveSlides(res.data.posters);
        }
      } catch (err) {
        // keep default
      }
    };
    fetchBanners();
  }, [initialSlides]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);

  return (
    <div className="relative w-full aspect-[2.4/1] sm:aspect-[2.2/1] lg:aspect-[2/1] max-h-[750px] overflow-hidden bg-secondary">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {activeSlides.map((slide, index) => (
          <div
            key={index}
            className="min-w-full h-full relative cursor-pointer group"
            onClick={() => {
               if (slide.target_url) window.location.href = slide.target_url;
            }}
          >
            <img
              src={getImageUrl(slide.image_url)}
              alt={slide.title || `Slide ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Gradient Overlay - keeps center clear */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 group-hover:opacity-80 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">
               {slide.target_url && (
                  <span className="bg-primary/90 hidden sm:inline-block px-4 py-2 rounded-full text-sm font-semibold shadow-lg">Khám phá ngay</span>
               )}
            </div>
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
        {activeSlides.map((_, index) => (
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
