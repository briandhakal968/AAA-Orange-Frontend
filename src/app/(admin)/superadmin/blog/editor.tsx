"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";
import MediaLibraryModal from "@/components/ui/media-library-modal";
import EditorJsComponent from "@/components/ui/editorjs";
import { ArrowLeft, Image, Edit3, Check, X } from "lucide-react";

interface PostForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category_id: string;
  status: "draft" | "published";
  featured_image: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_canonical: string;
  seo_og_title: string;
  seo_og_description: string;
  seo_og_image: string;
  seo_robots: string;
}

interface Category {
  id: number;
  name: string;
}

const defaultForm: PostForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category_id: "",
  status: "draft",
  featured_image: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  seo_canonical: "",
  seo_og_title: "",
  seo_og_description: "",
  seo_og_image: "",
  seo_robots: "index,follow",
};

export default function BlogPostEditorPage({ params, isEdit = false }: { params?: Promise<{ id: string }>; isEdit?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<PostForm>(defaultForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<"featured" | "og">("featured");
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState("");
  const [activeSeoTab, setActiveSeoTab] = useState<"general" | "social">("general");
  const titleRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);

  const openMediaModal = (target: "featured" | "og") => {
    setMediaTarget(target);
    setShowMediaModal(true);
  };

  const handleMediaSelect = (url: string) => {
    if (mediaTarget === "featured") {
      setForm((prev) => ({ ...prev, featured_image: url }));
    } else {
      setForm((prev) => ({ ...prev, seo_og_image: url }));
    }
  };

  useEffect(() => {
    fetchCategories();
    if (isEdit && params) {
      params.then(async (p) => {
        try {
          const post = await adminApi.get<any>(`/admin/blog/${p.id}`);
          setForm({
            title: post.title || "",
            slug: post.slug || "",
            excerpt: post.excerpt || "",
            content: post.content || "",
            category_id: post.category_id?.toString() || "",
            status: post.status || "draft",
            featured_image: post.featured_image || "",
            seo_title: post.seo_title || "",
            seo_description: post.seo_description || "",
            seo_keywords: post.seo_keywords || "",
            seo_canonical: post.seo_canonical || "",
            seo_og_title: post.seo_og_title || "",
            seo_og_description: post.seo_og_description || "",
            seo_og_image: post.seo_og_image || "",
            seo_robots: post.seo_robots || "index,follow",
          });
        } catch (error) {
          console.error("Error fetching post:", error);
        } finally {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
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

  const fetchCategories = async () => {
    try {
      const data = await adminApi.get<Category[]>("/admin/blog-categories");
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      seo_title: prev.seo_title || title,
    }));
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const data = { ...form, status, category_id: form.category_id ? parseInt(form.category_id) : null };
      if (isEdit && params) {
        const p = await params;
        await adminApi.put(`/admin/blog/${p.id}`, data);
      } else {
        await adminApi.post("/admin/blog", data);
      }
      router.push("/superadmin/blog");
    } catch (error) {
      console.error("Error saving post:", error);
    } finally {
      setSaving(false);
    }
  };

  const saveSlugEdit = () => {
    setForm((prev) => ({
      ...prev,
      slug: slugInput.toLowerCase().replace(/[^a-z0-9-]/g, ""),
    }));
    setEditingSlug(false);
  };

  const selectedCategory = categories.find((c) => c.id.toString() === form.category_id);
  const seoTitleLength = (form.seo_title || form.title).length;
  const seoDescLength = (form.seo_description || form.excerpt).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
              <button type="button" onClick={() => router.push("/superadmin/blog")} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 text-sm">
                <ArrowLeft className="w-4 h-4" />
                <span>All Posts</span>
              </button>
              <div className="w-px h-5 bg-slate-200" />
              <span className="text-sm text-slate-500">{isEdit ? "Editing" : "Creating"}</span>
              {form.title && <span className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{form.title}</span>}
            </div>
            <input ref={titleRef} type="text" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Add title" className="w-full text-4xl font-bold text-slate-800 placeholder:text-slate-300 outline-none mb-2" />
            {form.slug && (
              <div className="flex items-center gap-1 text-sm text-slate-500 mb-6">
                <span>Permalink:</span>
                <span className="text-slate-400">example.com/blog/</span>
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
            <EditorJsComponent value={form.content} onChange={(content) => setForm({ ...form, content })} placeholder="Write your blog post content..." />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Publish Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex gap-2">
              <button type="button" onClick={() => handleSubmit("published")} disabled={saving || !form.title.trim() || !form.content.trim()} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? "Saving..." : isEdit ? "Update" : "Publish"}
              </button>
              <button type="button" onClick={() => handleSubmit("draft")} disabled={saving || !form.title.trim() || !form.content.trim()} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
                Draft
              </button>
            </div>
          </div>

          {/* Post Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Post Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-700 mb-1 block">Category</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none">
                  <option value="">Select category</option>
                  {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-700 mb-1 block">Excerpt</label>
                <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short summary..." rows={3} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none resize-none" />
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Featured Image</h3>
            {form.featured_image ? (
              <div className="relative rounded-lg overflow-hidden group">
                <img src={form.featured_image} alt="" className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button type="button" onClick={() => openMediaModal("featured")} className="p-1.5 bg-white rounded hover:bg-slate-100"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => setForm({ ...form, featured_image: "" })} className="p-1.5 bg-white rounded hover:bg-slate-100"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => openMediaModal("featured")} className="w-full py-6 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                <Image className="w-6 h-6 mx-auto mb-1" /><span className="text-xs">Set featured image</span>
              </button>
            )}
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
                  <p className="text-base text-blue-700 truncate" style={{ fontFamily: "arial, sans-serif" }}>{form.seo_title || form.title || "Post Title"}</p>
                  <p className="text-xs text-green-700 truncate" style={{ fontFamily: "arial, sans-serif" }}>example.com/blog/{form.slug || "post-slug"}</p>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5" style={{ fontFamily: "arial, sans-serif" }}>{form.seo_description || form.excerpt || "Post meta description..."}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">SEO Title <span className={`ml-2 ${seoTitleLength > 60 ? "text-red-500" : ""}`}>{seoTitleLength}/60</span></label>
                  <input type="text" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder={form.title || "SEO title..."} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Meta Description <span className={`ml-2 ${seoDescLength > 160 ? "text-red-500" : ""}`}>{seoDescLength}/160</span></label>
                  <textarea value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} placeholder={form.excerpt || "Meta description..."} rows={3} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none resize-none" />
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
                    {form.seo_og_image || form.featured_image ? (
                      <div className="aspect-video bg-slate-200"><img src={form.seo_og_image || form.featured_image} alt="OG" className="w-full h-full object-cover" /></div>
                    ) : (
                      <div className="aspect-video bg-slate-200 flex items-center justify-center"><Image className="w-6 h-6 text-slate-400" /></div>
                    )}
                    <div className="p-3">
                      <p className="text-xs text-slate-500 uppercase">example.com</p>
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{form.seo_og_title || form.seo_title || form.title || "Post Title"}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{form.seo_og_description || form.seo_description || form.excerpt || "Description..."}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">OG Title</label>
                  <input type="text" value={form.seo_og_title} onChange={(e) => setForm({ ...form, seo_og_title: e.target.value })} placeholder={form.seo_title || form.title || "Social title..."} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">OG Description</label>
                  <textarea value={form.seo_og_description} onChange={(e) => setForm({ ...form, seo_og_description: e.target.value })} placeholder={form.seo_description || form.excerpt || "Social description..."} rows={3} className="w-full px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none resize-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">OG Image</label>
                  <div className="flex gap-2">
                    <input type="text" value={form.seo_og_image} onChange={(e) => setForm({ ...form, seo_og_image: e.target.value })} placeholder={form.featured_image || "https://example.com/image.jpg"} className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none" />
                    <button type="button" onClick={() => openMediaModal("og")} className="px-3 py-1.5 border border-slate-200 rounded text-sm hover:bg-slate-50"><Image className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MediaLibraryModal isOpen={showMediaModal} onClose={() => setShowMediaModal(false)} onSelect={handleMediaSelect} title={mediaTarget === "featured" ? "Select Featured Image" : "Select OG Image"} />
    </div>
  );
}
