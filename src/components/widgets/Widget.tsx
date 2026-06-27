import { GripVertical, X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  onRemove?: () => void;
  children: ReactNode;
}

export function Widget({ title, onRemove, children }: Props) {
  return (
    <div className="group/widget flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#E5E5E0] bg-white shadow-sm">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[#E5E5E0] bg-white px-2">
        <button
          type="button"
          aria-label="Drag widget"
          className="widget-drag-handle flex h-6 w-6 cursor-grab items-center justify-center rounded text-[#6B7280] opacity-0 hover:bg-[#FAFAF8] group-hover/widget:opacity-100 active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 truncate text-[14px] font-semibold text-[#111827]">{title}</div>
        {onRemove && (
          <button
            type="button"
            aria-label="Remove widget"
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded text-[#6B7280] opacity-0 hover:bg-[#FAFAF8] hover:text-[#DC2626] group-hover/widget:opacity-100"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">{children}</div>
    </div>
  );
}
