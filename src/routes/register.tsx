import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CanopyLogoBadge } from "@/components/canopy/Logo";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register your organization · Canopy" }] }),
  component: RegisterPage,
});

function chipsFromCSV(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgType, setOrgType] = useState("");
  const [countries, setCountries] = useState("");
  const [languages, setLanguages] = useState("");
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await signUp({
      name,
      email,
      password,
      organization_type: orgType || undefined,
      country_focus: chipsFromCSV(countries),
      source_languages: chipsFromCSV(languages),
      focus_areas: chipsFromCSV(focus),
    });
    if (error) {
      setError(error);
      setBusy(false);
      return;
    }
    // With auto-confirm on, signUp returns a session. Try a sign-in to be safe.
    await signIn(email, password);
    setBusy(false);
    navigate({ to: "/choose-template" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-[520px] rounded-2xl border border-border bg-card p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex flex-col items-center gap-3">
          <CanopyLogoBadge />
          <div className="text-[15px] font-semibold tracking-tight text-foreground">CANOPY</div>
        </div>

        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground">
          Register your organization
        </h1>
        <p className="mt-1.5 text-center text-sm text-[color:var(--metadata)]">
          One organization, one workspace.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <Field label="Organization name" value={name} onChange={setName} required />
          <Field label="Organization email" type="email" value={email} onChange={setEmail} required />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
            minLength={6}
          />
          <Field
            label="Organization type"
            value={orgType}
            onChange={setOrgType}
            placeholder="e.g. NGO, Foundation, Association"
          />
          <Field
            label="Countries of operation"
            value={countries}
            onChange={setCountries}
            placeholder="Comma-separated, e.g. Burundi, Rwanda"
          />
          <Field
            label="Source languages"
            value={languages}
            onChange={setLanguages}
            placeholder="Comma-separated, e.g. French, English, Kirundi"
          />
          <Field
            label="Focus areas"
            value={focus}
            onChange={setFocus}
            placeholder="Comma-separated, e.g. Education, GBV, Healthcare"
          />

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
            {busy ? "Creating workspace…" : "Create workspace"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[color:var(--metadata)]">
          Already have an account?{" "}
          <Link to="/login" className="text-[color:var(--accent)] underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        minLength={minLength}
        className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-[color:var(--metadata)] focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/15"
      />
    </div>
  );
}
