import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';

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

const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  shopLinks: [
    { label: 'New Arrivals', url: '/new' },
    { label: 'Women', url: '/women' },
    { label: 'Men', url: '/men' },
    { label: 'Kids', url: '/kids' },
    { label: 'Accessories', url: '/accessories' },
    { label: 'Top Selling', url: '/top-selling' },
    { label: 'Sale', url: '/sale' },
  ],
  helpLinks: [
    { label: 'Contact Us', url: '/contact' },
    { label: 'Shipping & Returns', url: '/shipping' },
    { label: 'FAQ', url: '/faq' },
    { label: 'Size Guide', url: '/size-guide' },
    { label: 'Track Order', url: '/track-order' },
    { label: 'Gift Cards', url: '/gift-cards' },
  ],
  aboutLinks: [
    { label: 'About Us', url: '/about' },
    { label: 'Store Locator', url: '/stores' },
    { label: 'Careers', url: '/careers' },
    { label: 'Sustainability', url: '/sustainability' },
    { label: 'Press', url: '/press' },
    { label: 'Corporate', url: '/corporate' },
  ],
  bottomLinks: [
    { label: 'Privacy Policy', url: '/privacy' },
    { label: 'Terms and Conditions', url: '/terms' },
    { label: 'Cookie Policy', url: '/cookies' },
  ],
  socialLinks: {
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
    pinterest: 'https://pinterest.com',
    tiktok: 'https://tiktok.com',
    snapchat: 'https://snapchat.com',
    threads: 'https://threads.net',
  },
};

export function useFooterSettings() {
  const [settings, setSettings] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchFooterSettings = async () => {
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

  useEffect(() => {
    fetchFooterSettings();
    
    // Refetch on window focus (when user comes back from admin page)
    const handleFocus = () => {
      console.log('Window focused, refetching footer settings...');
      fetchFooterSettings();
    };
    window.addEventListener('focus', handleFocus);

    // Listen for storage events (when admin saves in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'footer-settings-updated') {
        console.log('Footer settings updated in another tab, refetching...');
        fetchFooterSettings();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { settings, loading, refetch: fetchFooterSettings };
}
