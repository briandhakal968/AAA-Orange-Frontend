"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/admin-api";
import { MediaPicker } from "@/components/admin/media-picker";

interface Category {
  id: number;
  name: string;
  slug?: string;
  parent_id: number | null;
  products_count?: number;
  created_at?: string;
  subcategories?: Category[];
  position?: number;
  image?: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [draggingParentId, setDraggingParentId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    parent_id: "" as string,
    image: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await adminApi.get<Category[]>("/admin/categories");
      const sortedData = [...data].sort((a, b) => (a.position || 0) - (b.position || 0));
      const categoriesWithSubs = sortedData.map(cat => {
        const subcats = sortedData.filter(sub => sub.parent_id === cat.id);
        return {
          ...cat,
          subcategories: subcats.sort((a, b) => (a.position || 0) - (b.position || 0)),
        };
      });
      setCategories(categoriesWithSubs);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      parent_id: category.parent_id?.toString() || "",
      image: category.image || "",
    });
    setError("");
    setSuccess("");
  };

  const handleDelete = (category: Category) => {
    if ((category as any).slug === 'uncategorized') {
      setDeleteError("Cannot delete Uncategorized category");
      return;
    }
    setDeletingCategory(category);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setLoadingSubmit(true);
    setDeleteError("");

    try {
      await adminApi.delete(`/admin/categories/${deletingCategory.id}`);
      fetchCategories();
      setShowDeleteModal(false);
      setDeletingCategory(null);
      setSuccess("Category deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error deleting category:", err);
      const errorMsg = err.message || "An error occurred";
      setDeleteError(errorMsg);
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
      const payload = {
        name: formData.name,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
        image: formData.image,
      };

      console.log("[Category] Saving payload:", JSON.stringify(payload));

      if (editingId) {
        const response = await adminApi.put<any>(`/admin/categories/${editingId}`, payload);
        console.log("[Category] Update response:", JSON.stringify(response));
        setSuccess("Category updated successfully!");
      } else {
        const response = await adminApi.post<any>("/admin/categories", payload);
        console.log("[Category] Create response:", JSON.stringify(response));
        setSuccess("Category created successfully!");
      }
      
      fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/', secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET || 'ecom-revalidate-2026' }),
      }).catch(() => {});
      
      setFormData({ name: "", parent_id: "", image: "" });
      setEditingId(null);
      fetchCategories();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", parent_id: "", image: "" });
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleDragStart = (e: React.DragEvent, category: Category, parentId: number | null = null) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: category.id, parentId: parentId }));
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
    setDraggingId(category.id);
    setDraggingParentId(parentId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetCategory: Category, targetParentId: number | null = null) => {
    e.preventDefault();
    e.stopPropagation();

    const dragData = JSON.parse(e.dataTransfer.getData('text/plain') || '{}');
    const draggedId = dragData.id;
    const draggedParentId = dragData.parentId;

    if (!draggedId || draggedId === targetCategory.id) {
      setDraggingId(null);
      setDraggingParentId(null);
      return;
    }

    if (draggedParentId !== targetParentId) {
      setDraggingId(null);
      setDraggingParentId(null);
      return;
    }

    let reorderedItems: Category[] = [];

    if (draggedParentId === null) {
      const newCats = [...categories];
      const draggedIdx = newCats.findIndex(c => c.id === draggedId);
      const targetIdx = newCats.findIndex(c => c.id === targetCategory.id);

      if (draggedIdx === -1 || targetIdx === -1) {
        setDraggingId(null);
        setDraggingParentId(null);
        return;
      }

      const [draggedItem] = newCats.splice(draggedIdx, 1);
      newCats.splice(targetIdx, 0, draggedItem);

      reorderedItems = newCats.map((cat, idx) => ({ ...cat, position: idx + 1 } as Category));
      setCategories(reorderedItems);
    } else {
      const newCats = categories.map(cat => {
        if (cat.id === draggedParentId) {
          const subs = [...(cat.subcategories || [])];
          const draggedIdx = subs.findIndex(s => s.id === draggedId);
          const targetIdx = subs.findIndex(s => s.id === targetCategory.id);

          if (draggedIdx !== -1 && targetIdx !== -1) {
            const [draggedItem] = subs.splice(draggedIdx, 1);
            subs.splice(targetIdx, 0, draggedItem);
            reorderedItems = subs.map((s, idx) => ({ ...s, position: idx + 1 } as Category));
            return { ...cat, subcategories: reorderedItems };
          }
        }
        return cat;
      });
      setCategories(newCats);
    }

    if (reorderedItems.length === 0) {
      setDraggingId(null);
      setDraggingParentId(null);
      return;
    }

    setReordering(true);
    try {
      await adminApi.post("/admin/categories/reorder", {
        items: reorderedItems.map(c => ({ id: c.id })),
      });
      fetchCategories();
    } catch (err) {
      console.error("Error reordering:", err);
      fetchCategories();
    } finally {
      setReordering(false);
      setDraggingId(null);
      setDraggingParentId(null);
    }
  };

  const topLevelCategories = categories.filter(c => !c.parent_id && 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => (a.position || 0) - (b.position || 0));

  const parentCategoriesForSelect = categories.filter(c => !c.parent_id && c.id !== editingId);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Categories</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your product categories and subcategories ({categories.length} categories)</p>
        </div>
        {reordering && (
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            Saving order...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              {editingId ? "Edit Category" : "Add Category"}
            </h2>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  required
                />
              </div>

              <div className="text-sm text-slate-500">
                {formData.name ? (
                  <p>
                    Preview: <span className="text-indigo-600 font-medium">/{generateSlug(formData.name)}</span>
                  </p>
                ) : <p className="text-slate-400">Slug will be auto-generated</p>}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                >
                  <option value="" disabled>Select Parent Category</option>
                  {parentCategoriesForSelect.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Image</label>
                {formData.image ? (
                  <div className="relative mb-2">
                    <img src={formData.image} alt="Category" className="w-full h-32 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: "" })}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setShowMediaPicker(true)}
                    className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                  >
                    <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-slate-500">Click to upload image</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loadingSubmit ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-800">Categories List</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none w-64"
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
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No categories found. Create one to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {topLevelCategories.map((category) => {
                  const subcats = category.subcategories || [];
                  return (
                    <div 
                      key={category.id} 
                      className={`p-4 hover:bg-slate-50 transition-colors ${draggingId === category.id && draggingParentId === null ? 'opacity-50 bg-indigo-50' : ''}`}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        handleDragStart(e, category, null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDrop(e, category, null);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="cursor-move p-1 hover:bg-slate-200 rounded">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {category.image ? (
                              <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-800">{category.name}</h3>
                            <p className="text-xs text-slate-400">/{category.slug || 'category'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {category.products_count || 0} products
                          </span>
                          <a
                            href={`/category/${category.slug || category.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-slate-100 rounded-lg"
                            title="View Category"
                          >
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                          >
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="p-2 hover:bg-red-50 rounded-lg"
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {subcats.length > 0 && (
                        <div className="mt-3 space-y-2 pl-5 border-l-2 border-indigo-100">
                          {subcats.map((subcat) => (
                            <div 
                              key={subcat.id} 
                              className={`flex items-center justify-between p-2 rounded ${draggingId === subcat.id && draggingParentId === category.id ? 'opacity-50 bg-indigo-50' : ''}`}
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                handleDragStart(e, subcat, category.id);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDrop(e, subcat, category.id);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="cursor-move p-1 hover:bg-slate-200 rounded">
                                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                  </svg>
                                </div>
                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                                  {subcat.image ? (
                                    <img src={subcat.image} alt={subcat.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-slate-700">{subcat.name}</h4>
                                  <p className="text-xs text-slate-400">/{subcat.slug}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                  {subcat.products_count || 0}
                                </span>
                                <button
                                  onClick={() => handleEdit(subcat)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg"
                                >
                                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(subcat)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg"
                                >
                                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Delete Category</h2>
                <p className="text-sm text-slate-500">
                  Are you sure you want to delete <strong>{deletingCategory.name}</strong>?
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loadingSubmit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loadingSubmit ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => {
          setFormData({ ...formData, image: url });
          setShowMediaPicker(false);
        }}
      />
    </div>
  );
}