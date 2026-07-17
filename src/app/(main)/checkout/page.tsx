"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useCountry } from "@/context/country-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/components/ui/alert-modal";

type PaymentMethod = "cod" | "card" | "paypal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface OrderItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  attributes?: string;
  image: string;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 pt-0">
        <Container>
          <div className="py-12 md:py-20 text-center">
            <h1 className="text-2xl md:text-3xl font-light mb-4">Your cart is empty</h1>
            <Link href="/shop" className="inline-block px-6 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </Container>
      </main>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const { login, register, verifyEmail } = useAuth();
  const { selectedCountry } = useCountry();
  const currencySymbol = selectedCountry?.currency_symbol || '$';

  // Auth states
  const [authLoading, setAuthLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [authError, setAuthError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [existingEmail, setExistingEmail] = useState("");
  const [existingPassword, setExistingPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [registrationData, setRegistrationData] = useState<{ email: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    postalCode: "",
    phone: "",
  });
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express" | "overnight">("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  // Calculated values
  const shipping = useMemo(() => {
    if (shippingMethod === "standard") return subtotal >= 500 ? 0 : 15;
    if (shippingMethod === "express") return 25;
    if (shippingMethod === "overnight") return 50;
    return 0;
  }, [shippingMethod, subtotal]);

  const tax = useMemo(() => subtotal * 0.08, [subtotal]);
  const total = useMemo(() => subtotal + shipping + tax, [subtotal, shipping, tax]);

  // Check auth status on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("auth_user");
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        setIsLoggedIn(true);
        setLoggedInEmail(userData.email || "");
      } catch {
        setIsLoggedIn(false);
      }
    }
  }, []);

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await login(existingEmail, existingPassword);
      setIsLoggedIn(true);
      setLoggedInEmail(existingEmail);
      setShowLogin(false);
      setExistingEmail("");
      setExistingPassword("");
    } catch (err: any) {
      setAuthError(err.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const result = await register(accountName, accountEmail, accountPassword);
      setRegistrationData({ email: accountEmail });
      setShowVerification(true);
      setCreateAccount(false);
    } catch (err: any) {
      setAuthError(err.message || "Registration failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const sendVerificationCode = async (email: string) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await register(accountName, email, accountPassword);
    } catch (err: any) {
      setAuthError(err.message || "Failed to send verification code");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setVerifyLoading(true);
    setAuthError("");
    try {
      await verifyEmail(accountEmail, verificationCode);
      setIsLoggedIn(true);
      setLoggedInEmail(accountEmail);
      setShowVerification(false);
      setRegistrationData(null);
      setVerificationCode("");
    } catch (err: any) {
      setAuthError(err.message || "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  const downloadInvoice = async () => {
    if (!orderNumber) return;

    try {
      const token = localStorage.getItem("auth_token");
      const url = token
        ? `${API_URL}/api/user/orders/${orderNumber}/invoice`
        : `${API_URL}/api/orders/${orderNumber}/invoice`;

      const response = await fetch(url, {
        method: "GET",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `invoice-${orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Invoice download failed:", error);
      alert("Failed to download invoice. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderItems: OrderItem[] = items.filter(item => item.product).map((item) => {
        const itemSize = item.size || "M";
        const itemColor = (item as any).selectedColor || undefined;
        const attrs: string[] = [];
        if (itemSize) attrs.push(`Size: ${itemSize}`);
        if (itemColor) attrs.push(`Color: ${itemColor}`);
        
        return {
          product_id: item.product!.id,
          name: item.product!.name,
          price: item.product!.price,
          quantity: item.quantity,
          size: itemSize,
          attributes: attrs.length > 0 ? attrs.join(', ') : undefined,
          image: item.product!.image,
        };
      });

      const token = localStorage.getItem("auth_token");

      if (isLoggedIn && token) {
        // Authenticated user - use /api/orders which auto-sets user_id
        const orderData = {
          items: orderItems,
          subtotal,
          shipping_cost: shipping,
          tax,
          total,
          shipping_method: shippingMethod,
          payment_method: paymentMethod,
          email: loggedInEmail || formData.firstName.toLowerCase() + "@example.com",
          country_id: selectedCountry?.id || null,
          first_name: formData.firstName,
          last_name: formData.lastName,
          address: formData.address,
          apartment: formData.apartment,
          city: formData.city,
          postal_code: formData.postalCode,
          phone: formData.phone,
        };

        const response = await fetch(`${API_URL}/api/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Order API error:", response.status, errorText);
          throw new Error(`Failed to place order: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        setOrderNumber(result.order_number || `ORD-${Date.now()}`);
        // Use the order data from API response to show actual saved attributes
        const orderDataFromAPI = result.order || orderData;
        // Normalize numeric values (API returns strings) and map image fields
        setOrderDetails({
          ...orderDataFromAPI,
          items: (orderDataFromAPI.items || orderDataFromAPI).map((item: any) => ({
            ...item,
            image: item.product_image || item.image || null,
            name: item.product_name || item.name || 'Unknown Product',
          })),
          subtotal: Number(orderDataFromAPI.subtotal) || subtotal,
          shipping_cost: Number(orderDataFromAPI.shipping_cost) || shipping,
          tax: Number(orderDataFromAPI.tax) || tax,
          total: Number(orderDataFromAPI.total) || total,
        });
        setOrderPlaced(true);
        clearCart();
      } else {
        // Guest checkout
        const orderData = {
          ...formData,
          items: orderItems,
          subtotal,
          shipping_cost: shipping,
          tax,
          total,
          shippingMethod,
          paymentMethod,
          email: loggedInEmail || formData.firstName.toLowerCase() + "@example.com",
          country_id: selectedCountry?.id || null,
        };

        const response = await fetch(`${API_URL}/api/guest-orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Order API error:", response.status, errorText);
          throw new Error(`Failed to place order: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        setOrderNumber(result.order_number || `ORD-${Date.now()}`);
        // Normalize data for guest checkout too
        setOrderDetails({
          ...orderData,
          items: orderData.items.map((item: any) => ({
            ...item,
            product_image: item.image || item.product_image || null,
            product_name: item.name || item.product_name || 'Unknown Product',
            price: Number(item.price) || 0,
          })),
          subtotal: Number(orderData.subtotal) || subtotal,
          shipping_cost: Number(orderData.shipping_cost) || shipping,
          tax: Number(orderData.tax) || tax,
          total: Number(orderData.total) || total,
        });
        setOrderPlaced(true);
        clearCart();
      }
    } catch (error) {
      console.error("Order placement failed:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="flex-1 pt-0">
        <Container>
          <div className="py-12 md:py-20 text-center">
            <h1 className="text-2xl md:text-3xl font-light mb-4">Your cart is empty</h1>
            <Link href="/shop" className="inline-block px-6 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  if (items.length === 0 && !orderPlaced) {
    return (
      <main className="flex-1 pt-0">
        <Container>
          <div className="py-12 md:py-20 text-center">
            <h1 className="text-2xl md:text-3xl font-light mb-4">Your cart is empty</h1>
            <Link href="/shop" className="inline-block px-6 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  if (orderPlaced) {
    return (
      <main className="flex-1 pt-0">
        <Container>
          <div className="py-8 md:py-12 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-light mb-2">Order Placed Successfully!</h1>
              <p className="text-[var(--muted-foreground)]">Order Number: <span className="font-medium text-neutral-800">{orderNumber}</span></p>
            </div>

            <div className="bg-white border border-[var(--border)] rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">BILL TO</h4>
                  <p className="font-medium">{orderDetails.firstName} {orderDetails.lastName}</p>
                  <p className="text-sm text-neutral-600">{orderDetails.phone}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">SHIP TO</h4>
                  <p className="text-sm text-[var(--foreground)]">
                    {orderDetails.address}
                    {orderDetails.apartment && `, ${orderDetails.apartment}`}
                  </p>
                  <p className="text-sm text-[var(--foreground)]">
                    {orderDetails.city}, {orderDetails.postalCode}
                  </p>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-4 mb-4">
                <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">ORDER SUMMARY</h4>
                <div className="space-y-3">
                  {(orderDetails.items as any[]).map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.image || item.product_image || "/placeholder.png"} 
                          alt={item.name || item.product_name} 
                          className="w-full h-full object-cover" 
                          onError={(e: any) => { e.target.src = "/placeholder.png"; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.name || item.product_name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {item.attributes ? `${item.attributes} | Qty: ${item.quantity}` : `Size: ${item.size} | Qty: ${item.quantity}`}
                        </p>
                      </div>
                      <p className="text-sm font-medium">{currencySymbol}{(Number(item.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-4 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600">Subtotal</span>
                  <span>{currencySymbol}{Number(orderDetails.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600">Shipping</span>
                  <span>{Number(orderDetails.shipping_cost) === 0 ? "Free" : `${currencySymbol}{Number(orderDetails.shipping_cost).toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-600">Tax (8%)</span>
                  <span>{currencySymbol}{Number(orderDetails.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-[var(--border)] mt-2">
                  <span>Total</span>
                  <span>{currencySymbol}{Number(orderDetails.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-[var(--muted)] px-6 py-4 flex flex-col sm:flex-row gap-3 justify-center border-t border-[var(--border)]">
              <Button variant="outline" size="lg" onClick={downloadInvoice} className="flex items-center justify-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download Invoice
              </Button>
              <Link href="/shop">
                <Button variant="primary" size="lg" className="w-full">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  return (
<main className="flex-1 pt-0">
        <Container>
        <div className="py-8 md:py-12">
          <div className="flex items-center justify-between mb-8">
            <Link href="/cart" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to cart
            </Link>
            <h1 className="text-xl md:text-2xl font-light tracking-tight">Checkout</h1>
            <div className="w-24" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
              <div className="lg:col-span-2 space-y-8">
                {!authLoading && !isLoggedIn && (
                  <section className="mb-6">
                    <div className="border border-[var(--border)] rounded-xl p-6 bg-white">
                        <p className="text-sm text-[var(--foreground)] mb-2">
                          Already have an account?{' '}
                          <button
                            type="button"
                            onClick={() => { setShowLogin(!showLogin); setCreateAccount(false); }}
                            className="text-[var(--foreground)] font-medium hover:underline"
                          >
                            Click here to login
                          </button>
                        </p>
                        
                        {/* Login Form - slides open below the link */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showLogin ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                          <div className="space-y-3 pt-2">
                            {authError && showLogin && (
                              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{authError}</div>
                            )}
                            <input type="email" value={existingEmail} onChange={(e) => setExistingEmail(e.target.value)} placeholder="Email address" required className="w-full h-12 px-4 border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none text-sm" />
                            <div className="relative">
                              <input type={showPassword ? "text" : "password"} value={existingPassword} onChange={(e) => setExistingPassword(e.target.value)} placeholder="Password" required className="w-full h-12 px-4 pr-12 border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none text-sm" />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/70 hover:text-[var(--muted-foreground)]">{showPassword ? (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>) : (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>)}</button>
                            </div>
                            <Button type="button" variant="primary" size="lg" className="w-full" onClick={handleLogin}>Login</Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-[var(--foreground)] mb-2">
                          Don't have an account?{' '}
                          <button
                            type="button"
                            onClick={() => { setCreateAccount(!createAccount); setShowLogin(false); }}
                            className="text-[var(--foreground)] font-medium hover:underline"
                          >
                            Create a new account
                          </button>
                        </p>
                        
                        {/* Create Account Form - slides open below the link */}
                        {!showVerification && (
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${createAccount ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                            <div className="space-y-3 pt-2">
                              {authError && createAccount && !authError.includes('Verification code') && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{authError}</div>
                              )}
                              <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Full Name" required className="w-full h-12 px-4 border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none text-sm" />
                              <input type="email" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} placeholder="Email address" required className="w-full h-12 px-4 border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none text-sm" />
                              <div className="relative">
                                <input type={showPassword ? "text" : "password"} value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} placeholder="Password" required minLength={8} className="w-full h-12 px-4 pr-12 border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none text-sm" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/70 hover:text-[var(--muted-foreground)]">{showPassword ? (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>) : (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>)}</button>
                              </div>
                              <p className="text-xs text-[var(--muted-foreground)] -mt-1">Password must be at least 8 characters</p>
                              <Button type="button" onClick={handleRegister} disabled={authLoading || !accountName || !accountEmail || accountPassword.length < 8} className="w-full">{authLoading ? "Creating..." : "Create Account & Continue"}</Button>
                            </div>
                          </div>
                        )}

                        {/* Email Verification Form */}
                        {showVerification && (
                          <div className="overflow-hidden transition-all duration-300 ease-in-out max-h-96 opacity-100 mb-4">
                            <div className="space-y-3 pt-2">
                              <p className="text-sm text-[var(--foreground)]">
                                Enter the verification code sent to <strong>{registrationData?.email}</strong>
                              </p>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                Check your email inbox for the 6-digit code
                              </p>
                              <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Enter 6-digit code"
                                maxLength={6}
                                className="w-full h-12 px-4 border border-[var(--border)] rounded-lg focus:border-[var(--primary)] focus:outline-none text-sm text-center text-lg tracking-widest"
                              />
                              <div className="flex gap-2">
                                <Button type="button" onClick={handleVerifyEmail} disabled={verifyLoading || verificationCode.length !== 6} className="flex-1">
                                  {verifyLoading ? "Verifying..." : "Verify & Continue"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setShowVerification(false);
                                    setRegistrationData(null);
                                    setVerificationCode("");
                                    setAuthError("");
                                  }}
                                  className="flex-1"
                                >
                                  Back
                                </Button>
                              </div>
                              <button
                                type="button"
                                onClick={() => registrationData && sendVerificationCode(registrationData.email)}
                                className="text-sm text-[var(--muted-foreground)] underline underline-offset-4 hover:text-black"
                              >
                                Resend code
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  </section>
                )}

                {isLoggedIn && loggedInEmail && (
                  <section className="mb-6">
                    <div className="border border-[var(--border)] rounded-xl p-4 bg-green-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-600">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span className="text-sm text-green-800">
                          Logged in as <strong>{loggedInEmail}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem("auth_token");
                          localStorage.removeItem("auth_user");
                          window.dispatchEvent(new Event('storage'));
                          setIsLoggedIn(false);
                          setLoggedInEmail("");
                          setAuthError("");
                        }}
                        className="text-sm text-green-700 hover:text-green-900 underline"
                      >
                        Logout
                      </button>
                    </div>
                  </section>
                )}

                <section>
                  <h2 className="text-lg font-medium mb-4">Shipping Address</h2>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" name="firstName" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="First name" required className="h-12 px-4 border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none text-sm" />
                      <input type="text" name="lastName" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Last name" required className="h-12 px-4 border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none text-sm" />
                    </div>
                    <input type="text" name="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Address" required className="w-full h-12 px-4 border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none text-sm" />
                    <input type="text" name="apartment" value={formData.apartment} onChange={(e) => setFormData({...formData, apartment: e.target.value})} placeholder="Apartment, suite, etc. (optional)" className="w-full h-12 px-4 border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" name="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="City" required className="h-12 px-4 border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none text-sm" />
                      <input type="text" name="postalCode" value={formData.postalCode} onChange={(e) => setFormData({...formData, postalCode: e.target.value})} placeholder="Postal code" required className="h-12 px-4 border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none text-sm" />
                    </div>
                    <input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Phone" required className="w-full h-12 px-4 border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none text-sm" />
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-medium mb-4">Shipping Method</h2>
                  <div className="border border-[var(--border)] divide-y divide-neutral-200">
                    <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--muted)] transition-colors">
                      <div className="flex items-center gap-3">
                        <input type="radio" name="shippingMethod" value="standard" checked={shippingMethod === "standard"} onChange={() => setShippingMethod("standard")} className="w-4 h-4" />
                        <div>
                          <p className="text-sm font-medium">Standard Shipping</p>
                          <p className="text-xs text-[var(--muted-foreground)]">5-7 business days</p>
                        </div>
                      </div>
                      <span className="text-sm">{subtotal >= 500 ? "Free" : `${currencySymbol}15.00`}</span>
                    </label>
                    <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--muted)] transition-colors">
                      <div className="flex items-center gap-3">
                        <input type="radio" name="shippingMethod" value="express" checked={shippingMethod === "express"} onChange={() => setShippingMethod("express")} className="w-4 h-4" />
                        <div>
                          <p className="text-sm font-medium">Express Shipping</p>
                          <p className="text-xs text-[var(--muted-foreground)]">2-3 business days</p>
                        </div>
                      </div>
                      <span className="text-sm">{currencySymbol}25.00</span>
                    </label>
                    <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--muted)] transition-colors">
                      <div className="flex items-center gap-3">
                        <input type="radio" name="shippingMethod" value="overnight" checked={shippingMethod === "overnight"} onChange={() => setShippingMethod("overnight")} className="w-4 h-4" />
                        <div>
                          <p className="text-sm font-medium">Overnight Shipping</p>
                          <p className="text-xs text-[var(--muted-foreground)]">1 business day</p>
                        </div>
                      </div>
                      <span className="text-sm">{currencySymbol}50.00</span>
                    </label>
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-medium mb-4">Payment Method</h2>
                  <div className="border border-[var(--border)] divide-y divide-neutral-200">
                    <label className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--muted)] transition-colors">
                      <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="w-4 h-4" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Cash on Delivery</p>
                          <p className="text-xs text-[var(--muted-foreground)]">Pay when you receive your order</p>
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--muted)] transition-colors">
                      <input type="radio" name="paymentMethod" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} className="w-4 h-4" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Credit/Debit Card</p>
                          <p className="text-xs text-[var(--muted-foreground)]">Pay securely with your card</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-[var(--muted)] rounded-xl p-6 sticky top-24">
                  <h2 className="text-lg font-medium mb-4">Order Summary</h2>
                  <div className="space-y-3 mb-4">
                  {items.filter(item => item.product).map((item, index) => (
                       <div key={index} className="flex gap-3">
                         <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                           <img src={item.product!.image} alt={item.product!.name} className="w-full h-full object-cover" />
                           <div className="absolute top-0 right-0 bg-[var(--muted)]0 text-white text-xs px-1.5 py-0.5">{item.quantity}</div>
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-medium line-clamp-2">{item.product!.name}</p>
                           <p className="text-xs text-[var(--muted-foreground)]">
                             {item.selectedColor ? `Size: ${item.size} | Color: ${item.selectedColor}` : `Size: ${item.size}`}
                           </p>
                         </div>
                       </div>
                     ))}
                  </div>
                  <div className="border-t border-[var(--border)] pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Subtotal</span>
                      <span className="font-medium">{currencySymbol}{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Shipping</span>
                      <span className="font-medium">{shipping === 0 ? "Free" : `${currencySymbol}${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Tax (8%)</span>
                      <span className="font-medium">{currencySymbol}{tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-[var(--border)] pt-2 flex justify-between text-base font-semibold">
                      <span>Total</span>
                      <span>{currencySymbol}{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button type="submit" variant="primary" size="lg" className="w-full mt-6" disabled={loading}>
                    {loading ? "Placing Order..." : "Place Order"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </Container>
    </main>
  );
}
