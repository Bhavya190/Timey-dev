"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions";
import {
  Shield,
  Users,
  HelpCircle,
  ArrowRight,
  Mail,
  Lock,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUser } from "@/components/UserProvider";

export default function HomePage() {
  const router = useRouter();
  const { refreshUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { loginAction } = await import("@/app/actions");
      const result = await loginAction(email, password);

      if (result.success) {
        if (result.token) {
          sessionStorage.setItem("auth_token", result.token);
        }

        // Force refresh the user context before redirecting
        await refreshUser();

        if (result.role === "admin" || result.role === "teamLead") {
          router.replace("/admin");
        } else {
          router.replace("/employee");
        }
      } else {
        // Assuming if result.success is false, there's an error message in result.message
        // or a generic error should be shown.
        setError(result.message || "Invalid email or password");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* top bar */}
      <header className="flex items-center justify-between px-4 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-emerald-500">
              Timey
            </p>
            <p className="text-[11px] text-muted">Time & attendance control</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* center card */}
      <section className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl px-6 py-8 md:px-8 md:py-10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-semibold mb-2">
              Sign in to Timey
            </h1>
            <p className="text-sm text-muted">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/40 text-red-500 text-xs py-2 px-3 rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-muted">
                  Password
                </label>
                <button type="button" className="text-[10px] text-emerald-500 hover:text-emerald-400 font-medium">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border flex flex-col gap-4">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span>Secure, encrypted authentication</span>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>
                Need help with Timey?{" "}
                <button
                  type="button"
                  className="text-emerald-500 hover:text-emerald-400 underline underline-offset-2 transition-colors"
                >
                  Contact support
                </button>
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
