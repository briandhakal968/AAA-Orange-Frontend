"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./auth-context";
import { api } from "@/lib/api";
import { Product } from "@/lib/products";

interface WishlistContextType {
  wishlist: Product[];
  loading: boolean;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (productId: number) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isLoggedIn) {
      setWishlist([]);
      return;
    }

    setLoading(true);
    try {
      const data = await api.get<Product[]>("/wishlist");
      setWishlist(data);
    } catch (err) {
      if (err instanceof Error && !err.message.includes('401')) {
        console.error("Error fetching wishlist:", err);
      }
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!authLoading) {
      fetchWishlist();
    }
  }, [authLoading, fetchWishlist]);

  const addToWishlist = async (productId: number) => {
    if (!isLoggedIn) {
      throw new Error("Login required to add to wishlist");
    }
    await api.post("/wishlist", { product_id: productId });
    await fetchWishlist();
  };

  const removeFromWishlist = async (productId: number) => {
    if (!isLoggedIn) {
      throw new Error("Login required");
    }
    await api.delete(`/wishlist/${productId}`);
    setWishlist(prev => prev.filter(p => p.id !== productId));
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some(p => p.id === productId);
  };

  const toggleWishlist = async (productId: number) => {
    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
