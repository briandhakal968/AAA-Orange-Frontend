"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const slides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=80",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&q=80",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1920&q=80",
  },
];

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = slides.length;

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => {
      setIsAutoPlaying(true);
      setIsTransitioning(false);
    }, 3000);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => prev + 1);
  }, [isTransitioning]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => prev - 1);
  }, [isTransitioning]);

  useEffect(() => {
    if (!isAutoPlaying || isTransitioning) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, isTransitioning, nextSlide]);

  const handleTransitionEnd = () => {
    if (currentSlide >= totalSlides + 1) {
      setCurrentSlide(1);
      containerRef.current?.style.setProperty('transition', 'none');
      containerRef.current?.offsetHeight;
      containerRef.current?.style.setProperty('transition', 'transform 500ms ease');
    } else if (currentSlide <= 0) {
      setCurrentSlide(totalSlides);
      containerRef.current?.style.setProperty('transition', 'none');
      containerRef.current?.offsetHeight;
      containerRef.current?.style.setProperty('transition', 'transform 500ms ease');
    }
    setIsTransitioning(false);
  };

  const getSlideImage = (index: number) => {
    if (index === 0) return slides[totalSlides - 1].image;
    if (index > totalSlides) return slides[0].image;
    return slides[index - 1].image;
  };

  return (
    <section className="relative h-[50vh] md:h-[60vh] lg:h-[70vh] w-full overflow-hidden select-none bg-black">
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={containerRef}
          className="flex h-full"
          style={{ 
            transform: `translateX(-${currentSlide * 100}%)`,
            transition: 'transform 500ms ease'
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          <div className="w-full h-full flex-shrink-0 relative">
            <img
              src={slides[totalSlides - 1].image}
              alt="Last slide"
              className="w-full h-full object-cover object-center"
            />
          </div>
          {slides.map((slide, index) => (
            <div key={slide.id} className="w-full h-full flex-shrink-0 relative">
              <img
                src={slide.image}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover object-center"
              />
            </div>
          ))}
          <div className="w-full h-full flex-shrink-0 relative">
            <img
              src={slides[0].image}
              alt="First slide"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </div>

      <button
        onClick={prevSlide}
        disabled={isTransitioning}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md hover:bg-white/25 transition-all duration-300 rounded-full z-10 disabled:opacity-50"
        aria-label="Previous slide"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      
      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md hover:bg-white/25 transition-all duration-300 rounded-full z-10 disabled:opacity-50"
        aria-label="Next slide"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index + 1)}
            className="h-1 rounded-full bg-white/30 hover:bg-white/50 transition-all duration-300"
            style={{ width: index + 1 === currentSlide || (currentSlide === 0 && index === totalSlides - 1) || (currentSlide === totalSlides + 1 && index === 0) ? 48 : 16 }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="absolute top-4 right-4 z-10">
        <span className="text-white/60 text-xs tracking-widest">
          {String(currentSlide === 0 ? totalSlides : currentSlide > totalSlides ? 1 : currentSlide).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
        </span>
      </div>
    </section>
  );
}