"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import { useAuth } from "@/context/auth-context";
import { useAlert } from "@/components/ui/alert-modal";
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Section = "dashboard" | "orders" | "shipping" | "account-info" | "change-password";

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: {
    id: number;
    name: string;
    image: string;
  };
}

interface Order {
  id: number;
  order_number?: string;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
  cancellation_reason?: string;
  country?: {
    name: string;
    currency_symbol: string;
  };
}

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

const sidebarLinks = [
  { id: "dashboard", label: "Dashboard", href: "/my-account" },
  { id: "orders", label: "Orders", href: "/my-account/orders" },
  { id: "shipping", label: "Shipping Address", href: "/my-account/shipping" },
  { id: "account-info", label: "Account Info", href: "/my-account/info" },
  { id: "change-password", label: "Change Password", href: "/my-account/password" },
];

const initialAddress = {
  id: "",
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  phone: "",
};

export default function AccountPage() {
  const router = useRouter();
  const { user: authUser, logout, isLoggedIn, loading } = useAuth();
  const { showAlert } = useAlert();
  const [displayName, setDisplayName] = useState<string>("");
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonOther, setCancelReasonOther] = useState("");
  const [shippingAddresses, setShippingAddresses] = useState<Address[]>([]);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [shippingForm, setShippingForm] = useState<Address>(initialAddress);
  const [savedMessage, setSavedMessage] = useState<string>("");
  const [accountForm, setAccountForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string>("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<{id: number, name: string} | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (!authUser?.id) return;
    
    const userId = authUser.id;
    const savedShipping = localStorage.getItem(`shipping_addresses_${userId}`);
    const savedAccount = localStorage.getItem(`account_info_${userId}`);
    const savedProfile = localStorage.getItem(`profile_picture_${userId}`);
    
    if (savedShipping) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShippingAddresses(JSON.parse(savedShipping));
    }
    if (savedAccount) {
      const account = JSON.parse(savedAccount);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccountForm(account);
    } else {
      // Initialize with user data if no saved account info
      setAccountForm({
        name: authUser.name || '',
        email: authUser.email || '',
        phone: '',
      });
    }
    if (savedProfile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewImage(savedProfile);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfilePicture(savedProfile);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser?.name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayName(authUser.name);
    } else {
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setDisplayName(parsedUser.name || "Customer");
        } catch {
          setDisplayName("Customer");
        }
      }
    }
  }, [authUser]);

  useEffect(() => {
    if (isLoggedIn && authUser && !loading && (activeSection === "orders" || activeSection === "dashboard")) {
      fetchOrders();
    }
  }, [activeSection, isLoggedIn, authUser, loading]);

  useEffect(() => {
    // Extract phone number from orders if account phone is empty
    if (orders.length > 0 && !accountForm.phone && authUser) {
      const lastOrderWithPhone = orders.find((order: any) => order.phone);
      if (lastOrderWithPhone && (lastOrderWithPhone as any).phone) {
        const updatedForm = { ...accountForm, phone: (lastOrderWithPhone as any).phone };
        setAccountForm(updatedForm);
        localStorage.setItem(`account_info_${authUser.id}`, JSON.stringify(updatedForm));
      }
    }
  }, [orders, authUser]);

  const fetchOrders = async () => {
    if (!isLoggedIn || !authUser) return;
    
    setOrdersLoading(true);
    try {
      const data = await api.get<Order[]>("/orders");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      if (err instanceof Error && err.message.includes('401')) {
        logout();
        router.push('/login');
      }
    } finally {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrdersLoading(false);
    }
  };

  const handleCancelOrder = (orderId: number) => {
    setCancellingOrderId(orderId);
    setCancelReason("");
    setCancelReasonOther("");
    setShowCancelModal(true);
  };

  const submitCancelOrder = async () => {
    if (!cancelReason) return;
    
    try {
      const reason = cancelReason === "Other" ? cancelReasonOther : cancelReason;
      const token = localStorage.getItem("auth_token");
      
      await fetch(`${API_URL}/api/orders/${cancellingOrderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ cancellation_reason: reason }),
      });
      
      showAlert("Order cancelled successfully", "success");
      setShowCancelModal(false);
      setCancellingOrderId(null);
      setCancelReason("");
      setCancelReasonOther("");
      fetchOrders();
    } catch (err) {
      showAlert("Failed to cancel order. Please try again.", "error");
    }
  };

  const submitReview = async () => {
    if (!reviewProduct || reviewRating === 0) return;
    
    setReviewLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      
      const response = await fetch(`${API_URL}/api/products/${reviewProduct.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || "Failed to submit review");
      }

      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewModalOpen(false);
        setReviewProduct(null);
        setReviewSubmitted(false);
      }, 2000);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Failed to submit review", "error");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem("registration_name");
    router.push("/");
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.id) return;
    
    const newAddress = { ...shippingForm, id: Date.now().toString() };
    const updated = [...shippingAddresses, newAddress];
    setShippingAddresses(updated);
    localStorage.setItem(`shipping_addresses_${authUser.id}`, JSON.stringify(updated));
    setShippingForm(initialAddress);
    setShowShippingForm(false);
    setSavedMessage("Shipping address saved successfully!");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const deleteShippingAddress = (id: string) => {
    if (!authUser?.id) return;
    
    const updated = shippingAddresses.filter((a) => a.id !== id);
    setShippingAddresses(updated);
    localStorage.setItem(`shipping_addresses_${authUser.id}`, JSON.stringify(updated));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewImage(base64);
        setProfilePicture(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAccountInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.id) return;
    
    localStorage.setItem(`account_info_${authUser.id}`, JSON.stringify(accountForm));
    if (profilePicture) {
      localStorage.setItem(`profile_picture_${authUser.id}`, profilePicture);
    }
    setDisplayName(accountForm.name);
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        userData.name = accountForm.name;
        userData.email = accountForm.email;
        localStorage.setItem("auth_user", JSON.stringify(userData));
      } catch (err) {
        console.error("Error updating user data:", err);
      }
    }
    setSavedMessage("Account info saved successfully!");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordMessage("");
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_URL}/api/user/update-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          new_password_confirmation: passwordData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Password update failed");
      }

      setPasswordMessage("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 pt-[60px]">
        <Container>
          <div className="py-12 md:py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        </Container>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="flex-1 pt-[60px]">
        <Container>
          <div className="py-12 md:py-20 max-w-md mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-4">
              My Account
            </h1>
            <p className="text-neutral-500 mb-8">
              Please sign in to view your account details.
            </p>
            <div className="space-y-4">
              <Link
                href="/login"
                className="block w-full h-12 bg-black text-white text-xs uppercase tracking-[0.15em] font-medium hover:bg-neutral-800 transition-colors text-center leading-[48px]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="block w-full h-12 border border-black text-black text-xs uppercase tracking-[0.15em] font-medium hover:bg-black hover:text-white transition-colors text-center leading-[48px]"
              >
                Create Account
              </Link>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-neutral-800">Account Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-black to-neutral-800 text-white rounded-xl p-6 shadow-lg">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-xs text-white/60 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold">{orders.length}</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4 text-neutral-800">Account Details</h2>
              <div className="bg-gradient-to-br from-neutral-50 to-white rounded-xl p-6 border border-neutral-100">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-neutral-100">
                  <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-bold text-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-800">{displayName}</p>
                    <p className="text-xs text-neutral-500">Member since 2024</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400">Email</p>
                      <p className="text-sm font-medium text-neutral-700">{authUser?.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "orders":
        if (selectedOrder) {
          return (
            <div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to orders
              </button>
              <div className="bg-white border border-neutral-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-800">Order #{selectedOrder.id}</h2>
                    <p className="text-sm text-neutral-500">
                      Placed on {new Date(selectedOrder.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        selectedOrder.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : selectedOrder.status === "processing"
                          ? "bg-blue-100 text-blue-700"
                          : selectedOrder.status === "shipped"
                          ? "bg-purple-100 text-purple-700"
                          : selectedOrder.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : selectedOrder.status === "refunded"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                    {(selectedOrder.status === "pending" || selectedOrder.status === "processing") && (
                      <button
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        disabled={cancellingOrderId === selectedOrder.id}
                        className="px-3 py-1 text-sm font-medium text-red-600 border border-red-200 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {cancellingOrderId === selectedOrder.id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                        {item.product?.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-800">{item.product?.name || "Product"}</p>
                        <p className="text-sm text-neutral-500">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium text-neutral-800">
                          {selectedOrder.country?.currency_symbol || "$"}
                          {(Number(item.price) * item.quantity).toFixed(2)}
                        </p>
                        {selectedOrder.status === "delivered" && item.product?.id && item.product?.name && (
                          <button
                            onClick={() => {
                              setReviewProduct({ id: item.product!.id, name: item.product!.name! });
                              setReviewModalOpen(true);
                              setReviewSubmitted(false);
                              setReviewRating(0);
                              setReviewComment("");
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1 underline"
                          >
                            Write a review
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-neutral-100 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Subtotal</span>
                    <span className="text-neutral-800">
                      {selectedOrder.country?.currency_symbol || "$"}
                      {Number(selectedOrder.total).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Shipping</span>
                    <span className="text-neutral-800">
                      {Number((selectedOrder as Order & { shipping_cost?: string }).shipping_cost || 0) === 0 
                        ? "Free" 
                        : `${selectedOrder.country?.currency_symbol || "$"}${Number((selectedOrder as Order & { shipping_cost?: string }).shipping_cost || 0).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-neutral-100">
                    <span>Total</span>
                    <span>
                      {selectedOrder.country?.currency_symbol || "$"}
                      {Number(selectedOrder.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-neutral-800">Orders</h2>
            {!isLoggedIn ? (
              <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-gradient-to-b from-neutral-50 to-white">
                <div className="p-12 text-center">
                  <p className="text-lg font-medium text-neutral-700 mb-2">Please log in to view your orders</p>
                  <Link href="/login" className="inline-block px-6 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
                    Log In
                  </Link>
                </div>
              </div>
            ) : ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-gradient-to-b from-neutral-50 to-white">
                <div className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neutral-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-neutral-700 mb-2">No orders yet</p>
                  <p className="text-sm text-neutral-400 mb-6">When you place an order, it will appear here.</p>
                  <Link href="/shop" className="inline-block px-6 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
                    Start Shopping
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full text-left border border-neutral-200 rounded-xl p-4 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium text-neutral-800">Order #{order.id}</p>
                        <p className="text-sm text-neutral-500">
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-neutral-800">
                          {order.country?.currency_symbol || "$"}
                          {Number(order.total).toFixed(2)}
                        </p>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "processing"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "shipped"
                              ? "bg-purple-100 text-purple-700"
                              : order.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : order.status === "refunded"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        {order.status === "cancelled" && order.cancellation_reason && (
                          <p className="text-xs text-red-600 mt-1">Reason: {order.cancellation_reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex-shrink-0 w-16 h-16 rounded-lg bg-neutral-100 overflow-hidden">
                          {item.product?.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">Click to view details</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case "shipping":
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Shipping Address</h2>
              {!showShippingForm && (
                <button
                  onClick={() => setShowShippingForm(true)}
                  className="text-sm underline underline-offset-4 hover:text-neutral-600"
                >
                  Add New
                </button>
              )}
            </div>
            {savedMessage && activeSection === "shipping" && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm">
                {savedMessage}
              </div>
            )}
            {showShippingForm ? (
              <form onSubmit={handleShippingSubmit} className="bg-neutral-50 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">First Name</label>
                    <input
                      type="text"
                      value={shippingForm.firstName}
                      onChange={(e) => setShippingForm({ ...shippingForm, firstName: e.target.value })}
                      className="w-full h-10 px-3 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={shippingForm.lastName}
                      onChange={(e) => setShippingForm({ ...shippingForm, lastName: e.target.value })}
                      className="w-full h-10 px-3 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Address</label>
                  <input
                    type="text"
                    value={shippingForm.address1}
                    onChange={(e) => setShippingForm({ ...shippingForm, address1: e.target.value })}
                    className="w-full h-10 px-3 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                    placeholder="Street address"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={shippingForm.address2}
                    onChange={(e) => setShippingForm({ ...shippingForm, address2: e.target.value })}
                    className="w-full h-10 px-3 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">City</label>
                    <input
                      type="text"
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                      className="w-full h-10 px-3 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">State / Province</label>
                    <input
                      type="text"
                      value={shippingForm.state}
                      onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                      className="w-full h-10 px-3 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">ZIP / Postal Code</label>
                    <input
                      type="text"
                      value={shippingForm.zip}
                      onChange={(e) => setShippingForm({ ...shippingForm, zip: e.target.value })}
                      className="w-full h-10 px-3 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Country</label>
                    <select
                      value={shippingForm.country}
                      onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                      className="w-full h-10 px-3 border border-neutral-200 focus:border-black focus:outline-none text-sm bg-white"
                      required
                    >
                      <option value="">Select country</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="NP">Nepal</option>
                      <option value="HK">Hong Kong</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    className="w-full h-10 px-3 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                  />
                </div>
                <div className="flex gap-4 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-black text-white text-xs uppercase tracking-[0.15em] hover:bg-neutral-800 transition-colors"
                  >
                    Save Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShippingForm(false)}
                    className="px-6 py-2 border border-neutral-300 text-xs uppercase tracking-[0.15em] hover:bg-neutral-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : shippingAddresses.length > 0 ? (
              <div className="space-y-4">
                {shippingAddresses.map((addr) => (
                  <div key={addr.id} className="border border-neutral-200 p-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium">{addr.firstName} {addr.lastName}</p>
                        <p className="text-sm text-neutral-600">{addr.address1}</p>
                        {addr.address2 && <p className="text-sm text-neutral-600">{addr.address2}</p>}
                        <p className="text-sm text-neutral-600">{addr.city}, {addr.state} {addr.zip}</p>
                        <p className="text-sm text-neutral-600">{addr.country}</p>
                        {addr.phone && <p className="text-sm text-neutral-600">Phone: {addr.phone}</p>}
                      </div>
                      <button
                        onClick={() => deleteShippingAddress(addr.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-neutral-200 p-8 text-center">
                <p className="text-neutral-500 mb-4">No shipping address saved</p>
                <button
                  onClick={() => setShowShippingForm(true)}
                  className="px-6 py-2 border border-neutral-300 text-xs uppercase tracking-[0.15em] hover:bg-neutral-100 transition-colors"
                >
                  Add Shipping Address
                </button>
              </div>
            )}
          </div>
        );

      case "account-info":
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Account Info</h2>
            </div>
            {savedMessage && activeSection === "account-info" && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm">
                {savedMessage}
              </div>
            )}
            <div className="bg-neutral-50 p-6">
              <form onSubmit={handleAccountInfoSubmit} className="space-y-4">
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-neutral-800 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Profile Picture</p>
                    <p className="text-xs text-neutral-500">Upload a photo to personalize your account</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    className="w-full max-w-md h-10 px-3 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={accountForm.email || authUser?.email || ''}
                    readOnly
                    className="w-full max-w-md h-10 px-3 border border-neutral-200 bg-neutral-50 text-neutral-500 focus:outline-none text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    placeholder={orders.length > 0 ? `From orders: ${(orders.find((o: any) => o.phone) as any)?.phone}` : "Add phone number"}
                    className="w-full max-w-md h-10 px-3 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                  />
                  {orders.some((o: any) => o.phone) && !accountForm.phone && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Phone auto-saved from your order: <strong>{(orders.find((o: any) => o.phone) as any)?.phone}</strong>
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white text-xs uppercase tracking-[0.15em] hover:bg-neutral-800 transition-colors"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        );

      case "change-password":
        return (
          <div>
            <h2 className="text-lg font-medium mb-4">Change Password</h2>
            <div className="bg-neutral-50 p-6">
              <div className="space-y-4 max-w-md">
                {passwordMessage && (
                  <div className="p-3 bg-green-50 text-green-600 text-sm">
                    {passwordMessage}
                  </div>
                )}
                {passwordError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm">
                    {passwordError}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full h-10 px-3 pr-12 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showCurrentPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full h-10 px-3 pr-12 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showNewPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full h-10 px-3 pr-12 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="px-6 py-2 bg-black text-white text-xs uppercase tracking-[0.15em] hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="flex-1 pt-[60px]">
      <Container>
        <div className="py-8 md:py-12">
          <div className="flex gap-8">
            <aside className="hidden md:block w-[30%]">
              <div className="bg-white rounded-xl shadow-lg shadow-neutral-200/50 p-6 sticky top-24">
                <div className="text-center pb-6 border-b border-neutral-100">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden flex items-center justify-center ring-4 ring-white shadow-lg">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-neutral-200 to-neutral-300 w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-800">Hello, {displayName}</h2>
                  <p className="text-xs text-neutral-400 mt-1">How you doing?</p>
                </div>
                <nav className="pt-4 space-y-1">
                  {sidebarLinks.map((link, index) => (
                    <button
                      key={link.id}
                      onClick={() => setActiveSection(link.id as Section)}
                      className={`group flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeSection === link.id
                          ? "bg-black text-white shadow-lg shadow-black/20"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                        activeSection === link.id
                          ? "bg-white/20 text-white"
                          : "bg-neutral-100 group-hover:bg-black group-hover:text-white text-neutral-400"
                      }`}>
                        {index + 1}
                      </span>
                      {link.label}
                      {activeSection === link.id && (
                        <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-4 border-t border-neutral-100 pt-4"
                  >
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 text-red-500 text-xs font-bold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </span>
                    Log Out
                  </button>
                </nav>
              </div>
            </aside>

            <div className="flex-1 md:w-[70%]">
              <div className="mb-8 md:hidden">
                <select
                  value={activeSection}
                  onChange={(e) => setActiveSection(e.target.value as Section)}
                  className="w-full h-12 px-4 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                >
                  {sidebarLinks.map((link) => (
                    <option key={link.id} value={link.id}>
                      {link.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white rounded-xl shadow-lg shadow-neutral-200/50 p-6 md:p-8">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setShowCancelModal(false);
                setCancellingOrderId(null);
                setCancelReason("");
              }}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-2">Cancel Order</h3>
              <p className="text-neutral-500">Please provide a reason for cancelling this order.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Reason for cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Found better price elsewhere">Found better price elsewhere</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Long delivery time">Long delivery time</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {cancelReason === "Other" && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Please specify</label>
                  <input
                    type="text"
                    value={cancelReasonOther}
                    onChange={(e) => setCancelReasonOther(e.target.value)}
                    placeholder="Enter your reason"
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                    required
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellingOrderId(null);
                    setCancelReason("");
                    setCancelReasonOther("");
                  }}
                  className="flex-1 px-6 py-3 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={submitCancelOrder}
                  disabled={!cancelReason || (cancelReason === "Other" && !cancelReasonOther.trim())}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {reviewSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Review Submitted!</h3>
                <p className="text-neutral-500">Thank you for your feedback.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Reviewing: <strong>{reviewProduct?.name}</strong>
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-3xl transition-colors"
                      >
                        {star <= reviewRating ? (
                          <span className="text-yellow-400">★</span>
                        ) : (
                          <span className="text-neutral-300">☆</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Comment (optional)
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-black focus:outline-none text-sm resize-none"
                    placeholder="Share your experience with this product..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={reviewLoading || reviewRating === 0}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reviewLoading ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
