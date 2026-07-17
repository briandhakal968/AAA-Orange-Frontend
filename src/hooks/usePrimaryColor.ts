"use client";

import { useState, useEffect } from "react";

const DEFAULT_PRIMARY = "#660033";
const DEFAULT_PRIMARY_FOREGROUND = "#ffffff";

export function usePrimaryColor() {
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [primaryForeground, setPrimaryForeground] = useState(DEFAULT_PRIMARY_FOREGROUND);

  useEffect(() => {
    const root = document.documentElement;
    let primaryColor = DEFAULT_PRIMARY;
    let fgColor = DEFAULT_PRIMARY_FOREGROUND;
    
    // Try inline style first
    try {
      primaryColor = root.style.getPropertyValue('--primary')?.trim() || primaryColor;
      fgColor = root.style.getPropertyValue('--primary-foreground')?.trim() || fgColor;
    } catch (e) {}
    
    // Then try computed style
    if (!primaryColor || primaryColor === DEFAULT_PRIMARY) {
      try {
        const computed = getComputedStyle(root);
        primaryColor = computed.getPropertyValue('--primary')?.trim() || DEFAULT_PRIMARY;
        fgColor = computed.getPropertyValue('--primary-foreground')?.trim() || DEFAULT_PRIMARY_FOREGROUND;
      } catch (e) {}
    }
    
    setPrimary(primaryColor);
    setPrimaryForeground(fgColor);
  }, []);

  return { primary, primaryForeground };
}