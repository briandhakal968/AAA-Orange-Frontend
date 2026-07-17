"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";
import MediaLibraryModal from "@/components/ui/media-library-modal";
import EditorJsComponent from "@/components/ui/editorjs";
import { ArrowLeft, Image, Edit3, Check, X } from "lucide-react";

interface PageForm {
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  use_breadcrumb: boolean;
  banner_heading: string;
  banner_image: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_canonical: string;
  seo_og_title: string;
  seo_og_description: string;
  seo_og_image: string;
  seo_robots: string;
}

const defaultForm: PageForm = {
  title: "",
  slug: "",
  content: "",
  status: "draft",
  use_breadcrumb: true,
  banner_heading: "",
  banner_image: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  seo_canonical: "",
  seo_og_title: "",
  seo_og_description: "",
  seo_og_image: "",
  seo_robots: "index,follow",
};

export default function PageEditorPage({ params, isEdit = false }: { params?: Promise<{ slug: string }>; isEdit?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<PageForm>(defaultForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState("");
  const [activeSeoTab, setActiveSeoTab] = useState<"general" | "social">("general");
  const titleRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEdit && params) {
      params.then(async (p) => {
        try {
          console.log('[PageEditor] Fetching page with slug:', p.slug);
          const page = await adminApi.get<any>(`/admin/pages/${p.slug}`);
          console.log('[PageEditor] Page loaded:', page.title);
          setForm({
            title: page.title || "",
            slug: page.slug || "",
            content: page.content || "",
            status: page.status || "draft",
            use_breadcrumb: page.use_breadcrumb !== false,
            banner_heading: page.banner_heading || "",
            banner_image: page.banner_image || "",
            seo_title: page.seo_title || "",
            seo_description: page.seo_description || "",
            seo_keywords: page.seo_keywords || "",
            seo_canonical: page.seo_canonical || "",
            seo_og_title: page.seo_og_title || "",
            seo_og_description: page.seo_og_description || "",
            seo_og_image: page.seo_og_image || "",
            seo_robots: page.seo_robots || "index,follow",
          });
        } catch (error) {
          console.error("Error fetching page:", error);
          if (error instanceof Error && error.message.includes("404")) {
            setError("Page not found. It may have been deleted.");
          } else {
            setError(error instanceof Error ? error.message : "Failed to load page");
          }
        } finally {
          setLoading(false);
        }
      });
    }
  }, [isEdit, params]);

  useEffect(() => {
    if (!isEdit && titleRef.current) {
      titleRef.current.focus();
    }
  }, [isEdit]);

  useEffect(() => {
    if (editingSlug && slugRef.current) {
      slugRef.current.focus();
    }
  }, [editingSlug]);

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      seo_title: prev.seo_title || title,
    }));
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const data = { ...form, status };
      if (isEdit && params) {
        const p = await params;
        await adminApi.put(`/admin/pages/${p.slug}`, data);
      } else {
        await adminApi.post("/admin/pages", data);
      }
      router.push("/superadmin/pages");
    } catch (error) {
      console.error("Error saving page:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleMediaSelect = (url: string) => {
    setForm((prev) => ({ ...prev, banner_image: url }));
  };

  const saveSlugEdit = () => {
    setForm((prev) => ({
      ...prev,
      slug: slugInput.toLowerCase().replace(/[^a-z0-9-]/g, ""),
    }));
    setEditingSlug(false);
  };

  const seoTitleLength = (form.seo_title || form.title).length;
  const seoDescLength = (form.seo_description || "").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Failed to load page</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button type="button" onClick={() => router.push("/superadmin/pages")} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            ← Back to Pages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-8">
            <div className="flex items-center gap-3 mb-6">
              <button type="button" onClick={() => router.push("/superadmin/pages")} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 text-sm">
                <ArrowLeft className="w-4 h-4" />
                <span>All Pages</span>
              </button>
              <div className="w-px h-5 bg-slate-200" />
              <span className="text-sm text-slate-500">{isEdit ? "Editing" : "Creating"}</span>
              {form.title && <span className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{form.title}</span>}
            </div>
            <input ref={titleRef} type="text" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Add title" className="w-full text-4xl font-bold text-slate-800 placeholder:text-slate-300 outline-none mb-2" />
            {form.slug && (
              <div className="flex items-center gap-1 text-sm text-slate-500 mb-6">
                <span>Permalink:</span>
                <span className="text-slate-400">example.com/</span>
                {editingSlug ? (
                  <div className="flex items-center gap-1">
                    <input ref={slugRef} type="text" value={slugInput} onChange={(e) => setSlugInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveSlugEdit(); if (e.key === "Escape") setEditingSlug(false); }} className="px-1 py-0.5 text-sm border border-indigo-500 rounded outline-none w-32" />
                    <button type="button" onClick={saveSlugEdit} className="p-0.5 text-green-600 hover:bg-green-50 rounded"><Check className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => { setEditingSlug(true); setSlugInput(form.slug); }} className="text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-0.5">
                    {form.slug}<Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            <EditorJsComponent value={form.content} onChange={(content) => setForm({ ...form, content })} placeholder="Write your page content..." />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Publish Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex gap-2">
              <button type="button" onClick={() => handleSubmit("published")} disabled={saving || !form.title.trim()} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Saving..." : isEdit ? "Update" : "Publish"}
              </button>
              <button type="button" onClick={() => handleSubmit("draft")} disabled={saving || !form.title.trim()} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
                Draft
              </button>
            </div>
          </div>

          {/* Banner Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Banner Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">Show Breadcrumb</p>
                  <p className="text-xs text-slate-500">Display navigation trail</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.use_breadcrumb} onChange={(e) => setForm({ ...form, use_breadcrumb: e.target.checked })} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <div>
                <label className="text-sm text-slate-700 mb-1 block">Banner Image</label>
                {form.banner_image ? (
                  <div className="relative rounded-lg overflow-hidden group">
                    <img src={form.banner_image} alt="" className="w-full h-24 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button type="button" onClick={() => setShowMediaModal(true)} className="p-1.5 bg-white rounded hover:bg-slate-100"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => setForm({ ...form, banner_image: "" })} className="p-1.5 bg-white rounded hover:bg-slate-100"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowMediaModal(true)} className="w-full py-6 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                    <Image className="w-6 h-6 mx-auto mb-1" /><span className="text-xs">Set banner image</span>
                  </button>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-700 mb-1 block">Banner Heading</label>
                <input type="text" value={form.banner_heading} onChange={(e) => setForm({ ...form, banner_heading: e.target.value })} placeholder={form.title || "Page heading..."} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none" />
              </div>
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">SEO Settings</h3>
            <div className="flex border-b border-slate-200 mb-4">
              <button type="button" onClick={() => setActiveSeoTab("general")} className={`flex-1 px-3 py-2 text-sm font-medium ${activeSeoTab === "general" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}>General</button>
              <button type="button" onClick={() => setActiveSeoTab("social")} className={`flex-1 px-3 py-2 text-sm font-medium ${activeSeoTab === "social" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"}`}>Social</button>
            </div>

            {activeSeoTab === "general" ? (
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-slate-500 mb-2">Google Preview</p>
                  <p className="text-base text-blue-700 truncate" style={{ fontFamily: "arial, sans-serif" }}>{form.seo_title || form.title || "Page Title"}</p>
                  <p className="text-xs text-green-700 truncate" style={{ fontFamily: "arial, sans-serif" }}>example.com/{form.slug || "page-slug"}</p>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5" style={{ fontFamily: "arial, sans-serif" }}>{form.seo_description || "Page meta description..."}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">SEO Title <span className={`ml-2 ${seoTitleLength > 60 ? "text-red-500" : ""}`}>{seoTitleLength}/60</span></label>
                  <input type="text" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder={form.title || "SEO title..."} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Meta Description <span className={`ml-2 ${seoDescLength > 160 ? "text-red-500" : ""}`}>{seoDescLength}/160</span></label>
                  <textarea value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} placeholder="Meta description..." rows={3} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none resize-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Focus Keywords</label>
                  <input type="text" value={form.seo_keywords} onChange={(e) => setForm({ ...form, seo_keywords: e.target.value })} placeholder="keyword1, keyword2" className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Canonical URL</label>
                  <input type="text" value={form.seo_canonical} onChange={(e) => setForm({ ...form, seo_canonical: e.target.value })} placeholder="https://example.com/page" className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Robots</label>
                  <select value={form.seo_robots} onChange={(e) => setForm({ ...form, seo_robots: e.target.value })} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none">
                    <option value="index,follow">Index, Follow</option>
                    <option value="index,nofollow">Index, No Follow</option>
                    <option value="noindex,follow">No Index, Follow</option>
                    <option value="noindex,nofollow">No Index, No Follow</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-slate-500 mb-2">Facebook Preview</p>
                  <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
                    {form.seo_og_image || form.banner_image ? (
                      <div className="aspect-video bg-slate-200"><img src={form.seo_og_image || form.banner_image} alt="OG" className="w-full h-full object-cover" /></div>
                    ) : (
                      <div className="aspect-video bg-slate-200 flex items-center justify-center"><Image className="w-6 h-6 text-slate-400" /></div>
                    )}
                    <div className="p-3">
                      <p className="text-xs text-slate-500 uppercase">example.com</p>
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{form.seo_og_title || form.seo_title || form.title || "Page Title"}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{form.seo_og_description || form.seo_description || "Description..."}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">OG Title</label>
                  <input type="text" value={form.seo_og_title} onChange={(e) => setForm({ ...form, seo_og_title: e.target.value })} placeholder={form.seo_title || form.title || "Social title..."} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">OG Description</label>
                  <textarea value={form.seo_og_description} onChange={(e) => setForm({ ...form, seo_og_description: e.target.value })} placeholder={form.seo_description || "Social description..."} rows={3} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none resize-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">OG Image</label>
                  <div className="flex gap-2">
                    <input type="text" value={form.seo_og_image} onChange={(e) => setForm({ ...form, seo_og_image: e.target.value })} placeholder={form.banner_image || "https://example.com/image.jpg"} className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none" />
                    <button type="button" onClick={() => setShowMediaModal(true)} className="px-3 py-1.5 border border-slate-200 rounded text-sm hover:bg-slate-50"><Image className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MediaLibraryModal isOpen={showMediaModal} onClose={() => setShowMediaModal(false)} onSelect={handleMediaSelect} title="Select Banner Image" />
    </div>
  );
}
