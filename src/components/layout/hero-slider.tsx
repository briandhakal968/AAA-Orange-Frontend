"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { useState, useEffect } from "react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface HeroSlide {
  id: number;
  image: string | null;
  title: string | null;
  description: string | null;
  link: string | null;
}

const defaultSlides: HeroSlide[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=80",
    title: null,
    description: null,
    link: null,
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&q=80",
    title: null,
    description: null,
    link: null,
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1920&q=80",
    title: null,
    description: null,
    link: null,
  },
];

function getBaseUrl() {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }
  return "http://localhost:8000";
}

async function fetchHeroSlides(): Promise<HeroSlide[]> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/home-sections?key=hero`);
    if (!response.ok) return defaultSlides;
    const sections = await response.json();
    const heroSection = sections.find((s: { section_key: string }) => s.section_key === "hero");
    if (!heroSection?.items || heroSection.items.length === 0) return defaultSlides;
    const validSlides = heroSection.items
      .filter((item: HeroSlide) => item.image && (item.image.startsWith('http://') || item.image.startsWith('https://')))
      .map((item: HeroSlide) => ({
        id: item.id,
        image: item.image,
        title: item.title,
        description: item.description,
        link: item.link,
      }));
    return validSlides.length > 0 ? validSlides : defaultSlides;
  } catch {
    return defaultSlides;
  }
}

function isValidImageUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

interface HeroSliderProps {
  slides?: HeroSlide[];
}

export function HeroSlider({ slides: serverSlides }: HeroSliderProps = {}) {
  const [slides, setSlides] = useState<HeroSlide[]>(serverSlides || defaultSlides);
  const [loading, setLoading] = useState(!serverSlides);

  useEffect(() => {
    if (serverSlides && serverSlides.length > 0) {
      setSlides(serverSlides);
      setLoading(false);
      return;
    }
    fetchHeroSlides().then((data) => {
      const validSlides = data.filter(s => isValidImageUrl(s.image));
      setSlides(validSlides.length > 0 ? validSlides : defaultSlides);
      setLoading(false);
    });
  }, [serverSlides]);

  if (loading) {
    return (
    <section className="relative h-[18vh] md:h-[50vh] lg:h-[60vh] w-full overflow-hidden select-none bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[18vh] md:h-[50vh] lg:h-[60vh] w-full overflow-hidden select-none bg-black">
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        slidesPerView={1}
        loop={true}
        speed={800}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        navigation={{
          prevEl: ".hero-prev",
          nextEl: ".hero-next",
        }}
        pagination={{
          clickable: true,
          el: ".hero-pagination",
          renderBullet: (index, className) => {
            return `<button class="${className}" aria-label="Go to slide ${index + 1}"></button>`;
          },
        }}
        className="h-full w-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} className="relative">
            {slide.image ? (
              <img
                src={slide.image}
                alt={slide.title || "Slide"}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : null}
          </SwiperSlide>
        ))}
      </Swiper>

      <button
        className="hero-prev hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white/10 backdrop-blur-md hover:bg-white/25 transition-all duration-300 rounded-full z-10"
        aria-label="Previous slide"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      
      <button
        className="hero-next hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white/10 backdrop-blur-md hover:bg-white/25 transition-all duration-300 rounded-full z-10"
        aria-label="Next slide"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div className="hero-pagination absolute bottom-6 left-1/2 -translate-x-1/2 z-10" />
    </section>
  );
}
