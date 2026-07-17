"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AlertProvider } from "@/components/ui/alert-modal";

const navItems = [
  { href: "/countryadmin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/countryadmin/products", label: "Products", icon: "products" },
  { href: "/countryadmin/orders", label: "Orders", icon: "orders" },
  { href: "/countryadmin/reviews", label: "Reviews", icon: "reviews" },
];

const iconMap: Record<string, React.ReactElement> = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  products: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  orders: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  reviews: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
};

export default function CountryAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<{ name: string; country?: { name: string; flag: string } } | null>(null);

  const isLoginPage = pathname === "/countryadmin";

  useEffect(() => {
    setIsClient(true);
    const userData = localStorage.getItem("country_admin_user");
    const token = localStorage.getItem("country_admin_token");
    if (userData && token) {
      try {
        setUser(JSON.parse(userData));
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/country-admins`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => {
          if (res.status === 401 || res.status === 404) {
            localStorage.removeItem("country_admin_token");
            localStorage.removeItem("country_admin_user");
            router.push("/countryadmin");
          }
        });
      } catch {
        if (!isLoginPage) router.push("/countryadmin");
      }
    } else if (!isLoginPage) {
      router.push("/countryadmin");
    }
  }, [router, isLoginPage]);

  const handleLogout = () => {
    localStorage.removeItem("country_admin_token");
    localStorage.removeItem("country_admin_user");
    router.push("/countryadmin");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AlertProvider>
      <div className="min-h-screen bg-slate-100">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 h-full bg-slate-800 transition-all duration-300 z-40 ${sidebarOpen ? "w-64" : "w-20"} ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-slate-700">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            {sidebarOpen && <span className="ml-3 text-white font-semibold text-lg">AAA Orange</span>}
          </div>

          {/* Country badge */}
          {sidebarOpen && user.country && (
            <div className="px-4 py-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600/30 text-indigo-300 rounded-full text-sm">
                {user.country.flag} {user.country.name}
              </span>
            </div>
          )}

          {/* Navigation */}
          <nav className="mt-6 px-3">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/countryadmin/dashboard" && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:bg-slate-700 hover:text-white"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {iconMap[item.icon]}
                      {sidebarOpen && <span className="font-medium">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex absolute bottom-4 right-0 translate-x-1/2 w-8 h-8 bg-slate-800 text-white rounded-full items-center justify-center border border-slate-600 hover:bg-slate-700"
          >
            <svg className={`w-4 h-4 transition-transform ${sidebarOpen ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </aside>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main content */}
        <div className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}`}>
          {/* Top header */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-800 capitalize">
                {pathname.split("/").pop() || "Dashboard"}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {/* User */}
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-slate-700">{user?.name}</p>
                  <p className="text-xs text-slate-500">Country Admin</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0) || "A"}
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </AlertProvider>
  );
}