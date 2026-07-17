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

const LOCAL_STORAGE_KEY = "aaaorange_wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [localWishlist, setLocalWishlist] = useState<Product[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        setLocalWishlist(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse local wishlist:", e);
      }
    }
    setInitialized(true);
  }, [initialized]);

  useEffect(() => {
    if (initialized && !isLoggedIn) {
      setWishlist(localWishlist);
    }
  }, [initialized, isLoggedIn, localWishlist]);

  const fetchWishlist = useCallback(async () => {
    if (!isLoggedIn) {
      return;
    }

    setLoading(true);
    try {
      const data = await api.get<Product[]>("/wishlist");
      setWishlist(data);
    } catch (err) {
      // Silently handle 401 errors (unauthenticated)
      if (err instanceof Error && !err.message.includes('401')) {
        console.error("Error fetching wishlist:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!authLoading && initialized) {
      fetchWishlist();
    }
  }, [authLoading, initialized, fetchWishlist]);

  const saveLocalWishlist = (items: Product[]) => {
    setLocalWishlist(items);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  };

  const addToWishlist = async (productId: number) => {
    try {
      if (isLoggedIn) {
        await api.post("/wishlist", { product_id: productId });
        await fetchWishlist();
      } else {
        const productData = await api.get<Product>(`/products/${productId}`);
        const exists = localWishlist.some(p => p.id === productId);
        if (!exists) {
          const newList = [...localWishlist, productData];
          saveLocalWishlist(newList);
        }
      }
    } catch (err) {
      console.error("Error adding to wishlist:", err);
      throw err;
    }
  };

  const removeFromWishlist = async (productId: number) => {
    try {
      if (isLoggedIn) {
        await api.delete(`/wishlist/${productId}`);
        setWishlist(prev => prev.filter(p => p.id !== productId));
      } else {
        saveLocalWishlist(localWishlist.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      throw err;
    }
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
