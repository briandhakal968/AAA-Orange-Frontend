"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface Order {
  id: number;
  order_number: string;
  total: number;
  status: string;
  cancellation_reason?: string;
  country_id: number;
  created_at: string;
  updated_at: string;
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  apartment: string;
  city: string;
  postal_code: string;
  phone: string;
  shipping_method: string;
  payment_method: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  user_id: number;
  user?: { name: string; email: string };
  country?: { id: number; name: string; flag: string };
  items?: OrderItem[];
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  size?: string;
  product?: { name: string; image?: string };
}

interface CountryStats {
  country: string;
  country_id: number;
  flag: string;
  orders: number;
  revenue: number;
  products: number;
  customers: number;
  currency: string;
  currency_symbol: string;
}

interface DashboardStats {
  period: string;
  total_orders: number;
  total_products: number;
  total_customers: number;
  total_revenue: number;
  pending_amount: number;
  status_breakdown: Record<string, number>;
  orders_over_time: { date: string; orders: number; revenue: number }[];
  revenue_by_country: { country: string; revenue: number; orders: number; flag: string }[];
  payment_breakdown: Record<string, number>;
  top_products: { name: string; quantity: number; revenue: number }[];
  country_stats: CountryStats[];
  periods: Record<string, string>;
}

const periods = [
  { key: "all_time", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last_7_days", label: "Last 7 Days" },
];

const customPeriods = [
  { key: "last_30_days", label: "Last 30 Days" },
  { key: "last_3_months", label: "Last 3 Months" },
  { key: "last_6_months", label: "Last 6 Months" },
  { key: "last_360_days", label: "Last 360 Days" },
  { key: "this_year", label: "This Year" },
  { key: "last_year", label: "Last Year" },
];

const countryConfig: Record<string, { gradient: string; bg: string; ring: string; text: string; chartColor: string }> = {
  Nepal: { gradient: "from-amber-400 via-orange-500 to-red-500", bg: "bg-gradient-to-br from-amber-50 to-orange-50", ring: "ring-amber-200", text: "text-amber-600", chartColor: "#f59e0b" },
  "United Kingdom": { gradient: "from-violet-400 via-purple-500 to-fuchsia-500", bg: "bg-gradient-to-br from-violet-50 to-purple-50", ring: "ring-violet-200", text: "text-violet-600", chartColor: "#8b5cf6" },
  "Hong Kong": { gradient: "from-emerald-400 via-teal-500 to-cyan-500", bg: "bg-gradient-to-br from-emerald-50 to-teal-50", ring: "ring-emerald-200", text: "text-emerald-600", chartColor: "#10b981" },
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#ef4444",
  refunded: "#f97316",
};

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#f97316"];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("all_time");
  const [showCustomDropdown, setShowCustomDropdown] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [animatedStats, setAnimatedStats] = useState({ orders: 0, products: 0, customers: 0, revenue: 0 });
  const [countryFilter, setCountryFilter] = useState("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [chartCountryFilter, setChartCountryFilter] = useState("all");

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod, customDateRange, chartCountryFilter]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-dropdown')) {
        setShowCustomDropdown(false);
      }
    };
    if (showCustomDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showCustomDropdown]);

  useEffect(() => {
    if (!stats) return;
    const duration = 1500;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;

    const animate = () => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 4);

      setAnimatedStats({
        orders: Math.floor((stats.total_orders || 0) * eased),
        products: Math.floor((stats.total_products || 0) * eased),
        customers: Math.floor((stats.total_customers || 0) * eased),
        revenue: Math.floor((stats.total_revenue || 0) * eased),
      });

      if (step < steps) {
        setTimeout(animate, interval);
      }
    };

    animate();
  }, [stats]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const countryParam = chartCountryFilter !== "all" ? `&country_id=${chartCountryFilter}` : "";
      const [ordersRes, statsRes] = await Promise.all([
        adminApi.get<Order[]>("/admin/orders"),
        adminApi.get<DashboardStats>(`/admin/dashboard/stats?period=${selectedPeriod}${countryParam}`),
      ]);

      setRecentOrders(ordersRes.slice(0, 8));
      setStats(statsRes);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (country: string) => {
    const symbols: Record<string, string> = { Nepal: 'रू', 'United Kingdom': '£', 'Hong Kong': 'HK$' };
    return symbols[country] || '$';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      processing: "bg-blue-100 text-blue-700 border-blue-200",
      shipped: "bg-violet-100 text-violet-700 border-violet-200",
      delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
      refunded: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[status.toLowerCase()] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pending",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      refunded: "Refunded",
    };
    return labels[status] || status;
  };

  const handleViewClick = (order: Order) => {
    router.push(`/superadmin/orders/${order.id}`);
  };

  const handleEditClick = (order: Order) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setCancellationReason(order.cancellation_reason || "");
    setEditError("");
    setEditSuccess("");
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");
    setEditLoading(true);

    try {
      const updateData: any = { status: editStatus };
      if (editStatus === "cancelled" && cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }
      const updated = await adminApi.put<Order>(`/admin/orders/${selectedOrder?.id}`, updateData);
      setRecentOrders(recentOrders.map((o) => (o.id === updated.id ? updated : o)));
      setEditSuccess("Order status updated successfully!");
      setCancellationReason("");
      setTimeout(() => setShowEditModal(false), 1000);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (order: Order) => {
    setDeletingOrder(order);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingOrder) return;
    setDeleteLoading(true);
    setDeleteError("");

    try {
      await adminApi.delete(`/admin/orders/${deletingOrder.id}`);
      setRecentOrders(recentOrders.filter((o) => o.id !== deletingOrder.id));
      setShowDeleteModal(false);
      setDeletingOrder(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete order");
    } finally {
      setDeleteLoading(false);
    }
  };

  const statusChartData = stats?.status_breakdown
    ? Object.entries(stats.status_breakdown).map(([key, value]) => ({ name: getStatusLabel(key), value, color: STATUS_COLORS[key] || "#94a3b8" })).filter(d => d.value > 0)
    : [];

  const paymentChartData = stats?.payment_breakdown
    ? [
        { name: "Cash on Delivery", value: stats.payment_breakdown.cod || 0, color: "#f59e0b" },
        { name: "Card", value: stats.payment_breakdown.card || 0, color: "#3b82f6" },
        { name: "PayPal", value: stats.payment_breakdown.paypal || 0, color: "#8b5cf6" },
      ].filter(d => d.value > 0)
    : [];

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-violet-600 rounded-full animate-spin" style={{ animationDuration: '0.8s', animationDirection: 'reverse' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Analytics Overview</h1>
            <p className="text-sm text-slate-500">Track performance across all regions</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm relative custom-dropdown">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => { setSelectedPeriod(p.key); setShowCustomDropdown(false); }}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                selectedPeriod === p.key && !showCustomDropdown
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="relative">
            <button
              onClick={() => setShowCustomDropdown(!showCustomDropdown)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                showCustomDropdown
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              Custom
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCustomDropdown && (
              <div className="absolute top-full mt-1 right-0 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Select</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {customPeriods.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => {
                          setSelectedPeriod(p.key);
                          setShowCustomDropdown(false);
                        }}
                        className="px-3 py-2 text-sm text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors font-medium"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Custom Range</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-400 block mb-1 ml-0.5">Start Date</label>
                      <input
                        type="date"
                        value={customDateRange.start}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                      />
                    </div>
                    <span className="text-slate-400 mt-4">→</span>
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-400 block mb-1 ml-0.5">End Date</label>
                      <input
                        type="date"
                        value={customDateRange.end}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (customDateRange.start && customDateRange.end) {
                        setSelectedPeriod(`custom_${customDateRange.start}_${customDateRange.end}`);
                        setShowCustomDropdown(false);
                      }
                    }}
                    disabled={!customDateRange.start || !customDateRange.end}
                    className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Apply Custom Range
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="group relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-500 rounded-full -mr-12 -mt-12 opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500" />
            </div>
            <p className="text-sm text-slate-500 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-slate-800">{animatedStats.orders.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">{stats?.pending_amount ? `$${stats.pending_amount.toLocaleString()} pending` : 'No pending orders'}</p>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-full -mr-12 -mt-12 opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-500/25">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-fuchsia-500 to-rose-500" />
            </div>
            <p className="text-sm text-slate-500 mb-1">Total Products</p>
            <p className="text-2xl font-bold text-slate-800">{animatedStats.products.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Active listings</p>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-full -mr-12 -mt-12 opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-amber-400 to-red-500" />
            </div>
            <p className="text-sm text-slate-500 mb-1">Total Customers</p>
            <p className="text-2xl font-bold text-slate-800">{animatedStats.customers.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Registered users</p>
          </div>
        </div>
      </div>

      {/* Country Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats?.country_stats?.map((country, i) => {
          const config = countryConfig[country.country] || { gradient: "from-slate-400 to-slate-500" };
          return (
            <div
              key={i}
              className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-4 text-white relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{country.flag}</span>
                  <div>
                    <p className="text-white/70 text-[10px] font-medium">Revenue</p>
                    <h3 className="text-sm font-bold">{country.country}</h3>
                  </div>
                </div>
                <p className="text-2xl font-bold mb-2">{country.currency_symbol}{country.revenue.toLocaleString()}</p>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="bg-white/20 backdrop-blur-sm rounded px-1.5 py-1 text-center">
                    <p className="font-bold text-sm">{country.orders}</p>
                    <p className="text-white/70">Orders</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded px-1.5 py-1 text-center">
                    <p className="font-bold text-sm">{country.customers}</p>
                    <p className="text-white/70">Customers</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded px-1.5 py-1 text-center">
                    <p className="font-bold text-sm">{country.products}</p>
                    <p className="text-white/70">Products</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Orders Trend - Full Width Line Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Order Trend</h3>
            <p className="text-sm text-slate-500">Daily orders over the last 7 days</p>
          </div>
          <select
            value={chartCountryFilter}
            onChange={(e) => setChartCountryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Countries</option>
            {stats?.country_stats?.map((c, i) => (
              <option key={i} value={c.country_id?.toString()}>
                {c.flag} {c.country}
              </option>
            ))}
          </select>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.orders_over_time || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 600, color: '#1e293b' }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, strokeWidth: 2 }}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue by Country - Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Revenue by Country</h3>
        <p className="text-sm text-slate-500 mb-4">Comparison across regions</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.revenue_by_country || []} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="country" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                {(stats?.revenue_by_country || []).map((entry, index) => {
                  const colors = ["#f59e0b", "#8b5cf6", "#10b981"];
                  return <Cell key={index} fill={colors[index % colors.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Status Pie + Payment Pie + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status - Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Order Status</h3>
          <p className="text-sm text-slate-500 mb-4">Distribution of order statuses</p>
          <div className="h-64">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [value, 'Orders']}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data</div>
            )}
          </div>
        </div>

        {/* Payment Methods - Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Payment Methods</h3>
          <p className="text-sm text-slate-500 mb-4">How customers pay</p>
          <div className="h-64">
            {paymentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [value, 'Orders']}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data</div>
            )}
          </div>
        </div>

        {/* Top Products - Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Top Products</h3>
          <p className="text-sm text-slate-500 mb-4">Best selling items</p>
          <div className="h-64">
            {stats?.top_products && stats.top_products.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.top_products} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [value, 'Qty Sold']}
                  />
                  <Bar dataKey="quantity" fill="#6366f1" radius={[0, 8, 8, 0]} name="Qty Sold" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Over Time - Full Width Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Revenue Trend</h3>
            <p className="text-sm text-slate-500">Daily revenue over the last 7 days</p>
          </div>
          <select
            value={chartCountryFilter}
            onChange={(e) => setChartCountryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Countries</option>
            {stats?.country_stats?.map((c, i) => (
              <option key={i} value={c.country_id?.toString()}>
                {c.flag} {c.country}
              </option>
            ))}
          </select>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.orders_over_time || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.8} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Recent Orders</h2>
              <p className="text-sm text-slate-500">Latest transactions across all regions</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Countries</option>
                {stats?.country_stats?.map((country, i) => (
                  <option key={i} value={country.country_id?.toString()}>
                    {country.flag} {country.country}
                  </option>
                ))}
              </select>
              <a href="/superadmin/orders" className="inline-flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors">
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Order</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Country</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders
                .filter(order => countryFilter === "all" || order.country?.id?.toString() === countryFilter)
                .slice(0, 10)
                .map((order, i) => (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-5">
                    <span className="font-semibold text-slate-800">#{order.id}</span>
                  </td>
                  <td className="py-4 px-5">
                    <div>
                      <p className="font-medium text-slate-800">{order.first_name} {order.last_name}</p>
                      <p className="text-xs text-slate-500">{order.user?.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{order.country?.flag}</span>
                      <span className="text-sm text-slate-600">{order.country?.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-sm text-slate-500">
                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-sm font-semibold text-slate-800">{getCurrencySymbol(order.country?.name || '')}{order.total.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-3">
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewClick(order)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEditClick(order)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Edit Order #{selectedOrder.id}</h2>

            {editError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{editError}</div>}
            {editSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg">{editSuccess}</div>}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
                {editStatus === "cancelled" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cancellation Reason <span className="text-red-500">*</span></label>
                    <textarea
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Enter reason for cancellation..."
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                )}
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
                  disabled={editLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Delete Order</h2>
                <p className="text-sm text-slate-500">
                  Are you sure you want to delete order <strong>#{deletingOrder.order_number || deletingOrder.id}</strong>?
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
