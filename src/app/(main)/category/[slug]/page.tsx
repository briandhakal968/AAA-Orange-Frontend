"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/ui/product-card";
import { Container } from "@/components/ui/container";
import { useProducts } from "@/hooks/useProducts";
import { useCountry } from "@/context/country-context";
import { getProductPrice, isProductAvailableInCountry } from "@/lib/products";

const colors = [
  { value: "black", label: "Black", hex: "#000000" },
  { value: "white", label: "White", hex: "#ffffff" },
  { value: "brown", label: "Brown", hex: "#8B4513" },
  { value: "beige", label: "Beige", hex: "#F5F5DC" },
  { value: "grey", label: "Grey", hex: "#808080" },
];

const sizeOptions = [
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
];

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name" },
];

function PriceSlider({
  priceRange,
  minPercent,
  maxPercent,
  sliderRef,
  handleMouseDown,
  currencySymbol,
}: {
  priceRange: [number, number];
  minPercent: number;
  maxPercent: number;
  sliderRef: React.RefObject<HTMLDivElement | null>;
  handleMouseDown: (thumb: "min" | "max") => (e: React.MouseEvent) => void;
  currencySymbol: string;
}) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.15em] font-medium text-black mb-4">
        Filter by Price
      </h3>
      <div ref={sliderRef} className="relative h-5 cursor-pointer select-none">
        <div className="absolute top-1/2 -translate-y-1/2 w-full h-[3px] bg-neutral-200 rounded-full" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[3px] bg-black rounded-full"
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-black rounded-full cursor-grab shadow-sm hover:scale-110 active:cursor-grabbing transition-transform"
          style={{ left: `calc(${minPercent}% - 8px)` }}
          onMouseDown={handleMouseDown("min")}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-black rounded-full cursor-grab shadow-sm hover:scale-110 active:cursor-grabbing transition-transform"
          style={{ left: `calc(${maxPercent}% - 8px)` }}
          onMouseDown={handleMouseDown("max")}
        />
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-neutral-600">{currencySymbol}{priceRange[0].toLocaleString()}</span>
        <span className="text-sm text-neutral-600">{currencySymbol}{priceRange[1].toLocaleString()}</span>
      </div>
    </div>
  );
}

function CategoryFilter({
  categories,
  categorySlug,
  products,
}: {
  categories: any[];
  categorySlug: string;
  products: any[];
}) {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const toggleExpanded = (id: number) => {
    setExpandedCategories(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="border-t border-neutral-100 pt-8">
      <h3 className="text-xs uppercase tracking-[0.15em] font-medium text-black mb-4">
        Filter by Categories
      </h3>
      <ul className="space-y-2">
        {categories.filter((c: any) => !c.parent_id).map((category: any) => {
          const hasSubcategories = category.subcategories && category.subcategories.length > 0;
          const catValue = category.slug || category.name?.toLowerCase() || "";
          const catName = category.name || category.label || category;
          const isExpanded = expandedCategories.includes(category.id);
          const isActive = catValue === categorySlug;
          
          const catProducts = products.filter((p: any) => {
            const pCat = p.category as any;
            const pCatName = (pCat?.name as string)?.toLowerCase() || "";
            const pCatSlug = (pCat?.slug as string)?.toLowerCase() || "";
            const pCategories = (p as any).categories || [];
            const matchesCategories = pCategories.some((c: any) => 
              (c.name?.toLowerCase() || "") === catValue || 
              (c.slug?.toLowerCase() || "") === catValue
            );
            return pCatName === catValue || pCatSlug === catValue || matchesCategories;
          }).length;
          
          return (
            <li key={category.id || category.value}>
              <div className="flex items-center w-full">
                <Link
                  href={`/category/${catValue}`}
                  className={`flex-1 text-left text-sm transition-colors ${
                    isActive ? "text-black font-medium" : "text-neutral-500 hover:text-black"
                  }`}
                >
                  {catName}
                </Link>
                {hasSubcategories && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleExpanded(category.id); }}
                    className="p-1 text-neutral-400 hover:text-black transition-colors"
                  >
                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                )}
                <span className="text-xs text-neutral-400 ml-2 w-5 h-5 flex items-center justify-center rounded-full border border-neutral-300">{catProducts}</span>
              </div>
              {hasSubcategories && isExpanded && (
                <ul className="ml-[5px] mt-1 space-y-1">
                  {(category.subcategories as any[]).map((sub: any) => {
                    const subCatValue = sub.slug || sub.name?.toLowerCase() || "";
                    const subCatName = sub.name;
                    const isSubActive = subCatValue === categorySlug;
                    
                    const subCatProducts = products.filter((p: any) => {
                      const pCat = p.category as any;
                      const pCatName = (pCat?.name as string)?.toLowerCase() || "";
                      const pCatSlug = (pCat?.slug as string)?.toLowerCase() || "";
                      const pCategories = (p as any).categories || [];
                      const matchesCategories = pCategories.some((c: any) => 
                        (c.name?.toLowerCase() || "") === subCatValue || 
                        (c.slug?.toLowerCase() || "") === subCatValue
                      );
                      return pCatName === subCatValue || pCatSlug === subCatValue || matchesCategories;
                    }).length;
                    
                    return (
                      <li key={sub.id}>
                        <Link href={`/category/${subCatValue}`} className={`flex items-center justify-between w-full text-sm py-1 transition-colors ${isSubActive ? "text-black font-medium" : "text-neutral-500 hover:text-black"}`}>
                          <span>{subCatName}</span>
                          <span className="text-xs text-neutral-400 w-5 h-5 flex items-center justify-center rounded-full border border-neutral-300">{subCatProducts}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ColorFilter({
  activeColors,
  toggleColor,
}: {
  activeColors: string[];
  toggleColor: (color: string) => void;
}) {
  return (
    <div className="border-t border-neutral-100 pt-8">
      <h3 className="text-xs uppercase tracking-[0.15em] font-medium text-black mb-4">
        Filter by Color
      </h3>
      <ul className="space-y-3">
        {colors.map((color) => (
          <li key={color.value}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={activeColors.includes(color.value)}
                onChange={() => toggleColor(color.value)}
                className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black"
              />
              <span className="w-4 h-4 rounded-full border border-neutral-200" style={{ backgroundColor: color.hex }} />
              <span className="text-sm text-neutral-600">{color.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SizeFilter({
  activeSizes,
  toggleSize,
}: {
  activeSizes: string[];
  toggleSize: (size: string) => void;
}) {
  return (
    <div className="border-t border-neutral-100 pt-8">
      <h3 className="text-xs uppercase tracking-[0.15em] font-medium text-black mb-4">
        Filter by Size
      </h3>
      <ul className="space-y-2">
        {sizeOptions.map((size) => (
          <li key={size.value}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={activeSizes.includes(size.value)}
                onChange={() => toggleSize(size.value)}
                className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black"
              />
              <span className="text-sm text-neutral-600">{size.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const slugOrId = params.slug as string;
  const [categoryName, setCategoryName] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [activeColors, setActiveColors] = useState<string[]>([]);
  const [activeSizes, setActiveSizes] = useState<string[]>([]);
  const [activeSort, setActiveSort] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { products, loading } = useProducts();
  const { selectedCountry } = useCountry();
  const productsPerPage = 15;

  const currencySymbol = selectedCountry?.currency_symbol || "$";
  const maxProductPrice = products.reduce((max, p) => {
    const price = getProductPrice(p, selectedCountry?.id).price;
    return price > max ? price : max;
  }, 0);
  const maxPrice = Math.ceil(maxProductPrice / 100) * 100 + 100;
  const step = Math.ceil(maxPrice / 2000) * 10;

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = 0 + percentage * (maxPrice - 0);
    return Math.round(rawValue / step) * step;
  }, [maxPrice, step]);

  const handleMouseDown = (thumb: "min" | "max") => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(thumb);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return;
      const value = getValueFromPosition(e.clientX);
      setPriceRange((prev) => {
        if (dragging === "min") {
          return [Math.min(value, prev[1] - 50), prev[1]];
        } else {
          return [prev[0], Math.max(value, prev[0] + 50)];
        }
      });
    },
    [dragging, getValueFromPosition]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/categories`);
        const data = await res.json();
        setCategoriesData(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    setPriceRange([0, maxProductPrice]);
  }, [maxProductPrice]);

  useEffect(() => {
    if (slugOrId) {
      const decoded = decodeURIComponent(slugOrId);
      setCategoryName(decoded);
    }
  }, [slugOrId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [priceRange, activeSort]);

  const toggleColor = (color: string) => {
    setActiveColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : [...prev, color]
    );
  };

  const toggleSize = (size: string) => {
    setActiveSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size]
    );
  };

  const filteredProducts = products.filter((p) => {
    const cat = p.category as any;
    const productCategory = cat?.name?.toLowerCase() || cat?.slug?.toLowerCase() || "";
    const target = slugOrId.toString().toLowerCase();
    return productCategory === target || cat?.slug === target;
  });

  // Filter by color and size
  const filteredByColorSize = [...(activeColors.length > 0 || activeSizes.length > 0 ? filteredProducts.filter((p) => {
        const productAttrs = (p as any).attributes || [];
        return productAttrs.some((a: any) => {
          const attrName = a.attribute?.name?.toLowerCase() || "";
          const attrValue = a.value?.toLowerCase() || "";
          const matchColor = attrName === "color" && activeColors.includes(attrValue);
          const matchSize = attrName === "size" && (activeSizes.includes(attrValue.toUpperCase()) || activeSizes.includes(attrValue));
          return matchColor || matchSize;
        });
      }) : filteredProducts)];

  // Filter by country availability
  const availableProducts = selectedCountry?.id
    ? filteredByColorSize.filter(p => isProductAvailableInCountry(p, selectedCountry.id))
    : filteredByColorSize;

  const filteredByPrice = availableProducts.filter(
    (p) => {
      const price = getProductPrice(p, selectedCountry?.id).price;
      return price >= priceRange[0] && price <= priceRange[1];
    }
  );

  let sortedProducts = [...filteredByPrice];
  switch (activeSort) {
    case "price-asc":
      sortedProducts = sortedProducts.sort((a, b) => getProductPrice(a, selectedCountry?.id).price - getProductPrice(b, selectedCountry?.id).price);
      break;
    case "price-desc":
      sortedProducts = sortedProducts.sort((a, b) => getProductPrice(b, selectedCountry?.id).price - getProductPrice(a, selectedCountry?.id).price);
      break;
    case "name":
      sortedProducts = sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const minPercent = maxPrice > 0 ? (priceRange[0] / maxPrice) * 100 : 0;
  const maxPercent = maxPrice > 0 ? (priceRange[1] / maxPrice) * 100 : 100;

  const categorySlug = slugOrId.toLowerCase();

  return (
    <main className="flex-1">
      <section className="py-12 md:py-16">
        <Container>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <aside className="hidden lg:block w-[350px] flex-shrink-0">
              <div className="border border-neutral-200/50 rounded-lg p-6 space-y-8">
                <PriceSlider
                  priceRange={priceRange}
                  minPercent={minPercent}
                  maxPercent={maxPercent}
                  sliderRef={sliderRef}
                  handleMouseDown={handleMouseDown}
                  currencySymbol={currencySymbol}
                />
                {categoriesData.length > 0 && (
                  <CategoryFilter
                    categories={categoriesData}
                    categorySlug={slugOrId}
                    products={products}
                  />
                )}
                <ColorFilter
                  activeColors={activeColors}
                  toggleColor={toggleColor}
                />
                <SizeFilter
                  activeSizes={activeSizes}
                  toggleSize={toggleSize}
                />
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden flex items-center gap-2 text-sm"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Filters
                  </button>

                  <nav className="hidden md:flex items-center gap-2 text-xs text-neutral-400">
                    <Link href="/shop" className="hover:text-black transition-colors">Shop</Link>
                    <span>/</span>
                    <span className="text-black capitalize">{categorySlug}</span>
                    <span className="text-neutral-300 ml-2">({sortedProducts.length} products)</span>
                  </nav>

                  <span className="md:hidden text-sm text-neutral-500">
                    {sortedProducts.length} products
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-1 border border-neutral-200 rounded-md p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded transition-colors ${
                        viewMode === "grid" ? "bg-black text-white" : "hover:bg-neutral-100"
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded transition-colors ${
                        viewMode === "list" ? "bg-black text-white" : "hover:bg-neutral-100"
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <select
                    value={activeSort}
                    onChange={(e) => setActiveSort(e.target.value)}
                    className="px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:border-black focus:outline-none"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
                </div>
              ) : paginatedProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-neutral-500">No products found in this category.</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-3 lg:gap-4">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedProducts.map((product) => (
                    <div key={product.id} className="flex gap-3 p-3 border border-neutral-100 hover:border-neutral-200 transition-colors">
                      <div className="w-32 h-40 relative flex-shrink-0 bg-neutral-50">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">{product.name}</h3>
                        <p className="text-sm text-neutral-500 mt-1">
                          {currencySymbol}{getProductPrice(product, selectedCountry?.id).price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 border border-neutral-200 rounded-lg flex items-center justify-center disabled:opacity-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        currentPage === page ? "bg-black text-white" : "border border-neutral-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 border border-neutral-200 rounded-lg flex items-center justify-center disabled:opacity-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}