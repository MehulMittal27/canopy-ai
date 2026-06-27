import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { CanopyLogoBadge } from "@/components/canopy/Logo";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Canopy" },
      { name: "description", content: "Sign in to your Canopy workspace." },
    ],
  }),
  component: LoginPage,
});

const DEMO_ACCOUNTS = [
  {
    label: "Continue as Burundi Kids",
    email: "demo-bk@canopy.ngo",
    password: "canopy-demo-bk",
    name: "Burundi Kids",
    template: "burundi-kids" as const,
  },
  {
    label: "Continue as WTG",
    email: "demo-wtg@canopy.ngo",
    password: "canopy-demo-wtg",
    name: "Welttierschutzgesellschaft (WTG)",
    template: "wtg" as const,
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) {
      setError("We couldn't sign you in. Please check your email and password.");
      return;
    }
    navigate({ to: "/dashboard" });
  };

  const demoLogin = async (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setBusy(true);
    setError(null);
    let { error } = await signIn(acc.email, acc.password);
    if (error) {
      // First demo use — auto-create the demo account, then sign in.
      const { error: upErr } = await signUp({
        email: acc.email,
        password: acc.password,
        name: acc.name,
        organization_type: "NGO",
      });
      if (upErr && !/registered/i.test(upErr)) {
        setError(upErr);
        setBusy(false);
        return;
      }
      ({ error } = await signIn(acc.email, acc.password));
    }
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-card p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex flex-col items-center gap-3">
          <CanopyLogoBadge />
          <div className="text-[15px] font-semibold tracking-tight text-foreground">CANOPY</div>
        </div>

        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-1.5 text-center text-sm text-[color:var(--metadata)]">
          Sign in to your Canopy workspace
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourorg.org"
              required
              className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-[color:var(--metadata)] focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/15"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-[color:var(--metadata)] focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/15"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-[color:var(--metadata)] hover:text-foreground"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#991B1B]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[color:var(--accent)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--accent)]/90 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-[color:var(--metadata)]">Or try a demo workspace</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              disabled={busy}
              onClick={() => demoLogin(acc)}
              className="rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:border-[color:var(--accent)] disabled:opacity-60"
            >
              {acc.label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-[color:var(--metadata)]">
          New to Canopy?{" "}
          <Link to="/register" className="text-[color:var(--accent)] underline">
            Register your organization
          </Link>
        </p>
      </div>
    </div>
  );
}
