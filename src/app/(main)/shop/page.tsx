"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ui/product-card";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { useProducts } from "@/hooks/useProducts";
import { Container } from "@/components/ui/container";
import { motion, AnimatePresence } from "framer-motion";
import { useCountry } from "@/context/country-context";
import { useCart } from "@/context/cart-context";
import { Product, getProductPrice, isProductAvailableInCountry } from "@/lib/products";

const categories = [
  { value: "all", label: "All" },
  { value: "bags", label: "Bags" },
  { value: "shoes", label: "Shoes" },
  { value: "accessories", label: "Accessories" },
];

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

interface SidebarFiltersProps {
  products: Product[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  priceRange: [number, number];
  minPercent: number;
  maxPercent: number;
  sliderRef: React.RefObject<HTMLDivElement | null>;
  handleMouseDown: (thumb: "min" | "max") => (e: React.MouseEvent) => void;
  activeColors: string[];
  toggleColor: (color: string) => void;
  activeSizes: string[];
  toggleSize: (size: string) => void;
  currencySymbol: string;
  dynamicCategories?: any[];
}

function SidebarFilters({
  products,
  activeCategory,
  setActiveCategory,
  priceRange,
  minPercent,
  maxPercent,
  sliderRef,
  handleMouseDown,
  activeColors,
  toggleColor,
  activeSizes,
  toggleSize,
  currencySymbol,
  dynamicCategories,
}: SidebarFiltersProps) {
  const categoryList = dynamicCategories && dynamicCategories.length > 0 
    ? dynamicCategories.filter((c: any) => !c.parent_id)
    : categories;

  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const toggleExpanded = (id: number) => {
    setExpandedCategories(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs uppercase tracking-[0.15em] font-medium text-black mb-4">
          Filter by Price
        </h3>
        <div
          ref={sliderRef}
          className="relative h-5 cursor-pointer select-none"
        >
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

      <div className="border-t border-neutral-100 pt-8">
        <h3 className="text-xs uppercase tracking-[0.15em] font-medium text-black mb-4">
          Filter by Categories
        </h3>
        <ul className="space-y-2">
          {(categoryList as any[]).map((category) => {
            const hasSubcategories = category.subcategories && category.subcategories.length > 0;
            const catValue = category.slug || category.value?.toLowerCase() || category.name?.toLowerCase() || "";
            const catName = category.name || category.label || category;
            const isExpanded = expandedCategories.includes(category.id);
            
            const catProducts = products.filter(
              (p) => {
                const pCat = p.category as any;
                const pCatName = (pCat?.name as string)?.toLowerCase() || "";
                const pCatSlug = (pCat?.slug as string)?.toLowerCase() || "";
                
                // Also check categories array
                const pCategories = (p as any).categories || [];
                const matchesCategories = pCategories.some((c: any) => 
                  (c.name?.toLowerCase() || "") === catValue || 
                  (c.slug?.toLowerCase() || "") === catValue
                );
                
                return pCatName === catValue || pCatSlug === catValue || matchesCategories;
              }
            ).length;

return (
              <li key={category.id || category.value}>
                <div className="flex items-center w-full">
                  {catValue === "all" ? (
                    <button
                      onClick={() => setActiveCategory(catValue)}
                      className={`flex-1 text-left text-sm transition-colors ${
                        activeCategory === catValue ? "text-black font-medium" : "text-neutral-500 hover:text-black"
                      }`}
                    >
                      {catName}
                    </button>
                  ) : (
                    <Link
                      href={`/category/${catValue}`}
                      className={`flex-1 text-left text-sm transition-colors ${
                        activeCategory === catValue ? "text-black font-medium" : "text-neutral-500 hover:text-black"
                      }`}
                    >
                      {catName}
                    </Link>
                  )}
                  {hasSubcategories && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(category.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-black transition-colors"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
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
                      const subCatProducts = products.filter(
                        (p) => {
                          const pCat = p.category as any;
                          const pCatName = (pCat?.name as string)?.toLowerCase() || "";
                          const pCatSlug = (pCat?.slug as string)?.toLowerCase() || "";
                          
                          // Also check categories array
                          const pCategories = (p as any).categories || [];
                          const matchesCategories = pCategories.some((c: any) => 
                            (c.name?.toLowerCase() || "") === subCatValue || 
                            (c.slug?.toLowerCase() || "") === subCatValue
                          );
                          
                          return pCatName === subCatValue || pCatSlug === subCatValue || matchesCategories;
                        }
                      ).length;
                      return (
                        <li key={sub.id}>
                          <Link
                            href={`/category/${subCatValue}`}
                            className={`flex items-center justify-between w-full text-sm py-1 transition-colors ${
                              activeCategory === subCatValue ? "text-black font-medium" : "text-neutral-500 hover:text-black"
                            }`}
                          >
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
    </div>
  );
}

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [activeColors, setActiveColors] = useState<string[]>([]);
  const [activeSizes, setActiveSizes] = useState<string[]>([]);
  const [activeSort, setActiveSort] = useState<string>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const { products, loading } = useProducts();
  const { selectedCountry } = useCountry();
  const { addItem, setIsOpen } = useCart();
  const productsPerPage = 15;
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/categories`);
        const data = await res.json();
        setDynamicCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const currencySymbol = selectedCountry?.currency_symbol || "$";
  const maxProductPrice = products.reduce((max, p) => {
    const price = Number(getProductPrice(p, selectedCountry?.id).price);
    return price > max ? price : max;
  }, 0);
  const maxPrice = Math.ceil(maxProductPrice / 100) * 100 + 100;
  const step = Math.ceil(maxPrice / 2000) * 10;

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

  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [selectedCountry, products]);

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
    setCurrentPage(1);
  }, [activeCategory, priceRange, activeSort]);

  let filteredProducts = products;

  // Filter by category
  if (activeCategory !== "all") {
    const searchValue = activeCategory.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (product) => {
        const productCategory = product.category as any;
        const catName = (productCategory?.name as string)?.toLowerCase() || "";
        const catSlug = (productCategory?.slug as string)?.toLowerCase() || "";
        
        // Also check categories array for multi-category products
        const productCategories = (product as any).categories || [];
        const matchesCategories = productCategories.some((c: any) => 
          (c.name?.toLowerCase() || "") === searchValue || 
          (c.slug?.toLowerCase() || "") === searchValue
        );
        
        return catName === searchValue || catSlug === searchValue || matchesCategories;
      }
    );
  }

  // Filter by price range
  filteredProducts = filteredProducts.filter(
    (product) => {
      const price = Number(getProductPrice(product, selectedCountry?.id).price);
      return price >= priceRange[0] && price <= priceRange[1];
    }
  );

  // Filter by country availability
  if (selectedCountry?.id) {
    filteredProducts = filteredProducts.filter(p =>
      isProductAvailableInCountry(p, selectedCountry.id)
    );
  }

  // Filter by colors (if any color is selected)
  if (activeColors.length > 0) {
    filteredProducts = filteredProducts.filter(product => {
      const productColors = product.attributes
        ?.filter((attr: any) => attr.attribute?.name?.toLowerCase() === 'color')
        ?.map((attr: any) => attr.value?.toLowerCase()) || [];
      return activeColors.some(color => productColors.includes(color.toLowerCase()));
    });
  }

  // Filter by sizes (if any size is selected)
  if (activeSizes.length > 0) {
    filteredProducts = filteredProducts.filter(product => {
      const productSizes = product.attributes
        ?.filter((attr: any) => attr.attribute?.name?.toLowerCase() === 'size')
        ?.map((attr: any) => attr.value?.toUpperCase()) || [];
      return activeSizes.some(size => productSizes.includes(size.toUpperCase()));
    });
  }

  switch (activeSort) {
    case "featured":
      filteredProducts = [...filteredProducts].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      break;
    case "price-asc":
      filteredProducts = [...filteredProducts].sort((a, b) => {
        const priceA = Number(getProductPrice(a, selectedCountry?.id).price);
        const priceB = Number(getProductPrice(b, selectedCountry?.id).price);
        return priceA - priceB;
      });
      break;
    case "price-desc":
      filteredProducts = [...filteredProducts].sort((a, b) => {
        const priceA = Number(getProductPrice(a, selectedCountry?.id).price);
        const priceB = Number(getProductPrice(b, selectedCountry?.id).price);
        return priceB - priceA;
      });
      break;
    case "name":
      filteredProducts = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const minPercent = maxPrice > 0 ? (priceRange[0] / maxPrice) * 100 : 0;
  const maxPercent = maxPrice > 0 ? (priceRange[1] / maxPrice) * 100 : 100;

  return (
    <main className="flex-1 pt-0">
      <section className="py-12 md:py-16">
        <Container>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <aside className="hidden lg:block w-[350px] flex-shrink-0">
              <div className="border border-neutral-200/50 rounded-lg p-6">
              <SidebarFilters
                products={products}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                priceRange={priceRange}
                minPercent={minPercent}
                maxPercent={maxPercent}
                sliderRef={sliderRef}
                handleMouseDown={handleMouseDown}
                activeColors={activeColors}
                toggleColor={toggleColor}
                activeSizes={activeSizes}
                toggleSize={toggleSize}
                currencySymbol={currencySymbol}
                dynamicCategories={dynamicCategories}
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
                    <span className="text-black capitalize">{activeCategory === "all" ? "All" : activeCategory}</span>
                    <span className="text-neutral-300 ml-2">({filteredProducts.length} products)</span>
                  </nav>

                  <span className="md:hidden text-sm text-neutral-500">
                    {filteredProducts.length} products
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

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 hidden md:block">Sort by:</span>
                    <select
                      value={activeSort}
                      onChange={(e) => setActiveSort(e.target.value)}
                      className="text-xs md:text-sm bg-transparent border-b border-neutral-200 pb-1 focus:outline-none focus:border-black cursor-pointer"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
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
                    <ProductListCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {!loading && filteredProducts.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center border border-neutral-200 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 flex items-center justify-center text-sm transition-colors ${
                        currentPage === page
                          ? "bg-black text-white"
                          : "border border-neutral-200 hover:border-black"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center border border-neutral-200 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              )}

              {!loading && filteredProducts.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-neutral-500">No products found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white p-6 overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-medium">Filters</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-10 h-10 flex items-center justify-center"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SidebarFilters
                products={products}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                priceRange={priceRange}
                minPercent={minPercent}
                maxPercent={maxPercent}
                sliderRef={sliderRef}
                handleMouseDown={handleMouseDown}
                activeColors={activeColors}
                toggleColor={toggleColor}
                activeSizes={activeSizes}
                toggleSize={toggleSize}
                currencySymbol={currencySymbol}
                dynamicCategories={dynamicCategories}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

function ProductListCard({ product }: { product: Product }) {
  const { addItem, setIsOpen } = useCart();
  const { selectedCountry } = useCountry();
  const { price: rawPrice, stock } = getProductPrice(product, selectedCountry?.id);
  const price = Number(rawPrice);
  const currencySymbol = selectedCountry?.currency_symbol || "$";
  const currencyCode = selectedCountry?.currency || "USD";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, "M");
    setIsOpen(true);
  };

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="flex gap-4 md:gap-6 p-4 border border-neutral-100 hover:border-neutral-300 transition-colors group"
    >
      <div className="w-24 h-32 md:w-32 md:h-44 flex-shrink-0 bg-neutral-50 overflow-hidden relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-[10px] uppercase tracking-[0.15em]">Sold Out</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 mb-1">
            {product.category?.name || "Uncategorized"}
          </p>
          <h3 className="text-sm md:text-base font-medium text-black mb-2 group-hover:opacity-70 transition-opacity">
            {product.name}
          </h3>
          <p className="text-xs md:text-sm text-neutral-500 line-clamp-2">
            {product.description}
          </p>
          {(product.average_rating !== undefined && product.average_rating > 0 ||
            product.reviews_count !== undefined && product.reviews_count > 0) && (
            <div className="flex items-center gap-1 mt-2">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="#facc15"
                stroke="#facc15"
                strokeWidth="2"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-xs text-neutral-500">
                {product.average_rating !== undefined && product.average_rating > 0
                  ? product.average_rating.toFixed(1)
                  : "0"}
                {product.reviews_count !== undefined && product.reviews_count > 0 && (
                  <span className="text-neutral-400 ml-0.5">({product.reviews_count})</span>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm md:text-base font-medium text-black">
            {currencySymbol}
            {price.toFixed(2)}
            {currencyCode !== "USD" && <span className="text-neutral-400 text-xs ml-1">({currencyCode})</span>}
          </p>
          <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
            <WishlistButton productId={product.id} size="sm" />
            <button
              onClick={handleAddToCart}
              disabled={stock === 0}
              className="px-3 md:px-4 py-2 text-xs bg-black text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
