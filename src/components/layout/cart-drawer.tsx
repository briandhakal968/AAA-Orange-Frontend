"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCountry } from "@/context/country-context";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";

export function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, subtotal, itemCount } = useCart();
  const { selectedCountry } = useCountry();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const currencySymbol = selectedCountry?.currency_symbol || '';

  const handleViewCart = () => {
    setIsOpen(false);
    router.push(isLoggedIn ? "/cart" : "/login");
  };

  const handleLoginRedirect = () => {
    setIsOpen(false);
    router.push("/login");
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
              <h2 className="text-lg font-light tracking-wide">
                Shopping Cart ({itemCount})
              </h2>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={handleViewCart}
                    className="text-xs uppercase tracking-[0.15em] font-medium underline underline-offset-4 mr-2"
                  >
                    View Cart
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 flex items-center justify-center -mr-2"
                  aria-label="Close cart"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {!authLoading && !isLoggedIn ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-neutral-300 mb-4">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <p className="text-[var(--muted-foreground)] text-sm mb-2">Please login to use your cart</p>
                <p className="text-xs text-neutral-400 mb-6">You need to be logged in to add items to your cart.</p>
                <button
                  onClick={handleLoginRedirect}
                  className="block w-full h-12 text-white text-xs uppercase tracking-[0.15em] font-medium text-center leading-[48px]"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full h-12 mt-2 text-xs uppercase tracking-[0.15em] font-medium underline underline-offset-4"
                >
                  Continue Shopping
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-neutral-300 mb-4">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <p className="text-[var(--muted-foreground)] text-sm mb-6">Your cart is empty</p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs uppercase tracking-[0.15em] font-medium underline underline-offset-4"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="space-y-6">
                    {items.filter(item => item.product).map((item) => {
                      const product = item.product!;
                      const countryPrice = product.prices?.find(
                        (p: any) => p.country_id === selectedCountry?.id
                      );
                      const unitPrice = Number(countryPrice?.price ?? product.price ?? 0);
                      return (
                      <div key={`${product.id}-${item.size}-${selectedCountry?.id ?? 'none'}`} className="flex gap-4">
                        <div className="w-24 h-32 bg-[var(--muted)] flex-shrink-0 overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${product.slug || product.id}`}
                            onClick={() => setIsOpen(false)}
                            className="text-sm font-light text-black hover:opacity-50 transition-opacity line-clamp-2"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1">
                            Size: {item.size}{item.selectedColor ? ` | Color: ${item.selectedColor}` : ''}
                          </p>
                          <p className="text-sm mt-2">
                            {currencySymbol}{unitPrice.toLocaleString()}
                            {selectedCountry?.currency && (
                              <span className="text-xs text-neutral-400 ml-1"> {selectedCountry.currency}</span>
                            )}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-[var(--border)]">
                              <button
                                onClick={() => updateQuantity(item.product!.id, item.size, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                aria-label="Decrease quantity"
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-sm">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product!.id, item.size, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                              <button
                                onClick={() => removeItem(item.product!.id, item.size)}
                                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors underline underline-offset-2"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-[var(--border)] px-6 py-6 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--muted-foreground)]">Subtotal</span>
                    <span className="text-lg">{currencySymbol}{subtotal.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mb-6">
                    Shipping and taxes calculated at checkout
                  </p>
                  <Link
                    href="/checkout"
                    onClick={() => setIsOpen(false)}
                    className="block w-full h-12 text-white text-xs uppercase tracking-[0.15em] font-medium transition-colors text-center leading-[48px]"
                    style={{ backgroundColor: "var(--primary)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    Checkout
                  </Link>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full h-12 mt-2 text-xs uppercase tracking-[0.15em] font-medium underline underline-offset-4"
                  >
                    Continue Shopping
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
