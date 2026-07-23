"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/my-account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-gradient-to-br from-[#001E4D] via-[#002D6A] to-[#003d8a] flex items-center justify-center py-16 sm:py-24 px-4 sm:px-8 relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Card */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
        {/* Left side - Welcome panel */}
        <div className="relative bg-gradient-to-br from-[#002D6A] to-[#003d8a] p-10 sm:p-14 text-white flex flex-col justify-between overflow-hidden">
          {/* Large circle shape */}
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-white/10 rounded-full" />
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/5 rounded-full" />

          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-base font-bold">A</span>
              </div>
              <span className="text-lg font-semibold tracking-tight">AAA Orange</span>
            </Link>
          </div>

          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              WELCOME
            </h1>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-wide uppercase">
              Back to AAA Orange
            </h2>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xs">
              Sign in to continue shopping, track your orders, and unlock exclusive member rewards curated just for you.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-6 text-xs text-white/60">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Secure
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Trusted
            </div>
          </div>
        </div>

        {/* Right side - Form panel */}
        <div className="relative p-8 sm:p-12 flex flex-col justify-center">
          {/* Decorative corner circle */}
          <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-[#002D6A]/10 rounded-full" />

          <div className="relative z-10 max-w-sm mx-auto w-full">
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
                Login
              </h2>
              <p className="text-sm text-neutral-500 mt-2">
                Enter your credentials to access your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full h-12 pl-11 pr-4 border border-neutral-200 rounded-lg focus:border-[#002D6A] focus:ring-2 focus:ring-[#002D6A]/10 focus:outline-none text-sm transition-all bg-neutral-50/50 focus:bg-white"
                />
              </div>

              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full h-12 pl-11 pr-16 border border-neutral-200 rounded-lg focus:border-[#002D6A] focus:ring-2 focus:ring-[#002D6A]/10 focus:outline-none text-sm transition-all bg-neutral-50/50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-[#002D6A] hover:text-[#001E4D] uppercase tracking-wide"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-[#002D6A] focus:ring-[#002D6A] focus:ring-offset-0"
                  />
                  <span className="text-neutral-600">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[#002D6A] hover:text-[#001E4D] font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#001E4D] hover:bg-[#002D6A] text-white font-semibold rounded-lg transition-all shadow-lg shadow-[#002D6A]/30 disabled:opacity-60 mt-2"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-neutral-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-[#002D6A] font-semibold hover:underline"
                >
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
