"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";

interface PermissionGroup {
  [key: string]: string;
}

interface PermissionCategories {
  [group: string]: PermissionGroup;
}

interface StaffPermission {
  id: number;
  permission: string;
}

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: StaffPermission[];
}

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [permissions, setPermissions] = useState<PermissionCategories>({});
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [staffData, permissionsData] = await Promise.all([
        adminApi.get<StaffMember>(`/admin/staff/${id}`),
        adminApi.get<PermissionCategories>("/admin/staff/permissions"),
      ]);

      setForm({
        name: staffData.name,
        email: staffData.email,
        password: "",
        confirmPassword: "",
      });
      setSelectedPermissions(staffData.permissions.map((p) => p.permission));
      setPermissions(permissionsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const toggleGroup = (group: string) => {
    const groupPermissions = Object.keys(permissions[group]);
    const allSelected = groupPermissions.every((p) => selectedPermissions.includes(p));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !groupPermissions.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...groupPermissions])]);
    }
  };

  const toggleAll = () => {
    const allPermissions = Object.values(permissions).flatMap((group) => Object.keys(group));
    const allSelected = allPermissions.every((p) => selectedPermissions.includes(p));

    if (allSelected) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(allPermissions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password && form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (selectedPermissions.length === 0) {
      setError("Please select at least one permission");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        permissions: selectedPermissions,
      };

      if (form.password) {
        payload.password = form.password;
      }

      await adminApi.put(`/admin/staff/${id}`, payload);
      router.push("/superadmin/staff");
    } catch (err: any) {
      setError(err.message || "Failed to update staff member");
    } finally {
      setSaving(false);
    }
  };

  const allPermissions = Object.values(permissions).flatMap((group) => Object.keys(group));
  const allSelected = allPermissions.length > 0 && allPermissions.every((p) => selectedPermissions.includes(p));
  const someSelected = allPermissions.some((p) => selectedPermissions.includes(p));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/superadmin/staff"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Staff Member</h1>
          <p className="text-sm text-slate-500 mt-1">Update account details and permissions</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Account Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                placeholder="Leave blank to keep current"
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                placeholder="Confirm new password"
                minLength={8}
              />
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Permissions</h2>
              <p className="text-sm text-slate-500 mt-1">
                Select what this staff member can access ({selectedPermissions.length} of {allPermissions.length} selected)
              </p>
            </div>
            <button
              type="button"
              onClick={toggleAll}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                allSelected
                  ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="space-y-4">
            {Object.entries(permissions).map(([group, groupPermissions]) => {
              const groupPermKeys = Object.keys(groupPermissions);
              const groupAllSelected = groupPermKeys.every((p) => selectedPermissions.includes(p));
              const groupSomeSelected = groupPermKeys.some((p) => selectedPermissions.includes(p));

              return (
                <div key={group} className="border border-slate-100 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        groupAllSelected
                          ? "bg-indigo-600 border-indigo-600"
                          : groupSomeSelected
                          ? "bg-indigo-200 border-indigo-400"
                          : "border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {groupAllSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {groupSomeSelected && !groupAllSelected && (
                        <div className="w-2 h-2 bg-indigo-600 rounded-sm" />
                      )}
                    </button>
                    <h3 className="font-medium text-slate-800 capitalize">{group.replace(/-/g, " ")}</h3>
                    <span className="text-xs text-slate-400">
                      {groupPermKeys.filter((p) => selectedPermissions.includes(p)).length}/{groupPermKeys.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-8">
                    {Object.entries(groupPermissions).map(([permission, label]) => (
                      <label
                        key={permission}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-600 group-hover:text-slate-800">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/superadmin/staff"
            className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.216A8 8 0 0120 12h4c0 6.627-5.373 12-12 12v-4z" />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
