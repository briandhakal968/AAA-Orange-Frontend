"use client";

import Link from "next/link";
import { useState } from "react";
import { Star } from "lucide-react";
import type { Product } from "@/lib/products";
import { useProducts } from "@/hooks/useProducts";
import { useCountry } from "@/context/country-context";
import { getProductPrice } from "@/lib/products";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { selectedCountry } = useCountry();

  const { price: rawPrice, stock } = getProductPrice(product, selectedCountry?.id);
  const price = Number(rawPrice);
  const currencySymbol = selectedCountry?.currency_symbol || '$';
  const currencyCode = selectedCountry?.currency || 'USD';

  const countryPrice = product.prices?.find(
    (p) => p.country_id === selectedCountry?.id
  );
  const salePrice = countryPrice?.sale_price ? Number(countryPrice.sale_price) : (product.sale_price ? Number(product.sale_price) : null);
  const displayPrice = salePrice || price;
  const discount = salePrice && price > 0 ? Math.round(((price - salePrice) / price) * 100) : 0;

  return (
    <div 
      className="group relative overflow-visible"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden bg-[var(--muted)] mb-4 rounded-[10px]">
        <Link 
          href={`/products/${product.slug || product.id}`}
          className="block w-full h-full"
        >
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
              isHovered ? "scale-105" : "scale-100"
            }`}
          />
          <div
            className={`absolute inset-0 bg-black/0 transition-all duration-500 ${
              isHovered ? "bg-black/5" : ""
            }`}
          />
          {stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xs uppercase tracking-[0.15em]">Sold Out</span>
            </div>
          )}
        </Link>
        
        {stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs uppercase tracking-[0.15em]">Sold Out</span>
          </div>
        )}
      </div>

      <Link href={`/products/${product.slug || product.id}`} className="block">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-black leading-tight group-hover:opacity-50 transition-opacity truncate">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            {salePrice && salePrice < price ? (
              <>
                  <p className="text-base text-[var(--primary)] font-medium">
                    {currencySymbol}{Math.round(salePrice)}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)] line-through">
                    {currencySymbol}{Math.round(price)}
                  </p>
                  {discount > 0 && (
                    <span className="text-[10px] font-medium text-white bg-[var(--primary)] px-2 py-0.5 rounded">
                      {discount}% OFF
                    </span>
                  )}
                </>
            ) : (
              <p className="text-base text-[var(--foreground)]/60">
                {currencySymbol}{Math.round(price)} {currencyCode !== 'USD' && `(${currencyCode})`}
              </p>
            )}
          </div>
          {(product.average_rating !== undefined && product.average_rating > 0 || product.reviews_count !== undefined && product.reviews_count > 0) && (
            <div className="flex items-center gap-1 pt-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-[var(--muted-foreground)]/70">
                {product.average_rating !== undefined && product.average_rating > 0 ? product.average_rating.toFixed(1) : '0'}
                {product.reviews_count !== undefined && product.reviews_count > 0 && (
                  <span className="text-[var(--muted-foreground)] ml-0.5">({product.reviews_count})</span>
                )}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

export function ProductGrid() {
  const { products } = useProducts();
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-3 lg:gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}