"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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

interface Row {
  product: Product;
  country: Country;
  stock: number;
  damaged: number;
  sellable: number;
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

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const p of products) {
      const perCountry = new Map<number, Price>();
      (p.prices || []).forEach((pp) => perCountry.set(pp.country_id, pp));
      for (const c of countries) {
        const pp = perCountry.get(c.id);
        const stock = pp ? Number(pp.stock) : 0;
        const damaged = pp ? Number(pp.damaged_stock ?? 0) : 0;
        if (stock === 0 && damaged === 0) continue;
        out.push({
          product: p,
          country: c,
          stock,
          damaged,
          sellable: Math.max(0, stock - damaged),
        });
      }
    }
    return out.sort((a, b) => b.damaged - a.damaged);
  }, [products, countries]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (countryFilter !== "all" && String(r.country.id) !== countryFilter) return false;
      if (damageFilter === "any") {
        // pass
      } else if (damageFilter === "damaged") {
        if (r.damaged <= 0) return false;
      } else if (damageFilter === "high") {
        if (r.damaged < 5) return false;
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
      return true;
    });
  }, [rows, countryFilter, damageFilter, search]);

  const totalDamaged = rows.reduce((s, r) => s + r.damaged, 0);
  const totalStock = rows.reduce((s, r) => s + r.stock, 0);
  const totalProducts = new Set(rows.map((r) => r.product.id)).size;
  const damageRate = totalStock > 0 ? ((totalDamaged / totalStock) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Damaged Stock</h1>
        <p className="text-sm text-slate-500 mt-1">Per-country damaged units across all products</p>
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
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Product</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">SKU</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Country</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Total Stock</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Damaged</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Sellable</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Damage %</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Loading damaged stock...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No damaged stock records found
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const pct = r.stock > 0 ? ((r.damaged / r.stock) * 100).toFixed(1) : "0.0";
                  const highDamage = r.damaged >= 5;
                  return (
                    <tr key={`${r.product.id}-${r.country.id}`} className="hover:bg-slate-50 transition-colors">
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
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                          <span>{r.country.flag}</span>
                          <span>{r.country.name}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-800 text-right">{r.stock}</td>
                      <td className="py-4 px-6 text-right">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${
                          highDamage ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {r.damaged}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-800 text-right">{r.sellable}</td>
                      <td className="py-4 px-6 text-right">
                        <span className={`text-sm font-semibold ${
                          highDamage ? "text-red-600" : r.damaged > 0 ? "text-amber-600" : "text-slate-400"
                        }`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/superadmin/products/edit/${r.product.slug || r.product.id}`}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          Fix
                        </Link>
                      </td>
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
