"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { MediaPicker } from "@/components/admin/media-picker";

interface Country {
  id: number;
  name: string;
  currency: string;
  currency_symbol: string;
  flag: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

interface Attribute {
  id: number;
  name: string;
  values: { id: number; value: string }[];
}

interface ProductPrice {
  country_id: number;
  price: number;
  sale_price: number | null;
  stock: number;
  damaged_stock: number;
  available: boolean;
}

export default function NewProductPage() {
  const router = useRouter();

  const [countries, setCountries] = useState<Country[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    long_description: "",
    category_ids: [] as number[],
    brand_id: "",
    sku: "",
    minimum_stock: 0,
  });

  const [countryPrices, setCountryPrices] = useState<ProductPrice[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [showAttributes, setShowAttributes] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, string[]>>({});
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"main" | "gallery">("main");
  const [additionalInfo, setAdditionalInfo] = useState<{label: string; value: string}[]>([]);

  const handleOpenMediaPicker = (target: "main" | "gallery") => {
    setMediaPickerTarget(target);
    setShowMediaPicker(true);
  };

  const handleMediaSelect = (url: string) => {
    if (mediaPickerTarget === "main") {
      setMainImageUrl(url);
    } else {
      setGallery(prev => [...prev, url]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countriesData, brandsData, categoriesData, attributesData] = await Promise.all([
          adminApi.get<Country[]>("/countries"),
          adminApi.get<Brand[]>("/brands"),
          adminApi.get<Category[]>("/categories"),
          adminApi.get<Attribute[]>("/attributes"),
        ]);

        setCountries(countriesData);
        setBrands(brandsData);
        setCategoryList(categoriesData);
        setAttributes(attributesData);

        setCountryPrices(countriesData.map((c: Country) => ({
          country_id: c.id,
          price: 0,
          sale_price: null,
          stock: 0,
          damaged_stock: 0,
          available: true,
        })));

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    for (const cp of countryPrices) {
      if (cp.sale_price && cp.sale_price > cp.price) {
        alert(`Sale price (${cp.sale_price}) cannot be higher than regular price (${cp.price})`);
        setSaving(false);
        return;
      }
    }

    const productData: Record<string, unknown> = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      long_description: formData.long_description,
      category_ids: formData.category_ids,
      sku: formData.sku,
      minimum_stock: formData.minimum_stock,
      image: mainImageUrl,
      country_prices: countryPrices.map(cp => ({
        country_id: cp.country_id,
        price: cp.price,
        sale_price: cp.sale_price || null,
        stock: cp.stock,
        damaged_stock: cp.damaged_stock || 0,
        available: cp.available,
      })),
      gallery: gallery,
      attributes: Object.entries(selectedAttributes).flatMap(([attrId, values]) =>
        values.map(valueId => ({ attribute_id: parseInt(attrId), value: valueId.toString() }))
      ),
      additional_info: additionalInfo.filter(info => info.label && info.value),
    };

    if (formData.brand_id) {
      productData.brand_id = parseInt(formData.brand_id);
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.aaaorange.com'}/api/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create product');
      }
      router.push("/superadmin/products");
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleCountryPriceChange = (countryId: number, field: keyof ProductPrice, value: any) => {
    setCountryPrices(prev => prev.map(cp =>
      cp.country_id === countryId ? { ...cp, [field]: value } : cp
    ));
  };

  const handleCategoryToggle = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  const handleAttributeValueToggle = (attributeId: number, valueId: number, valueStr?: string) => {
    const valString = valueStr?.toString() || valueId.toString();
    setSelectedAttributes(prev => {
      const current = prev[attributeId] || [];
      return {
        ...prev,
        [attributeId]: current.includes(valString)
          ? current.filter(v => v !== valString)
          : [...current, valString]
      };
    });
  };

  const filteredCategories = useMemo(() => {
    const parents = categoryList.filter(cat => !cat.parent_id);
    return parents.map(parent => ({
      ...parent,
      subcategories: categoryList.filter(sub => sub.parent_id === parent.id),
    })).filter(cat => {
      const matchesParent = cat.name.toLowerCase().includes(categorySearch.toLowerCase());
      const matchesSub = cat.subcategories && cat.subcategories.some(sub =>
        sub.name.toLowerCase().includes(categorySearch.toLowerCase())
      );
      return matchesParent || matchesSub;
    });
  }, [categoryList, categorySearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Add New Product</h1>
          <p className="text-sm text-slate-500 mt-1">Create a new product</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/superadmin/products"
            className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Product"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg"
              required
            />
            <p className="text-xs text-slate-400 mt-2">URL: /{formData.slug || "auto-generates"}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Short Description</label>
            <TiptapEditor
              content={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Enter short description..."
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">SKU</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg"
              required
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Stock Quantity</label>
            <input
              type="number"
              value={formData.minimum_stock}
              onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg"
              min="0"
            />
            <p className="text-xs text-slate-400 mt-2">Products will be flagged as low stock when stock falls below this value</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <button
              type="button"
              onClick={() => setShowAttributes(!showAttributes)}
              className="w-full flex items-center justify-between text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              <span className="flex items-center gap-2">
                <svg className={`w-4 h-4 transition-transform ${showAttributes ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Product Attributes
                <span className="text-xs text-slate-400 ml-2">
                  ({Object.values(selectedAttributes).flat().length} selected)
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-indigo-600 font-medium">Available</span>
                <svg className={`w-4 h-4 transition-transform ${showAttributes ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            {showAttributes && (
              <div className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {attributes.map(attr => (
                    <div key={attr.id} className="p-3 bg-slate-50 rounded-lg">
                      <label className="block text-sm font-medium text-slate-700 mb-2">{attr.name}</label>
                      <div className="flex flex-wrap gap-2">
                        {attr.values.map(val => {
                          const selectedVals = selectedAttributes[attr.id] || [];
                          const valStr = val.value?.toString() || '';
                          const isSelected = selectedVals.includes(valStr);
                          const isColorAttr = attr.name === "Color" || attr.name === "colour" || attr.name === "Colour";
                          const colorMap: Record<string, string> = {
                            'Black': '#000000', 'White': '#FFFFFF', 'Brown': '#8B4513',
                            'Beige': '#F5F5DC', 'Navy': '#000080', 'Red': '#FF0000',
                            'Blue': '#0000FF', 'Green': '#008000', 'Yellow': '#FFFF00',
                            'Pink': '#FFC0CB', 'Grey': '#808080', 'Gray': '#808080',
                            'Orange': '#FFA500', 'Purple': '#800080',
                          };
                          const bgColor = isColorAttr ? (colorMap[valStr] || '#cccccc') : undefined;
                          
                          if (isColorAttr) {
                            return (
                              <button
                                key={val.id}
                                type="button"
                                onClick={() => handleAttributeValueToggle(attr.id, val.id, val.value)}
                                className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-full border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'}`}
                              >
                                <span className="w-3 h-3 rounded-full border border-white/50" style={{ backgroundColor: bgColor }} />
                                {val.value}
                              </button>
                            );
                          }
                          return (
                            <button
                              key={val.id}
                              type="button"
                              onClick={() => handleAttributeValueToggle(attr.id, val.id, val.value)}
                              className={isSelected ? "px-3 py-1 text-xs rounded-full border bg-indigo-600 text-white border-indigo-600" : "px-3 py-1 text-xs rounded-full border bg-white text-slate-600 border-slate-200 hover:border-indigo-400"}
                            >
                              {val.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAttributes(false)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                  >
                    Done ({Object.values(selectedAttributes).flat().length} selected)
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Country Prices & Availability</h2>
            <div className="space-y-4">
              {countryPrices.map(cp => {
                const country = countries.find(c => c.id === cp.country_id);
                const isUnavailable = !cp.available;
                return (
                  <div 
                    key={cp.country_id} 
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                      isUnavailable 
                        ? 'bg-slate-100 border-slate-200 opacity-60' 
                        : 'bg-slate-50 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xl">{country ? country.flag : ""}</span>
                      <span className="font-medium">{country ? country.name : ""}</span>
                    </div>
                    <div className={`flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4 ${isUnavailable ? 'pointer-events-none' : ''}`}>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Price ({country ? country.currency_symbol : ""})</label>
                        <input
                          type="number"
                          value={cp.price}
                          onChange={(e) => handleCountryPriceChange(cp.country_id, "price", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Sale Price</label>
                        <input
                          type="number"
                          value={cp.sale_price || ""}
                          onChange={(e) => handleCountryPriceChange(cp.country_id, "sale_price", e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                          min="0"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Stock</label>
                        <input
                          type="number"
                          value={cp.stock}
                          onChange={(e) => handleCountryPriceChange(cp.country_id, "stock", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Damaged Stock</label>
                        <input
                          type="number"
                          value={cp.damaged_stock ?? 0}
                          onChange={(e) => handleCountryPriceChange(cp.country_id, "damaged_stock", parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                          min="0"
                        />
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cp.available}
                        onChange={(e) => handleCountryPriceChange(cp.country_id, "available", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-slate-700">Additional Information</label>
              <button
                type="button"
                onClick={() => setAdditionalInfo([...additionalInfo, { label: "", value: "" }])}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                + Add Field
              </button>
            </div>
            <div className="space-y-3">
              {additionalInfo.map((info, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={info.label}
                    onChange={(e) => {
                      const newInfo = [...additionalInfo];
                      newInfo[index].label = e.target.value;
                      setAdditionalInfo(newInfo);
                    }}
                    placeholder="Label (e.g., Material)"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={info.value}
                    onChange={(e) => {
                      const newInfo = [...additionalInfo];
                      newInfo[index].value = e.target.value;
                      setAdditionalInfo(newInfo);
                    }}
                    placeholder="Value (e.g., 100% Silk)"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  {additionalInfo.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAdditionalInfo(additionalInfo.filter((_, i) => i !== index))}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Long Description</label>
            <TiptapEditor
              content={formData.long_description}
              onChange={(value) => setFormData({ ...formData, long_description: value })}
              placeholder="Enter long description..."
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Product Image</label>
              <button
                type="button"
                onClick={() => handleOpenMediaPicker("main")}
                className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Browse
              </button>
            </div>
            {mainImageUrl ? (
              <div className="relative">
                <img src={mainImageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setMainImageUrl("")}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                onClick={() => handleOpenMediaPicker("main")}
                className="w-full h-48 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400"
              >
                <div className="text-center">
                  <svg className="w-10 h-10 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-slate-500">Click to select image</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Gallery Images</label>
              <button
                type="button"
                onClick={() => handleOpenMediaPicker("gallery")}
                className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Browse
              </button>
            </div>
            {gallery.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {gallery.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                    <img src={url} alt={"Gallery " + idx} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div
                  onClick={() => handleOpenMediaPicker("gallery")}
                  className="relative aspect-square border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400"
                >
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
            ) : (
              <div
                onClick={() => handleOpenMediaPicker("gallery")}
                className="w-full h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400"
              >
                <div className="text-center">
                  <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-slate-500">Click to select images</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Category</label>
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredCategories.map(category => (
                <div key={category.id}>
                  <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.category_ids.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-slate-700">{category.name}</span>
                  </label>
                  {category.subcategories && category.subcategories.map(sub => (
                    <label key={sub.id} className="flex items-center gap-2 p-2 pl-8 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.category_ids.includes(sub.id)}
                        onChange={() => handleCategoryToggle(sub.id)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-slate-600">{sub.name}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Brand</label>
            <select
              value={formData.brand_id}
              onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg"
            >
              <option value="">Select Brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
      />
    </form>
  );
}