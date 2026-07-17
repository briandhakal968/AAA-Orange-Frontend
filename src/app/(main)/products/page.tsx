"use client";

import { useState } from "react";
import { ProductCard } from "@/components/ui/product-card";
import { useProducts } from "@/hooks/useProducts";
import { Container } from "@/components/ui/container";

const categories = [
  { value: "all", label: "All" },
  { value: "bags", label: "Bags" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
];

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { products, loading, error } = useProducts();

  const filteredProducts = products.filter(
    (product) =>
      activeCategory === "all" || product.category?.name?.toLowerCase() === activeCategory
  );

  if (loading) {
    return (
      <main className="flex-1">
        <section className="py-12 md:py-16">
          <Container>
            <div className="mb-8 md:mb-12">
              <h1 className="text-2xl md:text-3xl font-light tracking-tight text-black mb-2">
                All Products
              </h1>
            </div>
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
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1">
        <section className="py-12 md:py-16">
          <Container>
            <div className="text-center py-20">
              <p className="text-red-500">{error}</p>
            </div>
          </Container>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="py-12 md:py-16">
        <Container>
          <div className="mb-8 md:mb-12">
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-black mb-2">
              All Products
            </h1>
            <p className="text-sm text-neutral-500">
              {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
            </p>
          </div>

          <div className="flex items-center gap-6 md:gap-10 mb-10 md:mb-14 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setActiveCategory(category.value)}
                className={`text-xs md:text-sm tracking-wide whitespace-nowrap pb-1 transition-all duration-200 ${
                  activeCategory === category.value
                    ? "text-black border-b border-black"
                    : "text-neutral-400 hover:text-black"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-neutral-500">No products found in this category.</p>
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
