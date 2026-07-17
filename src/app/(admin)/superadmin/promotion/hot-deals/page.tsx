"use client";

import { useState, useEffect, useMemo } from "react";
import { adminApi } from "@/lib/admin-api";

interface ProductItem {
  id: number;
  name: string;
  image: string;
  price: number;
  sale_price: number | null;
  sku: string;
  category: string | null;
  selected: boolean;
  prices?: {
    country_id: number;
    country: {
      id: number;
      name: string;
      flag: string;
      currency_symbol: string;
    } | null;
    price: number;
    sale_price: number | null;
    stock: number;
    available: boolean;
  }[];
}

interface AdminHotDealsResponse {
  products: ProductItem[];
  selected_ids: number[];
}

export default function HotDealsAdminPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<AdminHotDealsResponse>("/admin/hot-deals");
      setProducts(data.products);
      setSelectedIds(data.selected_ids);
    } catch (err) {
      console.error("Error fetching hot deals:", err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleProduct = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await adminApi.post("/admin/hot-deals", { product_ids: selectedIds });
      setSuccess("Hot Deals saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving hot deals:", err);
      setError("Failed to save Hot Deals.");
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }
    if (showSelectedOnly) {
      list = list.filter((p) => selectedIds.includes(p.id));
    }
    return list;
  }, [products, search, selectedIds, showSelectedOnly]);

  const selectedCount = selectedIds.length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hot Deals</h1>
          <p className="text-sm text-slate-500 mt-1">
            Select products to display on the Hot Deals page ({selectedCount} selected)
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Selection
            </>
          )}
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSelectedOnly(!showSelectedOnly)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                showSelectedOnly
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {showSelectedOnly ? "Show All" : `Show Selected (${selectedCount})`}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500">No products found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={
                        filteredProducts.length > 0 &&
                        filteredProducts.every((p) => selectedIds.includes(p.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newIds = new Set(selectedIds);
                          filteredProducts.forEach((p) => newIds.add(p.id));
                          setSelectedIds(Array.from(newIds));
                        } else {
                          const toRemove = new Set(filteredProducts.map((p) => p.id));
                          setSelectedIds(selectedIds.filter((id) => !toRemove.has(id)));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Product</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">SKU</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Category</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Country Price</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Country Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        isSelected ? "bg-indigo-50/40" : ""
                      }`}
                      onClick={() => toggleProduct(product.id)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProduct(product.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No img</div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{product.name}</p>
                            {isSelected && (
                              <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Selected
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{product.sku}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{product.category || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {product.prices && product.prices.length > 0 ? (
                            product.prices.map((pp) => (
                              <span key={pp.country_id} className={`inline-flex px-2 py-1 text-xs font-medium rounded ${pp.available === false ? 'bg-red-50 text-red-400 line-through' : 'bg-indigo-50 text-indigo-700'}`}>
                                {pp.country?.flag} {pp.country?.currency_symbol || '$'}{Number(pp.price).toFixed(0)}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">${Number(product.price).toFixed(2)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {product.prices && product.prices.length > 0 ? (
                            product.prices.map((pp) => (
                              <span key={pp.country_id} className={`inline-flex px-2 py-1 text-xs font-medium rounded ${pp.available === false ? 'bg-red-50 text-red-400' : 'bg-green-50 text-green-700'}`}>
                                {pp.country?.flag} {pp.stock}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
