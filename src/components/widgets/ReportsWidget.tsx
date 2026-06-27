import { useMemo, useState } from "react";
import { useNgoStore } from "@/lib/ngo-store";
import { Widget } from "./Widget";
import { ExpandOverlay } from "./ExpandOverlay";

interface Doc {
  title: string;
  date: string;
  source: string;
  type: "PDF" | "DOCX";
  category: "Field" | "Donor";
}

const BK: Doc[] = [
  { title: "Q3 Field Report — Gitega Education Program", date: "12 Sep 2026", source: "Field team", type: "PDF", category: "Field" },
  { title: "GBV Prevention Workshop Outcomes", date: "28 Aug 2026", source: "Partner: AFEM", type: "DOCX", category: "Field" },
  { title: "Annual Donor Report 2025", date: "15 Mar 2026", source: "HQ Bonn", type: "PDF", category: "Donor" },
  { title: "Vocational Training Curriculum v2", date: "02 Feb 2026", source: "Education lead", type: "DOCX", category: "Field" },
  { title: "Burundi Country Risk Brief", date: "10 Jan 2026", source: "Operations", type: "PDF", category: "Donor" },
  { title: "Partner Capacity Assessment — AFEM", date: "05 Dec 2025", source: "M&E", type: "DOCX", category: "Field" },
  { title: "Quarterly Donor Update Q4 2025", date: "10 Nov 2025", source: "HQ Bonn", type: "PDF", category: "Donor" },
];

const WTG: Doc[] = [
  { title: "Donkey Trade Investigation — Ghana", date: "18 Sep 2026", source: "Field team", type: "PDF", category: "Field" },
  { title: "Stray Dog Program Annual Report", date: "05 Sep 2026", source: "Partner: HSI", type: "PDF", category: "Donor" },
  { title: "Animal Welfare Policy Submission", date: "20 Jul 2026", source: "Advocacy", type: "DOCX", category: "Field" },
  { title: "Social Media Monitoring Digest Q2", date: "30 Jun 2026", source: "Comms", type: "DOCX", category: "Donor" },
  { title: "WTG Strategy 2026-2028", date: "11 Jan 2026", source: "HQ Berlin", type: "PDF", category: "Donor" },
  { title: "Field Visit Report — Kenya Shelters", date: "20 Oct 2025", source: "Programs", type: "PDF", category: "Field" },
];

type Tab = "All" | "Field" | "Donor";

export function ReportsWidget({ onRemove }: { onRemove?: () => void }) {
  const current = useNgoStore((s) => s.current);
  const rows = current?.id === "wtg" ? WTG : BK;
  const [tab, setTab] = useState<Tab>("All");
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = rows.filter((r) => (tab === "All" ? true : r.category === tab));

  const fullFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? filtered.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.source.toLowerCase().includes(q),
        )
      : filtered;
  }, [filtered, search]);

  const tabs = (
    <Segment value={tab} onChange={setTab} options={["All", "Field", "Donor"]} />
  );

  return (
    <>
      <Widget
        title="Reports & Documents"
        onRemove={onRemove}
        onExpand={() => setExpanded(true)}
        headerRight={tabs}
      >
        <DocList rows={filtered} />
      </Widget>

      {expanded && (
        <ExpandOverlay
          title="Reports & Documents"
          onClose={() => setExpanded(false)}
          headerRight={tabs}
        >
          <div
            style={{
              padding: "12px 22px",
              borderBottom: "1px solid #EBEAE4",
              background: "#FFFFFF",
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 16,
                color: "#22221E",
                background: "transparent",
              }}
            />
          </div>
          <DocList rows={fullFiltered} />
        </ExpandOverlay>
      )}
    </>
  );
}

function DocList({ rows }: { rows: Doc[] }) {
  return (
    <ul className="flex flex-col">
      {rows.map((d, i) => {
        const tile =
          d.type === "PDF"
            ? { bg: "#FBE9E7", color: "#CC4444" }
            : { bg: "#E8EEFA", color: "#3F6CC4" };
        return (
          <li
            key={i}
            className="flex items-center gap-3 transition-colors hover:bg-[#FAF9F5]"
            style={{
              padding: "13px 18px",
              borderTop: i === 0 ? "none" : "1px solid #F4F3EE",
            }}
          >
            <div
              className="flex shrink-0 items-center justify-center"
              style={{
                width: 38,
                height: 44,
                borderRadius: 9,
                background: tile.bg,
                color: tile.color,
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              {d.type}
            </div>
            <div className="min-w-0 flex-1">
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  letterSpacing: "-0.005em",
                  color: "#22221E",
                }}
              >
                {d.title}
              </div>
              <div style={{ fontSize: 12.5, color: "#9B9B90", marginTop: 3 }}>
                {d.date} · {d.source}
              </div>
            </div>
            <button
              type="button"
              className="shrink-0 transition-colors"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "#137A5C",
                background: "#FFFFFF",
                border: "1px solid #CFE3DC",
                borderRadius: 9,
                padding: "6px 14px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F0F7F3")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
            >
              View
            </button>
          </li>
        );
      })}
      {rows.length === 0 && (
        <li
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#9B9B90",
            fontSize: 13,
          }}
        >
          No documents match.
        </li>
      )}
    </ul>
  );
}

function Segment<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <div
      className="inline-flex"
      style={{ background: "#F2F1EC", borderRadius: 11, padding: 3 }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              color: active ? "#1B1B17" : "#9B9B90",
              background: active ? "#FFFFFF" : "transparent",
              boxShadow: active ? "0 1px 2px rgba(20,20,18,.10)" : "none",
              borderRadius: 8,
              padding: "5px 11px",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
