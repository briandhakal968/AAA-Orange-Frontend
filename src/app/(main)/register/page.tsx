"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === 'password') {
      calculatePasswordStrength(e.target.value);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    setPasswordStrength(Math.min(strength, 100));
  };

  const getStrengthColor = () => {
    if (passwordStrength < 30) return 'bg-red-500';
    if (passwordStrength < 60) return 'bg-yellow-500';
    if (passwordStrength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength < 30) return 'Weak';
    if (passwordStrength < 60) return 'Fair';
    if (passwordStrength < 80) return 'Good';
    if (passwordStrength > 0) return 'Strong';
    return '';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Registration failed");
      }

      setSuccess("Account created! Please verify your email.");
      setStep('verify');

      await sendVerificationCode();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    setCodeLoading(true);
    try {
      const response = await fetch(`/api/auth/send-verification-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to send code");
      }

      setCodeSent(true);
      setError("");

      if (data.code) {
        setSuccess(`Verification code: ${data.code} (Check console in production)`);
        console.log('🔐 Verification Code:', data.code);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setCodeLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerifyLoading(true);

    try {
      const response = await fetch(`/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Verification failed");
      }

      if (data.token && data.user) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('storage'));
      }

      setSuccess("Email verified! Redirecting...");
      setTimeout(() => {
        router.push("/my-account");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-gradient-to-br from-[#001E4D] via-[#002D6A] to-[#003d8a] flex items-center justify-center py-16 sm:py-24 px-4 sm:px-8 relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Card */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[640px]">
        {/* Left side - Welcome panel */}
        <div className="relative bg-gradient-to-br from-[#002D6A] to-[#003d8a] p-10 sm:p-14 text-white flex flex-col justify-between overflow-hidden">
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
              JOIN US
            </h1>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-wide uppercase">
              Create your account
            </h2>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xs">
              Sign up today to unlock exclusive deals, faster checkout, and a personalized shopping experience.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-6 text-xs text-white/60">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Free shipping
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secure
            </div>
          </div>
        </div>

        {/* Right side - Form panel */}
        <div className="relative p-8 sm:p-12 flex flex-col justify-center">
          <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-[#002D6A]/10 rounded-full" />

          <div className="relative z-10 max-w-sm mx-auto w-full">
            <div className="mb-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
                {step === 'register' ? 'Register' : 'Verify Email'}
              </h2>
              <p className="text-sm text-neutral-500 mt-2">
                {step === 'register'
                  ? 'Create your account in just a few steps.'
                  : `Enter the code we sent to ${formData.email}`}
              </p>
            </div>

            {step === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-3">
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
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    required
                    className="w-full h-11 pl-11 pr-4 border border-neutral-200 rounded-lg focus:border-[#002D6A] focus:ring-2 focus:ring-[#002D6A]/10 focus:outline-none text-sm transition-all bg-neutral-50/50 focus:bg-white"
                  />
                </div>

                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    required
                    className="w-full h-11 pl-11 pr-4 border border-neutral-200 rounded-lg focus:border-[#002D6A] focus:ring-2 focus:ring-[#002D6A]/10 focus:outline-none text-sm transition-all bg-neutral-50/50 focus:bg-white"
                  />
                </div>

                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    required
                    className="w-full h-11 pl-11 pr-16 border border-neutral-200 rounded-lg focus:border-[#002D6A] focus:ring-2 focus:ring-[#002D6A]/10 focus:outline-none text-sm transition-all bg-neutral-50/50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-[#002D6A] hover:text-[#001E4D] uppercase tracking-wide"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {formData.password && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neutral-500">Password strength</span>
                      <span className={`text-xs font-semibold ${
                        passwordStrength < 30 ? 'text-red-500' :
                        passwordStrength < 60 ? 'text-yellow-600' :
                        passwordStrength < 80 ? 'text-blue-500' : 'text-green-600'
                      }`}>
                        {getStrengthLabel()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    required
                    className="w-full h-11 pl-11 pr-16 border border-neutral-200 rounded-lg focus:border-[#002D6A] focus:ring-2 focus:ring-[#002D6A]/10 focus:outline-none text-sm transition-all bg-neutral-50/50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-[#002D6A] hover:text-[#001E4D] uppercase tracking-wide"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <label className="flex items-start gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-[#002D6A] focus:ring-[#002D6A] focus:ring-offset-0"
                  />
                  <span className="text-xs text-neutral-600 leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" className="text-[#002D6A] font-medium hover:underline">Terms</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-[#002D6A] font-medium hover:underline">Privacy Policy</Link>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#001E4D] hover:bg-[#002D6A] text-white font-semibold rounded-lg transition-all shadow-lg shadow-[#002D6A]/30 disabled:opacity-60 mt-2"
                >
                  {loading ? "Creating account..." : "Register"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-green-50 border border-green-100 text-green-600 text-sm rounded-lg">
                    {success}
                  </div>
                )}

                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                  className="w-full h-14 px-4 border border-neutral-200 rounded-lg focus:border-[#002D6A] focus:ring-2 focus:ring-[#002D6A]/10 focus:outline-none text-center text-2xl tracking-[0.5em] font-semibold transition-all bg-neutral-50/50 focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={verifyLoading || verificationCode.length !== 6}
                  className="w-full h-12 bg-[#001E4D] hover:bg-[#002D6A] text-white font-semibold rounded-lg transition-all shadow-lg shadow-[#002D6A]/30 disabled:opacity-60"
                >
                  {verifyLoading ? "Verifying..." : "Verify Email"}
                </button>

                <div className="flex items-center justify-between text-sm pt-1">
                  <button
                    type="button"
                    onClick={() => setStep('register')}
                    className="text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={sendVerificationCode}
                    disabled={codeLoading}
                    className="text-[#002D6A] hover:text-[#001E4D] font-medium disabled:opacity-50"
                  >
                    {codeLoading ? "Sending..." : codeSent ? "Resend code" : "Send code"}
                  </button>
                </div>
              </form>
            )}

            {step === 'register' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-neutral-600">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-[#002D6A] font-semibold hover:underline"
                  >
                    Login
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
