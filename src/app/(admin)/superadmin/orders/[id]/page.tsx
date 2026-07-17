"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  size?: string;
  attributes?: string;
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

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [editStatus, setEditStatus] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const data = await adminApi.get<Order>(`/admin/orders/${orderId}`);
      setOrder(data);
      setEditStatus(data.status);
      setCancellationReason(data.cancellation_reason || "");
    } catch (err) {
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");
    setEditLoading(true);

    try {
      const updateData: any = { status: editStatus };
      if (editStatus === "cancelled" && cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }
      const updated = await adminApi.put<Order>(`/admin/orders/${orderId}`, updateData);
      setOrder(updated as Order);
      setEditSuccess("Order status updated successfully!");
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Order not found</p>
        <button onClick={() => router.push("/superadmin/orders")} className="mt-4 text-indigo-600 hover:underline">
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push("/superadmin/orders")} className="p-2 hover:bg-slate-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Order #{order.order_number || order.id}</h1>
        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${statusColors[order.status] || "bg-slate-100 text-slate-700"}`}>
          {statusLabels[order.status] || order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">Order Items</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <img 
                    src={item.product?.image || "/placeholder.jpg"} 
                    alt={item.product?.name} 
                    className="w-16 h-16 rounded-lg object-cover bg-slate-100"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{item.product?.name || `Product #${item.product_id}`}</p>
                    <p className="text-sm text-slate-500">Qty: {item.quantity} × ${Number(item.price).toFixed(2)}</p>
                     {item.attributes ? (
                       <p className="text-xs text-slate-400">{item.attributes}</p>
                     ) : item.size ? (
                       <p className="text-xs text-slate-400">Size: {item.size}</p>
                     ) : null}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(item.quantity * Number(item.price)).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {(!order.items || order.items.length === 0) && (
                <div className="p-8 text-center text-slate-500">No items found</div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span>${Number(order.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Shipping</span>
                  <span>${Number(order.shipping_cost || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax</span>
                  <span>${Number(order.tax || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Shipping Address</h2>
            <div className="space-y-1">
              <p className="font-medium">{order.first_name} {order.last_name}</p>
              <p className="text-slate-600">{order.address}</p>
              {order.apartment && <p className="text-slate-600">{order.apartment}</p>}
              <p className="text-slate-600">{order.city}, {order.postal_code}</p>
              <p className="text-slate-600">{order.country?.name}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Payment Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-medium capitalize">{order.payment_method || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping Method</span>
                <span className="font-medium capitalize">{order.shipping_method || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Customer & Status */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Update Status</h2>
            {editSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg">{editSuccess}</div>
            )}
            {editError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{editError}</div>
            )}
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
                {editStatus === "cancelled" && (
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Cancellation Reason</label>
                    <textarea
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      rows={3}
                      placeholder="Reason for cancellation..."
                    />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={editLoading}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                {editLoading ? "Updating..." : "Update Status"}
              </button>
            </form>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="font-medium">{order.first_name} {order.last_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium">{order.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="font-medium">{order.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Account</p>
                <p className="font-medium">{order.user?.name || "Guest"}</p>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Order Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Order ID</p>
                <p className="font-medium">#{order.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Order Number</p>
                <p className="font-medium">{order.order_number || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Updated</p>
                <p className="font-medium">{new Date(order.updated_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Country</p>
                <p className="font-medium">{order.country ? `${order.country.flag} ${order.country.name}` : "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}