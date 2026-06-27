import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, organization_name: orgName },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    // Best-effort upsert in case the trigger metadata path is unavailable.
    if (data.user) {
      await supabase
        .from("profiles")
        .upsert(
          { id: data.user.id, full_name: fullName, organization_name: orgName },
          { onConflict: "id" },
        );
    }

    setLoading(false);
    if (data.session) {
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/login" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-[460px] rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground">
          Create your workspace
        </h1>
        <p className="mt-1.5 text-center text-sm text-muted-foreground">
          One organization, one account.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <Field id="org" label="Organization name" value={orgName} onChange={setOrgName} required />
          <Field id="name" label="Full name" value={fullName} onChange={setFullName} required />
          <Field id="email" label="Email" type="email" value={email} onChange={setEmail} required />
          <Field
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
          />

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field(props: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={props.id} className="block text-sm font-medium text-foreground">
        {props.label}
      </label>
      <input
        id={props.id}
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
      />
    </div>
  );
}
