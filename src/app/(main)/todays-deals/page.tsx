"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import type { Product } from "@/lib/products";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const res = await fetch(`${API_URL}/api/todays-deals`);
        if (!res.ok) throw new Error("Failed to fetch today's deals");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching today's deals:", err);
        setError("Failed to load Today's Deals.");
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  return (
    <Container>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Today's Deals</h1>
          <p className="text-sm text-gray-500 mt-2">Special offers with discounted prices</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No deals available right now. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
