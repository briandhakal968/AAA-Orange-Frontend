"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/admin-api";

interface ColorSetting {
  key: string;
  label: string;
  description: string;
  value: string;
}

const defaultColors: ColorSetting[] = [
  { key: "primary", label: "Primary", description: "Main brand color", value: "#072788" },
  { key: "primary_foreground", label: "Primary Foreground", description: "Text on primary color", value: "#ffffff" },
  { key: "background", label: "Background", description: "Page background", value: "#ffffff" },
  { key: "foreground", label: "Foreground", description: "Main text color", value: "#0a0a0a" },
  { key: "muted", label: "Muted", description: "Subtle backgrounds", value: "#fafafa" },
  { key: "muted_foreground", label: "Muted Foreground", description: "Subtle text", value: "#737373" },
  { key: "border", label: "Border", description: "Border color", value: "#e5e5e5" },
  { key: "ring", label: "Ring", description: "Focus ring color", value: "#0a0a0a" },
  { key: "success", label: "Success", description: "Success states", value: "#22c55e" },
  { key: "secondary", label: "Secondary", description: "Secondary color (Buy Now, cart count, search)", value: "#f59e0b" },
  { key: "error", label: "Error", description: "Error states", value: "#ef4444" },
  { key: "info", label: "Info", description: "Info states", value: "#3b82f6" },
];

const cssVariableUsage: Record<string, string[]> = {
  primary: [
    "Navbar header background",
    "Navbar search button",
    "Cart badge background",
    "Product sale price",
    "Product discount badge",
    "Cart drawer checkout button",
    "All primary buttons",
    "Links and hover states",
    "Category slider arrows",
    "Blog category badges",
    "Product detail price",
  ],
  primary_foreground: [
    "Navbar header text/icons",
    "Cart badge text",
    "Primary button text",
  ],
  background: [
    "Page background",
    "Card backgrounds (fallback)",
  ],
  foreground: [
    "Main body text",
    "Headings",
    "Product names",
    "Navigation links",
    "Button text (secondary)",
  ],
  muted: [
    "Product image placeholder",
    "Cart item image background",
    "Search bar background (mobile)",
    "Category dropdown background",
    "Hover states on menu items",
    "Summary/order background",
  ],
  muted_foreground: [
    "Secondary/descriptive text",
    "Category labels",
    "Size labels",
    "Subtotal/shipping labels",
    "Placeholder hints",
    "Remove button text",
  ],
  border: [
    "All card borders",
    "Input field borders",
    "Divider lines",
    "Quantity selector borders",
    "Dropdown borders",
    "Slider track",
  ],
  ring: [
    "Focus ring on inputs",
    "Focus ring on buttons",
  ],
  success: [
    "Success badges",
    "Success messages",
    "Free shipping text",
  ],
  warning: [
    "Warning badges",
    "Warning states",
  ],
  error: [
    "Error badges",
    "Error messages",
    "Delete confirmations",
  ],
  info: [
    "Info badges",
    "Info states",
  ],
};

export default function GlobalColorsPage() {
  const [colors, setColors] = useState<ColorSetting[]>(defaultColors);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      const data = await adminApi.get<Record<string, string>>("/admin/global-settings/colors");
      setColors((prev) =>
        prev.map((c) => ({
          ...c,
          value: data[c.key] || c.value,
        }))
      );
    } catch (error) {
      console.error("Error fetching colors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (key: string, value: string) => {
    setColors((prev) => prev.map((c) => (c.key === key ? { ...c, value } : c)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings: Record<string, string> = {};
      colors.forEach((c) => {
        settings[c.key] = c.value;
      });
      await adminApi.put("/admin/global-settings/colors", { settings });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving colors:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Global Colors</h1>
          <p className="text-sm text-slate-500 mt-1">Define the color palette used across your website</p>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Colors saved successfully!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? "Saving..." : "Save Colors"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">CSS Variables Used Across Website</h2>
          <p className="text-sm text-slate-500 mt-1">Each color controls multiple elements across your site</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {colors.map((color) => (
              <div key={color.key} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                    <input
                      type="color"
                      value={color.value}
                      onChange={(e) => handleColorChange(color.key, e.target.value)}
                      className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{color.label}</p>
                    <p className="text-xs font-mono text-slate-500">--{color.key.replace(/_/g, "-")}</p>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={color.value}
                      onChange={(e) => handleColorChange(color.key, e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                  </div>
                  <ul className="space-y-1">
                    {cssVariableUsage[color.key]?.map((usage, idx) => (
                      <li key={idx} className="text-xs text-slate-500 flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                        {usage}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
