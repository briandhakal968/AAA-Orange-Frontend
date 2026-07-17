"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Step = "email" | "otp" | "new-password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("otp");
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(data.message || data.error || "Failed to send OTP");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newOtp = pasted.split("").concat(Array(6 - pasted.length).fill(""));
      setOtp(newOtp);
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("new-password");
      } else {
        setError(data.message || "Invalid or expired code");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, password_confirmation: confirmPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/login?reset=success");
      } else {
        setError(data.message || data.error || "Failed to reset password");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1">
      <Container>
        <div className="py-12 md:py-20 max-w-md mx-auto">
          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-center mb-2">
            {step === "email" && "Forgot Password"}
            {step === "otp" && "Verify OTP"}
            {step === "new-password" && "Set New Password"}
          </h1>
          <p className="text-sm text-neutral-500 text-center mb-8">
            {step === "email" && "Enter your email to receive a verification code"}
            {step === "otp" && `We sent a 6-digit code to ${email}`}
            {step === "new-password" && "Enter your new password below"}
          </p>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm text-center mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full h-12 px-4 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-neutral-500 underline underline-offset-4 hover:text-black transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-14 text-center text-xl font-medium border border-neutral-200 focus:border-black focus:outline-none rounded-lg"
                  />
                ))}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleEmailSubmit}
                  className="text-sm text-neutral-500 hover:text-black transition-colors"
                >
                  Resend Code
                </button>
                <div>
                  <Link
                    href="/login"
                    className="text-sm text-neutral-500 underline underline-offset-4 hover:text-black transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === "new-password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (min. 8 characters)"
                  required
                  minLength={8}
                  className="w-full h-12 px-4 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                />
              </div>

              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                  className="w-full h-12 px-4 border border-neutral-200 focus:border-black focus:outline-none text-sm"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-neutral-500 underline underline-offset-4 hover:text-black transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </Container>
    </main>
  );
}
