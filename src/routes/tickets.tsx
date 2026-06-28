import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Filter,
  Inbox,
  Plus,
  Search,
  UserRoundCheck,
} from "lucide-react";
import { TopBar } from "@/components/canopy/TopBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useNgoStore, type NgoId } from "@/lib/ngo-store";

export const Route = createFileRoute("/tickets")({
  head: () => ({ meta: [{ title: "Tickets · Canopy" }] }),
  component: TicketsRoute,
});

type TicketStatus = "open" | "in_progress" | "waiting" | "resolved";
type TicketPriority = "red" | "amber" | "green";

interface TicketItem {
  id: string;
  title: string;
  description: string;
  requester: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: string;
  project: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketDraft {
  title: string;
  description: string;
  priority: TicketPriority;
  assignee: string;
  project: string;
  source: string;
}

interface TicketFilters {
  status: "all" | TicketStatus;
  priority: "all" | TicketPriority;
  assignee: "all" | string;
  project: "all" | string;
  search: string;
}

const FONT_STACK =
  '"Schibsted Grotesk", -apple-system, "Helvetica Neue", Arial, sans-serif';
const STORAGE_KEY = "canopy.ticketPrototype.v1";

const STATUS_META: Record<
  TicketStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  open: { label: "Open", bg: "#FBE9E7", color: "#CC4444", border: "#F4C7C0" },
  in_progress: { label: "In progress", bg: "#FBF1DC", color: "#B07814", border: "#F4D9A0" },
  waiting: { label: "Waiting", bg: "#EEF2F0", color: "#5F6F69", border: "#DAE2DE" },
  resolved: { label: "Resolved", bg: "#E7F3ED", color: "#137A5C", border: "#CFE3DC" },
};

const PRIORITY_META: Record<TicketPriority, { label: string; dot: string; bg: string; color: string }> = {
  red: { label: "Critical", dot: "#E0533D", bg: "#FBE9E7", color: "#CC4444" },
  amber: { label: "Important", dot: "#E8A53D", bg: "#FBF1DC", color: "#B07814" },
  green: { label: "Normal", dot: "#2FA36B", bg: "#E7F3ED", color: "#137A5C" },
};

const ASSIGNEES = ["Amina Ndayizeye", "Jonas Weber", "Lea Fischer", "Shahin Khan"];
const PROJECTS_BY_NGO: Record<NgoId, string[]> = {
  bk: ["Burundi Kids", "Education", "Safeguarding", "Funding", "Translation"],
  wtg: ["WTG", "Animal Welfare", "International", "Policy", "Communications"],
};

const EMPTY_FILTERS: TicketFilters = {
  status: "all",
  priority: "all",
  assignee: "all",
  project: "all",
  search: "",
};

function TicketsRoute() {
  return (
    <ProtectedRoute>
      <TicketsPage />
    </ProtectedRoute>
  );
}

function TicketsPage() {
  const current = useNgoStore((s) => s.current);
  if (!current) throw redirect({ to: "/login" });

  const { tickets, ready, createTicket, updateTicket } = useTicketPrototype(current.id);
  const [filters, setFilters] = useState<TicketFilters>(EMPTY_FILTERS);
  const [composerOpen, setComposerOpen] = useState(false);
  const projects = PROJECTS_BY_NGO[current.id];

  const visibleTickets = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (filters.status !== "all" && ticket.status !== filters.status) return false;
      if (filters.priority !== "all" && ticket.priority !== filters.priority) return false;
      if (filters.assignee !== "all" && ticket.assignee !== filters.assignee) return false;
      if (filters.project !== "all" && ticket.project !== filters.project) return false;
      if (!query) return true;
      return `${ticket.title} ${ticket.description} ${ticket.requester} ${ticket.source}`
        .toLowerCase()
        .includes(query);
    });
  }, [filters, tickets]);

  const stats = useMemo(
    () => ({
      open: tickets.filter((ticket) => ticket.status === "open").length,
      waiting: tickets.filter((ticket) => ticket.status === "waiting").length,
      active: tickets.filter((ticket) => ticket.status === "in_progress").length,
      resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
    }),
    [tickets],
  );

  const resetFilters = () => setFilters(EMPTY_FILTERS);

  return (
    <div
      className="min-h-screen"
      style={{ background: "#F2F1EC", color: "#1B1B17", fontFamily: FONT_STACK }}
    >
      <TopBar />
      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <section className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div
              className="text-[12px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "#A0A096" }}
            >
              Ticket Desk
            </div>
            <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.03em] text-[#1B1B17]">
              {current.name} support queue
            </h1>
            <p className="mt-1 max-w-[620px] text-[15px] leading-6 text-[#6E6E64]">
              Turn inbox items, field requests, and partner follow-ups into assignable tasks.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-[11px] border px-4 text-[14px] font-semibold"
            style={{
              background: "#16A06B",
              borderColor: "#16A06B",
              color: "#FFFFFF",
              boxShadow: "0 14px 30px -18px rgba(22,160,107,.7)",
            }}
          >
            <Plus size={17} strokeWidth={2} />
            New ticket
          </button>
        </section>

        <section className="mt-7 grid gap-4 lg:grid-cols-4">
          <StatCard label="Open tickets" value={stats.open} icon={<Inbox size={28} />} />
          <StatCard label="Waiting reply" value={stats.waiting} icon={<Clock3 size={28} />} />
          <StatCard label="In progress" value={stats.active} icon={<CircleDot size={28} />} />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 size={28} />} />
        </section>

        <section
          className="mt-7 rounded-[18px] border bg-white p-4"
          style={{
            borderColor: "#EBEAE4",
            boxShadow: "0 1px 2px rgba(20,20,18,.04), 0 14px 30px -22px rgba(20,20,18,.22)",
          }}
        >
          <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr_.8fr_.9fr_.9fr_auto]">
            <SearchField
              value={filters.search}
              onChange={(search) => setFilters((prev) => ({ ...prev, search }))}
            />
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(status) =>
                setFilters((prev) => ({ ...prev, status: status as TicketFilters["status"] }))
              }
              options={[
                ["all", "All status"],
                ["open", "Open"],
                ["in_progress", "In progress"],
                ["waiting", "Waiting"],
                ["resolved", "Resolved"],
              ]}
            />
            <FilterSelect
              label="Priority"
              value={filters.priority}
              onChange={(priority) =>
                setFilters((prev) => ({
                  ...prev,
                  priority: priority as TicketFilters["priority"],
                }))
              }
              options={[
                ["all", "All priority"],
                ["red", "Critical"],
                ["amber", "Important"],
                ["green", "Normal"],
              ]}
            />
            <FilterSelect
              label="Assignee"
              value={filters.assignee}
              onChange={(assignee) => setFilters((prev) => ({ ...prev, assignee }))}
              options={[["all", "All assignees"], ...ASSIGNEES.map((name) => [name, name] as const)]}
            />
            <FilterSelect
              label="Project"
              value={filters.project}
              onChange={(project) => setFilters((prev) => ({ ...prev, project }))}
              options={[["all", "All projects"], ...projects.map((name) => [name, name] as const)]}
            />
            <button
              type="button"
              onClick={resetFilters}
              className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border px-4 text-[14px] font-semibold"
              style={{ borderColor: "#CFE3DC", color: "#137A5C", background: "#F0F7F3" }}
            >
              <Filter size={15} />
              Reset
            </button>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[18px] border bg-white" style={{ borderColor: "#EBEAE4" }}>
          <div className="overflow-x-auto">
            <div className="min-w-[1040px]">
              <div className="grid grid-cols-[44px_1.7fr_.85fr_.85fr_.95fr_.85fr_.85fr] items-center gap-4 border-b border-[#F4F3EE] px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9B9B90]">
                <span />
                <span>Title</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Assignee</span>
                <span>Updated</span>
                <span>Created</span>
              </div>

              {!ready && (
                <div className="px-5 py-12 text-center text-[14px] text-[#6E6E64]">
                  Loading ticket workspace...
                </div>
              )}

              {ready && visibleTickets.length === 0 && (
                <div className="px-5 py-12 text-center">
                  <div className="text-[15px] font-semibold text-[#1B1B17]">
                    No tickets match this view.
                  </div>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-3 text-[13px] font-semibold text-[#137A5C] hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              <div className="divide-y divide-[#F4F3EE]">
                {visibleTickets.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    onChange={(patch) => updateTicket(ticket.id, patch)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {composerOpen && (
        <TicketComposer
          currentNgoId={current.id}
          onClose={() => setComposerOpen(false)}
          onCreate={(draft) => {
            createTicket(draft);
            setComposerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-[18px] border bg-white p-6"
      style={{
        borderColor: "#EBEAE4",
        boxShadow: "0 1px 2px rgba(20,20,18,.04), 0 14px 30px -22px rgba(20,20,18,.22)",
      }}
    >
      <div className="text-[14px] font-medium text-[#6E6E64]">{label}</div>
      <div className="mt-4 text-[42px] font-semibold leading-none tracking-[-0.05em] text-[#11120F]">
        {String(value).padStart(2, "0")}
      </div>
      <div className="absolute -bottom-5 right-5 text-[#F4F3EE]">{icon}</div>
    </div>
  );
}

function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-2 block text-[13px] font-semibold text-[#1B1B17]">Search</span>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B90]" size={16} />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Request, donor, project..."
          className="h-11 w-full rounded-[10px] border bg-white pl-9 pr-3 text-[14px] outline-none"
          style={{ borderColor: "#E6E5DF", color: "#1B1B17" }}
        />
      </div>
    </label>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label>
      <span className="mb-2 block text-[13px] font-semibold text-[#1B1B17]">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-[10px] border bg-white px-3 pr-9 text-[14px] outline-none"
          style={{ borderColor: "#E6E5DF", color: "#3A3A34" }}
        >
          {options.map(([id, optionLabel]) => (
            <option key={id} value={id}>
              {optionLabel}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B90]"
        />
      </span>
    </label>
  );
}

function TicketRow({
  ticket,
  onChange,
}: {
  ticket: TicketItem;
  onChange: (patch: Partial<TicketItem>) => void;
}) {
  const status = STATUS_META[ticket.status];
  const priority = PRIORITY_META[ticket.priority];

  return (
    <article className="grid grid-cols-[44px_1.7fr_.85fr_.85fr_.95fr_.85fr_.85fr] items-center gap-4 px-5 py-5 hover:bg-[#FAF9F5]">
      <span className="flex h-5 w-5 items-center justify-center rounded border border-[#D8D7D0]" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="truncate text-[18px] font-semibold tracking-[-0.02em] text-[#1B1B17]">
            {ticket.title}
          </h2>
          <span className="text-[15px] font-medium text-[#9B9B90]">#{ticket.id}</span>
        </div>
        <p className="mt-1 truncate text-[13px] text-[#6E6E64]">{ticket.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-[#137A5C]">{ticket.requester}</span>
          <span className="rounded-md bg-[#F4F3EE] px-2 py-1 text-[12px] font-medium text-[#6E6E64]">
            {ticket.project}
          </span>
          <span className="rounded-md bg-[#F4F3EE] px-2 py-1 text-[12px] font-medium text-[#6E6E64]">
            {ticket.source}
          </span>
        </div>
      </div>
      <InlineSelect
        value={ticket.status}
        onChange={(statusValue) =>
          onChange({ status: statusValue as TicketStatus, updatedAt: new Date().toISOString() })
        }
        options={[
          ["open", "Open"],
          ["in_progress", "In progress"],
          ["waiting", "Waiting"],
          ["resolved", "Resolved"],
        ]}
        prefix={<span className="h-2 w-2 rounded-full" style={{ background: status.color }} />}
        bg={status.bg}
        color={status.color}
        border={status.border}
      />
      <InlineSelect
        value={ticket.priority}
        onChange={(priorityValue) =>
          onChange({
            priority: priorityValue as TicketPriority,
            updatedAt: new Date().toISOString(),
          })
        }
        options={[
          ["red", "Critical"],
          ["amber", "Important"],
          ["green", "Normal"],
        ]}
        prefix={<span className="h-3 w-3 rounded-[4px]" style={{ background: priority.dot }} />}
        bg={priority.bg}
        color={priority.color}
        border="transparent"
      />
      <InlineSelect
        value={ticket.assignee}
        onChange={(assignee) => onChange({ assignee, updatedAt: new Date().toISOString() })}
        options={ASSIGNEES.map((name) => [name, name] as const)}
        prefix={<Avatar name={ticket.assignee} />}
        bg="#FFFFFF"
        color="#1B1B17"
        border="#EBEAE4"
      />
      <TimeLabel value={ticket.updatedAt} />
      <TimeLabel value={ticket.createdAt} />
    </article>
  );
}

function InlineSelect({
  value,
  onChange,
  options,
  prefix,
  bg,
  color,
  border,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
  prefix: React.ReactNode;
  bg: string;
  color: string;
  border: string;
}) {
  return (
    <label className="relative flex min-w-0 items-center gap-2">
      <span className="absolute left-3 z-10 flex items-center">{prefix}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full appearance-none rounded-[10px] border pl-9 pr-8 text-[13px] font-semibold outline-none"
        style={{ background: bg, borderColor: border, color }}
      >
        {options.map(([id, optionLabel]) => (
          <option key={id} value={id}>
            {optionLabel}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 text-[#9B9B90]"
      />
    </label>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
      style={{ background: "#137A5C" }}
    >
      {name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)}
    </span>
  );
}

function TimeLabel({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6E6E64]">
      <Clock3 size={15} strokeWidth={1.8} className="text-[#9B9B90]" />
      {timeAgo(value)}
    </span>
  );
}

function TicketComposer({
  currentNgoId,
  onClose,
  onCreate,
}: {
  currentNgoId: NgoId;
  onClose: () => void;
  onCreate: (draft: TicketDraft) => void;
}) {
  const projects = PROJECTS_BY_NGO[currentNgoId];
  const [draft, setDraft] = useState<TicketDraft>({
    title: "",
    description: "",
    priority: "amber",
    assignee: ASSIGNEES[0],
    project: projects[0],
    source: "Manual",
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    onCreate({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim() || "No description added yet.",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,18,.28)] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-[620px] rounded-[18px] border bg-white p-5"
        style={{
          borderColor: "#EBEAE4",
          boxShadow: "0 24px 70px -30px rgba(20,20,18,.45)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#9B9B90]">
              New ticket
            </div>
            <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-[#1B1B17]">
              Create and assign work
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-[#E6E5DF] px-3 py-2 text-[13px] font-semibold text-[#6E6E64]"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label>
            <span className="mb-2 block text-[13px] font-semibold text-[#1B1B17]">Title</span>
            <input
              autoFocus
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Follow up on donor reporting request"
              className="h-11 w-full rounded-[10px] border border-[#E6E5DF] px-3 text-[14px] outline-none"
            />
          </label>
          <label>
            <span className="mb-2 block text-[13px] font-semibold text-[#1B1B17]">
              Description
            </span>
            <textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Add context, deadline, or the next action."
              className="min-h-[110px] w-full resize-none rounded-[10px] border border-[#E6E5DF] px-3 py-3 text-[14px] outline-none"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <FilterSelect
              label="Priority"
              value={draft.priority}
              onChange={(priority) =>
                setDraft((prev) => ({ ...prev, priority: priority as TicketPriority }))
              }
              options={[
                ["red", "Critical"],
                ["amber", "Important"],
                ["green", "Normal"],
              ]}
            />
            <FilterSelect
              label="Assignee"
              value={draft.assignee}
              onChange={(assignee) => setDraft((prev) => ({ ...prev, assignee }))}
              options={ASSIGNEES.map((name) => [name, name] as const)}
            />
            <FilterSelect
              label="Project"
              value={draft.project}
              onChange={(project) => setDraft((prev) => ({ ...prev, project }))}
              options={projects.map((name) => [name, name] as const)}
            />
            <FilterSelect
              label="Source"
              value={draft.source}
              onChange={(source) => setDraft((prev) => ({ ...prev, source }))}
              options={[
                ["Manual", "Manual"],
                ["Inbox", "Inbox"],
                ["Field report", "Field report"],
                ["Partner call", "Partner call"],
              ]}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-[#E6E5DF] px-4 py-2 text-[14px] font-semibold text-[#6E6E64]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-[10px] border px-4 py-2 text-[14px] font-semibold"
            style={{ background: "#16A06B", borderColor: "#16A06B", color: "#FFFFFF" }}
          >
            <UserRoundCheck size={16} />
            Create ticket
          </button>
        </div>
      </form>
    </div>
  );
}

function useTicketPrototype(ngoId: NgoId) {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredTickets();
    const next = stored[ngoId] ?? seedTickets(ngoId);
    setTickets(next);
    setReady(true);
  }, [ngoId]);

  useEffect(() => {
    if (!ready) return;
    const stored = readStoredTickets();
    stored[ngoId] = tickets;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [ngoId, ready, tickets]);

  const createTicket = (draft: TicketDraft) => {
    const now = new Date().toISOString();
    setTickets((prev) => [
      {
        id: String(Math.floor(240 + Math.random() * 700)),
        title: draft.title,
        description: draft.description,
        requester: "Team request",
        status: "open",
        priority: draft.priority,
        assignee: draft.assignee,
        project: draft.project,
        source: draft.source,
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ]);
  };

  const updateTicket = (id: string, patch: Partial<TicketItem>) => {
    setTickets((prev) =>
      prev.map((ticket) => (ticket.id === id ? { ...ticket, ...patch } : ticket)),
    );
  };

  return { tickets, ready, createTicket, updateTicket };
}

function readStoredTickets(): Record<string, TicketItem[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, TicketItem[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function seedTickets(ngoId: NgoId): TicketItem[] {
  const shared = ngoId === "bk" ? "Burundi Kids" : "WTG";
  return [
    {
      id: "233",
      title: ngoId === "bk" ? "Donor clarification due this week" : "Policy briefing review",
      description:
        ngoId === "bk"
          ? "Confirm answers for the education grant follow-up and assign one owner."
          : "Review country notes before the animal welfare coalition call.",
      requester: ngoId === "bk" ? "Michael Vaughn" : "Lea Fischer",
      status: "waiting",
      priority: "red",
      assignee: "Amina Ndayizeye",
      project: ngoId === "bk" ? "Funding" : "Policy",
      source: "Inbox",
      createdAt: daysAgo(2),
      updatedAt: hoursAgo(3),
    },
    {
      id: "232",
      title: ngoId === "bk" ? "Translate school permit notice" : "Assign field photos to comms",
      description:
        ngoId === "bk"
          ? "French source needs a short English summary for the programme lead."
          : "New partner materials need review before posting in the update deck.",
      requester: ngoId === "bk" ? "Robert Fox" : "Jonas Weber",
      status: "resolved",
      priority: "green",
      assignee: "Jonas Weber",
      project: ngoId === "bk" ? "Translation" : "Communications",
      source: "Field report",
      createdAt: daysAgo(2),
      updatedAt: hoursAgo(4),
    },
    {
      id: "231",
      title: ngoId === "bk" ? "Safeguarding incident triage" : "Emergency veterinary request",
      description:
        ngoId === "bk"
          ? "Review the internal note, confirm severity, and route to the right staff member."
          : "Partner asks whether Canopy can track the request and assign an owner.",
      requester: ngoId === "bk" ? "Ollie Pepe" : "Mina Patel",
      status: "in_progress",
      priority: "amber",
      assignee: "Lea Fischer",
      project: ngoId === "bk" ? "Safeguarding" : "Animal Welfare",
      source: "Partner call",
      createdAt: daysAgo(4),
      updatedAt: hoursAgo(9),
    },
    {
      id: "230",
      title: ngoId === "bk" ? "Monthly board pack actions" : "International partner follow-up",
      description:
        ngoId === "bk"
          ? "Collect three open tasks from the board pack and close assigned items."
          : "Split notes from the partner call into owners and next steps.",
      requester: "Canopy team",
      status: "open",
      priority: "amber",
      assignee: "Shahin Khan",
      project: shared,
      source: "Manual",
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    },
  ];
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
