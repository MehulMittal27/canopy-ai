import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onClose: () => void;
  /** Optional right-side controls in the overlay top bar (between title and close). */
  headerRight?: ReactNode;
  children: ReactNode;
}

const FONT_STACK =
  '"Schibsted Grotesk", -apple-system, "Helvetica Neue", Arial, sans-serif';

/** Reusable expand-icon button (two diagonal arrows). */
export function ExpandIconButton({
  onClick,
  ariaLabel = "Expand",
  collapse = false,
}: {
  onClick: () => void;
  ariaLabel?: string;
  collapse?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="expand-icon-btn flex items-center justify-center"
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        background: "transparent",
        color: "#9B9B90",
        border: "none",
        cursor: "pointer",
        opacity: 0.6,
        transition: "background .15s, color .15s, opacity .15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#F2F1EC";
        e.currentTarget.style.color = "#3A3A34";
        e.currentTarget.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "#9B9B90";
        e.currentTarget.style.opacity = "0.6";
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {collapse ? (
          <>
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </>
        ) : (
          <>
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </>
        )}
      </svg>
    </button>
  );
}

export function ExpandOverlay({ title, subtitle, icon, onClose, headerRight, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div style={{ fontFamily: FONT_STACK }}>
      <div
        onClick={onClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(20,20,18,.5)",
          zIndex: 50,
          animation: "canopy-overlay-fade 180ms ease forwards",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed",
          inset: 40,
          background: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(20,20,18,.28)",
          zIndex: 51,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "canopy-overlay-rise 200ms ease-out forwards",
        }}
      >
        <div
          className="flex items-center gap-3 shrink-0"
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid #EBEAE4",
            background: "#FFFFFF",
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {icon && (
              <div
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: "#E7F3ED",
                  color: "#137A5C",
                }}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div
                className="truncate"
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  letterSpacing: "-.02em",
                  color: "#1B1B17",
                  lineHeight: 1.15,
                }}
              >
                {title}
              </div>
              {subtitle && (
                <div
                  className="truncate"
                  style={{
                    color: "#9B9B90",
                    fontSize: 12.5,
                    fontWeight: 600,
                    marginTop: 3,
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          {headerRight}
          <ExpandIconButton onClick={onClose} ariaLabel="Collapse" collapse />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "transparent",
              color: "#3A3A34",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F2F1EC")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ padding: 0 }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes canopy-overlay-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes canopy-overlay-rise {
          from { opacity: 0; transform: translateY(16px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </div>,
    document.body,
  );
}
