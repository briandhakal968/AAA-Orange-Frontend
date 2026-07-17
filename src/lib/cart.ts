import { api } from './api';
import { Product } from './products';

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  product?: Product;
  created_at?: string;
  updated_at?: string;
}

export interface CartItemInput {
  product_id: number;
  quantity: number;
}

export async function getCart(): Promise<CartItem[]> {
  return api.get<CartItem[]>('/cart');
}

export async function addToCart(item: CartItemInput): Promise<CartItem> {
  return api.post<CartItem>('/cart', item);
}

export async function removeFromCart(id: number): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/cart/${id}`);
}