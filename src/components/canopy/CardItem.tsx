import { useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  Check,
  CheckCircle2,
  Send,
  XCircle,
} from "lucide-react";
import type { Item } from "@/data/items";
import {
  CATEGORY_LABEL,
  LANG_LABEL,
  URGENCY_META,
  daysUntil,
  formatDate,
} from "./shared";

export function CardItem({ item, ngoName }: { item: Item; ngoName: string }) {
  const meta = URGENCY_META[item.urgency];
  const translated = item.source_language !== "en";
  const [isRead, setIsRead] = useState(false);

  return (
    <article
      className={
        "rounded-xl border border-border border-l-4 bg-card p-4 transition-opacity " +
        meta.borderClass +
        (isRead ? " opacity-70" : "")
      }
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[color:var(--metadata)]">
        <span
          className="inline-flex items-center gap-1 font-semibold tracking-wide"
          style={{ color: meta.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
          {meta.label}
        </span>
        <span aria-hidden>·</span>
        <span className="rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-foreground">
          {CATEGORY_LABEL[item.category]}
        </span>
        <span aria-hidden>·</span>
        <span>
          {item.source}
          {translated && (
            <span className="ml-1 text-[color:var(--metadata)]">
              · {LANG_LABEL[item.source_language]}→EN
            </span>
          )}
        </span>
        <span aria-hidden>·</span>
        <span>{formatDate(item.published_at)}</span>
      </div>

      <h3 className="mt-2 text-[16px] font-semibold leading-snug text-foreground">
        {item.translated_title}
      </h3>

      {item.category === "funding" && <FundingStrip item={item} />}

      <p className="mt-2 text-[14px] leading-relaxed text-foreground">{item.summary}</p>

      <p className="mt-3 text-[13px] italic text-[color:var(--metadata)]">
        Why this matters for {ngoName}: {item.why_relevant}
      </p>

      <div className="mt-4 flex items-center justify-end gap-1">
        <IconBtn
          label={isRead ? "Mark as unread" : "Mark as read"}
          onClick={() => {
            console.log("mark-as-read", item.id);
            setIsRead((r) => !r);
          }}
        >
          <Check size={15} />
        </IconBtn>
        <IconBtn label="Save" onClick={() => console.log("save", item.id)}>
          <Bookmark size={15} />
        </IconBtn>
        <IconBtn label="Send to team" onClick={() => console.log("send", item.id)}>
          <Send size={15} />
        </IconBtn>
        <button
          onClick={() => console.log("open", item.id)}
          className="ml-2 text-[13px] font-semibold text-[color:var(--accent)] hover:underline"
        >
          Open
        </button>
      </div>
    </article>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--metadata)] hover:bg-secondary hover:text-foreground"
    >
      {children}
    </button>
  );
}

function FundingStrip({ item }: { item: Item }) {
  const verdict = item.eligibility_verdict;
  const deadline = item.funding_deadline;
  const days = deadline ? daysUntil(deadline) : null;
  const urgent = days !== null && days <= 7 && days >= 0;

  const amount =
    item.funding_amount_min && item.funding_amount_max
      ? `€${Math.round(item.funding_amount_min / 1000)}k to €${Math.round(item.funding_amount_max / 1000)}k`
      : null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[color:var(--metadata)]">
      {deadline &&
        (urgent ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626]/10 px-2 py-0.5 text-[11px] font-semibold text-[#DC2626]">
            ⏰ {days} {days === 1 ? "day" : "days"} left
          </span>
        ) : (
          <span>Deadline: {formatDate(deadline)}</span>
        ))}
      {amount && (
        <>
          {deadline && <span aria-hidden>·</span>}
          <span>{amount}</span>
        </>
      )}
      {verdict && (
        <>
          <span aria-hidden>·</span>
          <span>Eligible?</span>
          <VerdictPill verdict={verdict} />
        </>
      )}
    </div>
  );
}

export function VerdictPill({ verdict }: { verdict: "yes" | "check" | "no" }) {
  if (verdict === "yes") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#059669]/10 px-2 py-0.5 text-[11px] font-semibold text-[#059669]">
        <CheckCircle2 size={12} /> Yes
      </span>
    );
  }
  if (verdict === "check") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#D97706]/10 px-2 py-0.5 text-[11px] font-semibold text-[#D97706]">
        <AlertTriangle size={12} /> Check
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626]/10 px-2 py-0.5 text-[11px] font-semibold text-[#DC2626]">
      <XCircle size={12} /> No
    </span>
  );
}

export function Chip({
  children,
  active,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
        (active
          ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
          : "border-border bg-card text-foreground hover:border-[color:var(--accent)]") +
        (disabled ? " cursor-not-allowed opacity-80" : "")
      }
    >
      {children}
    </button>
  );
}
