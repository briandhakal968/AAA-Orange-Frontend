"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/admin-api";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  posts_count: number;
}

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  console.log("[BlogCategories] Loading:", loading);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const fetchCategories = async () => {
    console.log("[BlogCategories] Fetching...");
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(`${API_URL}/api/admin/blog-categories`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      console.log("[BlogCategories] Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log("[BlogCategories] Data:", data);
      const sorted = [...data].sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
      setCategories(sorted);
    } catch (err) {
      console.error("[BlogCategories] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    console.log("[BlogCategories] Token:", token ? "exists" : "missing");
    fetchCategories();
  }, []);

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = (category: Category) => {
    setDeletingCategory(category);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setLoadingSubmit(true);
    setDeleteError("");

    try {
      await adminApi.delete(`/admin/blog-categories/${deletingCategory.id}`);
      fetchCategories();
      setShowDeleteModal(false);
      setDeletingCategory(null);
      setSuccess("Category deleted!");
    } catch (err: any) {
      setDeleteError(err.message || "Error");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await adminApi.put(`/admin/blog-categories/${editingId}`, formData);
        setSuccess("Updated!");
      } else {
        await adminApi.post("/admin/blog-categories", formData);
        setSuccess("Created!");
      }
      setFormData({ name: "", slug: "", description: "" });
      setEditingId(null);
      fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/blog', secret: 'ecom-revalidate-2026' }),
      }).catch(() => {});
      fetchCategories();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", slug: "", description: "" });
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleDragStart = (e: React.DragEvent, category: Category) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: category.id }));
    setDraggingId(category.id);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = async (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault();
    const dragData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
    const draggedId = dragData.id;
    if (!draggedId || draggedId === targetCategory.id) { setDraggingId(null); return; }

    const newCategories = [...categories];
    const draggedIdx = newCategories.findIndex(c => c.id === draggedId);
    const targetIdx = newCategories.findIndex(c => c.id === targetCategory.id);
    if (draggedIdx === -1 || targetIdx === -1) { setDraggingId(null); return; }

    const [draggedItem] = newCategories.splice(draggedIdx, 1);
    newCategories.splice(targetIdx, 0, draggedItem);
    const reordered = newCategories.map((cat, idx) => ({ ...cat, position: idx + 1 }));
    setCategories(reordered);

    setReordering(true);
    try {
      await adminApi.post("/admin/blog-categories/reorder", { items: reordered.map(c => ({ id: c.id })) });
      fetchCategories();
    } catch (err) { console.error(err); fetchCategories(); }
    finally { setReordering(false); setDraggingId(null); }
  };

  const topLevelCategories = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-bold text-slate-800">Blog Categories</h1><p className="text-sm text-slate-500">Manage your blog post categories</p></div>
        {reordering && <div className="flex items-center gap-2 text-sm text-indigo-600"><div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>Saving...</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">{editingId ? "Edit Category" : "Add Category"}</h2>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500" required /></div>
              <div className="text-sm text-slate-500">{formData.name ? <p>Preview: <span className="text-indigo-600">/blog/category/{generateSlug(formData.name)}</span></p> : <p className="text-slate-400">Slug auto-generated</p>}</div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg resize-none" /></div>
              <div className="flex gap-3 pt-2">
                {editingId && <button type="button" onClick={handleCancel} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Cancel</button>}
                <button type="submit" disabled={loadingSubmit} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{loadingSubmit ? "..." : editingId ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-800">Categories List</h2><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64" /></div>
            {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div> : categories.length === 0 ? <div className="text-center py-12 text-slate-500">No categories found.</div> : (
              <div className="divide-y divide-slate-100">
                {topLevelCategories.map((category) => (
                  <div key={category.id} className={`p-4 hover:bg-slate-50 ${draggingId === category.id ? 'opacity-50 bg-indigo-50' : ''}`} draggable onDragStart={(e) => handleDragStart(e, category)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, category)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="cursor-move p-1"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg></div>
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg></div>
                        <div><h3 className="font-medium text-slate-800">{category.name}</h3><p className="text-xs text-slate-400">/blog/category/{category.slug}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{category.posts_count || 0} posts</span>
                        <a href={`/blog/category/${category.slug}`} target="_blank" className="p-2 hover:bg-slate-100 rounded-lg" title="View"><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></a>
                        <button onClick={() => handleEdit(category)} className="p-2 hover:bg-slate-100 rounded-lg"><svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                        <button onClick={() => handleDelete(category)} className="p-2 hover:bg-red-50 rounded-lg"><svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} /><div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
          <div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div><div><h2 className="text-xl font-semibold text-slate-800">Delete</h2><p className="text-sm text-slate-500">Delete <strong>{deletingCategory.name}</strong>?</p></div></div>
          {deleteError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{deleteError}</div>}
          <div className="flex gap-3"><button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg">Cancel</button><button onClick={handleDeleteConfirm} disabled={loadingSubmit} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{loadingSubmit ? "..." : "Delete"}</button></div>
        </div></div>
      )}
    </div>
  );
}