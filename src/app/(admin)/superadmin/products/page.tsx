"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import { adminApi } from "@/lib/admin-api";
import { Product } from "@/lib/products";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

interface Country {
  id: number;
  name: string;
  currency: string;
  currency_symbol: string;
  flag: string;
}

interface ProductPrice {
  id?: number;
  country_id: number;
  price: number;
  sale_price?: number;
  stock: number;
  available: boolean;
  country?: Country;
}

interface AdminProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  minimum_stock: number;
  damaged_stock: number;
  sku: string;
  slug?: string;
  featured?: boolean;
  category_id: number;
  brand_id?: number | null;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  prices?: ProductPrice[];
  additional_info?: ProductAdditionalInfo[];
  attributes?: { attribute_id: number; value: string; color?: string }[];
  gallery?: { id: number; image: string; sort_order: number }[];
}

interface ProductAdditionalInfo {
  id?: number;
  product_id?: number;
  label: string;
  value: string;
}

interface ProductAttribute {
  attribute_id: number;
  value: string;
  color?: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  slug?: string;
  parent_id?: number | null;
}

interface Attribute {
  id: number;
  name: string;
  type: 'dropdown' | 'swatches';
  values: AttributeValue[];
}

interface AttributeValue {
  id: number;
  attribute_id: number;
  value: string;
  color?: string;
}

export default function AdminProducts() {
  const [allProducts, setAllProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [categories, setCategories] = useState<{id: number; name: string; slug: string}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          adminApi.get<AdminProduct[]>('/products'),
          adminApi.get<{id: number; name: string; slug: string}[]>('/categories'),
        ]);
        setAllProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refetch = async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<AdminProduct[]>('/products');
      setAllProducts(data);
    } catch (error) {
      console.error('Error refetching:', error);
    } finally {
      setLoading(false);
    }
  };

  const products = allProducts;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const productCategories = (product as any).categories || [];
    const allCategoryNames = productCategories.length > 0 
      ? productCategories.map((c: any) => c.name?.toLowerCase())
      : [product.category?.name?.toLowerCase()].filter(Boolean);
    const matchesCategory =
      categoryFilter === "all" || allCategoryNames.includes(categoryFilter);
    const matchesLowStock = !lowStockFilter || (product.stock !== undefined && product.stock < (product.minimum_stock ?? 5));
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (product: AdminProduct) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    
    setDeleting(true);
    try {
      await adminApi.delete(`/products/${deletingProduct.slug}`);
      setShowDeleteModal(false);
      setDeletingProduct(null);
      refetch();
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setDeleting(false);
    }
  };

  const toggleFeatured = async (product: AdminProduct) => {
    try {
      await adminApi.put(`/products/${product.slug}`, {
        name: product.name,
        description: product.description,
        image: product.image,
        sku: product.sku,
        featured: !product.featured,
      });
      refetch();
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your product inventory ({products.length} products in list, {filteredProducts.length} shown)</p>
        </div>
        <Link
          href="/superadmin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name.toLowerCase()}>{cat.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
            />
            <span className="text-sm text-slate-700">Low Stock</span>
          </label>
        </div>
      </div>

      {/* Products Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-500 mt-4">Loading products...</p>
            </div>
          ) : (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-300">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Featured</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Country Prices</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {paginatedProducts.map((product, index) => (
                    <tr key={product.id} className={`${product.stock !== undefined && product.stock < (product.minimum_stock ?? 5) ? 'bg-red-50' : index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <img src={product.image} alt={product.name} className="w-14 h-14 rounded-lg object-cover bg-slate-100" />
                          <div>
                            <p className="font-medium text-slate-800">{product.name}</p>
                            <p className="text-sm text-slate-500 truncate max-w-xs">{stripHtml(product.description)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => toggleFeatured(product)}
                          className={`p-2 rounded-lg transition-colors ${
                            product.featured
                              ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'
                          }`}
                          title={product.featured ? 'Remove from featured' : 'Add to featured'}
                        >
                          <svg className="w-6 h-6" fill={product.featured ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {(product as any).categories && (product as any).categories.length > 0 
                            ? (product as any).categories.map((cat: { name: string }) => (
                              <span key={cat.name} className="inline-flex px-3 py-1 text-xs font-medium text-slate-700">
                                {cat.name}
                              </span>
                            ))
                            : (
                              <span className="inline-flex px-3 py-1 text-xs font-medium text-slate-700">
                                {product.category?.name || "Uncategorized"}
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {product.prices && product.prices.length > 0 ? (
                            product.prices.map((pp) => (
                              pp.sale_price && pp.sale_price > 0 ? (
                                <span key={pp.country_id} className={`inline-flex px-2 py-1 text-xs font-medium ${pp.available === false ? 'text-red-400 line-through' : 'text-slate-700'}`}>
                                  {pp.country?.flag} {pp.country?.currency_symbol || '$'}{Number(pp.price).toFixed(0)} <span className="text-red-500 font-semibold">→ ${Number(pp.sale_price).toFixed(0)}</span>
                                </span>
                              ) : (
                                <span key={pp.country_id} className={`inline-flex px-2 py-1 text-xs font-medium ${pp.available === false ? 'text-red-400 line-through' : 'text-slate-700'}`}>
                                  {pp.country?.flag} {pp.country?.currency_symbol || '$'}{Number(pp.price).toFixed(0)}
                                </span>
                              )
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">No country prices</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {product.prices && product.prices.length > 0 ? (
                            product.prices.map((pp) => {
                              const sellableStock = pp.stock - (product.damaged_stock || 0);
                              return (
                                <span key={pp.country_id} className={`inline-flex px-2 py-1 text-xs font-medium ${pp.available === false ? 'text-red-400' : 'text-green-700'}`}>
                                  {pp.country?.flag} {Math.max(0, sellableStock)}
                                  {sellableStock < (product.minimum_stock ?? 5) && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">Low</span>
                                  )}
                                </span>
                              );
                            })
                          ) : product.stock !== undefined ? (
                            (() => {
                              const sellableStock = product.stock - (product.damaged_stock || 0);
                              return (
                                <span className={`inline-flex px-2 py-1 text-xs font-medium ${sellableStock < (product.minimum_stock ?? 5) ? 'text-red-700' : 'text-green-700'}`}>
                                  {Math.max(0, sellableStock)}
                                  {sellableStock < (product.minimum_stock ?? 5) && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">Low</span>
                                  )}
                                </span>
                              );
                            })()
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500 font-mono">{product.sku}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/superadmin/products/edit/${product.slug || product.id}`}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button 
                            onClick={() => handleDeleteClick(product)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
</tbody>
              </table>
            </div>
          )}

          {!loading && (
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedProducts.map((product, index) => (
                <div key={product.id} className={`p-4 ${product.stock !== undefined && product.stock < (product.minimum_stock ?? 5) ? 'bg-red-50' : index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}>
                  <div className="flex gap-4">
                    <img src={product.image} alt={product.name} className="w-20 h-20 rounded-lg object-cover bg-slate-100" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{product.name}</p>
                      <p className="text-sm text-slate-500 truncate">{stripHtml(product.description)}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(product as any).categories && (product as any).categories.length > 0 
                          ? (product as any).categories.map((cat: { name: string }) => (
                            <span key={cat.name} className="inline-flex px-2 py-0.5 text-xs font-medium text-slate-700">
                              {cat.name}
                            </span>
                          ))
                          : (
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium text-slate-700">
                              {product.category?.name || "Uncategorized"}
                            </span>
                          )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.prices && product.prices.length > 0 ? (
                          product.prices.map((pp) => (
                            <span key={pp.country_id} className={`inline-flex px-2 py-0.5 text-xs font-medium ${pp.available === false ? 'text-red-400' : 'text-slate-700'}`}>
                              {pp.country?.flag} {pp.country?.currency_symbol || '$'}{Number(pp.price).toFixed(0)}{pp.sale_price && pp.sale_price > 0 ? ` → $${Number(pp.sale_price).toFixed(0)}` : ''}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">No prices</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => toggleFeatured(product)}
                        className={`p-1.5 rounded-lg ${product.featured ? 'text-amber-500' : 'text-slate-300'}`}
                      >
                        <svg className="w-5 h-5" fill={product.featured ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <Link
                        href={`/superadmin/products/edit/${product.slug || product.id}`}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {(currentPage - 1) * productsPerPage + 1} to {Math.min(currentPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
        </p>
        <div className="flex gap-1">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>
          {currentPage > 2 && (
            <>
              <button onClick={() => handlePageChange(1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm">1</button>
              {currentPage > 3 && <span className="px-2 py-1.5 text-slate-400">...</span>}
            </>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
            .map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  currentPage === page
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}
          {currentPage < totalPages - 1 && (
            <>
              {currentPage < totalPages - 2 && <span className="px-2 py-1.5 text-slate-400">...</span>}
              <button onClick={() => handlePageChange(totalPages)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm">{totalPages}</button>
            </>
          )}
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Next
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Delete Product</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to delete <span className="font-medium text-slate-700">&quot;{deletingProduct.name}&quot;</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingProduct(null);
                  }}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.216A8 8 0 0120 12h4c0 6.627-5.373 12-12 12v-4z" />
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    "Delete Product"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
