'use client';

import { useState, useEffect, useCallback } from 'react';
import { CartItem, getCart, addToCart, removeFromCart, CartItemInput } from '@/lib/cart';
import { isAuthenticated } from '@/lib/auth';

interface UseCartResult {
  cart: CartItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addItem: (item: CartItemInput) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
}

export function useCart(): UseCartResult {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getCart();
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddItem = useCallback(async (item: CartItemInput) => {
    try {
      await addToCart(item);
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
      throw err;
    }
  }, [fetchCart]);

  const handleRemoveItem = useCallback(async (id: number) => {
    try {
      await removeFromCart(id);
      setCart(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return {
    cart,
    loading,
    error,
    refetch: fetchCart,
    addItem: handleAddItem,
    removeItem: handleRemoveItem,
  };
}