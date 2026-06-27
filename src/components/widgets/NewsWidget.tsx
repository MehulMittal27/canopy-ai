import { useNgoStore } from "@/lib/ngo-store";

interface Headline {
  source: string;
  flag: string;
  headline: string;
  ago: string;
  topic: string;
}

const BK: Headline[] = [
  { source: "Iwacu", flag: "🇧🇮", headline: "Tensions reported along Burundi-DRC border villages", ago: "2h ago", topic: "Security" },
  { source: "RFI", flag: "🇫🇷", headline: "New school year opens in Gitega province", ago: "5h ago", topic: "Education" },
  { source: "ReliefWeb", flag: "🌍", headline: "UNHCR notes uptick in returns from Tanzania", ago: "9h ago", topic: "Humanitarian" },
  { source: "Le Renouveau", flag: "🇧🇮", headline: "Health ministry launches malaria prevention drive", ago: "1d ago", topic: "Health" },
  { source: "AFP", flag: "🇫🇷", headline: "Regional GBV survey reveals service gaps", ago: "1d ago", topic: "GBV" },
  { source: "SOS Médias Burundi", flag: "🇧🇮", headline: "Vocational center opens in Bujumbura suburb", ago: "2d ago", topic: "Education" },
];

const WTG: Headline[] = [
  { source: "The Guardian", flag: "🇬🇧", headline: "Donkey hide trade resurfaces in West African ports", ago: "1h ago", topic: "Animal Welfare" },
  { source: "Tagesschau", flag: "🇩🇪", headline: "Bundestag debates revised animal welfare act", ago: "4h ago", topic: "Animal Welfare DE" },
  { source: "Reuters", flag: "🌍", headline: "EU panel reviews live transport limits", ago: "8h ago", topic: "International" },
  { source: "DW", flag: "🇩🇪", headline: "German shelters report record intake numbers", ago: "11h ago", topic: "Animal Welfare DE" },
  { source: "ABC News", flag: "🇦🇺", headline: "Puppy trade crackdown nets dozens of dealers", ago: "1d ago", topic: "International" },
  { source: "Le Monde", flag: "🇫🇷", headline: "French farmers protest new welfare rules", ago: "2d ago", topic: "Agriculture" },
];

export function NewsWidget() {
  const current = useNgoStore((s) => s.current);
  const rows = current?.id === "wtg" ? WTG : BK;
  return (
    <ul className="flex flex-col divide-y divide-[#F1F1ED]">
      {rows.map((r, i) => (
        <li key={i} className="flex items-start gap-3 py-2">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-[#6B7280]">
              {r.flag} {r.source} · {r.ago}
            </div>
            <div className="truncate text-[13px] font-semibold text-[#111827]">{r.headline}</div>
          </div>
          <span className="shrink-0 rounded-full border border-[#E5E5E0] px-2 py-0.5 text-[11px] font-medium text-[#374151]">
            {r.topic}
          </span>
        </li>
      ))}
    </ul>
  );
}
