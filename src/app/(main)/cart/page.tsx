"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useCart } from "@/context/cart-context";
import { useCountry } from "@/context/country-context";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

function CartContent() {
  const { items, removeItem, updateQuantity, subtotal, clearCart, itemCount } = useCart();
  const { selectedCountry } = useCountry();
  const currencySymbol = selectedCountry?.currency_symbol || '$';

  if (items.length === 0) {
    return (
      <main className="flex-1 pt-0">
        <Container>
          <div className="py-20 md:py-32 text-center">
            <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-4">
              Your cart is empty
            </h1>
            <p className="text-[var(--muted-foreground)] mb-8">
              Add items to your cart to start shopping
            </p>
            <Link href="/shop">
              <Button variant="primary" size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="flex-1 pt-0">
      <Container>
        <div className="py-8 md:py-12">
          <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-2">
            Shopping Cart
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mb-8">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="border-t border-[var(--border)]">
                {items.filter(item => item.product).map((item) => (
                  <div
                    key={`${item.product?.id}-${item.size}`}
                    className="flex gap-4 md:gap-6 py-6 border-b border-[var(--border)]/50"
                  >
                    <div className="w-24 md:w-32 aspect-square bg-[var(--muted)] flex-shrink-0 overflow-hidden">
                      <img
                        src={item.product!.image}
                        alt={item.product!.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted-foreground)]/70 mb-1">
                            {item.product!.category?.name || 'Uncategorized'}
                          </p>
                          <Link
                            href={`/products/${item.product!.slug || item.product!.id}`}
                            className="text-base font-light text-black hover:opacity-50 transition-opacity"
                          >
                            {item.product!.name}
                          </Link>
                          <p className="text-sm text-[var(--muted-foreground)] mt-1">
                            Size: {item.size}{item.selectedColor ? ` | Color: ${item.selectedColor}` : ''}
                          </p>
                        </div>
                        <p className="text-base font-light">
                          {currencySymbol}{item.product!.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-[var(--border)]">
                          <button
                            onClick={() => updateQuantity(item.product!.id, item.size, item.quantity - 1)}
                            className="w-10 h-10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-12 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product!.id, item.size, item.quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product!.id, item.size)}
                          className="text-xs text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] transition-colors underline underline-offset-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={clearCart}
                className="mt-6 text-xs text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] transition-colors underline underline-offset-4"
              >
                Clear Cart
              </button>
            </div>

            <div>
              <div className="bg-[var(--muted)] p-6 md:p-8">
                <h2 className="text-lg font-light tracking-wide mb-6">
                  Summary
                </h2>
                <div className="space-y-4 border-b border-[var(--border)] pb-6 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Subtotal</span>
                    <span>{currencySymbol}{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Estimated Tax</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>
                <div className="flex justify-between mb-6">
                  <span className="font-medium">Total</span>
                  <span className="text-lg">{currencySymbol}{subtotal.toLocaleString()}</span>
                </div>
                <Link href="/checkout">
                  <Button variant="primary" size="lg" className="w-full">
                    Checkout
                  </Button>
                </Link>
                <Link
                  href="/shop"
                  className="block w-full h-12 mt-3 text-center leading-[48px] text-xs uppercase tracking-[0.15em] font-medium underline underline-offset-4"
                >
                  Continue Shopping
                </Link>
              </div>

              <div className="mt-6 space-y-3 text-sm text-[var(--muted-foreground)]">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span>Free shipping on orders over {currencySymbol}500</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <path d="M1 10h22" />
                  </svg>
                  <span>30-day return policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 pt-0">
        <Container>
          <div className="py-20 md:py-32 text-center">
            <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-4">
              Your cart is empty
            </h1>
            <p className="text-[var(--muted-foreground)] mb-8">
              Add items to your cart to start shopping
            </p>
            <Link href="/shop">
              <Button variant="primary" size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </Container>
      </main>
    }>
      <CartContent />
    </Suspense>
  );
}
