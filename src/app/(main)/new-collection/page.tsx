"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import { useProducts } from "@/hooks/useProducts";

export default function NewCollectionPage() {
  const [loading, setLoading] = useState(true);
  const { products } = useProducts();

  useEffect(() => {
    if (products.length > 0) {
      setLoading(false);
    }
  }, [products]);

  return (
    <Container>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">New Collection</h1>
          <p className="text-sm text-gray-500 mt-2">Check out our latest arrivals</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
            {products.slice(0, 12).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}