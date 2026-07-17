"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ui/product-card";
import { useProducts } from "@/hooks/useProducts";
import { Container } from "@/components/ui/container";
import { useCountry } from "@/context/country-context";
import { isProductAvailableInCountry, getTopSellingProducts, type Product } from "@/lib/products";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface ProductGridSectionProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  hideHeading?: boolean;
  filter?: string;
  enableLoadMore?: boolean;
  pageSize?: number;
}

export function ProductGridSection({
  title = "New Arrivals",
  subtitle = "Discover our latest collection",
  limit,
  hideHeading = false,
  filter = "all",
  enableLoadMore = false,
  pageSize = 12,
}: ProductGridSectionProps) {
  const { products, loading: productsLoading } = useProducts();
  const { selectedCountry } = useCountry();
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [topSellingLoading, setTopSellingLoading] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(pageSize);
  const [shuffledProducts, setShuffledProducts] = useState<Product[]>([]);

  useEffect(() => {
    setShuffledProducts(shuffleArray(products));
  }, [products]);

  useEffect(() => {
    if (filter === "top_selling") {
      setTopSellingLoading(true);
      getTopSellingProducts(limit)
        .then((data) => {
          setTopSellingProducts(data);
        })
        .catch((err) => {
          console.error("Failed to fetch top selling products:", err);
          setTopSellingProducts([]);
        })
        .finally(() => {
          setTopSellingLoading(false);
        });
    }
  }, [filter, limit]);

  const viewLink = useMemo(() => {
    switch (filter) {
      case "latest":
        return "/new-collection";
      case "featured":
        return "/products?featured=true";
      case "top_selling":
        return "/top-selling";
      default:
        return "/products";
    }
  }, [filter]);

  const filteredProducts = useMemo(() => {
    if (filter === "top_selling") {
      let result = [...topSellingProducts];
      if (selectedCountry?.id) {
        result = result.filter((p) => isProductAvailableInCountry(p, selectedCountry.id));
      }
      return result;
    }

    let result = [...products];

    switch (filter) {
      case "latest":
        result = shuffledProducts.length > 0 ? [...shuffledProducts] : shuffleArray(result);
        break;
      case "featured":
        result = result.filter((p) => p.featured);
        break;
      case "all":
      default:
        break;
    }

    if (selectedCountry?.id) {
      result = result.filter((p) => isProductAvailableInCountry(p, selectedCountry.id));
    }

    if (enableLoadMore) {
      result = result.slice(0, displayLimit);
    } else if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [products, filter, limit, selectedCountry, topSellingProducts, enableLoadMore, displayLimit, shuffledProducts]);

  const totalFilteredCount = useMemo(() => {
    if (filter === "top_selling") {
      let result = [...topSellingProducts];
      if (selectedCountry?.id) {
        result = result.filter((p) => isProductAvailableInCountry(p, selectedCountry.id));
      }
      return result.length;
    }

    let result = [...products];
    switch (filter) {
      case "latest":
        result = shuffledProducts.length > 0 ? [...shuffledProducts] : shuffleArray(result);
        break;
      case "featured":
        result = result.filter((p) => p.featured);
        break;
    }
    if (selectedCountry?.id) {
      result = result.filter((p) => isProductAvailableInCountry(p, selectedCountry.id));
    }
    return result.length;
  }, [products, filter, selectedCountry, topSellingProducts, shuffledProducts]);

  const loading = productsLoading || (filter === "top_selling" && topSellingLoading);

  const skeletonCount = enableLoadMore ? pageSize : (limit || 4);

  if (loading) {
    return (
      <section>
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-3 lg:gap-4">
            {[...Array(skeletonCount)].map((_, i) => (
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
        {!hideHeading && (
          <div className="flex items-end justify-between mb-2 md:mb-4 -mx-3 px-3 md:mx-0 md:px-0">
            <div>
              <h2 className="text-lg md:text-2xl font-light tracking-tight text-black">
                {title}
              </h2>
            </div>
            <Link
              href={viewLink}
              className="text-lg text-[var(--primary)] hover:underline underline-offset-4 mb-1 md:mb-0"
            >
              View All
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-3 lg:gap-4 overflow-visible">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {enableLoadMore && filteredProducts.length < totalFilteredCount && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setDisplayLimit((prev) => prev + pageSize)}
              className="px-8 py-3 bg-transparent text-[var(--primary)] border border-[var(--primary)] rounded-full text-sm font-medium tracking-wide hover:bg-[var(--primary)] hover:text-white transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </Container>
    </section>
  );
}
