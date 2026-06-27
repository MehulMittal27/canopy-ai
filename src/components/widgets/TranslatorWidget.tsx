import { useState } from "react";

const MOCK_OUTPUT =
  "Yesterday in Bujumbura, partner staff reported a calm security situation. The school in Gitega reopened after the holiday break. No incidents were noted on the Burundi–DRC border road.";

export function TranslatorWidget() {
  const [text, setText] = useState("");
  const [out, setOut] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-[#E5E5E0] px-2 py-0.5 text-[11px] font-medium text-[#6B7280]">
          FR → EN
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste French, Kirundi, or other text here..."
        className="min-h-[80px] flex-1 resize-none rounded-md border border-[#E5E5E0] bg-white p-2 text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#0F766E] focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setOut(MOCK_OUTPUT)}
        disabled={!text.trim()}
        className="rounded-md bg-[#0F766E] px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[#0F766E]/90 disabled:cursor-not-allowed disabled:bg-[#9CA3AF]"
      >
        Translate
      </button>
      {out && (
        <div className="rounded-md border border-[#E5E5E0] bg-[#FAFAF8] p-2 text-[13px] text-[#374151]">
          {out}
        </div>
      )}
    </div>
  );
}
