import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Check, ChevronDown, Mail, Settings as SettingsIcon } from "lucide-react";
import { NGOS, useNgoStore, type NgoId } from "@/lib/ngo-store";
import { useItemsStore } from "@/lib/items-store";

export function TopBar() {
  const current = useNgoStore((s) => s.current);
  const setNgo = useNgoStore((s) => s.setNgo);
  const items = useItemsStore((s) => s.items);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!current) return null;

  const hasUrgentRed = items.some((i) => i.ngo_id === current.id && i.urgency === "red");

  const switchNgo = (id: NgoId) => {
    setNgo(NGOS[id]);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-6 px-6">
        <Link
          to="/dashboard"
          className="text-[15px] font-semibold tracking-tight text-foreground"
        >
          CANOPY
        </Link>

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:border-[color:var(--accent)]"
          >
            {current.name}
            <ChevronDown size={14} className="text-[color:var(--metadata)]" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
              <div className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-md border border-border bg-card shadow-md">
                {(["bk", "wtg"] as NgoId[]).map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      switchNgo(id);
                      navigate({ to: "/dashboard" });
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    {NGOS[id].name}
                    {current.id === id && (
                      <Check size={14} className="text-[color:var(--accent)]" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => console.log("open today's email")}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--accent)] px-3 py-1.5 text-sm font-medium text-[color:var(--accent)] hover:bg-[color:var(--accent)]/5"
          >
            <Mail size={14} />
            Today's Email
          </button>
          <button
            onClick={() => console.log("notifications")}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--metadata)] hover:bg-secondary"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {hasUrgentRed && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#DC2626]" />
            )}
          </button>
          <Link
            to="/settings"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--metadata)] hover:bg-secondary"
          >
            <SettingsIcon size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
