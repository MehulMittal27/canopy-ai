import { Link } from "@tanstack/react-router";
import { Bell, Mail, Settings as SettingsIcon } from "lucide-react";
import { useNgoStore } from "@/lib/ngo-store";
import { useItemsStore } from "@/lib/items-store";
import { CanopyLogo } from "@/components/canopy/Logo";

export function TopBar() {
  const current = useNgoStore((s) => s.current);
  const items = useItemsStore((s) => s.items);

  if (!current) return null;

  const hasUrgentRed = items.some((i) => i.ngo_id === current.id && i.urgency === "red");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-6">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground"
        >
          <CanopyLogo size={22} />
          CANOPY
        </Link>

        <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground">
          {current.name}
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
