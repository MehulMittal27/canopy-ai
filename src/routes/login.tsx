import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CanopyLogoBadge } from "@/components/canopy/Logo";
import { NGOS, useNgoStore, type NgoId } from "@/lib/ngo-store";
import { hasSavedLayout } from "@/lib/dashboard-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Canopy" },
      { name: "description", content: "Sign in to your Canopy workspace." },
    ],
  }),
  component: LoginPage,
});

const DEMO_ACCOUNTS: { id: NgoId; label: string }[] = [
  { id: "bk", label: "Continue as Burundi Kids" },
  { id: "wtg", label: "Continue as WTG" },
];

function LoginPage() {
  const navigate = useNavigate();
  const setNgo = useNgoStore((s) => s.setNgo);

  const pick = (id: NgoId) => {
    setNgo(NGOS[id]);
    navigate({ to: hasSavedLayout(id) ? "/dashboard" : "/choose-template" });
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
          Choose a workspace to continue
        </p>

        <div className="mt-7 grid gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => pick(acc.id)}
              className="rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)]/5"
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
