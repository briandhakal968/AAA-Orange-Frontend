"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { countryAdminFetch } from "@/lib/country-admin-api";

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  size?: string;
  attributes?: string;
  product?: { name: string };
}

interface Order {
  id: number;
  user_id: number;
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
  order_number: string;
  user?: { name: string; email: string };
  items?: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-orange-100 text-orange-700",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default function CountryAdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [user, setUser] = useState<{ name: string; country_id: number; country?: { name: string; flag: string; currency_symbol: string } } | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("all_time");
  const [showCustomDropdown, setShowCustomDropdown] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [newOrder, setNewOrder] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    postal_code: "",
    shipping_method: "standard",
    payment_method: "cod",
    items: [] as { product_id: number; quantity: number; price: number; size?: string }[],
  });

  useEffect(() => {
    const userData = localStorage.getItem("country_admin_user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        router.push("/countryadmin/login");
      }
    }
  }, [router]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await countryAdminFetch("/country-admin/orders");
        if (!response) return;

        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchOrders();
  }, [user]);

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

  const getDateRange = (period: string) => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59) };
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return { start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()), end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59) };
      }
      case 'last_7_days':
        return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
      case 'last_30_days':
        return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
      case 'last_3_months':
        return { start: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()), end: now };
      case 'last_6_months':
        return { start: new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()), end: now };
      case 'last_360_days':
        return { start: new Date(now.getTime() - 360 * 24 * 60 * 60 * 1000), end: now };
      case 'this_year':
        return { start: new Date(now.getFullYear(), 0, 1), end: now };
      case 'last_year':
        return { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59) };
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      order.id.toString().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (selectedPeriod.startsWith('custom_')) {
      const parts = selectedPeriod.split('_');
      const startDate = new Date(parts[1]);
      const endDate = new Date(parts[2]);
      endDate.setHours(23, 59, 59);
      const orderDate = new Date(order.created_at);
      matchesDate = orderDate >= startDate && orderDate <= endDate;
    } else if (selectedPeriod !== 'all_time') {
      const range = getDateRange(selectedPeriod);
      if (range) {
        const orderDate = new Date(order.created_at);
        matchesDate = orderDate >= range.start && orderDate <= range.end;
      }
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, selectedPeriod]);

  const getStatusStats = () => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  });

  const stats = getStatusStats();

  const handleViewClick = (order: Order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleEditClick = (order: Order) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditError("");
    setEditSuccess("");
    setShowEditModal(true);
  };

  const handleAddOrderClick = () => {
    setNewOrder({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      apartment: "",
      city: "",
      postal_code: "",
      shipping_method: "standard",
      payment_method: "cod",
      items: [],
    });
    setAddError("");
    setAddSuccess("");
    setShowAddModal(true);
  };

  const handleAddOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    setAddSuccess("");

    try {
      const response = await countryAdminFetch("/country-admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });

      if (!response) {
        setAddLoading(false);
        return;
      }

      if (response.ok) {
        const created = await response.json();
        setOrders([created, ...orders]);
        setAddSuccess("Order created successfully!");
        setTimeout(() => setShowAddModal(false), 1000);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to create order");
      }
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");
    setEditLoading(true);

    try {
      const response = await countryAdminFetch(`/country-admin/orders/${selectedOrder?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus }),
      });

      if (!response) {
        setEditLoading(false);
        return;
      }

      if (response.ok) {
        const updated = await response.json();
        setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));
        setEditSuccess("Order status updated successfully!");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track customer orders</p>
        </div>
        
        <div className="flex items-center gap-1 bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm relative custom-dropdown">
          {[
            { key: "all_time", label: "All Time" },
            { key: "today", label: "Today" },
            { key: "yesterday", label: "Yesterday" },
            { key: "last_7_days", label: "Last 7 Days" },
          ].map((p) => (
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
                    {[
                      { key: "last_30_days", label: "Last 30 Days" },
                      { key: "last_3_months", label: "Last 3 Months" },
                      { key: "last_6_months", label: "Last 6 Months" },
                      { key: "last_360_days", label: "Last 360 Days" },
                      { key: "this_year", label: "This Year" },
                      { key: "last_year", label: "Last Year" },
                    ].map((p) => (
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

      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by order ID or customer..."
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
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Order</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Total</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-medium text-slate-800">#{order.id}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-slate-800">{order.user?.name || "Guest"}</p>
                        <p className="text-sm text-slate-500">{order.user?.email || "-"}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-slate-800">{user?.country?.currency_symbol || '$'}{order.total}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${statusColors[order.status] || "bg-slate-100 text-slate-700"}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
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

      {filteredOrders.length > ordersPerPage && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Showing {(currentPage - 1) * ordersPerPage + 1} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
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
                    {statusLabels[selectedOrder.status] || selectedOrder.status}
                  </span>
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
                             {item.attributes ? (
                               <p className="text-xs text-slate-400">{item.attributes}</p>
                             ) : item.size ? (
                               <p className="text-xs text-slate-400">Size: {item.size}</p>
                             ) : null}
                           </td>
                          <td className="py-3 px-4 text-sm text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-sm text-right">{user?.country?.currency_symbol || '$'}{Number(item.price).toFixed(2)}</td>
                          <td className="py-3 px-4 text-sm text-right font-medium">{user?.country?.currency_symbol || '$'}{(Number(item.price) * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td colSpan={3} className="py-2 px-4 text-sm text-right">Subtotal</td>
                        <td className="py-2 px-4 text-sm text-right">{user?.country?.currency_symbol || '$'}{Number(selectedOrder.subtotal || selectedOrder.total).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 px-4 text-sm text-right">Shipping</td>
                        <td className="py-2 px-4 text-sm text-right">
                          {Number(selectedOrder.shipping_cost) === 0 ? 'Free' : `${user?.country?.currency_symbol || '$'}${Number(selectedOrder.shipping_cost).toFixed(2)}`}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 px-4 text-sm text-right">Tax</td>
                        <td className="py-2 px-4 text-sm text-right">{user?.country?.currency_symbol || '$'}{Number(selectedOrder.tax || 0).toFixed(2)}</td>
                      </tr>
                      <tr className="border-t border-slate-200">
                        <td colSpan={3} className="py-3 px-4 text-base font-semibold text-right">Total</td>
                        <td className="py-3 px-4 text-base font-bold text-right">{user?.country?.currency_symbol || '$'}{Number(selectedOrder.total).toFixed(2)}</td>
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
    </div>
  );
}