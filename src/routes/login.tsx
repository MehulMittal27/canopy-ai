import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { CanopyLogoBadge } from "@/components/canopy/Logo";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Canopy" },
      {
        name: "description",
        content: "Sign in to your Canopy workspace.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/pick-ngo" });
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

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-[color:var(--accent)]"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => console.log("forgot password")}
              className="text-[color:var(--accent)] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[color:var(--accent)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--accent)]/90"
          >
            Sign In
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-[color:var(--metadata)]">Or continue with</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/pick-ngo" })}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:border-[color:var(--accent)]"
          >
            <GoogleIcon />
            Google
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/pick-ngo" })}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:border-[color:var(--accent)]"
          >
            <AppleIcon />
            Apple
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-[color:var(--metadata)]">
          Don't have an account?{" "}
          <Link to="/pick-ngo" className="text-[color:var(--accent)] underline">
            Join us
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C41.4 35.7 44 30.3 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.46 2.23-1.21 3.02-.81.85-2.12 1.51-3.21 1.42-.13-1.09.41-2.23 1.16-3.02.83-.88 2.24-1.55 3.26-1.42zM20.5 17.3c-.55 1.28-.82 1.85-1.53 2.98-1 1.58-2.41 3.55-4.16 3.56-1.55.01-1.95-1.01-4.06-1-2.11.01-2.55 1.02-4.1 1.01-1.75-.01-3.08-1.78-4.08-3.36C-.18 15.81-.46 9.6 2.72 7.27c1.13-.83 2.66-1.36 4.13-1.36 1.5 0 2.45.82 4.06.82 1.56 0 2.51-.82 4.25-.82 1.32 0 2.71.72 3.71 1.96-3.26 1.79-2.73 6.45.63 7.43z"/>
    </svg>
  );
}
