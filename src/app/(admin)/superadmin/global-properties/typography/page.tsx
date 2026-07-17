"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/admin-api";

interface TypographySetting {
  font_family: string;
  font_size: number;
  line_height: number;
  margin_bottom: number;
  color: string;
  font_weight: number;
}

const ELEMENTS = [
  { key: "h1", label: "Heading 1" },
  { key: "h2", label: "Heading 2" },
  { key: "h3", label: "Heading 3" },
  { key: "h4", label: "Heading 4" },
  { key: "h5", label: "Heading 5" },
  { key: "h6", label: "Heading 6" },
  { key: "paragraph", label: "Paragraph" },
];

const DEFAULT_ELEMENTS: Record<string, TypographySetting> = {
  h1: { font_family: "inherit", font_size: 32, line_height: 1.2, margin_bottom: 16, color: "#000000", font_weight: 700 },
  h2: { font_family: "inherit", font_size: 24, line_height: 1.3, margin_bottom: 12, color: "#000000", font_weight: 700 },
  h3: { font_family: "inherit", font_size: 20, line_height: 1.4, margin_bottom: 8, color: "#000000", font_weight: 600 },
  h4: { font_family: "inherit", font_size: 18, line_height: 1.4, margin_bottom: 8, color: "#000000", font_weight: 600 },
  h5: { font_family: "inherit", font_size: 16, line_height: 1.4, margin_bottom: 6, color: "#000000", font_weight: 500 },
  h6: { font_family: "inherit", font_size: 14, line_height: 1.4, margin_bottom: 4, color: "#000000", font_weight: 500 },
  paragraph: { font_family: "inherit", font_size: 16, line_height: 1.6, margin_bottom: 16, color: "#000000", font_weight: 400 },
};

const FONT_OPTIONS = [
  { label: "Inherit", value: "inherit" },
  { label: "Geist Sans", value: "var(--font-geist-sans), sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Open Sans", value: "Open Sans, sans-serif" },
  { label: "Lato", value: "Lato, sans-serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Poppins", value: "Poppins, sans-serif" },
  { label: "Playfair Display", value: "Playfair Display, serif" },
  { label: "Merriweather", value: "Merriweather, serif" },
  { label: "System Default", value: "system-ui, sans-serif" },
];

export default function GlobalTypographyPage() {
  const [typography, setTypography] = useState<Record<string, TypographySetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeElement, setActiveElement] = useState("h1");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchTypography();
  }, []);

  const fetchTypography = async () => {
    try {
      const data = await adminApi.get<Record<string, string>>("/admin/global-settings/typography");
      if (data && Object.keys(data).length > 0) {
        const reconstructed: Record<string, TypographySetting> = {};
        
        ELEMENTS.forEach((el) => {
          const fontSize = data[`${el.key}_font_size`];
          const fontFamily = data[`${el.key}_font_family`];
          const lineHeight = data[`${el.key}_line_height`];
          const marginBottom = data[`${el.key}_margin_bottom`];
          const color = data[`${el.key}_color`];
          const fontWeight = data[`${el.key}_font_weight`];

          const defaultEl = DEFAULT_ELEMENTS[el.key];
          reconstructed[el.key] = {
            font_family: fontFamily || defaultEl.font_family,
            font_size: fontSize ? parseFloat(fontSize) : defaultEl.font_size,
            line_height: lineHeight ? parseFloat(lineHeight) : defaultEl.line_height,
            margin_bottom: marginBottom ? parseFloat(marginBottom) : defaultEl.margin_bottom,
            color: color || defaultEl.color,
            font_weight: fontWeight ? parseInt(fontWeight) : defaultEl.font_weight,
          };
        });
        
        setTypography(reconstructed);
      }
    } catch (error) {
      console.error("Error fetching typography:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setTypography((prev) => {
      const updated = { ...prev };
      const current = prev[activeElement] || DEFAULT_ELEMENTS[activeElement];
      updated[activeElement] = {
        ...current,
        [key]:
          key === "font_size" || key === "margin_bottom" || key === "line_height"
            ? parseFloat(value)
            : key === "font_weight"
            ? parseInt(value)
            : value,
      };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const flatSettings: Record<string, string> = {};
      
      ELEMENTS.forEach((el) => {
        const config = typography[el.key];
        if (config) {
          flatSettings[`${el.key}_font_family`] = config.font_family;
          flatSettings[`${el.key}_font_size`] = String(config.font_size);
          flatSettings[`${el.key}_line_height`] = String(config.line_height);
          flatSettings[`${el.key}_margin_bottom`] = String(config.margin_bottom);
          flatSettings[`${el.key}_color`] = config.color;
          flatSettings[`${el.key}_font_weight`] = String(config.font_weight);
        }
      });
      
      await adminApi.put("/admin/global-settings/typography", { settings: flatSettings });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving typography:", error);
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

  const currentConfig = typography[activeElement] || DEFAULT_ELEMENTS[activeElement];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Global Typography</h1>
          <p className="text-sm text-slate-500 mt-1">Configure font styles for blog and custom pages</p>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? "Saving..." : "Save Typography"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Element Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800">Select Element</h3>
            </div>
            <div className="p-2 space-y-1">
              {ELEMENTS.map((el) => (
                <button
                  key={el.key}
                  onClick={() => setActiveElement(el.key)}
                  className={`w-full px-3 py-2 text-left rounded-lg text-sm font-medium transition-colors ${
                    activeElement === el.key
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "text-slate-600 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  {el.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Config Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800">
                {ELEMENTS.find(e => e.key === activeElement)?.label} Settings
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Font Family */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Font Family</label>
                <select
                  value={currentConfig.font_family}
                  onChange={(e) => handleChange("font_family", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none bg-white"
                >
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Font Weight */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Font Weight</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={100}
                    max={900}
                    step={100}
                    value={currentConfig.font_weight}
                    onChange={(e) => handleChange("font_weight", e.target.value)}
                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  />
                  <input
                    type="range"
                    min={100}
                    max={900}
                    step={100}
                    value={currentConfig.font_weight}
                    onChange={(e) => handleChange("font_weight", e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-slate-500 w-10 text-right">{currentConfig.font_weight}</span>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Font Size (px)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={8}
                    max={72}
                    value={currentConfig.font_size}
                    onChange={(e) => handleChange("font_size", e.target.value)}
                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  />
                  <input
                    type="range"
                    min={8}
                    max={72}
                    value={currentConfig.font_size}
                    onChange={(e) => handleChange("font_size", e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-slate-500 w-10 text-right">{currentConfig.font_size}px</span>
                </div>
              </div>

              {/* Line Height */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Line Height</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={2.5}
                    step={0.1}
                    value={currentConfig.line_height}
                    onChange={(e) => handleChange("line_height", e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-slate-500 w-10 text-right">{currentConfig.line_height}</span>
                </div>
              </div>

              {/* Margin Bottom */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Margin Bottom (px)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={48}
                    value={currentConfig.margin_bottom}
                    onChange={(e) => handleChange("margin_bottom", e.target.value)}
                    className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                  />
                  <input
                    type="range"
                    min={0}
                    max={48}
                    value={currentConfig.margin_bottom}
                    onChange={(e) => handleChange("margin_bottom", e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-sm text-slate-500 w-10 text-right">{currentConfig.margin_bottom}px</span>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Text Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentConfig.color}
                    onChange={(e) => handleChange("color", e.target.value)}
                    className="w-12 h-10 border border-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentConfig.color}
                    onChange={(e) => handleChange("color", e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-6">
            <div className="p-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-800">Preview</h3>
            </div>
            <div className="p-4">
              <div style={{
                fontFamily: currentConfig.font_family,
                fontSize: currentConfig.font_size,
                lineHeight: currentConfig.line_height,
                marginBottom: currentConfig.margin_bottom,
                fontWeight: currentConfig.font_weight,
                color: currentConfig.color
              }}>
                Sample {ELEMENTS.find(e => e.key === activeElement)?.label} Text
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}