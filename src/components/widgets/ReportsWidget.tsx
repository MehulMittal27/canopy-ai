import { FileText } from "lucide-react";
import { useNgoStore } from "@/lib/ngo-store";

interface Doc {
  title: string;
  date: string;
  source: string;
}

const BK: Doc[] = [
  { title: "Q3 Field Report — Gitega Education Program", date: "12 Sep 2026", source: "Field team" },
  { title: "GBV Prevention Workshop Outcomes", date: "28 Aug 2026", source: "Partner: AFEM" },
  { title: "Annual Donor Report 2025", date: "15 Mar 2026", source: "HQ Bonn" },
  { title: "Vocational Training Curriculum v2", date: "02 Feb 2026", source: "Education lead" },
  { title: "Burundi Country Risk Brief", date: "10 Jan 2026", source: "Operations" },
];

const WTG: Doc[] = [
  { title: "Donkey Trade Investigation — Ghana", date: "18 Sep 2026", source: "Field team" },
  { title: "Stray Dog Program Annual Report", date: "05 Sep 2026", source: "Partner: HSI" },
  { title: "Animal Welfare Policy Submission", date: "20 Jul 2026", source: "Advocacy" },
  { title: "Social Media Monitoring Digest Q2", date: "30 Jun 2026", source: "Comms" },
  { title: "WTG Strategy 2026-2028", date: "11 Jan 2026", source: "HQ Berlin" },
];

export function ReportsWidget() {
  const current = useNgoStore((s) => s.current);
  const rows = current?.id === "wtg" ? WTG : BK;
  return (
    <ul className="flex flex-col divide-y divide-[#F1F1ED]">
      {rows.map((d, i) => (
        <li key={i} className="flex items-start gap-3 py-2.5">
          <FileText size={16} className="mt-0.5 shrink-0 text-[#6B7280]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-[#111827]">{d.title}</div>
            <div className="text-[12px] text-[#6B7280]">
              {d.date} · {d.source}
            </div>
          </div>
          <button
            type="button"
            onClick={() => console.log("view doc", d.title)}
            className="shrink-0 text-[12px] font-semibold text-[#0F766E] hover:underline"
          >
            View
          </button>
        </li>
      ))}
    </ul>
  );
}
