"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/admin-api";

interface Settings {
  store_name: string;
  store_email: string;
  store_phone: string;
  store_address: string;
  theme: string;
  email_notifications: boolean;
  order_notifications: boolean;
  low_stock_alerts: boolean;
  marketing_emails: boolean;
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<Settings>({
    store_name: "",
    store_email: "",
    store_phone: "",
    store_address: "",
    theme: "light",
    email_notifications: true,
    order_notifications: true,
    low_stock_alerts: true,
    marketing_emails: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await adminApi.get<Settings>("/admin/settings");
      setSettings(data);
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await adminApi.post("/admin/settings", settings);
      setMessage({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppearance = async (theme: string) => {
    setSaving(true);
    setMessage(null);
    try {
      await adminApi.post("/admin/settings", { theme });
      setSettings({ ...settings, theme });
      setMessage({ type: "success", text: "Theme updated successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update theme" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = async (key: keyof Settings, value: boolean) => {
    try {
      await adminApi.post("/admin/settings", { [key]: value });
      setSettings({ ...settings, [key]: value });
    } catch (err) {
      console.error("Error updating notification:", err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordData.new_password.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setChangingPassword(true);
    setPasswordMessage(null);
    try {
      await adminApi.post("/admin/settings/password", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({ current_password: "", new_password: "", new_password_confirmation: "" });
    } catch (err) {
      setPasswordMessage({ type: "error", text: "Current password is incorrect" });
    } finally {
      setChangingPassword(false);
    }
  };

  const tabs = [
    { id: "general", name: "General", icon: "settings" },
    { id: "appearance", name: "Appearance", icon: "palette" },
    { id: "notifications", name: "Notifications", icon: "bell" },
    { id: "security", name: "Security", icon: "lock" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your store settings</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-600 border-l-2 border-indigo-600"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {activeTab === "general" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-800">General Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Store Name</label>
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Store Email</label>
                  <input
                    type="email"
                    value={settings.store_email}
                    onChange={(e) => setSettings({ ...settings, store_email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Store Phone</label>
                  <input
                    type="text"
                    value={settings.store_phone}
                    onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Store Address</label>
                  <textarea
                    rows={3}
                    value={settings.store_address}
                    onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={handleSaveGeneral}
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-800">Appearance</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">Theme</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleSaveAppearance("light")}
                    className={`flex-1 p-4 border-2 rounded-xl transition-all ${
                      settings.theme === "light"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-full h-16 bg-white rounded-lg border border-slate-200 mb-3" />
                    <p className="text-sm font-medium text-slate-800">Light</p>
                    {settings.theme === "light" && (
                      <p className="text-xs text-indigo-600 mt-1">Active</p>
                    )}
                  </button>
                  <button
                    onClick={() => handleSaveAppearance("dark")}
                    className={`flex-1 p-4 border-2 rounded-xl transition-all ${
                      settings.theme === "dark"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-full h-16 bg-slate-800 rounded-lg mb-3" />
                    <p className="text-sm font-medium text-slate-600">Dark</p>
                    {settings.theme === "dark" && (
                      <p className="text-xs text-indigo-600 mt-1">Active</p>
                    )}
                  </button>
                  <button
                    onClick={() => handleSaveAppearance("system")}
                    className={`flex-1 p-4 border-2 rounded-xl transition-all ${
                      settings.theme === "system"
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="w-full h-16 bg-gradient-to-r from-white to-slate-800 rounded-lg mb-3" />
                    <p className="text-sm font-medium text-slate-600">System</p>
                    {settings.theme === "system" && (
                      <p className="text-xs text-indigo-600 mt-1">Active</p>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-800">Notifications</h2>

              {[
                { key: "email_notifications", label: "Email notifications", desc: "Receive email updates" },
                { key: "order_notifications", label: "Order notifications", desc: "Get notified for new orders" },
                { key: "low_stock_alerts", label: "Low stock alerts", desc: "Alert when stock is low" },
                { key: "marketing_emails", label: "Marketing emails", desc: "Receive promotional emails" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-800">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings[item.key as keyof Settings] as boolean}
                      onChange={(e) => handleToggleNotification(item.key as keyof Settings, e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-800">Security</h2>

              {passwordMessage && (
                <div className={`p-4 rounded-lg ${passwordMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {passwordMessage.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <h3 className="font-medium text-slate-800 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        required
                        minLength={8}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.new_password_confirmation}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {changingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
