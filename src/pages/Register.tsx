import { FormEvent, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AuthSplitLayout } from "@/components/canopy/AuthSplitLayout";
import { useAuth } from "@/contexts/AuthContext";

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signUp(email, password);
      window.sessionStorage.setItem("pending_full_name", fullName);
      window.sessionStorage.setItem("pending_org_name", orgName);
      navigate({ to: "/onboarding" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Create your Canopy workspace"
      subtitle="Set up your organization account, then choose the dashboard layout your team will use."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5">
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6E6E64" }}>Full name</span>
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
            className="h-11 rounded-xl px-3 text-sm outline-none"
            style={{ border: "1px solid #EBEAE4", color: "#1B1B17", background: "#FFFFFF" }}
          />
        </label>

        <label className="grid gap-1.5">
          <span style={{ fontSize: 12, fontWeight: 600, color: "#6E6E64" }}>Organization name</span>
          <input
            type="text"
            value={orgName}
            onChange={(event) => setOrgName(event.target.value)}
            required
            className="h-11 rounded-xl px-3 text-sm outline-none"
            style={{ border: "1px solid #EBEAE4", color: "#1B1B17", background: "#FFFFFF" }}
          />
        </label>

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
            minLength={6}
            autoComplete="new-password"
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
          disabled={submitting}
          className="h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "#137A5C" }}
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-5" style={{ fontSize: 13, color: "#6E6E64" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#137A5C", fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
