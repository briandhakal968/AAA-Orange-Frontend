"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/admin-api";

interface AttributeValue {
  id?: number;
  value: string;
  color?: string | null;
}

interface Attribute {
  id: number;
  name: string;
  values: AttributeValue[];
  type: "dropdown" | "swatches";
  products?: number;
}

export default function AdminAttributes() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAttribute, setDeletingAttribute] = useState<Attribute | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    type: "dropdown" as "dropdown" | "swatches",
    values: [] as { value: string; color: string | null }[],
  });
  const [newValue, setNewValue] = useState("");
  const [newColor, setNewColor] = useState("#000000");

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      const data = await adminApi.get<Attribute[]>("/admin/attributes");
      setAttributes(data);
    } catch (err) {
      console.error("Error fetching attributes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (attr: Attribute) => {
    setEditingId(attr.id);
    setFormData({
      name: attr.name,
      type: attr.type,
      values: attr.values.map(v => ({ value: v.value || "", color: v.color || null })),
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (attr: Attribute) => {
    setDeletingAttribute(attr);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deletingAttribute) {
      setLoadingSubmit(true);
      try {
        await adminApi.delete(`/admin/attributes/${deletingAttribute.id}`);
        setAttributes(attributes.filter((a) => a.id !== deletingAttribute.id));
        setSuccess("Attribute deleted successfully!");
        setTimeout(() => setSuccess(""), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoadingSubmit(false);
        setShowDeleteModal(false);
        setDeletingAttribute(null);
      }
    }
  };

  const addValue = () => {
    if (newValue.trim()) {
      setFormData({
        ...formData,
        values: [...formData.values, { value: newValue.trim(), color: formData.type === "swatches" ? newColor : null }],
      });
      setNewValue("");
    }
  };

  const removeValue = (index: number) => {
    setFormData({
      ...formData,
      values: formData.values.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        values: formData.values,
      };

      if (editingId) {
        await adminApi.put(`/admin/attributes/${editingId}`, payload);
        setSuccess("Attribute updated successfully!");
      } else {
        await adminApi.post("/admin/attributes", payload);
        setSuccess("Attribute created successfully!");
      }

      setFormData({ name: "", type: "dropdown", values: [] });
      setEditingId(null);
      setNewValue("");
      fetchAttributes();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", type: "dropdown", values: [] });
    setEditingId(null);
    setError("");
    setSuccess("");
    setNewValue("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attributes</h1>
          <p className="text-sm text-slate-500 mt-1">Manage product attributes and variations</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add / Edit Form */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h2 className="text-base font-semibold text-slate-800">
              {editingId ? "Edit Attribute" : "Add New Attribute"}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-5">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Attribute Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-sm"
                placeholder="e.g., Size, Color"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as "dropdown" | "swatches" })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-sm"
              >
                <option value="dropdown">Dropdown</option>
                <option value="swatches">Swatches</option>
              </select>
            </div>

            {/* Values Table */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Attribute Values</label>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-slate-600 w-12">#</th>
                      <th className="text-left px-3 py-2 font-medium text-slate-600">Value Name</th>
                      {formData.type === "swatches" && (
                        <th className="text-left px-3 py-2 font-medium text-slate-600 w-16">Color</th>
                      )}
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.values.map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2">{v.value}</td>
                        {formData.type === "swatches" && (
                          <td className="px-3 py-2">
                            {v.color && (
                              <span className="inline-block w-5 h-5 rounded-full border border-slate-300" style={{ backgroundColor: v.color }} />
                            )}
                          </td>
                        )}
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeValue(i)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-0.5 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.values.length === 0 && (
                      <tr>
                        <td colSpan={formData.type === "swatches" ? 4 : 3} className="px-3 py-6 text-center text-slate-400 text-xs">
                          No values added yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValue())}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 outline-none text-sm"
                  placeholder="Enter value name"
                />
                {formData.type === "swatches" && (
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-9 h-9 border border-slate-200 rounded-lg cursor-pointer"
                  />
                )}
                <button
                  type="button"
                  onClick={addValue}
                  className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 text-sm font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              {editingId && (
                <button type="button" onClick={handleCancel} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm">
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loadingSubmit || !formData.name || formData.values.length === 0}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                {loadingSubmit ? "Saving..." : editingId ? "Update" : "Add Attribute"}
              </button>
            </div>
          </form>
        </div>

        {/* Attributes List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">All Attributes</h2>
            <span className="text-sm text-slate-500">{attributes.length} total</span>
          </div>
          {attributes.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p className="text-sm text-slate-500">No attributes yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attributes.map((attr) => (
                <div key={attr.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800 text-sm">{attr.name}</h3>
                          <p className="text-xs text-slate-500">{attr.values.length} values · {attr.type === "swatches" ? "Swatches" : "Dropdown"}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(attr)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(attr)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {attr.values.slice(0, 6).map((val, idx) => (
                        <span key={idx} className={`px-2 py-0.5 rounded text-xs ${attr.type === "swatches" ? "border border-slate-200" : "bg-slate-100 text-slate-700"}`}>
                          {attr.type === "swatches" ? (
                            <span className="flex items-center gap-1">
                              {val.color && <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: val.color }} />}
                              {val.value}
                            </span>
                          ) : (
                            val.value
                          )}
                        </span>
                      ))}
                      {attr.values.length > 6 && (
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500">+{attr.values.length - 6} more</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Delete Attribute</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete &quot;{deletingAttribute?.name}&quot;?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDelete} disabled={loadingSubmit} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {loadingSubmit ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
