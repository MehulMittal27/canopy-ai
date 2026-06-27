import { useNgoStore } from "@/lib/ngo-store";
import { Widget } from "./Widget";

interface Row {
  funder: string;
  title: string;
  deadlineDays: number;
  amount: string;
  match: number; // 0-100
}

const BK: Row[] = [
  { funder: "BMZ", title: "Girls' Education in Fragile Contexts", deadlineDays: 4, amount: "€80k–€250k", match: 92 },
  { funder: "EU INTPA", title: "Civil Society in the Great Lakes Region", deadlineDays: 18, amount: "€150k–€500k", match: 84 },
  { funder: "UN Women", title: "GBV Prevention Innovation Fund", deadlineDays: 34, amount: "€40k–€120k", match: 76 },
  { funder: "GIZ", title: "Vocational Training Grants Africa", deadlineDays: 95, amount: "€100k–€300k", match: 68 },
];

const WTG: Row[] = [
  { funder: "Vier Pfoten Foundation", title: "Stray Animal Welfare Co-funding", deadlineDays: 5, amount: "€30k–€90k", match: 90 },
  { funder: "World Animal Net", title: "Donkey Trade Monitoring Grant", deadlineDays: 21, amount: "€25k–€75k", match: 82 },
  { funder: "EU LIFE Programme", title: "Animal Welfare in Agriculture", deadlineDays: 48, amount: "€200k–€600k", match: 74 },
  { funder: "Brigitte Bardot Foundation", title: "International Rescue Operations", deadlineDays: 80, amount: "€15k–€50k", match: 65 },
];

function deadlinePill(days: number) {
  if (days <= 7) return { label: `${days}d left`, color: "#CC4444", bg: "#FBE9E7" };
  if (days <= 30) return { label: `${days}d left`, color: "#B07814", bg: "#FBF1DC" };
  return { label: `${days}d left`, color: "#137A5C", bg: "#E7F3ED" };
}

export function FundingWidget({ onRemove }: { onRemove?: () => void }) {
  const current = useNgoStore((s) => s.current);
  const rows = current?.id === "wtg" ? WTG : BK;
  const closingSoon = rows.filter((r) => r.deadlineDays <= 14).length;

  return (
    <Widget
      title="Funding Tracker"
      onRemove={onRemove}
      topSlot={
        <div
          className="grid grid-cols-2 gap-3"
          style={{ padding: "16px 18px 4px" }}
        >
          <StatCard
            label="OPEN CALLS"
            value={rows.length.toString()}
            trend="+2 this week"
            bg="#F1F6F2"
            border="#E0EBE2"
            labelColor="#7F9A8A"
            trendColor="#137A5C"
          />
          <StatCard
            label="CLOSING SOON"
            value={closingSoon.toString()}
            trend="⚠ next 14 days"
            bg="#FBF4EC"
            border="#F0E4D2"
            labelColor="#B79268"
            trendColor="#C9772E"
          />
        </div>
      }
    >
      <ul className="flex flex-col">
        {rows.map((r, idx) => {
          const pill = deadlinePill(r.deadlineDays);
          return (
            <li
              key={idx}
              className="transition-colors hover:bg-[#FAF9F5]"
              style={{
                padding: "13px 18px",
                borderTop: idx === 0 ? "1px solid #F4F3EE" : "1px solid #F4F3EE",
                marginTop: idx === 0 ? 10 : 0,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 600,
                      letterSpacing: "-0.005em",
                      color: "#22221E",
                    }}
                  >
                    {r.funder}
                  </div>
                  <div style={{ fontSize: 13, color: "#8A8A80", marginTop: 3 }}>
                    {r.title}
                  </div>
                </div>
                <span
                  className="shrink-0"
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: pill.color,
                    background: pill.bg,
                    borderRadius: 8,
                    padding: "3px 9px",
                  }}
                >
                  {pill.label}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span style={{ fontSize: 12.5, color: "#9B9B90" }}>{r.amount}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#137A5C" }}>
                  {r.match}% match
                </span>
              </div>
              <div
                className="mt-2"
                style={{ height: 6, borderRadius: 99, background: "#EFEEE9", overflow: "hidden" }}
              >
                <div
                  style={{
                    width: `${r.match}%`,
                    height: "100%",
                    background: "#1A8A66",
                    borderRadius: 99,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Widget>
  );
}

function StatCard({
  label,
  value,
  trend,
  bg,
  border,
  labelColor,
  trendColor,
}: {
  label: string;
  value: string;
  trend: string;
  bg: string;
  border: string;
  labelColor: string;
  trendColor: string;
}) {
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: "13px 14px",
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: labelColor,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 29,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "#1B1B17",
          marginTop: 4,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: trendColor, marginTop: 2 }}>
        {trend}
      </div>
    </div>
  );
}
