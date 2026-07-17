"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/admin-api";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/api` 
  : 'http://localhost:8000/api';

const API_URL = getApiUrl();

interface Country {
  id: number;
  name: string;
  currency: string;
  currency_symbol: string;
  flag: string;
}

interface CountryAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  country_id: number;
  country?: Country;
  created_at: string;
}

type CountryAdminWithCountry = CountryAdmin & { country?: Country };

export default function CountryAdminsPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [admins, setAdmins] = useState<CountryAdmin[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingAdmin, setEditingAdmin] = useState<CountryAdmin | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<CountryAdmin | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    country_id: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCountries();
    fetchAdmins();
  }, []);

  const fetchCountries = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${API_URL}/countries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await response.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      setCountries(data);
    } catch (err) {
      console.error("Error fetching countries:", err);
    }
  };

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const countriesRes = await fetch(`${API_URL}/countries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const countriesJson = await countriesRes.json();
      const countriesData = Array.isArray(countriesJson) ? countriesJson : (countriesJson.data || []);

      const adminsResponse = await adminApi.get<CountryAdmin[]>("/admin/country-admins");
      const adminsWithCountries: CountryAdminWithCountry[] = adminsResponse.map((admin) => ({
        ...admin,
        country: countriesData.find((c: Country) => c.id === admin.country_id),
      }));
      setAdmins(adminsWithCountries);
    } catch (err) {
      console.error("Error fetching admins:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("admin_token");
      const url = editingAdmin
        ? `${API_URL}/admin/country-admin/${editingAdmin.id}`
        : `${API_URL}/admin/country-admin`;

      const method = editingAdmin ? "PUT" : "POST";
      const body = editingAdmin
        ? { name: formData.name, email: formData.email, country_id: formData.country_id, ...(formData.password && { password: formData.password }) }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        const fallbackMsg = editingAdmin ? "Failed to update country admin" : "Failed to create country admin";
        throw new Error(data.error || data.message || fallbackMsg);
      }

      setSuccess(editingAdmin ? "Country admin updated successfully!" : "Country admin created successfully!");
      setFormData({ name: "", email: "", password: "", country_id: "" });
      setShowModal(false);
      setEditingAdmin(null);
      setShowPassword(false);
      setFormData({ name: "", email: "", password: "", country_id: "" });
      fetchAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : editingAdmin ? "Failed to update country admin" : "Failed to create country admin");
    }
  };

  const handleEdit = (admin: CountryAdmin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "",
      country_id: admin.country_id.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingAdmin) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${API_URL}/admin/country-admin/${deletingAdmin.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete country admin");
      }

      setSuccess("Country admin deleted successfully!");
      setDeletingAdmin(null);
      fetchAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete country admin");
      setDeletingAdmin(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Country Admins</h1>
          <p className="text-sm text-slate-500 mt-1">Manage country-specific administrators</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Country Admin
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No country admins found
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">{admin.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">
                        {admin.country ? (
                          <span>
                            {admin.country.flag} {admin.country.name}
                          </span>
                        ) : (
                          "Not assigned"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(admin)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingAdmin(admin)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">
              {editingAdmin ? "Edit Country Admin" : "Add Country Admin"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg">{success}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {editingAdmin && "(leave blank to keep current)"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 pr-10 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7a10.057 10.057 0 01-4.132 5.411m.828 2.867a1 1 0 01-1.413-1.414 1 1 0 00-1.418-1.414 1 1 0 00-1.413 1.414m2.829-2.829a1 1 0 011.413 1.414 1 1 0 001.418 1.414 1 1 0 001.413-1.414" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                <select
                  value={formData.country_id}
                  onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  required
                >
                  <option value="">Select a country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingAdmin ? "Update Admin" : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingAdmin(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Delete Country Admin</h2>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete <span className="font-medium">{deletingAdmin.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingAdmin(null)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
