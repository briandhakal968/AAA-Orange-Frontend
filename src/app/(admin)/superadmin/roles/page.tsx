"use client";

import { useState } from "react";

const roles = [
  { id: 1, name: "Super Admin", users: 2, permissions: ["all"], color: "bg-red-500" },
  { id: 2, name: "Admin", users: 5, permissions: ["products", "orders", "customers"], color: "bg-purple-500" },
  { id: 3, name: "Manager", users: 8, permissions: ["products", "orders"], color: "bg-blue-500" },
  { id: 4, name: "Customer", users: 1219, permissions: ["profile"], color: "bg-green-500" },
];

const permissions = [
  { id: "dashboard", name: "Dashboard", description: "Access dashboard analytics" },
  { id: "products", name: "Products", description: "Manage products" },
  { id: "orders", name: "Orders", description: "Manage orders" },
  { id: "customers", name: "Customers", description: "Manage customers" },
  { id: "settings", name: "Settings", description: "Manage settings" },
  { id: "users", name: "User Management", description: "Manage users and roles" },
];

export default function AdminRoles() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Roles & Permissions</h1>
          <p className="text-sm text-slate-500 mt-1">Manage user roles and access permissions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 ${role.color} rounded-xl flex items-center justify-center`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{role.name}</h3>
                  <p className="text-sm text-slate-500">{role.users} users</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase">Permissions</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((perm) => (
                    <span key={perm} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm text-slate-600 hover:bg-white rounded-lg">Edit</button>
              <button className="flex-1 px-3 py-2 text-sm text-red-600 hover:bg-white rounded-lg">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Available Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {permissions.map((perm) => (
            <div key={perm.id} className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-800">{perm.name}</h4>
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">{perm.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
