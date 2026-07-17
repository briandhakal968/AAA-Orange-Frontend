"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/admin-api";

interface FooterLink {
  label: string;
  url: string;
}

interface FooterSettings {
  shopLinks: FooterLink[];
  helpLinks: FooterLink[];
  aboutLinks: FooterLink[];
  bottomLinks: FooterLink[];
  socialLinks: Record<string, string>;
}

interface LinkGroup {
  key: string;
  label: string;
  links: FooterLink[];
}

export default function FooterSettingsPage() {
  const [settings, setSettings] = useState<FooterSettings>({
    shopLinks: [],
    helpLinks: [],
    aboutLinks: [],
    bottomLinks: [],
    socialLinks: {},
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState("shop");

  const linkGroups: LinkGroup[] = [
    { key: "shop", label: "Shop Links", links: settings.shopLinks },
    { key: "help", label: "Help Links", links: settings.helpLinks },
    { key: "about", label: "About Links", links: settings.aboutLinks },
    { key: "bottom", label: "Bottom Links", links: settings.bottomLinks },
  ];

  const socialPlatforms = [
    { key: "instagram", label: "Instagram" },
    { key: "twitter", label: "X (Twitter)" },
    { key: "facebook", label: "Facebook" },
    { key: "youtube", label: "YouTube" },
    { key: "pinterest", label: "Pinterest" },
    { key: "tiktok", label: "TikTok" },
    { key: "snapchat", label: "Snapchat" },
    { key: "threads", label: "Threads" },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await adminApi.get<Record<string, string>>("/global-settings/footer");
      
      if (data && Object.keys(data).length > 0) {
        const parsed: FooterSettings = {
          shopLinks: [],
          helpLinks: [],
          aboutLinks: [],
          bottomLinks: [],
          socialLinks: {},
        };

        Object.keys(data).forEach((key) => {
          const value = data[key];
          
          if (key.startsWith('shop_') && key.endsWith('_label')) {
            const baseKey = key.replace('_label', '');
            const urlKey = `${baseKey}_url`;
            parsed.shopLinks.push({
              label: value,
              url: data[urlKey] || '#',
            });
          }
          
          if (key.startsWith('help_') && key.endsWith('_label')) {
            const baseKey = key.replace('_label', '');
            const urlKey = `${baseKey}_url`;
            parsed.helpLinks.push({
              label: value,
              url: data[urlKey] || '#',
            });
          }
          
          if (key.startsWith('about_') && key.endsWith('_label')) {
            const baseKey = key.replace('_label', '');
            const urlKey = `${baseKey}_url`;
            parsed.aboutLinks.push({
              label: value,
              url: data[urlKey] || '#',
            });
          }
          
          if (key.startsWith('bottom_') && key.endsWith('_label')) {
            const baseKey = key.replace('_label', '');
            const urlKey = `${baseKey}_url`;
            parsed.bottomLinks.push({
              label: value,
              url: data[urlKey] || '#',
            });
          }
          
          if (key.startsWith('social_')) {
            parsed.socialLinks[key.replace('social_', '')] = value;
          }
        });

        setSettings(parsed);
      }
    } catch (error) {
      console.error("Error fetching footer settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkChange = (group: string, index: number, field: 'label' | 'url', value: string) => {
    setSettings((prev) => {
      const updated = { ...prev };
      const groupKey = `${group}Links` as keyof FooterSettings;
      const links = [...(updated[groupKey] as FooterLink[])];
      links[index] = { ...links[index], [field]: value };
      (updated as any)[groupKey] = links;
      return updated;
    });
  };

  const addLink = (group: string) => {
    setSettings((prev) => {
      const updated = { ...prev };
      const groupKey = `${group}Links` as keyof FooterSettings;
      const links = [...(updated[groupKey] as FooterLink[]), { label: "New Link", url: "#" }];
      (updated as any)[groupKey] = links;
      return updated;
    });
  };

  const removeLink = (group: string, index: number) => {
    setSettings((prev) => {
      const updated = { ...prev };
      const groupKey = `${group}Links` as keyof FooterSettings;
      const links = [...(updated[groupKey] as FooterLink[])];
      links.splice(index, 1);
      (updated as any)[groupKey] = links;
      return updated;
    });
  };

  const handleSocialChange = (platform: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const settingsToSave: Record<string, string> = {};
      
      const saveLinks = (links: FooterLink[], prefix: string) => {
        links.forEach((link, index) => {
          const key = `${prefix}_${link.label.toLowerCase().replace(/\s+/g, '_')}`.replace(/[^a-z0-9_]/g, '');
          settingsToSave[`${key}_label`] = link.label;
          settingsToSave[`${key}_url`] = link.url;
        });
      };
      
      saveLinks(settings.shopLinks, 'shop');
      saveLinks(settings.helpLinks, 'help');
      saveLinks(settings.aboutLinks, 'about');
      saveLinks(settings.bottomLinks, 'bottom');
      
      Object.keys(settings.socialLinks).forEach((platform) => {
        settingsToSave[`social_${platform}`] = settings.socialLinks[platform];
      });

       const response =        await adminApi.put("/admin/global-settings/footer", {
        settings: settingsToSave,
      });
      
      console.log('Save response:', response);
      console.log('Saved settings:', settingsToSave);
      
      // Signal frontend to refetch
      localStorage.setItem('footer-settings-updated', Date.now().toString());
      
      setMessage({ type: "success", text: "Footer settings saved successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error saving footer settings:", error);
      console.error("Error response:", error.response?.data);
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to save footer settings" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-light">Footer Settings</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage footer links and social media URLs</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white border border-neutral-200">
          <div className="flex border-b border-neutral-200">
            {linkGroups.map((group) => (
              <button
                key={group.key}
                onClick={() => setActiveTab(group.key)}
                className={`px-6 py-3 text-sm font-light transition-colors ${
                  activeTab === group.key
                    ? "border-b-2 border-black bg-neutral-50"
                    : "text-neutral-500 hover:text-black"
                }`}
              >
                {group.label}
              </button>
            ))}
            <button
              onClick={() => setActiveTab("social")}
              className={`px-6 py-3 text-sm font-light transition-colors ${
                activeTab === "social"
                  ? "border-b-2 border-black bg-neutral-50"
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              Social Media
            </button>
          </div>

          <div className="p-6">
            {activeTab !== "social" && (
              <div>
                {linkGroups.find((g) => g.key === activeTab)?.links.map((link, index) => (
                  <div key={index} className="flex gap-4 mb-4 items-start">
                    <div className="flex-1">
                      <label className="block text-xs text-neutral-500 mb-1">Label</label>
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => handleLinkChange(activeTab, index, 'label', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-neutral-500 mb-1">URL</label>
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => handleLinkChange(activeTab, index, 'url', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                    <button
                      onClick={() => removeLink(activeTab, index)}
                      className="mt-6 text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addLink(activeTab)}
                  className="mt-4 text-sm text-neutral-600 hover:text-black transition-colors"
                >
                  + Add Link
                </button>
              </div>
            )}

            {activeTab === "social" && (
              <div className="space-y-4">
                {socialPlatforms.map((platform) => (
                  <div key={platform.key}>
                    <label className="block text-xs text-neutral-500 mb-1">{platform.label}</label>
                    <input
                      type="url"
                      value={settings.socialLinks[platform.key] || ""}
                      onChange={(e) => handleSocialChange(platform.key, e.target.value)}
                      placeholder={`https://${platform.key}.com/your-handle`}
                      className="w-full px-3 py-2 border border-neutral-300 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-black text-white text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <a
            href="/"
            target="_blank"
            className="text-sm text-neutral-500 hover:text-black transition-colors"
          >
            View Frontend →
          </a>
        </div>
      </div>
    </div>
  );
}
