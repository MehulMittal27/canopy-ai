import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { TopBar } from "@/components/canopy/TopBar";
import { URGENCY_META, formatDate } from "@/components/canopy/shared";
import { useNgoStore } from "@/lib/ngo-store";
import { useItemsStore } from "@/lib/items-store";
import { DetailHeader } from "./news";
import type { Item } from "@/data/items";

export const Route = createFileRoute("/translator")({
  head: () => ({ meta: [{ title: "Translator · CANOPY" }] }),
  component: TranslatorView,
});

function TranslatorView() {
  const current = useNgoStore((s) => s.current);
  if (!current) throw redirect({ to: "/login" });
  const items = useItemsStore((s) => s.items);
  const addItem = useItemsStore((s) => s.addItem);
  const [processing, setProcessing] = useState(false);

  const recent = useMemo(
    () =>
      [...items.filter(
        (i) => i.ngo_id === current.id && i.source_language !== "en",
      )]
        .sort(
          (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
        )
        .slice(0, 5),
    [items, current.id],
  );

  const fakeUpload = () => {
    if (processing) return;
    setProcessing(true);
    setTimeout(() => {
      const id = `upload-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const item: Item = {
        id,
        ngo_id: current.id,
        urgency: "green",
        category: "report",
        source: "Uploaded by you",
        source_language: "fr",
        source_url: "#",
        published_at: nowIso,
        original_title: "Document téléversé",
        original_text: "Contenu original du document.",
        translated_title: "Uploaded document — English summary",
        summary:
          "Auto-translated summary of the uploaded document. Key points have been extracted and translated to English. Review the full translation for details.",
        full_summary:
          "This is a placeholder English summary generated from the uploaded document. The translator detected French as the source language and produced an English version covering the main points, action items, and any funding-related information found in the text.",
        why_relevant: `Uploaded for ${current.name}'s internal review.`,
        next_steps: ["Review translation", "Share with team if relevant"],
        topic_tags: [],
        funding_deadline: null,
        funding_amount_min: null,
        funding_amount_max: null,
        funding_funder: null,
        eligibility_verdict: null,
        eligibility_reason: null,
        confidence: "medium",
        model: "claude-sonnet-4",
        created_at: nowIso,
      };
      addItem(item);
      setProcessing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <DetailHeader
        title="Translator"
        subtitle="Translate and summarize documents in French, English, or local languages"
      />
      <main className="mx-auto mt-6 grid max-w-[1200px] grid-cols-10 gap-6 px-6 pb-12">
        <div className="col-span-10 flex flex-col gap-6 md:col-span-6">
          <button
            onClick={fakeUpload}
            disabled={processing}
            className="flex h-[240px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card text-[14px] text-[color:var(--metadata)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:opacity-70"
          >
            {processing ? (
              <>
                <Loader2 size={28} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload size={28} />
                Drag a PDF or DOCX here, or click to browse
              </>
            )}
          </button>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-[16px] font-semibold text-foreground">Recent translations</h2>
            {recent.length === 0 ? (
              <p className="mt-3 text-[13px] text-[color:var(--metadata)]">
                No translations yet.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col">
                {recent.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => console.log("open", item.id)}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-[#FAFAF8]"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: URGENCY_META[item.urgency].color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[14px] text-foreground">
                        {item.translated_title}
                      </span>
                      <span className="shrink-0 text-[12px] text-[color:var(--metadata)]">
                        {item.source} · {formatDate(item.published_at)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="col-span-10 md:col-span-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-[16px] font-semibold text-foreground">About this tool</h2>
            <ul className="mt-3 flex flex-col gap-2 text-[13px] text-foreground">
              <li className="flex gap-2">
                <span className="text-[color:var(--accent)]">·</span>
                Auto-detects the source language of any uploaded document.
              </li>
              <li className="flex gap-2">
                <span className="text-[color:var(--accent)]">·</span>
                Produces an English summary plus a full translation.
              </li>
              <li className="flex gap-2">
                <span className="text-[color:var(--accent)]">·</span>
                Extracts action items and funding requirements where present.
              </li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
