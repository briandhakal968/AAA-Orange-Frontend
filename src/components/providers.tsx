"use client";

import { AuthProvider } from "@/context/auth-context";
import { CountryProvider } from "@/context/country-context";
import { CartProvider } from "@/context/cart-context";
import { WishlistProvider } from "@/context/wishlist-context";
import { TypographyProvider } from "@/hooks/use-typography";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CountryProvider>
        <CartProvider>
          <WishlistProvider>
            <TypographyProvider>{children}</TypographyProvider>
          </WishlistProvider>
        </CartProvider>
      </CountryProvider>
    </AuthProvider>
  );
}
