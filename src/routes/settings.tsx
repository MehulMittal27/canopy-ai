import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNgoStore } from "@/lib/ngo-store";
import { TEMPLATES, useTemplateStore, readSavedTemplate } from "@/lib/template-store";
import { DASH_TEMPLATES, defaultTemplateForNgo, useDashboardStore } from "@/lib/dashboard-store";
import { TopBar } from "@/components/canopy/TopBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Canopy" }] }),
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  );
}

function Settings() {
  const current = useNgoStore((s) => s.current);
  const logout = useNgoStore((s) => s.logout);
  const { signOut } = useAuth();
  if (!current) throw redirect({ to: "/login" });
  const navigate = useNavigate();
  const selected = useTemplateStore((s) => s.selections[current.id]);

  const activeId = selected ?? readSavedTemplate(current.id) ?? "clarity";
  const active = TEMPLATES[activeId];

  const handleLogout = async () => {
    await signOut();
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="mx-auto max-w-[760px] px-6 py-10">
        <Link
          to="/inbox"
          className="text-[13px] font-medium text-[color:var(--accent)] hover:underline"
        >
          ← Back to inbox
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Settings</h1>

        <Section title="Workspace Template">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[15px] font-semibold text-foreground">{active.name}</div>
              <div className="text-[13px] text-[color:var(--metadata)]">{active.tagline}</div>
            </div>
            <Link
              to="/choose-template"
              className="rounded-lg border border-[color:var(--accent)] px-3 py-1.5 text-sm font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/5"
            >
              Change template
            </Link>
          </div>
        </Section>

        <Section title="Dashboard Layout">
          <DashboardLayoutSection />
        </Section>

        <Section title="Organization">
          <div className="text-[15px] font-semibold text-foreground">{current.name}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {current.topics.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[12px] text-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </Section>

        <Section title="Session">
          <button
            type="button"
            onClick={handleLogout}
            className="text-[14px] font-medium text-[#DC2626] hover:underline"
          >
            Log out
          </button>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 rounded-xl border border-border bg-card p-5">
      <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[color:var(--metadata)]">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DashboardLayoutSection() {
  const current = useNgoStore((s) => s.current)!;
  const { user } = useAuth();
  const hydrate = useDashboardStore((s) => s.hydrate);
  const tplId = useDashboardStore((s) => (user ? s.templates[user.id] : undefined));
  useEffect(() => {
    if (!user) return;
    void hydrate(user.id, defaultTemplateForNgo(current.id));
  }, [current.id, hydrate, user]);
  const tpl = tplId ? DASH_TEMPLATES[tplId] : null;
  return (
    <div>
      <div className="text-[15px] font-semibold text-foreground">
        {tpl ? tpl.name : "Custom layout"}
      </div>
      {tpl && <div className="text-[13px] text-[color:var(--metadata)]">{tpl.description}</div>}
      <Link
        to="/choose-template"
        className="mt-3 inline-block rounded-lg border border-[color:var(--accent)] px-3 py-1.5 text-sm font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/5"
      >
        Change layout
      </Link>
      <p className="mt-2 text-[12px] text-[color:var(--metadata)]">
        Your current widget positions will be replaced with the new template defaults.
      </p>
    </div>
  );
}
