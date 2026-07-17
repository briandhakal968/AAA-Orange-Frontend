"use client";

import { useState } from "react";
import { ProductCard } from "@/components/ui/product-card";
import { useProducts } from "@/hooks/useProducts";
import { Container } from "@/components/ui/container";
import { useCountry } from "@/context/country-context";
import { isProductAvailableInCountry } from "@/lib/products";
import Link from "next/link";

interface ProductGridWithLoadMoreProps {
  title?: string;
  subtitle?: string;
  initialCount?: number;
}

export function ProductGridWithLoadMore({
  title = "You May Also Like",
  subtitle = "More products you'll love",
  initialCount = 8,
}: ProductGridWithLoadMoreProps) {
  const { products, loading } = useProducts();
  const { selectedCountry } = useCountry();
  const [visibleCount, setVisibleCount] = useState(initialCount);

  const filteredProducts = selectedCountry?.id
    ? products.filter(p => isProductAvailableInCountry(p, selectedCountry.id))
    : products;

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const loadMore = () => {
    setVisibleCount(prev => prev + 4);
  };

  if (loading) {
    return (
<section>
        <Container>
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 lg:gap-8">
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
    <section className="py-10 md:py-[60px]">
      <Container>
        <div className="mb-10 md:mb-14 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--primary)] mb-3">
            Explore
          </p>
          <h2 className="text-2xl md:text-3xl font-light tracking-tight text-black">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={loadMore}
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