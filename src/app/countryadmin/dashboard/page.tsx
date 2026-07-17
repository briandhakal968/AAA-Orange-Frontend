"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { countryAdminFetch } from "@/lib/country-admin-api";

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

interface CountryInfo {
  name: string;
  flag: string;
  currency: string;
  currency_symbol: string;
}

interface DashboardStats {
  period: string;
  country: CountryInfo | null;
  total_orders: number;
  total_revenue: number;
  total_products: number;
  total_customers: number;
  status_breakdown: Record<string, number>;
  recent_orders: Order[];
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

const countryConfig: Record<string, { gradient: string; bg: string }> = {
  Nepal: { gradient: "from-amber-400 via-orange-500 to-red-500", bg: "bg-gradient-to-br from-amber-50 to-orange-50" },
  "United Kingdom": { gradient: "from-violet-400 via-purple-500 to-fuchsia-500", bg: "bg-gradient-to-br from-violet-50 to-purple-50" },
  "Hong Kong": { gradient: "from-emerald-400 via-teal-500 to-cyan-500", bg: "bg-gradient-to-br from-emerald-50 to-teal-50" },
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-violet-100 text-violet-700 border-violet-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  refunded: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function CountryAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("all_time");
  const [showCustomDropdown, setShowCustomDropdown] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [user, setUser] = useState<{ name: string; country?: { name: string; flag: string; currency_symbol: string } } | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
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

  useEffect(() => {
    const userData = localStorage.getItem("country_admin_user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        router.push("/countryadmin/login");
      }
    } else {
      router.push("/countryadmin/login");
    }
  }, [router]);

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
    if (!user) return;
    fetchStats();
  }, [user, selectedPeriod]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await countryAdminFetch(`/country-admin/dashboard/stats?period=${selectedPeriod}`);
      if (!response) return;
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = stats?.country?.currency_symbol || user?.country?.currency_symbol || '$';

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

  const handleViewClick = async (order: Order) => {
    try {
      const response = await countryAdminFetch(`/country-admin/orders/${order.id}`);
      if (!response) return;
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data);
        setShowViewModal(true);
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
    }
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
      const response = await countryAdminFetch(`/country-admin/orders/${selectedOrder?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!response) { setEditLoading(false); return; }
      if (response.ok) {
        const updated = await response.json();
        setStats(prev => prev ? { ...prev, recent_orders: prev.recent_orders.map((o) => (o.id === updated.id ? updated : o)) } : prev);
        setEditSuccess("Order status updated successfully!");
        setCancellationReason("");
        setTimeout(() => setShowEditModal(false), 1000);
      } else {
        throw new Error("Failed to update order");
      }
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
      const response = await countryAdminFetch(`/country-admin/orders/${deletingOrder.id}`, {
        method: "DELETE",
      });
      if (!response) { setDeleteLoading(false); return; }
      if (response.ok) {
        setStats(prev => prev ? { ...prev, recent_orders: prev.recent_orders.filter((o) => o.id !== deletingOrder.id) } : prev);
        setShowDeleteModal(false);
        setDeletingOrder(null);
      } else {
        throw new Error("Failed to delete order");
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete order");
    } finally {
      setDeleteLoading(false);
    }
  };

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Analytics Overview</h1>
            <p className="text-sm text-slate-500">
              {user?.country?.flag} {user?.country?.name} store performance
            </p>
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

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-white/70 text-[10px] font-medium">Revenue</p>
                  <h3 className="text-sm font-bold">{stats.country?.name}</h3>
                </div>
              </div>
              <p className="text-2xl font-bold mb-2">{currencySymbol}{stats.total_revenue.toLocaleString()}</p>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="bg-white/20 backdrop-blur-sm rounded px-1.5 py-1 text-center">
                  <p className="font-bold text-sm">{stats.total_orders}</p>
                  <p className="text-white/70">Orders</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500 rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <div>
                  <p className="text-white/70 text-[10px] font-medium">Catalog</p>
                  <h3 className="text-sm font-bold">Products & Customers</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="bg-white/20 backdrop-blur-sm rounded px-1.5 py-1 text-center">
                  <p className="font-bold text-sm">{stats.total_products}</p>
                  <p className="text-white/70">Products</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded px-1.5 py-1 text-center">
                  <p className="font-bold text-sm">{stats.total_customers}</p>
                  <p className="text-white/70">Customers</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <div>
                  <p className="text-white/70 text-[10px] font-medium">Orders by Status</p>
                  <h3 className="text-sm font-bold">Breakdown</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] flex-wrap">
                {Object.entries(stats.status_breakdown).map(([status, count]) => (
                  <div key={status} className="bg-white/20 backdrop-blur-sm rounded px-1.5 py-1 text-center">
                    <p className="font-bold text-sm">{count}</p>
                    <p className="text-white/70 capitalize">{status}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {stats?.recent_orders && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Recent Orders</h2>
                <p className="text-sm text-slate-500">Latest transactions for your store</p>
              </div>
              <a href="/countryadmin/orders" className="inline-flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors">
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Order</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">No orders found</td>
                  </tr>
                ) : (
                  stats.recent_orders.map((order) => (
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
                      <td className="py-4 px-5 text-sm text-slate-500">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-sm font-semibold text-slate-800">{currencySymbol}{Number(order.total).toFixed(2)}</span>
                      </td>
                      <td className="py-4 px-3">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${statusColors[order.status]}`}>
                          {getStatusLabel(order.status)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Order #{selectedOrder.order_number || selectedOrder.id}</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Order Number</p>
                  <p className="font-medium">{selectedOrder.order_number || selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Date</p>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Status</p>
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${statusColors[selectedOrder.status]}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                  {selectedOrder.cancellation_reason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-600 font-medium">Cancellation Reason:</p>
                      <p className="text-sm text-red-700">{selectedOrder.cancellation_reason}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Name</p>
                    <p className="font-medium">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Email</p>
                    <p className="font-medium">{selectedOrder.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Phone</p>
                    <p className="font-medium">{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">User Account</p>
                    <p className="font-medium">{selectedOrder.user?.name || "Guest"}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Shipping Address</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="font-medium">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                  <p className="text-sm text-slate-600">{selectedOrder.address}</p>
                  {selectedOrder.apartment && <p className="text-sm text-slate-600">{selectedOrder.apartment}</p>}
                  <p className="text-sm text-slate-600">{selectedOrder.city}, {selectedOrder.postal_code}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Shipping & Payment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Shipping Method</p>
                    <p className="font-medium capitalize">{selectedOrder.shipping_method || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Payment Method</p>
                    <p className="font-medium capitalize">{selectedOrder.payment_method === 'cod' ? 'Cash on Delivery' : selectedOrder.payment_method}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-3">Order Items</p>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Product</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Qty</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Price</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 px-4 text-sm">
                            {item.product ? item.product.name : `Product #${item.product_id}`}
                            {item.size && <p className="text-xs text-slate-400">Size: {item.size}</p>}
                          </td>
                          <td className="py-3 px-4 text-sm text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-sm text-right">{currencySymbol}{Number(item.price).toFixed(2)}</td>
                          <td className="py-3 px-4 text-sm text-right font-medium">{currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td colSpan={3} className="py-2 px-4 text-sm text-right">Subtotal</td>
                        <td className="py-2 px-4 text-sm text-right">{currencySymbol}{Number(selectedOrder.subtotal || selectedOrder.total).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 px-4 text-sm text-right">Shipping</td>
                        <td className="py-2 px-4 text-sm text-right">
                          {Number(selectedOrder.shipping_cost) === 0 ? 'Free' : `${currencySymbol}${Number(selectedOrder.shipping_cost).toFixed(2)}`}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 px-4 text-sm text-right">Tax</td>
                        <td className="py-2 px-4 text-sm text-right">{currencySymbol}{Number(selectedOrder.tax || 0).toFixed(2)}</td>
                      </tr>
                      <tr className="border-t border-slate-200">
                        <td colSpan={3} className="py-3 px-4 text-base font-semibold text-right">Total</td>
                        <td className="py-3 px-4 text-base font-bold text-right">{currencySymbol}{Number(selectedOrder.total).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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


