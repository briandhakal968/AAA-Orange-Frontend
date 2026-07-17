"use client";

import { useEffect } from "react";

function applyColors(colors: Record<string, string>) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    try {
      root.style.setProperty(`--${key.replace(/_/g, "-")}`, value);
    } catch (e) {}
  });
}

export function GlobalColorsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        // Use simple fetch without AbortController to avoid extension conflicts
        const res = await fetch(`${API_URL}/api/global-settings/colors`);
        
        if (res.ok) {
          const data = await res.json();
          if (data && data.primary) {
            applyColors(data);
          }
        }
      } catch (error: any) {
        // Silently fail - colors will use defaults from CSS
        if (error?.name !== 'AbortError') {
          console.error("Error fetching global colors:", error);
        }
      }
    };

    fetchColors();
  }, []);

  return <>{children}</>;
}