"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/admin-api";

interface MenuItem {
  id: number;
  name: string;
  label: string;
  url: string;
  location: string;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
  children?: MenuItem[];
}

export default function MenusPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState("header");
  const [locations, setLocations] = useState<string[]>(["header", "category"]);
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    url: "",
    location: "header",
    parent_id: "" as string,
  });
  const [usePageSelector, setUsePageSelector] = useState(false);
  const [selectedPage, setSelectedPage] = useState("");

  const availablePages = [
    { label: "Home", value: "/", path: "/" },
    { label: "Shop", value: "/shop", path: "/shop" },
    { label: "Today's Deals", value: "/todays-deals", path: "/todays-deals" },
    { label: "Hot Deals", value: "/hot-deals", path: "/hot-deals" },
    { label: "Top Selling", value: "/top-selling", path: "/top-selling" },
    { label: "New Collection", value: "/new-collection", path: "/new-collection" },
    { label: "Wishlist", value: "/wishlist", path: "/wishlist" },
    { label: "Cart", value: "/cart", path: "/cart" },
    { label: "Checkout", value: "/checkout", path: "/checkout" },
    { label: "My Account", value: "/my-account", path: "/my-account" },
    { label: "Login", value: "/login", path: "/login" },
    { label: "Register", value: "/register", path: "/register" },
  ];

  const handlePageSelect = (pagePath: string) => {
    const page = availablePages.find(p => p.path === pagePath);
    if (page) {
      setSelectedPage(pagePath);
      setFormData({ ...formData, label: page.label, url: page.path });
    }
  };
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingMenu, setDeletingMenu] = useState<MenuItem | null>(null);

  const fetchMenus = async () => {
    try {
      const data = await adminApi.get<MenuItem[]>(`/admin/menus?location=${activeLocation}`);
      setMenus(data);
    } catch (err) {
      console.error("Error fetching menus:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const data = await adminApi.get<string[]>("/admin/menus/locations");
      setLocations(data);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [activeLocation]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: formData.label,
        label: formData.label,
        url: formData.url,
        location: formData.location,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      };

      if (editingMenu) {
        await adminApi.put(`/admin/menus/${editingMenu.id}`, payload);
        setSuccess("Menu updated successfully!");
      } else {
        await adminApi.post("/admin/menus", payload);
        setSuccess("Menu created successfully!");
      }

      fetchMenus();
      setShowModal(false);
      setFormData({ label: "", url: "", location: activeLocation, parent_id: "" });
      setEditingMenu(null);
      setUsePageSelector(false);
      setSelectedPage("");
      fetchMenus();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleEdit = (menu: MenuItem) => {
    setEditingMenu(menu);
    setFormData({
      label: menu.label,
      url: menu.url,
      location: menu.location,
      parent_id: menu.parent_id?.toString() || "",
    });
    setShowModal(true);
  };

  const handleDelete = (menu: MenuItem) => {
    setDeletingMenu(menu);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMenu) return;
    setLoadingSubmit(true);

    try {
      await adminApi.delete(`/admin/menus/${deletingMenu.id}`);
      fetchMenus();
      setShowDeleteModal(false);
      setDeletingMenu(null);
      setSuccess("Menu deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleToggleActive = async (menu: MenuItem) => {
    try {
      await adminApi.put(`/admin/menus/${menu.id}`, {
        is_active: !menu.is_active,
      });
      fetchMenus();
    } catch (err) {
      console.error("Error toggling menu:", err);
    }
  };

  const openAddModal = () => {
    setEditingMenu(null);
    setFormData({ label: "", url: "", location: activeLocation, parent_id: "" });
    setUsePageSelector(false);
    setSelectedPage("");
    setShowModal(true);
  };

  const topLevelMenus = menus.filter(m => !m.parent_id);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Menu Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage website navigation menu</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Menu Item
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {locations.map((loc) => (
          <button
            key={loc}
            onClick={() => setActiveLocation(loc)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeLocation === loc
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {loc === "header" ? "Header Menu" : loc === "category" ? "Category Menu" : loc}
          </button>
        ))}
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg">{success}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : topLevelMenus.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No menu items found. Create one to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {topLevelMenus.map((menu) => (
              <div key={menu.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-800">{menu.label}</h3>
                      <p className="text-xs text-slate-400">{menu.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(menu)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        menu.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {menu.is_active ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => handleEdit(menu)}
                      className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(menu)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {menu.children && menu.children.length > 0 && (
                  <div className="mt-3 space-y-2" style={{ paddingLeft: "60px" }}>
                    {menu.children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-slate-700">{child.label}</h4>
                            <p className="text-xs text-slate-400">{child.url}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(child)}
                            className={`px-2 py-1 text-xs rounded-full ${
                              child.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {child.is_active ? "Active" : "Inactive"}
                          </button>
                          <button
                            onClick={() => handleEdit(child)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg"
                          >
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(child)}
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
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              {editingMenu ? "Edit Menu" : "Add Menu Item"}
            </h2>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  placeholder="Menu Item"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => { setUsePageSelector(true); }}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${usePageSelector ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Select Page
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUsePageSelector(false); }}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${!usePageSelector ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Custom URL
                  </button>
                </div>
                {usePageSelector ? (
                  <select
                    value={selectedPage}
                    onChange={(e) => handlePageSelect(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  >
                    <option value="">Select a page...</option>
                    {availablePages.map((page) => (
                      <option key={page.path} value={page.path}>{page.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="/menu-item"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent Menu</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                >
                  <option value="">None (Top Level)</option>
                  {menus.filter(m => !m.parent_id).map((menu) => (
                    <option key={menu.id} value={menu.id}>{menu.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loadingSubmit ? "Saving..." : editingMenu ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && deletingMenu && (
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
                <h2 className="text-xl font-semibold text-slate-800">Delete Menu</h2>
                <p className="text-sm text-slate-500">
                  Are you sure you want to delete <strong>{deletingMenu.label}</strong>?
                </p>
              </div>
            </div>

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
    </div>
  );
}