"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { HeroSlider } from "@/components/layout/hero-slider";
import { useProducts } from "@/hooks/useProducts";
import { useCountry } from "@/context/country-context";
import { isProductAvailableInCountry } from "@/lib/products";

type FullProduct = Product;

interface HomeSection {
  id: number;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  background_image: string | null;
  link: string | null;
  button_text: string | null;
  position: number;
  is_active: boolean;
  settings: Record<string, unknown> | null;
  items?: HomeSectionItem[];
}

interface HomeSectionItem {
  id: number;
  home_section_id: number;
  title: string | null;
  description: string | null;
  image: string | null;
  link: string | null;
  price: number | null;
  sale_price: number | null;
  badge: string | null;
  button_text: string | null;
  position: number;
  product_id: number | null;
  meta: Record<string, unknown> | null;
  product?: FullProduct;
}

type Product = {
  id: number;
  name: string;
  slug: string;
  image: string;
  price: number;
  sale_price?: number | null;
  category_id?: number | null;
  category?: { id: number; name: string; slug: string };
};

function HeroSliderWithMargin() {
  return <HeroSlider />;
}

function FeaturedProductsSection({ section }: { section: HomeSection }) {
  const { products, loading } = useProducts();
  const { selectedCountry } = useCountry();
  const swiperRef = useRef<any>(null);
  
  const categoryId = section.settings?.category_id 
    ? Number(section.settings.category_id) 
    : null;
  const limit = section.settings?.limit ? Number(section.settings.limit) : 8;

  const filteredProducts = selectedCountry?.id
    ? products.filter(p => isProductAvailableInCountry(p, selectedCountry.id))
    : products;
    
  const categoryProducts = categoryId
    ? filteredProducts.filter(p => p.category_id === categoryId).slice(0, limit)
    : filteredProducts.slice(0, limit);

  const displayProducts = section.items?.length 
    ? section.items.map(item => item.product).filter(Boolean).slice(0, limit)
    : categoryProducts;

  const slidesPerView = section.settings?.slides_per_view 
    ? Number(section.settings.slides_per_view) 
    : 4;

  if (loading) {
    return (
      <section>
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-neutral-200 aspect-square mb-4" />
                <div className="h-4 bg-neutral-200 w-3/4 mb-2" />
                <div className="h-4 bg-neutral-200 w-1/2" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    );
  }

    return (
      <section>
        <Container>
          <div className="flex items-end justify-between mb-2 md:mb-4 -mx-3 px-3 md:mx-0 md:px-0">
          <div>
            <h2 className="text-base md:text-xl font-light tracking-tight text-[var(--foreground)]">
              {section.title || "Featured Products"}
            </h2>
          </div>
          <div className="flex items-center gap-2.5 md:gap-2 mb-1 md:mb-0">
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="product-prev w-5 h-5 md:w-6 md:h-6 bg-transparent flex items-center justify-center p-0"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="product-next w-5 h-5 md:w-6 md:h-6 bg-transparent flex items-center justify-center p-0 translate-x-[3px]"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <Swiper
          modules={[Navigation]}
          loop={true}
          slidesPerView={slidesPerView}
          spaceBetween={24}
          navigation={{
            prevEl: ".product-prev",
            nextEl: ".product-next",
          }}
          breakpoints={{
            0: { slidesPerView: 2, spaceBetween: 12 },
            480: { slidesPerView: 2, spaceBetween: 16 },
            640: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: slidesPerView > 3 ? 4 : slidesPerView, spaceBetween: 24 },
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
        >
          {displayProducts.map((product: any) => {
              const countryPrice = product.prices?.find((p: any) => p.country_id === selectedCountry?.id);
              const basePrice = Number(countryPrice?.price ?? product.price ?? 0);
              const baseSale = countryPrice?.sale_price != null ? Number(countryPrice.sale_price) : (product.sale_price != null ? Number(product.sale_price) : null);
              const displayPrice = baseSale ?? basePrice;
              const discount = baseSale && basePrice > 0
                ? Math.round(((basePrice - baseSale) / basePrice) * 100)
                : 0;
              const sym = selectedCountry?.currency_symbol || '';
              return (
                <SwiperSlide key={product.id}>
                  <Link href={`/products/${product.slug}`} className="group block">
                     <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 mb-1 md:mb-2">
                      <img
                        src={product.image || ""}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <h3 className="text-sm font-medium text-black line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {baseSale ? (
                        <>
                          <span className="text-base font-medium text-[var(--primary)]">
                            {sym}{displayPrice.toLocaleString()}
                          </span>
                          <span className="text-sm text-neutral-400 line-through">
                            {sym}{basePrice.toLocaleString()}
                          </span>
                          {discount > 0 && (
                            <span className="text-[10px] font-medium text-white bg-[var(--primary)] px-2 py-0.5 rounded">
                              {discount}% OFF
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-base font-medium text-black">
                          {sym}{basePrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {(product.average_rating !== undefined && product.average_rating > 0 || product.reviews_count !== undefined && product.reviews_count > 0) && (
                      <div className="flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-xs text-[var(--muted-foreground)]/70">
                          {product.average_rating !== undefined && product.average_rating > 0 ? Number(product.average_rating).toFixed(1) : '0'}
                          {product.reviews_count !== undefined && product.reviews_count > 0 && (
                            <span className="text-[var(--muted-foreground)] ml-0.5">({product.reviews_count})</span>
                          )}
                        </span>
                      </div>
                    )}
                  </Link>
                </SwiperSlide>
              );
            })}
        </Swiper>
      </Container>
    </section>
  );
}

function BannerSection({ section }: { section: HomeSection }) {
  const items = section.items || [];
  const columns = section.settings?.columns ? Number(section.settings.columns) : 2;
  const aspectRatio = String(section.settings?.aspect_ratio || "3/2");

  const colClass = columns === 3 ? "md:grid-cols-3" : columns === 1 ? "md:grid-cols-1" : "md:grid-cols-2";

  return (
    <section>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div className={`grid grid-cols-1 ${colClass} gap-1 md:gap-3 lg:gap-4`}>
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.link || "#"}
              className="block relative group overflow-hidden rounded-xl"
            >
              <div className="relative" style={{ aspectRatio }}>
                <img
                  src={item.image || ""}
                  alt={item.title || "Banner"}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end">
                  <div className="p-6 md:p-10">
                    {item.badge && (
                      <p className="text-white/80 text-xs uppercase tracking-wider mb-2">
                        {item.badge}
                      </p>
                    )}
                    <h3 className="text-white text-2xl md:text-4xl font-light mb-4">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-white/80 text-sm mb-4">
                        {item.description}
                      </p>
                    )}
                    {item.link && (
                      <span className="inline-block text-white text-sm border border-white/40 px-5 py-2.5 rounded-full group-hover:bg-white group-hover:text-black transition-colors">
                        {item.button_text || "Shop Now"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {items.length === 0 && (
            <div className="col-span-full text-center py-12 text-neutral-400">
              No banners configured. Add banners from admin panel.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HeroBannerSection({ section }: { section: HomeSection }) {
  const items = section.items || [];
  const item = items[0];
  const imageUrl = section.background_image || item?.image || "";
  const linkUrl = section.link || item?.link || "/shop";

  return (
    <section>
      <Link href={linkUrl} className="block relative group overflow-hidden">
        <div className="relative aspect-[16/9] md:aspect-[21/9]">
          <img
            src={imageUrl}
            alt={section.title || "Banner"}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-end md:justify-center pb-12 md:pb-0">
            <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-light text-center mb-2">
              {section.title || "New Collection"}
            </h2>
            {section.subtitle && (
              <p className="text-white/80 text-center text-sm md:text-base mb-6 max-w-md">
                {section.subtitle}
              </p>
            )}
            {section.link && (
              <span className="inline-block bg-white text-black px-8 py-3 rounded-full font-medium group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                {section.button_text || "Shop Now"}
              </span>
            )}
          </div>
        </div>
      </Link>
    </section>
  );
}

function VerticalBannerSection({ section }: { section: HomeSection }) {
  const items = section.items || [];

  return (
    <section>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <Link 
              key={item.id} 
              href={item.link || "#"} 
              className="block relative aspect-square md:min-h-[100vh] group overflow-hidden rounded-xl"
            >
              <img
                src={item.image || ""}
                alt={item.title || "Banner"}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
                <div className="p-8 md:p-10">
                  {item.badge && (
                    <p className="text-white/80 text-xs uppercase tracking-wider mb-2">
                      {item.badge}
                    </p>
                  )}
                  <h3 className="text-white text-2xl md:text-3xl font-light">
                    {item.title}
                  </h3>
                  {item.link && (
                    <span className="inline-block mt-4 text-white text-sm border border-white/40 px-5 py-2.5 rounded-full group-hover:bg-white group-hover:text-black transition-colors">
                      {item.button_text || "Shop Now"}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategorySection({ section }: { section: HomeSection }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef<any>(null);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${API_URL}/api/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.filter((c: any) => !c.parent_id));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (!section.items?.length) {
      fetchCategories();
    } else {
      setLoading(false);
    }
  }, [section.items]);

  const items = section.items?.length 
    ? section.items 
    : categories.map((c: any) => ({
        id: c.id,
        title: c.name,
        description: c.slug,
        image: c.image,
        link: `/category/${c.slug}`
      }));

  if (loading || !items.length) {
    return (
      <section>
        <Container>
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-neutral-200 mb-8" />
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-neutral-200 aspect-square" />
              ))}
            </div>
          </div>
        </Container>
      </section>
    );
  }

    return (
      <section>
        <Container>
          <div className="flex items-end justify-between mb-2 md:mb-4 -mx-3 px-3 md:mx-0 md:px-0">
          <div>
            <h2 className="text-base md:text-xl font-light tracking-tight text-[var(--foreground)]">
              {section.title || "Shop by Category"}
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
          modules={[Navigation]}
          loop={true}
          slidesPerView={6}
          spaceBetween={24}
          navigation={{
            prevEl: ".category-prev",
            nextEl: ".category-next",
          }}
          breakpoints={{
            0: { slidesPerView: 3, spaceBetween: 8 },
            640: { slidesPerView: 3, spaceBetween: 20 },
            768: { slidesPerView: 4, spaceBetween: 24 },
            1024: { slidesPerView: 6, spaceBetween: 24 },
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
        >
          {items.map((item: any) => (
            <SwiperSlide key={item.id}>
              <Link href={item.link || `/category/${item.description}`} className="group block">
                 <div className="relative aspect-square rounded-lg md:rounded-xl overflow-hidden bg-neutral-100 mb-1 md:mb-2">
                  <img
                    src={item.image || ""}
                    alt={item.title || "Category"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <h3 className="text-sm font-medium text-black group-hover:text-[var(--primary)] transition-colors">
                    {item.title}
                  </h3>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </section>
  );
}

function ProductGridSection({ section }: { section: HomeSection }) {
  const { products, loading } = useProducts();
  const { selectedCountry } = useCountry();
  
  const limit = section.settings?.limit ? Number(section.settings.limit) : 8;
  const categoryId = section.settings?.category_id 
    ? Number(section.settings.category_id) 
    : null;
  const showLoadMore = section.settings?.show_load_more === "true";

  const filteredProducts = selectedCountry?.id
    ? products.filter(p => isProductAvailableInCountry(p, selectedCountry.id))
    : products;
    
  const displayProducts = categoryId
    ? filteredProducts.filter(p => p.category_id === categoryId).slice(0, limit)
    : filteredProducts.slice(0, limit);

  const [visibleCount, setVisibleCount] = useState(limit);
  const shownProducts = displayProducts.slice(0, visibleCount);
  const hasMore = showLoadMore && visibleCount < displayProducts.length;

  if (loading) {
    return (
      <section>
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-neutral-200 aspect-square mb-4" />
                <div className="h-4 bg-neutral-200 w-3/4 mb-2" />
                <div className="h-4 bg-neutral-200 w-1/2" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section>
      <Container>
        <div className="text-center mb-2 md:mb-4">
            <h2 className="text-base md:text-xl font-light tracking-tight text-[var(--foreground)]">
              {section.title || "Featured Products"}
          </h2>
        </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-3 lg:gap-4">
           {shownProducts.map((product) => (
             <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setVisibleCount(prev => prev + 4)}
              className="inline-block px-8 py-3 border border-[var(--primary)] text-[var(--primary)] rounded-full hover:bg-[var(--primary)] hover:text-white transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </Container>
    </section>
  );
}

export function DynamicSection({ section }: { section: HomeSection }) {
  switch (section.section_key) {
    case "hero":
    case "hero_slider":
      return <HeroSliderWithMargin />;
    case "hero_banner":
    case "full_banner":
      return <HeroBannerSection section={section} />;
    case "promo_banner":
    case "banner":
    case "promo":
      return <BannerSection section={section} />;
    case "vertical_banner":
    case "tall_banner":
      return <VerticalBannerSection section={section} />;
    case "product_slider":
    case "bestsellers":
    case "featured":
    case "new_arrivals":
    case "deals":
      return <FeaturedProductsSection section={section} />;
    case "product_grid":
    case "products":
      return <ProductGridSection section={section} />;
    case "category_slider":
    case "categories":
      return <CategorySection section={section} />;
    default:
      return <FeaturedProductsSection section={section} />;
  }
}