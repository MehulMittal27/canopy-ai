import { Link } from "@tanstack/react-router";
import { Bell, ListTodo, MessageCircle, Settings as SettingsIcon } from "lucide-react";
import { useNgoStore } from "@/lib/ngo-store";
import { useItemsStore } from "@/lib/items-store";
import { CanopyLogo } from "@/components/canopy/Logo";

export function TopBar() {
  const current = useNgoStore((s) => s.current);
  const items = useItemsStore((s) => s.items);

  if (!current) return null;

  const urgent = items.filter((i) => i.ngo_id === current.id && i.urgency === "red").length;

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "rgba(255,255,255,.86)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #E9E8E2",
      }}
    >
      <div
        className="mx-auto flex max-w-[1440px] items-center justify-between"
        style={{ padding: "13px 26px" }}
      >
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <CanopyLogo size={22} />
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

          <div
            className="inline-flex items-center gap-1.5"
            style={{
              background: "#FFFFFF",
              border: "1px solid #E6E5DF",
              borderRadius: 999,
              padding: "5px 11px 5px 9px",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1B1B17" }}>
              {current.name}
            </span>
          </div>

          <Link
            to="/tickets"
            className="inline-flex items-center gap-1.5 hover:bg-[#F0F7F3]"
            style={{
              background: "#FFFFFF",
              border: "1px solid #CFE3DC",
              borderRadius: 999,
              padding: "5px 11px",
              color: "#137A5C",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <ListTodo size={14} strokeWidth={1.8} />
            Ticketing
          </Link>

          <Link
            to="/connections"
            className="inline-flex items-center gap-1.5 hover:bg-[#F0F7F3]"
            style={{
              background: "#FFFFFF",
              border: "1px solid #CFE3DC",
              borderRadius: 999,
              padding: "5px 11px",
              color: "#137A5C",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <MessageCircle size={14} strokeWidth={1.8} />
            Connections
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex items-center justify-center hover:bg-[#EDECE6]"
            style={{ width: 38, height: 38, borderRadius: 11, color: "#3A3A34" }}
          >
            <Bell size={18} strokeWidth={1.6} />
            {urgent > 0 && (
              <span
                className="absolute"
                style={{
                  top: 6,
                  right: 6,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: "#E0533D",
                  color: "#FFFFFF",
                  fontSize: 9.5,
                  fontWeight: 700,
                  border: "2px solid #FFFFFF",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {urgent}
              </span>
            )}
          </button>
          <Link
            to="/settings"
            aria-label="Settings"
            className="flex items-center justify-center hover:bg-[#EDECE6]"
            style={{ width: 38, height: 38, borderRadius: 11, color: "#3A3A34" }}
          >
            <SettingsIcon size={18} strokeWidth={1.6} />
          </Link>
        </div>
      </div>
    </header>
  );
}
