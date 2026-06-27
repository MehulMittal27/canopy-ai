import { useMemo } from "react";
import { useItemsStore } from "@/lib/items-store";
import { useNgoStore } from "@/lib/ngo-store";

const DOT: Record<string, string> = {
  red: "#DC2626",
  yellow: "#D97706",
  green: "#059669",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

export function InboxWidget() {
  const items = useItemsStore((s) => s.items);
  const current = useNgoStore((s) => s.current);
  const rows = useMemo(() => {
    if (!current) return [];
    const rank = { red: 0, yellow: 1, green: 2 } as const;
    return items
      .filter((i) => i.ngo_id === current.id)
      .sort((a, b) => {
        const u = rank[a.urgency] - rank[b.urgency];
        if (u !== 0) return u;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      })
      .slice(0, 6);
  }, [items, current]);

  return (
    <ul className="flex flex-col divide-y divide-[#F1F1ED]">
      {rows.map((it) => (
        <li key={it.id}>
          <button
            type="button"
            onClick={() => console.log("open item", it.id)}
            className="flex w-full items-start gap-2.5 py-2 text-left hover:bg-[#FAFAF8]"
          >
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: DOT[it.urgency] }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold text-[#111827]">
                {it.translated_title}
              </div>
              <div className="text-[12px] text-[#6B7280]">
                {it.source} · {fmt(it.published_at)}
              </div>
              <div className="mt-0.5 line-clamp-1 text-[13px] text-[#374151]">
                {it.summary.split(/(?<=\.)\s/)[0]}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
