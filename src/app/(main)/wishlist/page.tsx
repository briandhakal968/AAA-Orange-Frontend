"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWishlist } from "@/context/wishlist-context";
import { useAuth } from "@/context/auth-context";
import { useCountry } from "@/context/country-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { selectedCountry } = useCountry();

  const handleRemove = async (productId: number) => {
    if (confirm("Remove this item from your wishlist?")) {
      await removeFromWishlist(productId);
    }
  };

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [authLoading, isLoggedIn, router]);

  if (authLoading || !isLoggedIn) {
    return (
      <main className="flex-1">
        <Container>
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        </Container>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex-1">
        <Container>
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <Container>
        <div className="py-8 md:py-12">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-black">
              Wishlist
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          {wishlist.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-gradient-to-b from-neutral-50 to-white">
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-neutral-700 mb-2">Your wishlist is empty</p>
                <p className="text-sm text-neutral-400 mb-6">Save items you like by clicking the heart icon.</p>
                <Link href="/shop">
                  <Button variant="primary" size="lg">
                    Browse Products
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
              {wishlist.map((product) => (
                <div key={product.id} className="border border-neutral-200 rounded-xl overflow-hidden group">
                  <Link href={`/products/${product.slug || product.id}`} className="block">
                    <div className="aspect-square bg-neutral-50 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-wider text-neutral-400 truncate">
                          {product.category?.name || 'Uncategorized'}
                        </p>
                        <Link href={`/products/${product.slug || product.id}`} className="block">
                          <h3 className="font-medium text-neutral-800 hover:text-neutral-600 truncate">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-sm font-semibold text-neutral-800 mt-1">
                          {selectedCountry?.currency_symbol || ''}{(() => {
                            const cp = product.prices?.find((p: any) => p.country_id === selectedCountry?.id);
                            return Number(cp?.price ?? product.price ?? 0).toFixed(2);
                          })()} {selectedCountry?.currency && <span className="text-xs text-neutral-400">{selectedCountry.currency}</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(product.id)}
                        className="ml-2 p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <Link href={`/products/${product.slug || product.id}`} className="block mt-3">
                      <Button variant="outline" size="sm" className="w-full">
                        View Product
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
