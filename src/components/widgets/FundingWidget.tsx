import { useNgoStore } from "@/lib/ngo-store";

interface Row {
  funder: string;
  title: string;
  deadline: string; // ISO
  amount: string;
}

const BK: Row[] = [
  { funder: "BMZ", title: "Girls' Education in Fragile Contexts", deadline: addDays(5), amount: "€80k to €250k" },
  { funder: "EU INTPA", title: "Civil Society in the Great Lakes Region", deadline: addDays(18), amount: "€150k to €500k" },
  { funder: "UN Women", title: "GBV Prevention Innovation Fund", deadline: addDays(34), amount: "€40k to €120k" },
  { funder: "Stiftung Nord-Süd-Brücken", title: "Partner Capacity Building Burundi", deadline: addDays(62), amount: "€20k to €60k" },
  { funder: "GIZ", title: "Vocational Training Grants Africa", deadline: addDays(95), amount: "€100k to €300k" },
];

const WTG: Row[] = [
  { funder: "Vier Pfoten Foundation", title: "Stray Animal Welfare Co-funding", deadline: addDays(9), amount: "€30k to €90k" },
  { funder: "World Animal Net", title: "Donkey Trade Monitoring Grant", deadline: addDays(21), amount: "€25k to €75k" },
  { funder: "EU LIFE Programme", title: "Animal Welfare in Agriculture", deadline: addDays(48), amount: "€200k to €600k" },
  { funder: "Brigitte Bardot Foundation", title: "International Rescue Operations", deadline: addDays(80), amount: "€15k to €50k" },
];

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function FundingWidget() {
  const current = useNgoStore((s) => s.current);
  const rows = current?.id === "wtg" ? WTG : BK;

  return (
    <ul className="flex flex-col divide-y divide-[#F1F1ED]">
      {rows.map((r, idx) => {
        const days = daysUntil(r.deadline);
        const color = days < 14 ? "#DC2626" : days < 30 ? "#D97706" : "#059669";
        const bg = days < 14 ? "#FEF2F2" : days < 30 ? "#FFFBEB" : "#ECFDF5";
        return (
          <li key={idx} className="flex items-start gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-[#111827]">{r.funder}</div>
              <div className="truncate text-[13px] text-[#374151]">{r.title}</div>
              <div className="mt-0.5 text-[12px] text-[#6B7280]">{r.amount}</div>
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{ color, backgroundColor: bg }}
            >
              {fmt(r.deadline)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
