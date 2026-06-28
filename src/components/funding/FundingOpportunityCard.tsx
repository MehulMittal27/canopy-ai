import { type ReactNode } from "react";
import { Check, ExternalLink, Sparkles } from "lucide-react";
import {
  daysUntil,
  getFundingEligibility,
  getFundingPriority,
  type FundingOpportunity,
  type FundingPriority,
} from "@/lib/api/funding";

export function FundingOpportunityCard({ item }: { item: FundingOpportunity }) {
  const priority = getFundingPriority(item);
  const priorityStyle = fundingPriorityMeta(priority);
  const title = item.title_de || item.title || item.title_original || "Untitled opportunity";
  const summary = item.summary_de || item.description || "No summary available yet.";
  const sourceUrl = item.source_url || item.url;
  const amount = formatFundingAmount(item);
  const deadline = formatFundingDeadline(item.deadline, true);
  const match = clamp(Number(item.match_score ?? 0), 0, 100);
  const topics = item.topics?.length ? item.topics : [];
  const funders = item.funders?.length ? item.funders : item.funder ? [item.funder] : [];
  const sourceCode = sourceAcronym(item.funder || funders[0] || item.source_type || "Source");
  const assessment =
    item.eligibility_reason ||
    item.classification_reason ||
    "AI assessment is pending for this funding opportunity.";

  return (
    <article
      className="grid overflow-hidden bg-white lg:grid-cols-[minmax(0,1fr)_220px]"
      style={{
        border: "1px solid #EBEAE4",
        borderLeft: `4px solid ${priorityStyle.color}`,
        borderRadius: 18,
        boxShadow: "0 1px 2px rgba(20,20,18,.04), 0 14px 30px -24px rgba(20,20,18,.22)",
      }}
    >
      <div style={{ padding: "24px 26px" }}>
        <div className="flex flex-wrap items-center gap-2">
          <PriorityPill meta={priorityStyle} />
          <span
            className="inline-flex items-center justify-center"
            style={{
              minWidth: 28,
              height: 25,
              borderRadius: 8,
              background: "#E7F3ED",
              color: "#137A5C",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {sourceCode}
          </span>
          <span style={{ color: "#8A8A80", fontSize: 14.5, fontWeight: 600 }}>
            {item.funder || "Funding source"}
          </span>
        </div>

        <h3
          style={{
            marginTop: 16,
            color: "#1B1B17",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            marginTop: 12,
            color: "#6E6E64",
            fontSize: 17,
            lineHeight: 1.55,
          }}
        >
          {summary}
        </p>

        <div
          className="mt-6 grid gap-4 sm:grid-cols-[42px_1fr]"
          style={{
            background: "#F5FAF7",
            border: "1px solid #DDEEE7",
            borderRadius: 14,
            padding: "16px 18px",
          }}
        >
          <div
            className="flex h-[34px] w-[34px] items-center justify-center rounded-lg"
            style={{ background: "#138363", color: "#FFFFFF" }}
          >
            <Sparkles size={17} strokeWidth={2.3} />
          </div>
          <div>
            <div
              style={{
                color: "#439A76",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              AI Assessment
            </div>
            <p style={{ color: "#4D5A52", fontSize: 16, lineHeight: 1.45, marginTop: 6 }}>
              {assessment}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {topics.map((topic) => (
            <Tag key={topic}>{labelizeFundingValue(topic)}</Tag>
          ))}
          {funders.map((funder) => (
            <Tag key={funder}>{funder}</Tag>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #F4F3EE", marginTop: 18, paddingTop: 16 }}>
          <div className="flex flex-wrap gap-2">
            <RequirementBadge kind="own" value={item.own_contribution_required} />
            <RequirementBadge kind="nrw" value={item.nrw_required} />
            <RequirementBadge kind="burundi" value={item.applies_from_burundi_ok} />
            <EligibilityBadge value={getFundingEligibility(item)} />
          </div>
        </div>
      </div>

      <aside
        className="flex flex-col items-center justify-between gap-5 border-t lg:border-l lg:border-t-0"
        style={{ borderColor: "#EBEAE4", padding: "24px 24px" }}
      >
        <div
          className="w-full text-center"
          style={{
            background: priorityStyle.bg,
            color: priorityStyle.color,
            borderRadius: 10,
            padding: "9px 12px",
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          {deadline}
        </div>

        <div className="flex flex-col items-center gap-5">
          <MatchRing value={match} color={priorityStyle.color} />
          <div className="text-center">
            <div
              style={{
                color: "#A8A69B",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              Funding
            </div>
            <div style={{ color: "#1B1B17", fontSize: 18, fontWeight: 800, marginTop: 4 }}>
              {amount ?? "Check source"}
            </div>
          </div>
        </div>

        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 transition-colors hover:bg-[#F0F7F3]"
            style={{
              border: "1px solid #CFE3DC",
              borderRadius: 12,
              color: "#137A5C",
              fontSize: 15,
              fontWeight: 800,
              padding: "11px 14px",
            }}
          >
            Source <ExternalLink size={16} />
          </a>
        ) : (
          <span
            className="inline-flex w-full items-center justify-center"
            style={{
              border: "1px solid #EBEAE4",
              borderRadius: 12,
              color: "#9B9B90",
              fontSize: 15,
              fontWeight: 800,
              padding: "11px 14px",
            }}
          >
            No source
          </span>
        )}
      </aside>
    </article>
  );
}

export function fundingPriorityMeta(priority: FundingPriority) {
  if (priority === "red") {
    return {
      label: "Urgent",
      color: "#E0533D",
      bg: "#FBE9E7",
      ring: "rgba(224,83,61,.14)",
    };
  }
  if (priority === "amber") {
    return {
      label: "Relevant",
      color: "#D58A24",
      bg: "#FBF1DC",
      ring: "rgba(213,138,36,.16)",
    };
  }
  return {
    label: "Monitor",
    color: "#8A8A80",
    bg: "#F2F1EC",
    ring: "rgba(138,138,128,.14)",
  };
}

export function formatFundingAmount(item: FundingOpportunity) {
  const currency = item.amount_currency || "EUR";
  if (item.amount_min != null && item.amount_max != null) {
    return `${formatCurrency(item.amount_min, currency)}-${formatCurrency(item.amount_max, currency)}`;
  }
  if (item.amount_min != null) return `from ${formatCurrency(item.amount_min, currency)}`;
  if (item.amount_max != null) return `up to ${formatCurrency(item.amount_max, currency)}`;
  return null;
}

export function formatFundingDeadline(deadline: string | null, short = false) {
  const days = daysUntil(deadline);
  if (!deadline || days === null) return "No deadline";
  if (days < 0) return "Closed";
  if (days === 0) return "Due today";
  if (days === 1) return short ? "1d left" : "1 day left";
  return short ? `${days}d left` : `${days} days left`;
}

export function formatFundingUpdated(rows: FundingOpportunity[]) {
  const latest = rows
    .flatMap((row) => [row.ai_processed_at, row.created_at, row.published_date])
    .filter(Boolean)
    .map((value) => new Date(value as string).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => b - a)[0];

  if (!latest) return "ready";

  const minutes = Math.max(0, Math.round((Date.now() - latest) / 60_000));
  if (minutes < 1) return "updated just now";
  if (minutes < 60) return `updated ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `updated ${hours}h ago`;
  const days = Math.round(hours / 24);
  return `updated ${days}d ago`;
}

export function labelizeFundingValue(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function PriorityPill({
  meta,
}: {
  meta: ReturnType<typeof fundingPriorityMeta>;
}) {
  return (
    <span
      className="inline-flex items-center gap-2"
      style={{
        background: meta.bg,
        color: meta.color,
        borderRadius: 9,
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: "0.06em",
        padding: "7px 12px",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 99,
          background: meta.color,
        }}
      />
      {meta.label}
    </span>
  );
}

function MatchRing({ value, color }: { value: number; color: string }) {
  return (
    <div
      className="relative flex h-[126px] w-[126px] items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${value * 3.6}deg, #EFEEE9 0deg)`,
      }}
    >
      <div className="absolute h-[92px] w-[92px] rounded-full bg-white" />
      <div className="relative text-center">
        <div style={{ color, fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em" }}>
          {Math.round(value)}
          <span style={{ fontSize: 14 }}>%</span>
        </div>
        <div
          style={{
            color: "#A8A69B",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginTop: -2,
          }}
        >
          Match
        </div>
      </div>
    </div>
  );
}

function RequirementBadge({
  kind,
  value,
}: {
  kind: "own" | "nrw" | "burundi";
  value: boolean | null | undefined;
}) {
  if (kind === "own") {
    const text = value == null ? "Own contribution: Check" : value ? "Own contribution: Required" : "Own contribution: No";
    return <Badge tone={value ? "amber" : value === false ? "green" : "amber"} prefix="!">{text}</Badge>;
  }

  if (kind === "nrw") {
    const text = value == null ? "NRW required: Check" : value ? "NRW required: Yes" : "NRW required: No";
    return <Badge tone={value ? "amber" : "neutral"}>{text}</Badge>;
  }

  const text =
    value == null ? "Burundi partner OK: Check" : value ? "Burundi partner OK: Yes" : "Burundi partner OK: No";
  return (
    <Badge tone={value ? "green" : value === false ? "neutral" : "amber"} icon={value ? <Check size={14} /> : null}>
      {text}
    </Badge>
  );
}

function EligibilityBadge({ value }: { value: ReturnType<typeof getFundingEligibility> }) {
  if (value === "yes") return <Badge tone="green" icon={<Check size={14} />}>Eligible</Badge>;
  if (value === "no") return <Badge tone="neutral">Not eligible</Badge>;
  return <Badge tone="amber">Eligibility: Check</Badge>;
}

function Badge({
  children,
  tone,
  icon,
  prefix,
}: {
  children: ReactNode;
  tone: "green" | "amber" | "neutral";
  icon?: ReactNode;
  prefix?: string;
}) {
  const styles = {
    green: { color: "#137A5C", bg: "#E7F3ED" },
    amber: { color: "#C78323", bg: "#FBF1DC" },
    neutral: { color: "#6E6E64", bg: "#F2F1EC" },
  }[tone];

  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{
        background: styles.bg,
        color: styles.color,
        borderRadius: 9,
        padding: "7px 10px",
        fontSize: 13,
        fontWeight: 800,
      }}
    >
      {icon}
      {prefix && <span>{prefix}</span>}
      {children}
    </span>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        background: "#F2F1EC",
        color: "#6E6E64",
        borderRadius: 8,
        padding: "6px 11px",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function sourceAcronym(value: string) {
  const clean = value.replace(/[^a-zA-Z0-9\s-]/g, " ").trim();
  const first = clean.split(/\s+/)[0] ?? "";
  if (/^[A-Z0-9]{2,4}$/.test(first)) return first.slice(0, 4);
  const words = clean
    .split(/[\s-]+/)
    .filter((word) => word.length > 2 && !/^stiftung$/i.test(word));
  const acronym = words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
  return acronym || clean.slice(0, 2).toUpperCase() || "SO";
}

function formatCurrency(value: number, currency: string) {
  if (currency.toUpperCase() === "EUR") {
    if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}m`;
    if (value >= 1_000) return `€${Math.round(value / 1_000)}k`;
    return `€${value}`;
  }
  return `${currency} ${value.toLocaleString()}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
