import { api } from './api';

export interface Product {
  id: number;
  category_id?: number;
  name: string;
  slug?: string;
  description: string;
  long_description?: string;
  price: number;
  sale_price?: number | null;
  image: string;
  stock: number;
  sku: string;
  status?: string;
  featured?: boolean;
  brand_id?: number | null;
  category?: Category;
  brand?: Brand;
  variants?: ProductVariant[];
  prices?: ProductPrice[];
  additional_info?: AdditionalInfoItem[];
  attributes?: ProductAttribute[];
  average_rating?: number;
  reviews_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface AdditionalInfoItem {
  label: string;
  value: string;
}

export interface ProductAttribute {
  id: number;
  attribute_id: number;
  attribute_value_id: number;
  attribute?: Attribute;
  attribute_value?: AttributeValue;
}

export interface Attribute {
  id: number;
  name: string;
  values?: AttributeValue[];
}

export interface AttributeValue {
  id: number;
  attribute_id: number;
  value: string;
}

export interface ProductPrice {
  id?: number;
  country_id: number;
  price: number;
  sale_price?: number | null;
  stock: number;
  available: boolean;
  country?: Country;
}

export interface Country {
  id: number;
  name: string;
  currency: string;
  currency_symbol: string;
  flag: string;
}

export interface Category {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  size?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.aaaorange.com';

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/api/products`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function getProduct(slug: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

export function getProductPrice(product: Product, countryId: number | undefined): { price: number; stock: number; available: boolean } {
  if (!countryId) {
    return { price: product.price, stock: product.stock, available: true };
  }

  const countryPrice = product.prices?.find(p => p.country_id === countryId);
  return {
    price: countryPrice?.price || product.price,
    stock: countryPrice?.stock || product.stock,
    available: countryPrice?.available !== false,
  };
}

export function isProductAvailableInCountry(product: Product | null, countryId: number | undefined): boolean {
  if (!product || !countryId) return true;
  const countryPrice = product.prices?.find(p => p.country_id === countryId);
  return countryPrice?.available !== false;
}

export function filterProductsByCountry(products: Product[] | null, countryId: number | undefined): Product[] {
  if (!products || !countryId) return products || [];
  return products.filter(p => isProductAvailableInCountry(p, countryId));
}

export async function getTopSellingProducts(limit?: number): Promise<Product[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const res = await fetch(`${API_URL}/api/products/top-selling${limit ? `?limit=${limit}` : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch top selling products');
  return res.json();
}

export async function getProductsByCategory(categoryId: number): Promise<Product[]> {
  const products = await getProducts();
  return products.filter(p => p.category_id === categoryId);
}