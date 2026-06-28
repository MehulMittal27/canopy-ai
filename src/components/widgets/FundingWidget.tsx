import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import {
  FundingOpportunityCard,
  formatFundingAmount,
  formatFundingDeadline,
  formatFundingUpdated,
  fundingPriorityMeta,
} from "@/components/funding/FundingOpportunityCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  FUNDING_QUERY_KEY,
  getFundingOpportunities,
  getFundingPriority,
  refreshFundingOpportunities,
  type FundingEligibility,
  type FundingOpportunity,
} from "@/lib/api/funding";
import { Widget } from "./Widget";
import { ExpandOverlay } from "./ExpandOverlay";

export function FundingWidget({ onRemove }: { onRemove?: () => void }) {
  const { org } = useAuth();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const queryKey = useMemo(() => [...FUNDING_QUERY_KEY, org?.id] as const, [org?.id]);
  const fundingQuery = useQuery({
    queryKey,
    queryFn: getFundingOpportunities,
    enabled: Boolean(org),
  });

  const rows = fundingQuery.data ?? [];
  const stats = useFundingStats(rows);

  const refreshMutation = useMutation({
    mutationFn: () => refreshFundingOpportunities(true),
    onSuccess: async (result) => {
      setActionMessage(formatActionResult("Refresh", result));
      await queryClient.invalidateQueries({ queryKey: FUNDING_QUERY_KEY });
    },
    onError: (error) => {
      setActionMessage(error instanceof Error ? error.message : "Funding refresh failed.");
    },
  });

  const statStrip = (
    <div className="grid grid-cols-3 gap-3" style={{ padding: "16px 18px 4px" }}>
      <StatCard
        label="OPEN CALLS"
        value={stats.total.toString()}
        trend={`${stats.analyzed} analyzed`}
        bg="#F1F6F2"
        border="#E0EBE2"
        labelColor="#7F9A8A"
        trendColor="#137A5C"
      />
      <StatCard
        label="URGENT"
        value={stats.red.toString()}
        trend="next 14 days"
        bg="#FBE9E7"
        border="#F5C8C2"
        labelColor="#C9786D"
        trendColor="#CC4444"
      />
      <StatCard
        label="RELEVANT"
        value={stats.amber.toString()}
        trend="monitor"
        bg="#FBF4EC"
        border="#F0E4D2"
        labelColor="#B79268"
        trendColor="#B07814"
      />
    </div>
  );

  const statusMessage =
    actionMessage ||
    (fundingQuery.isError
      ? "Funding opportunities could not load. Try refreshing once the migration is applied."
      : null);
  const actionsDisabled = !org || refreshMutation.isPending;
  const expandedActions = (
    <FundingActions
      refreshing={refreshMutation.isPending}
      disabled={!org}
      compact
      onRefresh={() => refreshMutation.mutate()}
    />
  );

  return (
    <>
      <Widget
        title="Funding Tracker"
        onRemove={onRemove}
        onExpand={() => setExpanded(true)}
        topSlot={statStrip}
      >
        <FundingList
          rows={rows}
          loading={fundingQuery.isLoading}
          message={statusMessage}
          detailed={false}
          emptyAction={
            <ActionButton
              label="Refresh funding"
              icon={
                refreshMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RefreshCw size={13} />
                )
              }
              disabled={actionsDisabled}
              onClick={() => refreshMutation.mutate()}
            />
          }
        />
      </Widget>

      {expanded && (
        <ExpandOverlay
          title="Funding Tracker"
          subtitle={`${org?.name ?? "Workspace"} · ${formatFundingUpdated(rows)}`}
          icon={<Sparkles size={19} strokeWidth={2.2} />}
          headerRight={expandedActions}
          onClose={() => setExpanded(false)}
        >
          <FundingList
            rows={rows}
            loading={fundingQuery.isLoading}
            message={statusMessage}
            detailed
          />
        </ExpandOverlay>
      )}
    </>
  );
}

function FundingActions({
  refreshing,
  disabled,
  onRefresh,
  compact = false,
}: {
  refreshing: boolean;
  disabled: boolean;
  onRefresh: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-end gap-2"
      style={{ padding: compact ? 0 : "12px 18px 4px" }}
    >
      <ActionButton
        label="Refresh"
        icon={refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        disabled={disabled || refreshing}
        onClick={onRefresh}
      />
    </div>
  );
}

function ActionButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 transition-colors"
      style={{
        background: disabled ? "#F2F1EC" : "#E7F3ED",
        color: disabled ? "#9B9B90" : "#137A5C",
        border: "1px solid #CFE3DC",
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 700,
        padding: "6px 10px",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function FundingList({
  rows,
  loading,
  message,
  detailed,
  emptyAction,
}: {
  rows: FundingOpportunity[];
  loading: boolean;
  message: string | null;
  detailed: boolean;
  emptyAction?: ReactNode;
}) {
  if (detailed) {
    return (
      <div style={{ background: "#F2F1EC", minHeight: "100%", padding: "22px" }}>
        {(loading || message) && (
          <div
            className="mb-4 flex items-center gap-2"
            style={{
              color: message ? "#B07814" : "#6E6E64",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>{message ?? "Loading funding opportunities..."}</span>
          </div>
        )}
        {rows.length === 0 && !loading ? (
          <div
            className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-[18px] bg-white"
            style={{ border: "1px solid #EBEAE4", color: "#9B9B90", fontSize: 14 }}
          >
            <span>No funding opportunities yet.</span>
            {emptyAction}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {rows.map((row) => (
              <FundingOpportunityCard key={row.id} item={row} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {(loading || message) && (
        <li
          className="flex items-center gap-2"
          style={{
            padding: "10px 18px",
            borderTop: "1px solid #F4F3EE",
            color: message ? "#B07814" : "#6E6E64",
            fontSize: 12.5,
          }}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          <span>{message ?? "Loading funding opportunities..."}</span>
        </li>
      )}
      {rows.map((row, idx) => (
        <FundingRow key={row.id} row={row} first={idx === 0} />
      ))}
      {rows.length === 0 && !loading && (
        <li
          className="flex flex-col items-center justify-center gap-3"
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#9B9B90",
            fontSize: 13,
          }}
        >
          <span>No funding opportunities yet.</span>
          {emptyAction}
        </li>
      )}
    </ul>
  );
}

function FundingRow({
  row,
  first,
}: {
  row: FundingOpportunity;
  first: boolean;
}) {
  const priority = getFundingPriority(row);
  const priorityStyle = fundingPriorityMeta(priority);
  const eligibility = row.eligibility ?? "check";
  const title = row.title_de || row.title || row.title_original || "Untitled opportunity";
  const amount = formatFundingAmount(row);
  const deadline = formatFundingDeadline(row.deadline, true);

  return (
    <li
      className="transition-colors hover:bg-[#FAF9F5]"
      style={{
        padding: "13px 18px",
        borderTop: first ? "1px solid #F4F3EE" : "1px solid #F4F3EE",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                color: priorityStyle.color,
                fontSize: 11.5,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  background: priorityStyle.color,
                  boxShadow: `0 0 0 4px ${priorityStyle.ring}`,
                }}
              />
              {priorityStyle.label}
            </span>
            <span style={{ color: "#9B9B90", fontSize: 12 }}>{row.funder || "Funding source"}</span>
          </div>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              letterSpacing: "-0.005em",
              color: "#22221E",
              marginTop: 5,
              lineHeight: 1.25,
            }}
          >
            {title}
          </div>
        </div>
        <span
          className="shrink-0"
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: priorityStyle.color,
            background: priorityStyle.bg,
            borderRadius: 8,
            padding: "4px 9px",
          }}
        >
          {deadline}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2" style={{ fontSize: 12.5, color: "#9B9B90" }}>
          {amount && <span>{amount}</span>}
          <EligibilityPill eligibility={eligibility} />
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#137A5C" }}>
          {Number(row.match_score ?? 0)}% match
        </span>
      </div>

      <div
        className="mt-2"
        style={{ height: 6, borderRadius: 99, background: "#EFEEE9", overflow: "hidden" }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, Number(row.match_score ?? 0)))}%`,
            height: "100%",
            background: priorityStyle.color,
            borderRadius: 99,
          }}
        />
      </div>
    </li>
  );
}

function EligibilityPill({ eligibility }: { eligibility: FundingEligibility | "check" }) {
  const meta = eligibilityMeta(eligibility);
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{
        color: meta.color,
        background: meta.bg,
        borderRadius: 999,
        padding: "3px 8px",
        fontSize: 11.5,
        fontWeight: 800,
      }}
    >
      {meta.label}
    </span>
  );
}

function useFundingStats(rows: FundingOpportunity[]) {
  return useMemo(() => {
    const counts = rows.reduce(
      (acc, row) => {
        const priority = getFundingPriority(row);
        acc[priority] += 1;
        if (row.ai_processed_at || row.summary_de || row.eligibility) acc.analyzed += 1;
        return acc;
      },
      { total: rows.length, red: 0, amber: 0, green: 0, analyzed: 0 },
    );
    return counts;
  }, [rows]);
}

function formatActionResult(
  label: string,
  result: {
    inserted?: number;
    processed?: number;
    updated: number;
    skipped: number;
    warnings: string[];
  },
) {
  const started = result.inserted != null ? `${result.inserted} added` : `${result.processed ?? 0} processed`;
  const base = `${label}: ${started}, ${result.updated} updated`;
  const skipped = result.skipped ? `, ${result.skipped} skipped` : "";
  const warning = result.warnings[0] ? `. ${result.warnings[0]}` : ".";
  return `${base}${skipped}${warning}`;
}

function eligibilityMeta(eligibility: FundingEligibility) {
  if (eligibility === "yes") return { label: "Eligible", color: "#137A5C", bg: "#E7F3ED" };
  if (eligibility === "no") return { label: "Not eligible", color: "#6E6E64", bg: "#F2F1EC" };
  return { label: "Check", color: "#B07814", bg: "#FBF1DC" };
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
        minWidth: 0,
      }}
    >
      <div
        className="truncate"
        style={{
          fontSize: 10.5,
          fontWeight: 700,
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
      <div className="truncate" style={{ fontSize: 12, fontWeight: 600, color: trendColor, marginTop: 2 }}>
        {trend}
      </div>
    </div>
  );
}
