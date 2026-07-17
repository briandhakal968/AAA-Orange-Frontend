"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  position: number;
  image?: string;
}

interface CategorySectionItem {
  id: number;
  title: string;
  image: string;
  link: string;
}

interface CategorySection {
  id: number;
  title: string | null;
  subtitle: string | null;
  items: CategorySectionItem[];
}

const categoryIcons: Record<string, string> = {
  "ladies-wear": "👗",
  "mens-wear": "👔",
  "kids-wear": "👶",
  "dry-fish-seafoods": "🐟",
  "organic-foods-nepal": "🌿",
  "phone-accessories": "📱",
  "electric-appliances-home": "🏠",
  "kitchen-appliances": "🍳",
  "gifts-flowers": "🎁",
};

interface CategorySliderProps {
  className?: string;
  categories?: Category[];
  categorySection?: CategorySection | null;
}

export function CategorySlider({ className = "", categories: serverCategories, categorySection: serverCategorySection }: CategorySliderProps = {}) {
  const [categories, setCategories] = useState<Category[]>(serverCategories || []);
  const [loading, setLoading] = useState(!serverCategories);
  const [categorySection, setCategorySection] = useState<CategorySection | null>(serverCategorySection || null);
  const [dynamicItems, setDynamicItems] = useState<CategorySectionItem[]>(serverCategorySection?.items || []);
  const [heading, setHeading] = useState(serverCategorySection?.title || "Shop by Category");
  const [subheading, setSubheading] = useState(serverCategorySection?.subtitle || "Browse");
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    if (serverCategories && serverCategorySection) {
      setCategories(serverCategories);
      setCategorySection(serverCategorySection);
      setDynamicItems(serverCategorySection.items || []);
      if (serverCategorySection.title) setHeading(serverCategorySection.title);
      if (serverCategorySection.subtitle) setSubheading(serverCategorySection.subtitle);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        const sectionsRes = await fetch(`${API_URL}/api/home-sections`);
        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json();
          const catSection = sectionsData.find((s: any) => s.section_key === "category");
          if (catSection && catSection.items && catSection.items.length > 0) {
            setCategorySection(catSection);
            setDynamicItems(catSection.items);
            if (catSection.title) setHeading(catSection.title);
            if (catSection.subtitle) setSubheading(catSection.subtitle);
          }
        }
        
        const response = await fetch(`${API_URL}/api/categories`);
        if (response.ok) {
          const data = await response.json();
          const parentCategories = data.filter((c: Category) => !c.parent_id);
          setCategories(parentCategories);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serverCategories, serverCategorySection]);

  if (loading) return null;

  const displayItems = dynamicItems.length > 0 
    ? dynamicItems 
    : categories.map((cat) => ({
        id: cat.id,
        title: cat.name,
        image: cat.image || "",
        link: `/category/${cat.slug}`,
      }));

  if (displayItems.length === 0) return null;

  return (
    <section className={`bg-white ${className}`}>
      <Container>
        <div className="flex items-end justify-between mb-2 md:mb-4 -mx-3 px-3 md:mx-0 md:px-0">
          <div>
            <h2 className="text-lg md:text-2xl font-light tracking-tight text-black">
              {heading}
            </h2>
          </div>
          <div className="flex items-center gap-2.5 md:gap-2 mb-1 md:mb-0">
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="category-prev w-5 h-5 md:w-6 md:h-6 bg-transparent flex items-center justify-center p-0"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="category-next w-5 h-5 md:w-6 md:h-6 bg-transparent flex items-center justify-center p-0 translate-x-[3px]"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <Swiper
          modules={[Autoplay]}
          loop={true}
          slidesPerView={6}
          slidesPerGroup={1}
          spaceBetween={24}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            0: { slidesPerView: 3, spaceBetween: 4 },
            640: { slidesPerView: 3, spaceBetween: 8 },
            768: { slidesPerView: 4, spaceBetween: 12 },
            1024: { slidesPerView: 6, spaceBetween: 16 },
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
        >
          {displayItems.map((item, idx) => {
            const icon = categoryIcons[item.title.toLowerCase().replace(/\s+/g, "-")] || "📦";
            const LinkComponent = item.link ? Link : "div";

            return (
              <SwiperSlide key={item.id || idx}>
                <LinkComponent
                  href={item.link || "#"}
                  className={item.link ? "group block" : "block"}
                >
                   <div className="relative aspect-square rounded-lg md:rounded-xl overflow-hidden bg-neutral-100 mb-1 md:mb-2">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                        <span className="text-3xl">{icon}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-sm md:text-base">{icon}</span>
                    <h3 className="text-xs md:text-sm font-medium text-neutral-800 group-hover:text-black transition-colors truncate">
                      {item.title}
                    </h3>
                  </div>
                </LinkComponent>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </Container>
    </section>
  );
}
