import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard" }] }),
  component: DashboardPage,
});

type Profile = { full_name: string | null; organization_name: string | null };

function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      setEmail(user.email ?? "");
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, organization_name")
        .eq("id", user.id)
        .maybeSingle();
      if (error) setError(error.message);
      else setProfile(data);
      setLoading(false);
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Sign out
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : profile ? (
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Organization
                </dt>
                <dd className="mt-1 text-lg font-semibold text-foreground">
                  {profile.organization_name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Full name
                </dt>
                <dd className="mt-1 text-lg font-semibold text-foreground">
                  {profile.full_name ?? "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No profile found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
