import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useNgoStore } from "@/lib/ngo-store";
import { InboxLayout, FONT_STACK } from "@/components/inbox/InboxLayout";

type Search = { id?: string };

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "Inbox · Canopy" }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  component: InboxPage,
});

function InboxPage() {
  const current = useNgoStore((s) => s.current);
  if (!current) throw redirect({ to: "/login" });


  const navigate = useNavigate();
  const search = Route.useSearch();

  const handleSelect = (id: string) => {
    if (search.id !== id) {
      navigate({ to: "/inbox", search: { id }, replace: true, resetScroll: false });
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "#F2F1EC", fontFamily: FONT_STACK, color: "#1B1B17" }}
    >
      <TopNav />
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 56px)" }}>
        <div className="flex-1">
          <InboxLayout selectedId={search.id} onSelectId={handleSelect} backTo="/dashboard" />
        </div>
      </div>
    </div>
  );
}

function TopNav() {
  const current = useNgoStore((s) => s.current);
  if (!current) return null;
  return (
    <header
      className="sticky top-0 z-10"
      style={{
        background: "rgba(255,255,255,.86)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #E9E8E2",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "13px 26px", height: 56 }}
      >
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#16A06B",
              boxShadow: "0 0 0 3px rgba(22,160,107,.16)",
              display: "block",
            }}
          />
          <span
            style={{
              fontWeight: 700,
              letterSpacing: "0.15em",
              fontSize: 14,
              color: "#1B1B17",
            }}
          >
            CANOPY
          </span>
        </Link>
        <span style={{ fontSize: 13, color: "#6E6E64" }}>{current.name}</span>
      </div>
    </header>
  );
}
