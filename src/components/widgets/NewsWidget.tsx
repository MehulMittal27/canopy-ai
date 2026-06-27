import { useState } from "react";
import { useNgoStore } from "@/lib/ngo-store";
import { Widget } from "./Widget";

interface Headline {
  source: string;
  flag: string;
  headline: string;
  ago: string;
  topic: string;
  priority: "red" | "amber" | "green";
  saved?: boolean;
}

const BK: Headline[] = [
  { source: "Iwacu", flag: "🇧🇮", headline: "Tensions reported along Burundi-DRC border villages", ago: "2h ago", topic: "Security", priority: "red" },
  { source: "RFI", flag: "🇫🇷", headline: "New school year opens in Gitega province", ago: "5h ago", topic: "Education", priority: "green", saved: true },
  { source: "ReliefWeb", flag: "🌍", headline: "UNHCR notes uptick in returns from Tanzania", ago: "9h ago", topic: "Humanitarian", priority: "amber" },
  { source: "Le Renouveau", flag: "🇧🇮", headline: "Health ministry launches malaria prevention drive", ago: "1d ago", topic: "Health", priority: "green" },
  { source: "AFP", flag: "🇫🇷", headline: "Regional GBV survey reveals service gaps", ago: "1d ago", topic: "GBV", priority: "red", saved: true },
  { source: "SOS Médias Burundi", flag: "🇧🇮", headline: "Vocational center opens in Bujumbura suburb", ago: "2d ago", topic: "Education", priority: "green" },
];

const WTG: Headline[] = [
  { source: "The Guardian", flag: "🇬🇧", headline: "Donkey hide trade resurfaces in West African ports", ago: "1h ago", topic: "Animal Welfare", priority: "red" },
  { source: "Tagesschau", flag: "🇩🇪", headline: "Bundestag debates revised animal welfare act", ago: "4h ago", topic: "Animal Welfare DE", priority: "amber", saved: true },
  { source: "Reuters", flag: "🌍", headline: "EU panel reviews live transport limits", ago: "8h ago", topic: "International", priority: "amber" },
  { source: "DW", flag: "🇩🇪", headline: "German shelters report record intake numbers", ago: "11h ago", topic: "Animal Welfare DE", priority: "green" },
  { source: "ABC News", flag: "🇦🇺", headline: "Puppy trade crackdown nets dozens of dealers", ago: "1d ago", topic: "International", priority: "red" },
  { source: "Le Monde", flag: "🇫🇷", headline: "French farmers protest new welfare rules", ago: "2d ago", topic: "Agriculture", priority: "green" },
];

const DOT_COLOR: Record<Headline["priority"], string> = {
  red: "#E0533D",
  amber: "#E8A53D",
  green: "#2FA36B",
};

type Tab = "All" | "Urgent" | "Saved";

export function NewsWidget({ onRemove }: { onRemove?: () => void }) {
  const current = useNgoStore((s) => s.current);
  const rows = current?.id === "wtg" ? WTG : BK;
  const [tab, setTab] = useState<Tab>("All");

  const filtered = rows.filter((r) =>
    tab === "Urgent" ? r.priority === "red" : tab === "Saved" ? r.saved : true,
  );

  return (
    <Widget
      title="News Monitor"
      onRemove={onRemove}
      headerRight={<Segment value={tab} onChange={setTab} options={["All", "Urgent", "Saved"]} />}
    >
      <ul className="flex flex-col">
        {filtered.map((r, i) => (
          <li
            key={i}
            className="flex items-start gap-3 transition-colors hover:bg-[#FAF9F5]"
            style={{ padding: "13px 18px", borderTop: i === 0 ? "none" : "1px solid #F4F3EE" }}
          >
            <div
              className="flex shrink-0 items-center justify-center"
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "#F4F3EE",
                border: "1px solid #ECEBE4",
                fontSize: 18,
              }}
            >
              {r.flag}
            </div>
            <div className="min-w-0 flex-1">
              <div style={{ fontSize: 12, color: "#9B9B90" }}>
                <span style={{ color: "#83837A", fontWeight: 500 }}>{r.source}</span>
                {" · "}
                {r.ago}
              </div>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  lineHeight: 1.34,
                  letterSpacing: "-0.005em",
                  color: "#22221E",
                  marginTop: 2,
                }}
              >
                {r.headline}
              </div>
              <div className="mt-2">
                <Chip>{r.topic}</Chip>
              </div>
            </div>
            <span
              className="shrink-0"
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: DOT_COLOR[r.priority],
                marginTop: 6,
              }}
            />
          </li>
        ))}
      </ul>
    </Widget>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11.5,
        fontWeight: 500,
        color: "#6E6E64",
        background: "#F2F1EC",
        borderRadius: 7,
        padding: "3px 9px",
      }}
    >
      {children}
    </span>
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
              transition: "all .15s",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
