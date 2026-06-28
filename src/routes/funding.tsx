import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Search, Sparkles } from "lucide-react";
import { TopBar } from "@/components/canopy/TopBar";
import { Chip } from "@/components/canopy/CardItem";
import {
  FundingOpportunityCard,
  labelizeFundingValue,
} from "@/components/funding/FundingOpportunityCard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import {
  FUNDING_QUERY_KEY,
  analyzeFundingOpportunities,
  getFundingEligibility,
  getFundingOpportunities,
  getFundingPriority,
  refreshFundingOpportunities,
  type FundingEligibility,
  type FundingOpportunity,
  type FundingPriority,
} from "@/lib/api/funding";
import { useNgoStore } from "@/lib/ngo-store";
import { DetailHeader, EmptyState } from "./news";

export const Route = createFileRoute("/funding")({
  head: () => ({ meta: [{ title: "Funding · CANOPY" }] }),
  component: FundingRoute,
});

function FundingRoute() {
  return (
    <ProtectedRoute>
      <FundingView />
    </ProtectedRoute>
  );
}

type Sort = "urgency" | "deadline" | "eligibility" | "match";
type PriorityFilter = "all" | FundingPriority;
type EligibilityFilter = "all" | FundingEligibility;

const PRIORITY_RANK: Record<FundingPriority, number> = { red: 0, amber: 1, green: 2 };
const ELIGIBILITY_RANK: Record<FundingEligibility, number> = { yes: 0, check: 1, no: 2 };

function FundingView() {
  const current = useNgoStore((s) => s.current);
  const { org } = useAuth();
  if (!current) throw redirect({ to: "/login" });

  const queryClient = useQueryClient();
  const [activeTopics, setActiveTopics] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("urgency");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [eligibilityFilter, setEligibilityFilter] = useState<EligibilityFilter>("all");
  const [search, setSearch] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const queryKey = useMemo(() => [...FUNDING_QUERY_KEY, org?.id] as const, [org?.id]);
  const fundingQuery = useQuery({
    queryKey,
    queryFn: getFundingOpportunities,
    enabled: Boolean(org),
  });

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

  const analyzeMutation = useMutation({
    mutationFn: analyzeFundingOpportunities,
    onSuccess: async (result) => {
      setActionMessage(formatActionResult("Analysis", result));
      await queryClient.invalidateQueries({ queryKey: FUNDING_QUERY_KEY });
    },
    onError: (error) => {
      setActionMessage(error instanceof Error ? error.message : "Funding analysis failed.");
    },
  });

  const rows = fundingQuery.data ?? [];
  const topicOptions = useMemo(() => {
    const fromRows = rows.flatMap((row) => row.topics ?? []);
    return [...new Set([...current.topics, ...fromRows].filter(Boolean))].slice(0, 12);
  }, [current.topics, rows]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = rows;

    if (activeTopics.length > 0) {
      filtered = filtered.filter((row) =>
        (row.topics ?? []).some((topic) => activeTopics.includes(topic)),
      );
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((row) => getFundingPriority(row) === priorityFilter);
    }

    if (eligibilityFilter !== "all") {
      filtered = filtered.filter((row) => getFundingEligibility(row) === eligibilityFilter);
    }

    if (q) {
      filtered = filtered.filter((row) =>
        [
          row.title_de,
          row.title,
          row.title_original,
          row.funder,
          row.summary_de,
          row.description,
          ...(row.topics ?? []),
          ...(row.funders ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }

    const sorted = [...filtered];
    if (sort === "urgency") {
      sorted.sort((a, b) => {
        const priority = PRIORITY_RANK[getFundingPriority(a)] - PRIORITY_RANK[getFundingPriority(b)];
        if (priority !== 0) return priority;
        return deadlineMs(a) - deadlineMs(b);
      });
    } else if (sort === "deadline") {
      sorted.sort((a, b) => deadlineMs(a) - deadlineMs(b));
    } else if (sort === "eligibility") {
      sorted.sort(
        (a, b) =>
          ELIGIBILITY_RANK[getFundingEligibility(a)] - ELIGIBILITY_RANK[getFundingEligibility(b)],
      );
    } else {
      sorted.sort((a, b) => Number(b.match_score ?? 0) - Number(a.match_score ?? 0));
    }

    return sorted;
  }, [activeTopics, eligibilityFilter, priorityFilter, rows, search, sort]);

  const toggleTopic = (topic: string) =>
    setActiveTopics((previous) =>
      previous.includes(topic) ? previous.filter((item) => item !== topic) : [...previous, topic],
    );

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <DetailHeader
        title="Funding Opportunities"
        subtitle={`Grants, calls, and prizes for ${current.name}`}
      />

      <section className="mx-auto max-w-[1200px] border-b border-border px-6 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {topicOptions.map((topic) => (
            <Chip key={topic} active={activeTopics.includes(topic)} onClick={() => toggleTopic(topic)}>
              {labelizeFundingValue(topic)}
            </Chip>
          ))}
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <ActionButton
              label="Refresh"
              icon={
                refreshMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <RefreshCw size={13} />
                )
              }
              disabled={!org || refreshMutation.isPending || analyzeMutation.isPending}
              onClick={() => refreshMutation.mutate()}
            />
            <ActionButton
              label="Analyze"
              icon={
                analyzeMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )
              }
              disabled={!org || refreshMutation.isPending || analyzeMutation.isPending}
              onClick={() => analyzeMutation.mutate()}
            />
          </div>
        </div>

        <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(240px,1fr)_auto_auto_auto]">
          <label className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-[color:var(--metadata)]">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search funder, topic, source..."
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-[color:var(--metadata)]"
            />
          </label>
          <SelectFilter
            value={priorityFilter}
            onChange={(value) => setPriorityFilter(value as PriorityFilter)}
            options={[
              ["all", "All priority"],
              ["red", "Urgent"],
              ["amber", "Relevant"],
              ["green", "Info"],
            ]}
          />
          <SelectFilter
            value={eligibilityFilter}
            onChange={(value) => setEligibilityFilter(value as EligibilityFilter)}
            options={[
              ["all", "All eligibility"],
              ["yes", "Eligible"],
              ["check", "Check"],
              ["no", "Not eligible"],
            ]}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <SortBtn active={sort === "urgency"} onClick={() => setSort("urgency")}>
              Urgency
            </SortBtn>
            <SortBtn active={sort === "deadline"} onClick={() => setSort("deadline")}>
              Deadline
            </SortBtn>
            <SortBtn active={sort === "eligibility"} onClick={() => setSort("eligibility")}>
              Eligibility
            </SortBtn>
            <SortBtn active={sort === "match"} onClick={() => setSort("match")}>
              Match
            </SortBtn>
          </div>
        </div>

        {(actionMessage || fundingQuery.isError) && (
          <div className="mt-3 rounded-md border border-[#F0E4D2] bg-[#FBF4EC] px-3 py-2 text-sm font-medium text-[#B07814]">
            {actionMessage || "Funding opportunities could not load."}
          </div>
        )}
      </section>

      <main className="mx-auto max-w-[1200px] px-6 py-8">
        {fundingQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-[color:var(--metadata)]">
            <Loader2 size={16} className="animate-spin" />
            Loading funding opportunities...
          </div>
        ) : list.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-4">
            {list.map((item) => (
              <FundingOpportunityCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
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
      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors"
      style={{
        background: disabled ? "#F2F1EC" : "#E7F3ED",
        color: disabled ? "#9B9B90" : "#137A5C",
        borderColor: "#CFE3DC",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function SortBtn({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors " +
        (active
          ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
          : "border-border bg-card text-foreground hover:border-[color:var(--accent)]")
      }
    >
      {children}
    </button>
  );
}

function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-md border border-border bg-card px-2.5 py-2 text-sm font-medium text-foreground outline-none"
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
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

function deadlineMs(item: Pick<FundingOpportunity, "deadline">) {
  if (!item.deadline) return Number.POSITIVE_INFINITY;
  const time = new Date(`${item.deadline}T23:59:59`).getTime();
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}
