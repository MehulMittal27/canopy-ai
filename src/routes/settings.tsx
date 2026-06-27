import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useNgoStore } from "@/lib/ngo-store";
import { TEMPLATES, useTemplateStore, readSavedTemplate } from "@/lib/template-store";
import { TopBar } from "@/components/canopy/TopBar";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Canopy" }] }),
  component: Settings,
});

function Settings() {
  const current = useNgoStore((s) => s.current);
  const logout = useNgoStore((s) => s.logout);
  const navigate = useNavigate();
  const selected = useTemplateStore((s) =>
    current ? s.selections[current.id] : undefined,
  );

  if (!current) {
    throw redirect({ to: "/" });
  }

  const activeId =
    selected ?? readSavedTemplate(current.id) ?? "clarity";
  const active = TEMPLATES[activeId];

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
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
