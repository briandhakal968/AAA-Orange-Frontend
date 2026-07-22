"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { countryAdminFetch } from "@/lib/country-admin-api";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  stock: number;
  minimum_stock: number;
  sku: string;
  category?: { name: string };
  brand?: { name: string };
}

interface ProductWithStock extends Product {
  country_stock?: number;
  country_damaged_stock?: number;
}

export default function CountryAdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
  const [newStock, setNewStock] = useState(0);
  const [newDamagedStock, setNewDamagedStock] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ name: string; country_id: number; country?: { name: string; flag: string; currency_symbol: string } } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;

  useEffect(() => {
    const userData = localStorage.getItem("country_admin_user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      } catch {
        router.push("/countryadmin/login");
      }
    }
  }, [router]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await countryAdminFetch("/country-admin/products");
        if (!response) return;

        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProducts();
  }, [user]);

  const handleEditStock = (product: ProductWithStock) => {
    setSelectedProduct(product);
    setNewStock(product.country_stock ?? product.stock);
    setNewDamagedStock(product.country_damaged_stock ?? 0);
    setSuccess("");
    setError("");
    setShowEditModal(true);
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setUpdating(true);
    setSuccess("");
    setError("");

    try {
      const response = await countryAdminFetch(`/country-admin/products/${selectedProduct.id}/stock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock, damaged_stock: newDamagedStock }),
      });

      if (!response) {
        setUpdating(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setProducts(products.map(p =>
          p.id === selectedProduct.id
            ? { ...p, country_stock: data.stock, country_damaged_stock: data.damaged_stock }
            : p
        ));
        setSuccess("Stock updated successfully!");
        setTimeout(() => setShowEditModal(false), 1500);
      } else {
        const err = await response.json();
        throw new Error(err.error || "Failed to update stock");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stock");
    } finally {
      setUpdating(false);
    }
  };

  const getSellableStock = (product: ProductWithStock) =>
    Math.max(0, getStockValue(product) - (product.country_damaged_stock ?? 0));

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const sellable = getSellableStock(product);
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "in_stock" && sellable > 0) ||
      (statusFilter === "low_stock" && sellable > 0 && sellable <= (product.minimum_stock ?? 5)) ||
      (statusFilter === "out_of_stock" && sellable === 0);
    return matchesSearch && matchesStatus;
  });

  const getStockStatus = (stock: number, minimumStock: number = 5) => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
    if (stock <= minimumStock) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700" };
    return { label: "In Stock", color: "bg-green-100 text-green-700" };
  };

  const getStockValue = (product: ProductWithStock) => product.country_stock ?? product.stock;

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500 mt-1">Manage product stock for your country</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-500 rounded-xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-white/70 text-xs font-medium mb-1">Total Products</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-white/70 text-xs font-medium mb-1">In Stock</p>
            <p className="text-2xl font-bold">
              {products.filter(p => getStockValue(p) > 0).length}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-white/70 text-xs font-medium mb-1">Low Stock</p>
            <p className="text-2xl font-bold">
              {products.filter(p => getStockValue(p) > 0 && getStockValue(p) <= (p.minimum_stock ?? 5)).length}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-400 via-pink-500 to-red-600 rounded-xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-white/70 text-xs font-medium mb-1">Out of Stock</p>
            <p className="text-2xl font-bold">
              {products.filter(p => getStockValue(p) === 0).length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Product</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">SKU</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Price</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Stock</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No products found
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const stock = getStockValue(product);
                  const stockStatus = getStockStatus(stock, product.minimum_stock ?? 5);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg bg-slate-100"
                          />
                          <span className="font-medium text-slate-800">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">{product.sku}</td>
                      <td className="py-4 px-6 text-sm text-slate-600">{product.category?.name || "-"}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-800">{user?.country?.currency_symbol || ''}{product.price}</td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-800">
                        <div>{Math.max(0, stock - (product.country_damaged_stock ?? 0))}</div>
                        {(product.country_damaged_stock ?? 0) > 0 && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            {stock} total · {product.country_damaged_stock} damaged
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditStock(product)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Update Stock"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProducts.length > productsPerPage && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
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
        </div>
      )}

      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Update Stock</h2>

            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500 mb-1">Product</p>
              <p className="font-medium text-slate-800">{selectedProduct.name}</p>
              <p className="text-xs text-slate-500">SKU: {selectedProduct.sku}</p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg">{success}</div>}

            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Stock</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Damaged Stock</label>
                <input
                  type="number"
                  value={newDamagedStock}
                  onChange={(e) => setNewDamagedStock(parseInt(e.target.value) || 0)}
                  min="0"
                  max={newStock}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Sellable stock: {Math.max(0, newStock - newDamagedStock)}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {updating ? "Updating..." : "Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}