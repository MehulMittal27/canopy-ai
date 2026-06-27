import { FormEvent, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AuthSplitLayout } from "@/components/canopy/AuthSplitLayout";
import { useAuth } from "@/contexts/AuthContext";
import type { NgoId } from "@/lib/ngo-store";

type SubmitTarget = "credentials" | "bk" | "wtg";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInDemo } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<SubmitTarget | null>(null);

  const submitCredentials = async (nextEmail: string, nextPassword: string) => {
    setError(null);
    setSubmitting("credentials");
    try {
      const result = await signIn(nextEmail, nextPassword);
      navigate({ to: result.org ? "/dashboard" : "/onboarding" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setSubmitting(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitCredentials(email, password);
  };

  const loginDemo = async (ngoId: NgoId, nextEmail: string) => {
    setEmail(nextEmail);
    setPassword("canopy123");
    setError(null);
    setSubmitting(ngoId);
    try {
      const result = await signInDemo(ngoId);
      navigate({ to: result.org ? "/dashboard" : "/onboarding" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open demo workspace.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <AuthSplitLayout
      title="Sign in to Canopy"
      subtitle="Open your NGO workspace, review priorities, and continue from your saved dashboard."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5">
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6E6E64" }}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="h-11 rounded-xl px-3 text-sm outline-none"
            style={{ border: "1px solid #EBEAE4", color: "#1B1B17", background: "#FFFFFF" }}
          />
        </label>

        <label className="grid gap-1.5">
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6E6E64" }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="h-11 rounded-xl px-3 text-sm outline-none"
            style={{ border: "1px solid #EBEAE4", color: "#1B1B17", background: "#FFFFFF" }}
          />
        </label>

        {error && (
          <div
            role="alert"
            style={{
              background: "#FBE9E7",
              color: "#CC4444",
              borderRadius: 10,
              padding: "9px 11px",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting !== null}
          className="h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "#137A5C" }}
        >
          {submitting === "credentials" ? "Signing in..." : "Sign in"}
        </button>

        <div className="mt-1" style={{ borderTop: "1px solid #F4F3EE", paddingTop: 14 }}>
          <div style={{ fontSize: 12, color: "#9B9B90" }}>Or try the demo:</div>
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={submitting !== null}
              onClick={() => loginDemo("bk", "burundi-kids@canopy.demo")}
              className="text-sm font-semibold disabled:opacity-60"
              style={{ color: "#137A5C" }}
            >
              {submitting === "bk" ? "Opening Burundi Kids..." : "Demo: Burundi Kids"}
            </button>
            <button
              type="button"
              disabled={submitting !== null}
              onClick={() => loginDemo("wtg", "wtg@canopy.demo")}
              className="text-sm font-semibold disabled:opacity-60"
              style={{ color: "#137A5C" }}
            >
              {submitting === "wtg" ? "Opening WTG..." : "Demo: WTG"}
            </button>
          </div>
        </div>
      </form>

      <p className="mt-5" style={{ fontSize: 13, color: "#6E6E64" }}>
        New to Canopy?{" "}
        <Link to="/register" style={{ color: "#137A5C", fontWeight: 600 }}>
          Create an account
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
