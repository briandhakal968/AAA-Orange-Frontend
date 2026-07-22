"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useCountry } from "@/context/country-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

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
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
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
  const { items, subtotal, clearCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const { selectedCountry } = useCountry();
  const router = useRouter();
  const currencySymbol = selectedCountry?.currency_symbol || '$';

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

  // Saved addresses from localStorage
  interface SavedAddress {
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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const shipping = useMemo(() => {
    if (shippingMethod === "standard") return subtotal >= 500 ? 0 : 15;
    if (shippingMethod === "express") return 25;
    if (shippingMethod === "overnight") return 50;
    return 0;
  }, [shippingMethod, subtotal]);

  const tax = useMemo(() => subtotal * 0.08, [subtotal]);
  const total = useMemo(() => subtotal + shipping + tax, [subtotal, shipping, tax]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load saved addresses when logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      try {
        const savedAddressesRaw = localStorage.getItem(`shipping_addresses_${user.id}`);
        if (savedAddressesRaw) {
          const addresses: SavedAddress[] = JSON.parse(savedAddressesRaw);
          setSavedAddresses(addresses);
          if (addresses.length > 0) {
            const first = addresses[0];
            setSelectedAddressId(first.id);
            setFormData({
              firstName: first.firstName,
              lastName: first.lastName,
              address: first.address1,
              apartment: first.address2,
              city: first.city,
              postalCode: first.zip,
              phone: first.phone,
            });
          }
        }
      } catch {}
    }
  }, [isLoggedIn, user]);

  const downloadInvoice = async () => {
    if (!orderNumber) return;
    const token = localStorage.getItem("auth_token");
    try {
      const response = await fetch(`${API_URL}/api/user/orders/${orderNumber}/invoice`, {
        method: "GET",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to download invoice");
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
      const token = localStorage.getItem("auth_token");
      if (!isLoggedIn || !token) {
        router.push("/login");
        return;
      }

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

      const orderData = {
        items: orderItems,
        subtotal,
        shipping_cost: shipping,
        tax,
        total,
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        email: user?.email || "",
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
        const errorData = await response.json().catch(() => null);
        if (errorData?.details) {
          alert(errorData.details.join('\n'));
        } else {
          throw new Error(errorData?.error || `Failed to place order`);
        }
        return;
      }

      const result = await response.json();
      setOrderNumber(result.order_number || `ORD-${Date.now()}`);
      const orderDataFromAPI = result.order || orderData;
      setOrderDetails({
        ...orderDataFromAPI,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        postalCode: formData.postalCode,
        phone: formData.phone,
        items: (orderDataFromAPI.items || orderItems).map((item: any) => ({
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
    } catch (error) {
      console.error("Order placement failed:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <main className="flex-1 pt-0">
        <Container>
          <div className="py-12 md:py-20 text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </Container>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="flex-1 pt-0">
        <Container>
          <div className="py-20 md:py-32 text-center">
            <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-4">
              Please login to checkout
            </h1>
            <p className="text-[var(--muted-foreground)] mb-8">
              You need to be logged in to place an order
            </p>
            <Link href="/login">
              <Button variant="primary" size="lg">
                Login
              </Button>
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
                <section className="mb-6">
                  <div className="border border-[var(--border)] rounded-xl p-4 bg-green-50 flex items-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-green-600">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span className="text-sm text-green-800">
                      Logged in as <strong>{user?.email}</strong>
                    </span>
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-medium mb-4">Shipping Address</h2>
                  {savedAddresses.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Use a saved address</label>
                      <select
                        value={selectedAddressId}
                        onChange={(e) => {
                          const addr = savedAddresses.find(a => a.id === e.target.value);
                          if (addr) {
                            setSelectedAddressId(addr.id);
                            setFormData({
                              firstName: addr.firstName,
                              lastName: addr.lastName,
                              address: addr.address1,
                              apartment: addr.address2,
                              city: addr.city,
                              postalCode: addr.zip,
                              phone: addr.phone,
                            });
                          } else {
                            setSelectedAddressId("");
                            setFormData({ firstName: "", lastName: "", address: "", apartment: "", city: "", postalCode: "", phone: "" });
                          }
                        }}
                        className="w-full h-12 px-4 border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none text-sm rounded-lg"
                      >
                        <option value="">Enter a new address</option>
                        {savedAddresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.firstName} {addr.lastName} - {addr.address1}, {addr.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
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
                           <div className="absolute top-0 right-0 bg-black text-white text-xs px-1.5 py-0.5">{item.quantity}</div>
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
