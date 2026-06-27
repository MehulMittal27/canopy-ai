import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { useNgoStore } from "@/lib/ngo-store";
import { TEMPLATES, type TemplateId, useTemplateStore } from "@/lib/template-store";

export const Route = createFileRoute("/choose-template")({
  head: () => ({ meta: [{ title: "Choose your workspace · Canopy" }] }),
  component: ChooseTemplate,
});

function ChooseTemplate() {
  const current = useNgoStore((s) => s.current);
  const setTemplate = useTemplateStore((s) => s.setTemplate);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<TemplateId | null>(null);

  if (!current) {
    throw redirect({ to: "/" });
  }

  const handleSelect = (id: TemplateId) => {
    setSelected(id);
    setTemplate(current.id, id);
    // Smooth UX: apply immediately, navigate after a tick
    setTimeout(() => navigate({ to: "/inbox" }), 180);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] px-6 py-14">
      <div className="mx-auto max-w-[1100px]">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-[#111827]">
            Choose your workspace
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Pick the layout that fits how your team works. You can change this later in Settings.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {(Object.values(TEMPLATES) as (typeof TEMPLATES)[TemplateId][]).map((t) => (
            <TemplateCard
              key={t.id}
              tpl={t}
              active={selected === t.id}
              onSelect={() => handleSelect(t.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  tpl,
  active,
  onSelect,
}: {
  tpl: (typeof TEMPLATES)[TemplateId];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={
        "group rounded-2xl border bg-white p-6 transition-all duration-200 " +
        (active
          ? "border-[#0F766E] shadow-[0_8px_28px_rgba(15,118,110,0.18)]"
          : "border-[#E5E5E0] hover:-translate-y-0.5 hover:border-[#0F766E]/50 hover:shadow-[0_6px_22px_rgba(0,0,0,0.06)]")
      }
    >
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: tpl.theme.border, backgroundColor: tpl.theme.background }}
      >
        <TemplatePreview id={tpl.id} />
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[16px] font-bold text-[#111827]">{tpl.name}</h3>
          <p className="mt-1 text-[13px] text-[#6B7280]">{tpl.tagline}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {tpl.swatch.map((c) => (
            <span
              key={c}
              className="h-5 w-5 rounded-full border border-black/5"
              style={{ backgroundColor: c }}
              aria-hidden
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onSelect}
        className={
          "mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors " +
          (active
            ? "bg-[#0F766E] text-white"
            : "border border-[#E5E5E0] bg-white text-[#111827] hover:border-[#0F766E] hover:text-[#0F766E]")
        }
      >
        {active ? (
          <>
            <Check size={15} /> Selected
          </>
        ) : (
          "Select"
        )}
      </button>
    </div>
  );
}

function TemplatePreview({ id }: { id: TemplateId }) {
  const t = TEMPLATES[id].theme;

  if (id === "clarity") {
    return (
      <div className="flex h-36 flex-col gap-1.5 p-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-md border px-2 py-1.5"
            style={{ borderColor: t.border, backgroundColor: t.card }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.accent }} />
            <span className="h-1.5 flex-1 rounded" style={{ backgroundColor: t.border }} />
          </div>
        ))}
      </div>
    );
  }

  if (id === "command") {
    return (
      <div className="grid h-36 grid-cols-[3fr_2fr] gap-2 p-3">
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded px-2 py-1"
              style={{ backgroundColor: t.card }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.accent }} />
              <span className="h-1.5 flex-1 rounded" style={{ backgroundColor: t.border }} />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="rounded p-2" style={{ backgroundColor: t.card }}>
            <span
              className="block h-1.5 w-8 rounded"
              style={{ backgroundColor: t.accent }}
            />
            <span
              className="mt-1.5 block h-3 w-10 rounded"
              style={{ backgroundColor: t.accent, opacity: 0.6 }}
            />
          </div>
          <div className="flex-1 rounded" style={{ backgroundColor: t.card }} />
        </div>
      </div>
    );
  }

  if (id === "focus") {
    return (
      <div className="grid h-36 grid-cols-2 gap-2 p-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-lg border p-2"
            style={{ borderColor: t.border, backgroundColor: t.card }}
          >
            <span className="h-1.5 w-6 rounded" style={{ backgroundColor: t.accent }} />
            <span className="block h-1.5 w-full rounded" style={{ backgroundColor: t.border }} />
          </div>
        ))}
      </div>
    );
  }

  // field
  return (
    <div className="grid h-36 grid-cols-[24px_1fr_1fr] gap-2 p-3">
      <div className="flex flex-col gap-1.5 rounded" style={{ backgroundColor: t.secondary }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="mx-auto mt-1.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: t.accent }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded border px-2 py-1"
            style={{ borderColor: t.border, backgroundColor: t.card }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.accent }} />
            <span className="h-1.5 flex-1 rounded" style={{ backgroundColor: t.border }} />
          </div>
        ))}
      </div>
      <div className="rounded border p-2" style={{ borderColor: t.border, backgroundColor: t.card }}>
        <span className="block h-1.5 w-10 rounded" style={{ backgroundColor: t.accent }} />
        <span
          className="mt-1.5 block h-1.5 w-full rounded"
          style={{ backgroundColor: t.border }}
        />
        <span
          className="mt-1 block h-1.5 w-2/3 rounded"
          style={{ backgroundColor: t.border }}
        />
      </div>
    </div>
  );
}
