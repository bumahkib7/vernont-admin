"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  Store,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api/client";

type PageState = "request" | "sent" | "reset" | "done";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Determine initial state from URL
  const [state, setState] = useState<PageState>(token ? "reset" : "request");

  // Request form
  const [email, setEmail] = useState("");

  // Reset form
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Shared
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password validation
  const hasMinLength = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to send reset email");
      }

      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.message || "Failed to reset password. The link may have expired."
        );
      }

      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
              <Store className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">Vernont</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              {state === "reset" || state === "done" ? (
                <>
                  Set a new<br />
                  <span className="text-zinc-400">password</span>
                </>
              ) : (
                <>
                  Reset your<br />
                  <span className="text-zinc-400">password</span>
                </>
              )}
            </h1>
            <p className="text-zinc-400 text-lg max-w-md">
              {state === "reset"
                ? "Choose a strong password to secure your account."
                : "We'll send you a link to reset your password and get back into your dashboard."}
            </p>
          </div>

          <div className="text-sm text-zinc-500">Vernont Commerce Platform</div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-1 items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Store className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">Vernont</span>
          </div>

          {/* === STATE: Request reset === */}
          {state === "request" && (
            <>
              <div className="space-y-2 text-center lg:text-left">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Forgot password?
                </h2>
                <p className="text-muted-foreground">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleRequestReset} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@vernont.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isSubmitting || !email}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}

          {/* === STATE: Email sent === */}
          {state === "sent" && (
            <>
              <div className="space-y-4 text-center lg:text-left">
                <div className="flex justify-center lg:justify-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Check your email
                </h2>
                <p className="text-muted-foreground">
                  We sent a password reset link to{" "}
                  <span className="font-medium text-foreground">{email}</span>.
                  The link expires in 1 hour.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => {
                    setError(null);
                    setState("request");
                  }}
                >
                  Try a different email
                </Button>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <a
                  href="mailto:support@vernont.com"
                  className="text-foreground hover:underline"
                >
                  contact support
                </a>
              </p>
            </>
          )}

          {/* === STATE: Reset password (from email link) === */}
          {state === "reset" && (
            <>
              <div className="space-y-2 text-center lg:text-left">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Set new password
                </h2>
                <p className="text-muted-foreground">
                  Choose a strong password for your account
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        required
                        autoComplete="new-password"
                        autoFocus
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isSubmitting}
                        required
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                        aria-label="Toggle confirm visibility"
                      >
                        {showConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password requirements */}
                  {password.length > 0 && (
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        {hasMinLength ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span
                          className={
                            hasMinLength
                              ? "text-green-500"
                              : "text-muted-foreground"
                          }
                        >
                          At least 8 characters
                        </span>
                      </div>
                      {confirmPassword.length > 0 && (
                        <div className="flex items-center gap-2">
                          {passwordsMatch ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          <span
                            className={
                              passwordsMatch
                                ? "text-green-500"
                                : "text-destructive"
                            }
                          >
                            Passwords match
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isSubmitting || !hasMinLength || !passwordsMatch}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* === STATE: Done === */}
          {state === "done" && (
            <>
              <div className="space-y-4 text-center lg:text-left">
                <div className="flex justify-center lg:justify-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Password reset
                </h2>
                <p className="text-muted-foreground">
                  Your password has been updated. You can now sign in with your
                  new password.
                </p>
              </div>

              <Button
                className="w-full h-11"
                onClick={() => router.push("/login")}
              >
                Sign in
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
