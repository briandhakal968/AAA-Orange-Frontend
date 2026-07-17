"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { CartDrawer } from "./cart-drawer";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useProducts } from "@/hooks/useProducts";

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  subcategories?: CategoryData[];
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLowerNav, setShowLowerNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryData[]>([]);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [headerMenu, setHeaderMenu] = useState<any[]>([]);
  const [hoveredMenu, setHoveredMenu] = useState<number | null>(null);
  const menuRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMenuEnter = (id: number) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setHoveredMenu(id);
  };

  const handleMenuLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 300);
  };
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = () => setHoveredMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const { itemCount, isOpen, setIsOpen } = useCart();
  const { isLoggedIn, user } = useAuth();
  const { products } = useProducts();

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, products]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/categories`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const sortedData = [...data].sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
          const withSortedSubcategories = sortedData.map((cat: any) => ({
            ...cat,
            subcategories: (cat.subcategories || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
          }));
          setAllCategories(withSortedSubcategories);
          const parentCategories = withSortedSubcategories.filter((cat: any) => !cat.parent_id);
          setCategories(parentCategories);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchHeaderMenu = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/menus?location=header`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setHeaderMenu(data);
        }
      } catch (err) {
        console.error("Error fetching header menu:", err);
      }
    };
    fetchHeaderMenu();
  }, []);

  const renderSubmenuDropdown = useCallback((item: any) => {
    if (!item.children || item.children.length === 0) return null;
    const ref = menuRefs.current.get(item.id);
    if (!ref) return null;
    const rect = ref.getBoundingClientRect();
    return createPortal(
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-white shadow-lg border-t border-[var(--border)] z-[100] min-w-[200px]"
        style={{ position: 'fixed', top: '108px', left: rect.left, width: 'auto' }}
        onMouseEnter={() => handleMenuEnter(item.id)}
        onMouseLeave={handleMenuLeave}
      >
        {item.children.map((child: any, index: number) => (
          <div key={child.id}>
            {index > 0 && <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mx-4" />}
            <Link
              href={child.url}
              onClick={() => setHoveredMenu(null)}
              className="block px-5 py-2.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              {child.label}
            </Link>
          </div>
        ))}
      </motion.div>,
      document.body
    );
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 100 && currentScrollY >= lastScrollY) {
        setShowLowerNav(false);
      } else {
        setShowLowerNav(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
      {/* ===== DESKTOP HEADER (original) ===== */}
      <header style={{ backgroundColor: 'var(--primary)' }} className="hidden md:block fixed top-0 left-0 right-0 z-50">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center py-3 gap-2">
            {/* Left: Logo + Deliver to */}
              <div className="flex items-center gap-2 shrink-0">
               <Link href="/" className="flex items-center px-2 py-1">
                 <span className="text-white text-xl font-bold tracking-wide">AAA Orange</span>
               </Link>
             </div>

            {/* Center: Search bar */}
            <div className="flex-1 flex justify-center relative">
              <form onSubmit={handleSearchSubmit} className="flex items-center w-full max-w-[750px] h-10 rounded-full overflow-hidden bg-white px-2.5">
              <input
                ref={desktopSearchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="Search Your Favourite Product"
                className="flex-1 px-4 text-sm text-black focus:outline-none"
              />
              <div className="flex items-center bg-[var(--muted)] rounded-full mx-1 relative border border-[var(--border)] py-1">
                <select className="bg-transparent text-[var(--muted-foreground)] text-xs cursor-pointer focus:outline-none rounded-full pl-[10px] pr-[20px] appearance-none">
                  <option>All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
                <svg className="w-3 h-3 text-[#555] absolute right-[6px] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            <button type="submit" style={{ backgroundColor: 'var(--primary)' }} className="px-5 py-1.5 flex items-center justify-center rounded-full hover:opacity-90">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              </form>

              {/* Search results dropdown */}
              {searchFocused && searchResults.length > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-full max-w-[800px] bg-white shadow-lg border border-[var(--border)] z-50 rounded-md">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug || product.id}`}
                      onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                      className="flex items-center gap-3 p-3 hover:bg-[var(--muted)] transition-colors"
                    >
                      {product.image && (
                        <div className="w-10 h-10 bg-neutral-100 flex-shrink-0 overflow-hidden">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black truncate">{product.name}</p>
                        <p className="text-xs text-neutral-500">{product.category?.name}</p>
                      </div>
                    </Link>
                  ))}
                  <Link
                    href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                    onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                    style={{ color: 'var(--primary)' }}
                  >
                    See all results
                  </Link>
                </div>
              )}
              {searchFocused && searchQuery && searchResults.length === 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-full max-w-[800px] bg-white shadow-lg border border-[var(--border)] z-50 p-4 rounded-md">
                  <p className="text-sm text-neutral-500">No results found</p>
                </div>
              )}
            </div>

            {/* Right: Account + Orders + Cart */}
            <div className="flex items-center gap-2 shrink-0">
              {mounted && isLoggedIn ? (
                <Link href="/my-account" className="hidden md:flex items-center gap-1 px-2 py-1">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="text-[var(--primary-foreground)] text-sm leading-tight">
                    <p className="text-white/70 text-xs">Hello, {user?.name?.split(" ")[0] || "User"}</p>
                    <p className="font-bold">Account</p>
                  </div>
                </Link>
              ) : (
                <Link href="/login" className="hidden md:flex items-center gap-1 px-2 py-1">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="text-[var(--primary-foreground)] text-sm leading-tight">
                    <p className="text-white/70 text-xs">Hello, sign in</p>
                    <p className="font-bold">Account</p>
                  </div>
                </Link>
              )}

              <Link href="/wishlist" className="hidden md:flex items-center gap-1 px-2 py-1">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <div className="text-[var(--primary-foreground)] text-sm leading-tight">
                  <p className="text-white/70 text-xs">Your</p>
                  <p className="font-bold">Wishlist</p>
                </div>
              </Link>

              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-1 px-2 py-1 relative"
              >
                <div className="relative">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  {mounted && (
                    <span style={{ backgroundColor: 'var(--primary)' }} className="absolute -top-1 left-1/2 -translate-x-1/2 text-[var(--primary-foreground)] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </div>
                <span className="text-white text-xs font-bold hidden sm:inline">Cart</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Sub-navigation bar */}
      <div className={`hidden md:block fixed top-[60px] left-0 right-0 z-40 bg-white border-b border-[var(--border)] transition-transform duration-300 ${showLowerNav ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center h-12 gap-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1">
              {/* Browse All Categories - opens off-canvas */}
              <button
                onClick={() => setShowCategoriesDropdown(true)}
                className="flex items-center gap-1 px-2 pt-2 pb-0 hover:bg-[var(--muted)] rounded-sm shrink-0 text-[var(--foreground)] text-sm font-bold"
              >
                <span>Browse all categories</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {headerMenu.length > 0 ? (
              headerMenu.map((item) => (
                <div
                  key={item.id}
                  ref={(el) => { if (el) menuRefs.current.set(item.id, el); }}
                  onMouseEnter={() => handleMenuEnter(item.id)}
                  onMouseLeave={handleMenuLeave}
                >
                  <Link href={item.url} className="px-2 pt-2 pb-0 shrink-0 text-[var(--foreground)] text-sm font-normal whitespace-nowrap flex items-center gap-1">
                    {item.label}
                    {item.children && item.children.length > 0 && (
                      <svg className={`w-3 h-3 transition-transform ${hoveredMenu === item.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>
                </div>
              ))
            ) : (
              <>
                <Link href="/todays-deals" className="px-2 pt-2 pb-0 shrink-0 text-[var(--foreground)] text-sm font-bold whitespace-nowrap">
                  Today's Deals
                </Link>
                <Link href="/hot-deals" className="px-2 pt-2 pb-0 shrink-0 text-[var(--foreground)] text-sm font-bold whitespace-nowrap">
                  Hot Deals
                </Link>
                <Link href="/top-selling" className="px-2 pt-2 pb-0 shrink-0 text-[var(--foreground)] text-sm whitespace-nowrap">
                  Top Selling
                </Link>
                <Link href="/new-collection" className="px-2 pt-2 pb-0 shrink-0 text-[var(--foreground)] text-sm whitespace-nowrap">
                  New Collection
                </Link>
                <Link href="/blog" className="px-2 pt-2 pb-0 shrink-0 text-[var(--foreground)] text-sm whitespace-nowrap">
                  Blog
                </Link>
                <Link href="/wishlist" className="px-2 pt-2 pb-0 shrink-0 text-[var(--foreground)] text-sm whitespace-nowrap">
                  Wishlist
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===== MOBILE HEADER (Amazon-style 3 parts) ===== */}
      {/* Part 1: Top bar - Hamburger + Logo + Sign In + Cart */}
      <header style={{ backgroundColor: 'var(--primary)' }} className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="px-3">
          <div className="flex items-center h-14 gap-2">
            {/* Left: Hamburger */}
            <button
              onClick={() => setShowCategoriesDropdown(true)}
              className="flex items-center text-white shrink-0"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Center: Logo */}
            <Link href="/" className="flex items-center px-2 shrink-0">
              <span className="text-white text-xl font-bold tracking-wide">AAA Orange</span>
            </Link>

            {/* Right: Sign In + Cart */}
            <div className="flex items-center gap-1 ml-auto shrink-0">
              {mounted && isLoggedIn ? (
                <Link href="/my-account" className="flex flex-col items-center px-2 py-1 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-[10px] font-bold leading-tight">Account</span>
                </Link>
              ) : (
                <Link href="/login" className="flex flex-col items-center px-2 py-1 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-[10px] font-bold leading-tight">Sign in</span>
                </Link>
              )}

              <button
                onClick={() => setIsOpen(true)}
                className="flex flex-col items-center px-2 py-1 text-white relative"
              >
                <div className="relative">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  {mounted && (
                    <span style={{ backgroundColor: 'var(--primary)' }} className="absolute -top-1 -right-1 text-[var(--primary-foreground)] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold leading-tight">Cart</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Part 2: Search bar - full width */}
      <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-[var(--muted)] border-b border-[var(--border)]">
        <div className="px-3 py-2">
          <form onSubmit={handleSearchSubmit} className="flex items-center h-10 rounded-full overflow-hidden relative bg-white px-2.5 border border-[var(--border)]">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Search Your Favourite Product"
              className="flex-1 px-3 text-sm text-black focus:outline-none"
            />
            <button type="submit" style={{ backgroundColor: 'var(--primary)' }} className="px-5 py-1.5 flex items-center justify-center rounded-full hover:opacity-90">
              <svg className="w-5 h-5" style={{ color: 'var(--primary-foreground)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Search results dropdown */}
            {searchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-lg border border-[var(--border)] z-50">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug || product.id}`}
                    onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                    className="flex items-center gap-3 p-3 hover:bg-[var(--muted)] transition-colors"
                  >
                    {product.image && (
                      <div className="w-10 h-10 bg-neutral-100 flex-shrink-0 overflow-hidden">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">{product.name}</p>
                      <p className="text-xs text-neutral-500">{product.category?.name}</p>
                    </div>
                  </Link>
                ))}
                <Link
                  href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                  onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                  className="block p-3 text-sm text-center text-[#007185] hover:bg-[var(--muted)] hover:underline border-t border-[#ddd]"
                >
                  See all results
                </Link>
              </div>
            )}
            {searchFocused && searchQuery && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-lg border border-[var(--border)] z-50 p-4">
                <p className="text-sm text-neutral-500">No results found</p>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Part 3: Sliding horizontal menu */}
      <div className={`md:hidden fixed top-[104px] left-0 right-0 z-40 bg-white border-b border-[var(--border)] transition-transform duration-300 ${showLowerNav ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="flex items-center h-11 gap-0 overflow-x-auto scrollbar-hide px-3">
          {headerMenu.length > 0 ? (
            headerMenu.map((item) => (
              <div
                key={item.id}
                ref={(el) => { if (el) menuRefs.current.set(item.id, el); }}
                onMouseEnter={() => handleMenuEnter(item.id)}
                onMouseLeave={handleMenuLeave}
                className="shrink-0"
              >
                <Link href={item.url} className="px-3 py-2 text-sm text-[var(--foreground)] font-normal whitespace-nowrap flex items-center gap-1 hover:text-[var(--primary)] transition-colors">
                  {item.label}
                  {item.children && item.children.length > 0 && (
                    <svg className={`w-3 h-3 transition-transform ${hoveredMenu === item.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </Link>
              </div>
            ))
          ) : (
            <>
<Link href="/todays-deals" className="px-3 py-2 text-sm text-[var(--foreground)] font-normal whitespace-nowrap hover:text-[var(--primary)] transition-colors shrink-0">
              Today's Deals
            </Link>
            <Link href="/hot-deals" className="px-3 py-2 text-sm text-[var(--foreground)] font-normal whitespace-nowrap hover:text-[var(--primary)] transition-colors shrink-0">
              Hot Deals
            </Link>
            <Link href="/top-selling" className="px-3 py-2 text-sm text-[var(--foreground)] font-normal whitespace-nowrap hover:text-[var(--primary)] transition-colors shrink-0">
              Top Selling
            </Link>
            <Link href="/new-collection" className="px-3 py-2 text-sm text-[var(--foreground)] font-normal whitespace-nowrap hover:text-[var(--primary)] transition-colors shrink-0">
              New Collection
            </Link>
            <Link href="/wishlist" className="px-3 py-2 text-sm text-[var(--foreground)] font-normal whitespace-nowrap hover:text-[var(--primary)] transition-colors shrink-0">
                Wishlist
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Spacer to push content below fixed navbar */}
      <div className="md:hidden h-[150px]" />
      <div className="hidden md:block h-[108px]" />

      {/* Mobile slide-out menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 bg-black/60"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed left-0 top-0 bottom-0 z-[60] w-[300px] bg-white overflow-y-auto"
            >
              {/* Menu header */}
              <div style={{ backgroundColor: 'var(--primary)' }} className="px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/>
                  </svg>
                </div>
                <span className="text-white font-bold text-lg">
                  {mounted && isLoggedIn ? `Hello, ${user?.name?.split(" ")[0]}` : "Hello, sign in"}
                </span>
              </div>

              {/* Menu items */}
              <nav className="py-2">
                <p className="px-6 py-2 text-base font-bold text-black">Help & Settings</p>
                <Link href="/my-account" onClick={() => setMenuOpen(false)} className="block px-6 py-3 text-sm text-black hover:bg-[var(--muted)] transition-colors">Your Account</Link>
                <Link href="/blog" onClick={() => setMenuOpen(false)} className="block px-6 py-3 text-sm text-black hover:bg-[var(--muted)] transition-colors">Blog</Link>
                <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="block px-6 py-3 text-sm text-black hover:bg-[var(--muted)] transition-colors">Your Wishlist</Link>
                <Link href="/my-account/orders" onClick={() => setMenuOpen(false)} className="block px-6 py-3 text-sm text-black hover:bg-[var(--muted)] transition-colors">Your Orders</Link>
                {mounted && isLoggedIn && (
                  <button onClick={() => { setMenuOpen(false); }} className="block w-full text-left px-6 py-3 text-sm text-black hover:bg-[var(--muted)] transition-colors">Sign Out</button>
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Categories Off-Canvas */}
      <AnimatePresence>
        {showCategoriesDropdown && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 bg-black/60"
              onClick={() => setShowCategoriesDropdown(false)}
            />
            <motion.aside
              initial={{ x: -400, opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0.8 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-0 top-0 bottom-0 z-[60] w-[350px] bg-white overflow-y-auto"
            >
              <div style={{ backgroundColor: 'var(--primary)' }} className="px-6 py-4 flex items-center justify-between">
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-white font-bold text-lg"
                >
                  All Categories
                </motion.span>
                <button
                  onClick={() => setShowCategoriesDropdown(false)}
                  className="text-white hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="py-2">
                {allCategories.filter(c => !c.parent_id).map((cat, index) => (
                  <motion.div 
                    key={cat.id} 
                    className="border-b border-[var(--border)]/50 overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/category/${cat.slug}`}
                        onClick={() => setShowCategoriesDropdown(false)}
                        className="flex-1 px-6 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                      >
                        {cat.name}
                      </Link>
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <button
                          onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                          className="px-4 py-3 text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                        >
                          <motion.svg 
                            className={`w-5 h-5`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                            animate={{ rotate: expandedCategory === cat.id ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </motion.svg>
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {expandedCategory === cat.id && cat.subcategories && cat.subcategories.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="bg-[var(--muted)]"
                        >
                          {cat.subcategories.map((sub, subIndex) => (
                            <motion.div
                              key={sub.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.03 * subIndex }}
                            >
                              <Link
                                href={`/category/${sub.slug}`}
                                onClick={() => setShowCategoriesDropdown(false)}
                                className="block px-10 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                              >
                                {sub.name}
                              </Link>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CartDrawer />
      {hoveredMenu !== null && headerMenu.find(m => m.id === hoveredMenu)?.children?.length > 0 && renderSubmenuDropdown(headerMenu.find(m => m.id === hoveredMenu)!)}
    </>
  );
}
