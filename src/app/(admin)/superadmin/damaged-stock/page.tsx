"use client";

import { useState, useEffect, useMemo } from "react";
import { adminApi } from "@/lib/admin-api";

interface Country {
  id: number;
  name: string;
  currency: string;
  currency_symbol: string;
  flag: string;
}

interface Price {
  id: number;
  country_id: number;
  country?: Country;
  price: number;
  sale_price?: number | null;
  stock: number;
  damaged_stock: number;
  available: boolean;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  image: string;
  sku: string;
  stock: number;
  damaged_stock: number;
  prices: Price[];
}

interface CountryStat {
  country: Country;
  stock: number;
  damaged: number;
  sellable: number;
}

interface ProductRow {
  product: Product;
  stats: CountryStat[];
}

export default function DamagedStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [damageFilter, setDamageFilter] = useState("any");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, cs] = await Promise.all([
          adminApi.get<Product[]>("/products"),
          adminApi.get<Country[]>("/countries"),
        ]);
        setProducts(prods || []);
        setCountries(cs || []);
      } catch (err) {
        console.error("Error fetching damaged stock:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const rows: ProductRow[] = useMemo(() => {
    const out: ProductRow[] = [];
    for (const p of products) {
      const perCountry = new Map<number, Price>();
      (p.prices || []).forEach((pp) => perCountry.set(pp.country_id, pp));
      const stats: CountryStat[] = countries.map((c) => {
        const pp = perCountry.get(c.id);
        const stock = pp ? Number(pp.stock) : 0;
        const damaged = pp ? Number(pp.damaged_stock ?? 0) : 0;
        return {
          country: c,
          stock,
          damaged,
          sellable: Math.max(0, stock - damaged),
        };
      });
      out.push({ product: p, stats });
    }
    return out;
  }, [products, countries]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const totalDamaged = r.stats.reduce((s, x) => s + x.damaged, 0);
      const totalStock = r.stats.reduce((s, x) => s + x.stock, 0);

      if (damageFilter === "damaged") {
        if (totalDamaged <= 0) return false;
      } else if (damageFilter === "high") {
        if (totalDamaged < 5) return false;
      }

      if (countryFilter !== "all") {
        const cid = Number(countryFilter);
        const s = r.stats.find((x) => x.country.id === cid);
        if (!s || (s.stock === 0 && s.damaged === 0)) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !r.product.name.toLowerCase().includes(q) &&
          !r.product.sku.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      // Hide products with zero stock/damage in every country
      if (totalStock === 0 && totalDamaged === 0) return false;
      return true;
    });
  }, [rows, countryFilter, damageFilter, search]);

  const totalDamaged = rows.reduce(
    (s, r) => s + r.stats.reduce((x, y) => x + y.damaged, 0),
    0
  );
  const totalStock = rows.reduce(
    (s, r) => s + r.stats.reduce((x, y) => x + y.stock, 0),
    0
  );
  const totalProducts = rows.length;
  const damageRate = totalStock > 0 ? ((totalDamaged / totalStock) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Damaged Stock</h1>
        <p className="text-sm text-slate-500 mt-1">Per-country stock and damage across all products</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-rose-500 via-red-500 to-pink-600 rounded-xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-white/80 text-xs font-medium mb-1">Total Damaged</p>
            <p className="text-2xl font-bold">{totalDamaged}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-white/80 text-xs font-medium mb-1">Damage Rate</p>
            <p className="text-2xl font-bold">{damageRate}%</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-500 rounded-xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-white/80 text-xs font-medium mb-1">Affected Products</p>
            <p className="text-2xl font-bold">{totalProducts}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 rounded-xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-white/80 text-xs font-medium mb-1">Total Stock Tracked</p>
            <p className="text-2xl font-bold">{totalStock}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by product name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            <option value="all">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          <select
            value={damageFilter}
            onChange={(e) => setDamageFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            <option value="any">Any Damage</option>
            <option value="damaged">Has Damage (&gt;0)</option>
            <option value="high">High Damage (&ge;5)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th rowSpan={2} className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase align-bottom">Product</th>
                <th rowSpan={2} className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase align-bottom">SKU</th>
                {countries.map((c) => (
                  <th key={c.id} colSpan={2} className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase border-l border-slate-200">
                    <span className="inline-flex items-center gap-1.5">
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </span>
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50">
                {countries.flatMap((c) => [
                  <th key={`s-${c.id}`} className="text-right py-2 px-4 text-[10px] font-semibold text-slate-500 uppercase border-l border-slate-200">Stock</th>,
                  <th key={`d-${c.id}`} className="text-right py-2 px-4 text-[10px] font-semibold text-slate-500 uppercase">Damaged</th>,
                ])}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3 + countries.length * 2} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Loading damaged stock...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3 + countries.length * 2} className="py-12 text-center text-slate-500">
                    No damaged stock records found
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  return (
                    <tr key={r.product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={r.product.image || ""}
                            alt={r.product.name}
                            className="w-10 h-10 object-cover rounded-lg bg-slate-100"
                          />
                          <span className="font-medium text-slate-800 line-clamp-1">{r.product.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">{r.product.sku}</td>
                      {r.stats.map((s) => {
                        return (
                          <td key={`s-${r.product.id}-${s.country.id}`} className="py-4 px-4 text-sm font-medium text-slate-800 text-right border-l border-slate-100">
                            {s.stock}
                          </td>
                        );
                      })}
                      {r.stats.map((s) => {
                        const dmgHigh = s.damaged >= 5;
                        return (
                          <td key={`d-${r.product.id}-${s.country.id}`} className="py-4 px-4 text-right border-l border-slate-100">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
                              dmgHigh ? "bg-red-100 text-red-700" : s.damaged > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                            }`}>
                              {s.damaged}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
