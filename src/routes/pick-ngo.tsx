import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Leaf, PawPrint } from "lucide-react";
import { NGOS, useNgoStore, type NgoId } from "@/lib/ngo-store";
import { CanopyLogoBadge } from "@/components/canopy/Logo";

export const Route = createFileRoute("/pick-ngo")({
  head: () => ({
    meta: [{ title: "Choose your organization · Canopy" }],
  }),
  component: PickNgo,
});

const OPTIONS: { id: NgoId; description: string; icon: React.ReactNode }[] = [
  {
    id: "bk",
    description: "Children, education, GBV · Burundi",
    icon: <Leaf size={20} />,
  },
  {
    id: "wtg",
    description: "Animal welfare · 20+ countries",
    icon: <PawPrint size={20} />,
  },
];

function PickNgo() {
  const navigate = useNavigate();
  const setNgo = useNgoStore((s) => s.setNgo);
  const [selected, setSelected] = useState<NgoId | null>(null);

  const cont = () => {
    if (!selected) return;
    setNgo(NGOS[selected]);
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
          Who are you working with?
        </h1>
        <p className="mt-1.5 text-center text-sm text-[color:var(--metadata)]">
          Select your organization to continue
        </p>

        <div className="mt-7 space-y-3">
          {OPTIONS.map((opt) => {
            const ngo = NGOS[opt.id];
            const active = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelected(opt.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? "border-[color:var(--accent)] bg-[#F0FDF9]"
                    : "border-border bg-card hover:border-[color:var(--accent)]/50"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    active
                      ? "bg-[color:var(--accent)] text-white"
                      : "bg-secondary text-[color:var(--metadata)]"
                  }`}
                >
                  {opt.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-base font-semibold text-foreground">{ngo.name}</div>
                  <div className="text-[13px] text-[color:var(--metadata)]">{opt.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={cont}
          disabled={!selected}
          className="mt-7 w-full rounded-xl bg-[color:var(--accent)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--accent)]/90 disabled:cursor-not-allowed disabled:bg-[color:var(--metadata)]/40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
