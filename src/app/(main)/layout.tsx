import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import { CountrySelector } from "@/components/country-selector";
import { AlertProvider } from "@/components/ui/alert-modal";
import { GlobalColorsProvider } from "@/components/providers/global-colors-provider";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AAA Orange | Premium Collection",
  description: "Elevate your style with curated luxury pieces",
};

function Chrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <AlertProvider>
        <GlobalColorsProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <CountrySelector />
        </GlobalColorsProvider>
      </AlertProvider>
    </div>
  );
}

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <Providers>
          <Chrome>
            {children}
          </Chrome>
        </Providers>
      </Suspense>
    </div>
  );
}
