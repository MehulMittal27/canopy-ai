import { X } from "lucide-react";
import type { ReactNode } from "react";
import { ExpandIconButton } from "./ExpandOverlay";

interface Props {
  title: string;
  onRemove?: () => void;
  onExpand?: () => void;
  /** Optional right-aligned slot in the widget header (e.g. segment tabs, badges). */
  headerRight?: ReactNode;
  /** Optional left-aligned slot before the title (e.g. badge, icon tile). */
  headerLeft?: ReactNode;
  /** Optional fixed body content above the scroll area (e.g. stat strip). */
  topSlot?: ReactNode;
  children: ReactNode;
}

/**
 * Canopy widget shell — matches the Canopy_Dashboard.html reference.
 * White card, 18px radius, soft layered shadow, header row with drag handle.
 */
export function Widget({ title, onRemove, headerRight, headerLeft, topSlot, children }: Props) {
  return (
    <div
      className="group/widget flex h-full w-full flex-col overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "1px solid #EBEAE4",
        borderRadius: 18,
        boxShadow:
          "0 1px 2px rgba(20,20,18,.04), 0 14px 30px -22px rgba(20,20,18,.22)",
      }}
    >
      <div
        className="flex shrink-0 items-center gap-3"
        style={{ padding: "15px 18px", borderBottom: "1px solid #F2F1EC" }}
      >
        <button
          type="button"
          aria-label="Drag widget"
          className="widget-drag-handle grid cursor-grab grid-cols-2 grid-rows-3 active:cursor-grabbing"
          style={{ gap: 2, opacity: 0.4 }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 3,
                height: 3,
                borderRadius: 999,
                background: "#9A9A92",
                display: "block",
              }}
            />
          ))}
        </button>
        {headerLeft}
        <div
          className="flex-1 truncate"
          style={{
            fontSize: 15.5,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "#1B1B17",
          }}
        >
          {title}
        </div>
        {headerRight}
        {onRemove && (
          <button
            type="button"
            aria-label="Remove widget"
            onClick={onRemove}
            className="flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-opacity group-hover/widget:opacity-100"
            style={{ color: "#6E6E64" }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {topSlot}
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
