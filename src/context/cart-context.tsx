"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { Product } from "@/lib/products";
import { useAuth } from "./auth-context";
import { useCountry } from "./country-context";

export interface CartItem {
  product: Product | null;
  quantity: number;
  size: string;
  selectedColor?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (product: Product | null, size: string, quantity?: number, selectedColor?: string) => void;
  removeItem: (productId: number | string, size: string) => void;
  updateQuantity: (productId: number | string, size: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  mounted: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aaaorange_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { selectedCountry } = useCountry();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      setItems([]);
      try { localStorage.removeItem(CART_STORAGE_KEY); } catch {}
      setMounted(true);
      return;
    }
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load cart:', e);
    }
    setMounted(true);
  }, [isLoggedIn, authLoading]);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoggedIn) return;
    try {
      if (items.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
      } else {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [items, mounted, isLoggedIn]);

  const addItem = useCallback((product: Product | null, size: string, quantity = 1, selectedColor?: string) => {
    if (!product) return;
    setItems((currentItems) => {
      const existingIndex = currentItems.findIndex(
        (item) => item.product && String(item.product.id) === String(product.id) && item.size === size
      );

      if (existingIndex >= 0) {
        const updated = [...currentItems];
        const newQty = updated[existingIndex].quantity + quantity;
        const maxStock = product.prices?.find((p: any) => (p as any).country_id)?.stock ?? product.stock ?? Infinity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(newQty, maxStock),
          selectedColor: selectedColor || updated[existingIndex].selectedColor,
        };
        return updated;
      }

      const maxStock = product.prices?.find((p: any) => (p as any).country_id)?.stock ?? product.stock ?? Infinity;
      return [...currentItems, { product, size, quantity: Math.min(quantity, maxStock), selectedColor }];
    });
  }, []);

  const removeItem = useCallback((productId: number | string, size: string) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => !(item.product && String(item.product.id) === String(productId) && item.size === size)
      )
    );
  }, []);

  const updateQuantity = useCallback((productId: number | string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, size);
      return;
    }
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.product && String(item.product.id) === String(productId) && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    if (!item.product) return sum;
    const product = item.product;
    const countryPrice = product.prices?.find((p: any) => p.country_id === selectedCountry?.id);
    const unitPrice = Number(countryPrice?.price ?? product.price ?? 0);
    return sum + unitPrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        setIsOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        mounted,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
