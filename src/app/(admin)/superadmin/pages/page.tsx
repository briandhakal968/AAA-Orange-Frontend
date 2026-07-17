"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { adminApi } from "@/lib/admin-api";

interface CustomPage {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SystemPage {
  name: string;
  path: string;
  description: string;
  section: string;
}

const systemPages: SystemPage[] = [
  { name: "Home", path: "/", description: "Main landing page", section: "Public" },
  { name: "Shop", path: "/shop", description: "All products listing", section: "Public" },
  { name: "Products", path: "/products", description: "Product catalog", section: "Public" },
  { name: "Today's Deals", path: "/todays-deals", description: "Special deals and offers", section: "Public" },
  { name: "Hot Deals", path: "/hot-deals", description: "Hot deals with amazing discounts", section: "Public" },
  { name: "Top Selling", path: "/top-selling", description: "Top selling products", section: "Public" },
  { name: "New Collection", path: "/new-collection", description: "Latest collection", section: "Public" },
  { name: "Cart", path: "/cart", description: "Shopping cart", section: "Public" },
  { name: "Checkout", path: "/checkout", description: "Order checkout", section: "Public" },
  { name: "Wishlist", path: "/wishlist", description: "Saved products", section: "Public" },
  { name: "Login", path: "/login", description: "Customer login", section: "Public" },
  { name: "Register", path: "/register", description: "Customer registration", section: "Public" },
  { name: "Forgot Password", path: "/forgot-password", description: "Password recovery", section: "Public" },
  { name: "My Account", path: "/my-account", description: "Customer account dashboard", section: "Public" },
  { name: "Blog", path: "/blog", description: "Blog listing page", section: "Public" },
  { name: "Blog Post", path: "/blog/[slug]", description: "Individual blog post", section: "Public" },
  { name: "Blog Category", path: "/blog/category/[slug]", description: "Blog posts by category", section: "Public" },
  { name: "Product Category", path: "/category/[slug]", description: "Products by category", section: "Public" },
  { name: "Product Detail", path: "/products/[id]", description: "Individual product page", section: "Public" },
];

export default function AdminPages() {
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "custom" | "system">("all");

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<CustomPage[]>("/admin/pages");
      setCustomPages(data);
    } catch (error) {
      console.error("Error fetching pages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Delete this page?")) return;
    try {
      await adminApi.delete(`/admin/pages/${slug}`);
      fetchPages();
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  const allPages = [
    ...customPages.map(p => ({ name: p.title, path: `/${p.slug}`, type: "custom" as const, status: p.status, id: p.id, slug: p.slug, excerpt: p.excerpt })),
    ...systemPages.map(p => ({ ...p, type: "system" as const })),
  ];

  const filteredPages = allPages.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.path.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "custom" && p.type === "custom") ||
      (activeTab === "system" && p.type === "system");
    return matchesSearch && matchesTab;
  });

  const customCount = customPages.length;
  const systemCount = systemPages.length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pages</h1>
          <p className="text-sm text-slate-500 mt-1">All website pages ({customCount} custom, {systemCount} system)</p>
        </div>
        <Link
          href="/superadmin/pages/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Page
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {(["all", "custom", "system"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab === "all" ? `All (${customCount + systemCount})` : tab === "custom" ? `Custom (${customCount})` : `System (${systemCount})`}
              </button>
            ))}
          </div>
          <div className="relative max-w-md w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">No pages found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Page</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Section</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Path</th>
                  {activeTab !== "system" && (
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                  )}
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPages.map((page, idx) => (
                  <tr key={page.type === "custom" ? `custom-${page.id}` : `system-${idx}`} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-medium text-slate-800">{page.name}</span>
                        {page.type === "custom" && page.excerpt && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{page.excerpt}</p>
                        )}
                        {page.type === "system" && "description" in page && (
                          <p className="text-xs text-slate-400 mt-0.5">{(page as SystemPage).description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                        page.type === "custom"
                          ? "text-indigo-600 bg-indigo-50"
                          : "text-slate-600 bg-slate-100"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          page.type === "custom" ? "bg-indigo-500" : "bg-slate-400"
                        }`}></span>
                        {page.type === "custom" ? "Custom" : "System"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">
                        {"section" in page ? (page as SystemPage).section : "Custom"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400 font-mono">{page.path}</span>
                    </td>
                    {page.type === "custom" && (
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                          page.status === "published"
                            ? "text-green-600 bg-green-50"
                            : "text-amber-600 bg-amber-50"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            page.status === "published" ? "bg-green-500" : "bg-amber-500"
                          }`}></span>
                          {page.status}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={page.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-blue-50 rounded-lg"
                          title="View Page"
                        >
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </a>
                        {page.type === "custom" && (
                          <>
                            <Link
                              href={`/superadmin/pages/edit/${(page as any).slug}`}
                              className="p-2 hover:bg-slate-100 rounded-lg"
                              title="Edit"
                            >
                              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDelete((page as any).slug)}
                              className="p-2 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
