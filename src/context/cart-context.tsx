"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { Product } from "@/lib/products";

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
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load cart:', e);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart:', e);
      }
    }
  }, [items, mounted]);

  const addItem = useCallback((product: Product | null, size: string, quantity = 1, selectedColor?: string) => {
    if (!product) return;
    setItems((currentItems) => {
      const existingIndex = currentItems.findIndex(
        (item) => item.product && String(item.product.id) === String(product.id) && item.size === size
      );

      if (existingIndex >= 0) {
        const updated = [...currentItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          selectedColor: selectedColor || updated[existingIndex].selectedColor,
        };
        return updated;
      }

      return [...currentItems, { product, size, quantity, selectedColor }];
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
  const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

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
