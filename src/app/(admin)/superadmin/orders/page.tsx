"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  size?: string;
  product?: { name: string; image?: string };
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
  country?: { name: string; flag: string };
  items?: OrderItem[];
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface Country {
  id: number;
  name: string;
  flag: string;
  currency_symbol?: string;
}

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
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

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [filterCountries, setFilterCountries] = useState<Country[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 20;
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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
  
  // Add order state
  const [customers, setCustomers] = useState<{ id: number; name: string; email: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Date filter state
  const [selectedPeriod, setSelectedPeriod] = useState("all_time");
  const [showCustomDropdown, setShowCustomDropdown] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (showAddModal) {
      fetchAddData();
    }
  }, [showAddModal]);

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

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const getApi = () => getApiUrl() + '/api';

  const fetchAddData = async () => {
    try {
      const API = getApi();
      const [customersRes, productsRes, countriesRes] = await Promise.all([
        adminApi.get<{ id: number; name: string; email: string }[]>("/admin/customers"),
        fetch(`${API}/products`).then(r => r.json()),
        fetch(`${API}/countries`).then(r => r.json()),
      ]);
      setCustomers(customersRes);
      setProducts(productsRes);
      setCountries(countriesRes);
      if (countriesRes.length > 0) {
        setSelectedCountry(countriesRes[0].id.toString());
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cartItems.find(item => item.product_id === product.id);
    if (existing) {
      setCartItems(cartItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.product_id !== productId));
    } else {
      setCartItems(cartItems.map(item =>
        item.product_id === productId ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (productId: number) => {
    setCartItems(cartItems.filter(item => item.product_id !== productId));
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    
    if (!selectedCustomer) {
      setAddError("Please select a customer");
      return;
    }
    if (cartItems.length === 0) {
      setAddError("Please add at least one product");
      return;
    }
    
    setAddLoading(true);
    try {
      const items = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));
      
      await adminApi.post("/orders", {
        user_id: parseInt(selectedCustomer),
        country_id: selectedCountry ? parseInt(selectedCountry) : null,
        total: getCartTotal(),
        items
      });
      
      setAddSuccess("Order created successfully!");
      setCartItems([]);
      setSelectedCustomer("");
      fetchOrders();
      setTimeout(() => setShowAddModal(false), 1500);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setAddLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const API = getApi();
      const [ordersData, countriesData] = await Promise.all([
        adminApi.get<Order[]>("/admin/orders"),
        fetch(`${API}/countries`).then(r => r.json()),
      ]);
      setOrders(ordersData);
      setFilterCountries(countriesData);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCountry = countryFilter === "all" || order.country_id?.toString() === countryFilter;
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
    
    return matchesStatus && matchesCountry && matchesSearch && matchesDate;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, countryFilter, searchTerm, selectedPeriod]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusStats = () => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  };

  const stats = getStatusStats();

  const handleViewClick = async (order: Order) => {
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
      setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));
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
      setOrders(orders.filter((o) => o.id !== deletingOrder.id));
      setShowDeleteModal(false);
      setDeletingOrder(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete order");
    } finally {
      setDeleteLoading(false);
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
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            <option value="all">All Countries</option>
            {filterCountries.map((country) => (
              <option key={country.id} value={country.id.toString()}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Country</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
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
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-600">
                        {order.country ? `${order.country.flag} ${order.country.name}` : "-"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-slate-800">${order.total}</td>
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
                        <button
                          onClick={() => handleDeleteClick(order)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        
        {/* Pagination */}
        {filteredOrders.length > ordersPerPage && (
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
        )}
      </div>

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
              {/* Order Info */}
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
                  {selectedOrder.cancellation_reason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-600 font-medium">Cancellation Reason:</p>
                      <p className="text-sm text-red-700">{selectedOrder.cancellation_reason}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Country</p>
                  <p className="font-medium">
                    {selectedOrder.country ? `${selectedOrder.country.flag} ${selectedOrder.country.name}` : "-"}
                  </p>
                </div>
              </div>

              {/* Customer & Contact Info */}
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

              {/* Shipping Address */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Shipping Address</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="font-medium">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                  <p className="text-sm text-slate-600">{selectedOrder.address}</p>
                  {selectedOrder.apartment && <p className="text-sm text-slate-600">{selectedOrder.apartment}</p>}
                  <p className="text-sm text-slate-600">{selectedOrder.city}, {selectedOrder.postal_code}</p>
                </div>
              </div>

              {/* Shipping & Payment Method */}
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
                            {item.product ? (
                              <a
                                href={`/products/${item.product_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 hover:underline"
                              >
                                {item.product.name}
                              </a>
                            ) : (
                              `Product #${item.product_id}`
                            )}
                            {item.size && <p className="text-xs text-slate-400">Size: {item.size}</p>}
                          </td>
                          <td className="py-3 px-4 text-sm text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-sm text-right">${Number(item.price).toFixed(2)}</td>
                          <td className="py-3 px-4 text-sm text-right font-medium">${(Number(item.price) * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td colSpan={3} className="py-2 px-4 text-sm text-right">Subtotal</td>
                        <td className="py-2 px-4 text-sm text-right">${Number(selectedOrder.subtotal || selectedOrder.total).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 px-4 text-sm text-right">Shipping ({selectedOrder.shipping_method})</td>
                        <td className="py-2 px-4 text-sm text-right">
                          {Number(selectedOrder.shipping_cost) === 0 ? 'Free' : `$${Number(selectedOrder.shipping_cost).toFixed(2)}`}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2 px-4 text-sm text-right">Tax</td>
                        <td className="py-2 px-4 text-sm text-right">${Number(selectedOrder.tax || 0).toFixed(2)}</td>
                      </tr>
                      <tr className="border-t border-slate-200">
                        <td colSpan={3} className="py-3 px-4 text-base font-semibold text-right">Total</td>
                        <td className="py-3 px-4 text-base font-bold text-right">${Number(selectedOrder.total).toFixed(2)}</td>
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Create New Order</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {addError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{addError}</div>}
              {addSuccess && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg">{addSuccess}</div>}

              <form onSubmit={handleAddOrder} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-800">Order Details</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                      <select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                        required
                      >
                        <option value="">Select a customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} ({customer.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                      >
                        {countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.flag} {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-800">Available Products</h3>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">No products found</div>
                      ) : (
                        filteredProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                          <div>
                            <p className="font-medium text-slate-800">{product.name}</p>
                            <p className="text-sm text-slate-500">${product.price}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      ))
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-800 mb-3">Cart</h3>
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 border border-dashed border-slate-300 rounded-lg">
                      No items in cart. Add products from the list.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Product</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Quantity</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Price</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Subtotal</th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cartItems.map((item) => (
                            <tr key={item.product_id}>
                              <td className="py-3 px-4 text-sm">{item.name}</td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                                    className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded hover:bg-slate-200"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                                    className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded hover:bg-slate-200"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-right">${item.price}</td>
                              <td className="py-3 px-4 text-sm text-right font-medium">${item.price * item.quantity}</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.product_id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50">
                          <tr>
                            <td colSpan={3} className="py-3 px-4 text-sm font-semibold text-right">Total</td>
                            <td className="py-3 px-4 text-sm font-bold text-right">${getCartTotal().toFixed(2)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading || cartItems.length === 0}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {addLoading ? "Creating..." : "Create Order"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
