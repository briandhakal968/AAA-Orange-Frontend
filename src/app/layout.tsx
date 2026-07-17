import type { Metadata } from "next";
import "./globals.css";
import { GlobalColorsProvider } from "@/components/providers/global-colors-provider";

export const metadata: Metadata = {
  title: "AAA Orange | Premium Collection",
  description: "Elevate your style with curated luxury pieces",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <GlobalColorsProvider>
          {children}
        </GlobalColorsProvider>
      </body>
    </html>
  );
}