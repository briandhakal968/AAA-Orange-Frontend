"use client";

import { useRef } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import type { Product } from "@/lib/products";
import { useCountry } from "@/context/country-context";

interface ProductSliderProps {
  products?: Product[];
  label?: string;
  heading?: string;
}

export function ProductSlider({ products = [], label = "Featured", heading = "Top Selling" }: ProductSliderProps) {
  const swiperRef = useRef<any>(null);
  const { selectedCountry } = useCountry();

  return (
    <section className="bg-white">
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
              className="w-5 h-5 md:w-6 md:h-6 bg-transparent flex items-center justify-center p-0"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="w-5 h-5 md:w-6 md:h-6 bg-transparent flex items-center justify-center p-0 translate-x-[3px]"
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
          slidesPerView={4}
          slidesPerGroup={1}
          spaceBetween={16}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            0: { slidesPerView: 2, spaceBetween: 4 },
            480: { slidesPerView: 2, spaceBetween: 8 },
            640: { slidesPerView: 3, spaceBetween: 12 },
            1024: { slidesPerView: 4, spaceBetween: 16 },
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
        >
          {products.map((product) => {
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
                  <Link
                    href={`/products/${product.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 mb-1 md:mb-2">
                      <img
                        src={product.image || ""}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <h3 className="text-sm font-medium text-black md:line-clamp-2 truncate group-hover:text-[var(--primary)] transition-colors">
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
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
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