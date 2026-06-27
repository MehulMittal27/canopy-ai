import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import {
  AlertCircle,
  Download,
  FileText,
  Languages,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import type { SourceLanguage, TargetLanguage } from "@/lib/api/translator";
import type { TranslatorSession } from "@/components/canopy/useTranslatorSession";

type TranslatorVariant = "compact" | "expanded" | "page";

const SOURCE_OPTIONS: { value: SourceLanguage; label: string }[] = [
  { value: "auto", label: "Detect automatically" },
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "rn", label: "Kirundi" },
  { value: "ar", label: "Arabic" },
];

const TARGET_OPTIONS: { value: TargetLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
];

const selectClass =
  "h-10 w-full rounded-md border border-[#EBEAE4] bg-white px-3 text-[13px] font-medium text-[#1B1B17] outline-none transition focus:border-[#137A5C] focus:ring-2 focus:ring-[#CFE3DC]";

export function TranslatorTool({
  session,
  variant = "compact",
}: {
  session: TranslatorSession;
  variant?: TranslatorVariant;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isCompact = variant === "compact";
  const isWide = variant !== "compact";
  const hasDraft =
    Boolean(session.file) || session.text.trim().length > 0 || Boolean(session.result);

  const openPicker = () => inputRef.current?.click();

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (nextFile) session.selectFile(nextFile);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) session.selectFile(nextFile);
  };

  const onDropKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <div
      className={
        isCompact
          ? "flex h-full flex-col gap-3 p-4"
          : "mx-auto flex w-full max-w-[1160px] flex-col gap-5 p-6 md:p-8"
      }
    >
      <div
        className={isWide ? "grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]" : "flex flex-col gap-3"}
      >
        <div className="flex min-w-0 flex-col gap-3">
          <div className={isCompact ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 gap-3"}>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[#6E6E64]">From</span>
              <select
                value={session.sourceLanguage}
                onChange={(event) =>
                  session.updateSourceLanguage(event.target.value as SourceLanguage)
                }
                className={selectClass}
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[#6E6E64]">To</span>
              <select
                value={session.targetLanguage}
                onChange={(event) =>
                  session.updateTargetLanguage(event.target.value as TargetLanguage)
                }
                className={selectClass}
              >
                {TARGET_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={openPicker}
            onKeyDown={onDropKeyDown}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={
              "flex cursor-pointer items-center gap-3 rounded-md border border-dashed px-3 py-3 text-left transition " +
              (isDragging
                ? "border-[#137A5C] bg-[#E7F3ED]"
                : "border-[#CFE3DC] bg-[#F0F7F3] hover:border-[#137A5C]")
            }
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#137A5C]">
              {session.file ? <FileText size={18} /> : <Upload size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              {session.file ? (
                <>
                  <div className="truncate text-[13px] font-semibold text-[#1B1B17]">
                    {session.file.name}
                  </div>
                  <div className="text-[12px] text-[#6E6E64]">
                    {(session.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[13px] font-semibold text-[#137A5C]">
                    {isCompact ? "Upload PDF" : "Drop a PDF here, or click to browse"}
                  </div>
                  {!isCompact && (
                    <div className="text-[12px] text-[#6E6E64]">PDF only, up to 8 MB</div>
                  )}
                </>
              )}
            </div>
            {session.file && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  session.clearFile();
                }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#6E6E64] hover:bg-white hover:text-[#1B1B17]"
                aria-label="Remove PDF"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={onFileInput}
            className="hidden"
          />

          <textarea
            value={session.text}
            onChange={(event) => session.updateText(event.target.value)}
            disabled={Boolean(session.file)}
            placeholder={
              session.file
                ? "PDF selected. Remove it to paste text instead."
                : "Paste source text here..."
            }
            className={
              "min-h-[96px] resize-none rounded-md border border-[#EBEAE4] bg-white p-3 text-[13px] leading-relaxed text-[#1B1B17] outline-none transition placeholder:text-[#9B9B90] focus:border-[#137A5C] focus:ring-2 focus:ring-[#CFE3DC] disabled:bg-[#FAF9F5] disabled:text-[#9B9B90] " +
              (isWide ? "md:min-h-[190px]" : "")
            }
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={session.translate}
              disabled={!session.canTranslate}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-[#137A5C] px-4 text-[13px] font-semibold text-white transition hover:bg-[#0F6B50] disabled:cursor-not-allowed disabled:bg-[#9B9B90]"
            >
              {session.status === "translating" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Languages size={15} />
              )}
              {session.status === "translating" ? "Translating" : "Translate"}
            </button>
            {hasDraft && (
              <button
                type="button"
                onClick={session.reset}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#EBEAE4] bg-white text-[#6E6E64] hover:border-[#CFE3DC] hover:bg-[#F0F7F3] hover:text-[#137A5C]"
                aria-label="Start a new translation"
              >
                <RefreshCw size={15} />
              </button>
            )}
          </div>
        </div>

        <ResultPanel session={session} isCompact={isCompact} />
      </div>
    </div>
  );
}

function ResultPanel({ session, isCompact }: { session: TranslatorSession; isCompact: boolean }) {
  if (session.status === "translating") {
    return (
      <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-md border border-[#EBEAE4] bg-[#FAF9F5] p-4 text-center">
        <Loader2 size={22} className="animate-spin text-[#137A5C]" />
        <div className="text-[13px] font-medium text-[#6E6E64]">Translating your document...</div>
      </div>
    );
  }

  if (session.error) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-[#F3C8C3] bg-[#FBE9E7] p-4 text-[#CC4444]">
        <div className="flex items-start gap-2 text-[13px] font-medium">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{session.error}</span>
        </div>
        <button
          type="button"
          onClick={session.translate}
          disabled={!session.canTranslate}
          className="self-start rounded-md bg-white px-3 py-1.5 text-[12px] font-semibold text-[#CC4444] hover:bg-[#FFF7F6] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!session.result) {
    if (isCompact) return null;

    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-md border border-dashed border-[#EBEAE4] bg-[#FAF9F5] p-8 text-center">
        <Languages size={26} className="text-[#137A5C]" />
        <p className="mt-3 max-w-[320px] text-[13px] leading-relaxed text-[#6E6E64]">
          Add source text or a PDF, then translate to generate a summary and downloadable document.
        </p>
      </div>
    );
  }

  const result = session.result;

  return (
    <div className="flex min-h-0 flex-col gap-3 rounded-md border border-[#EBEAE4] bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#137A5C]">
            Overview
          </div>
          <h3 className="mt-1 truncate text-[15px] font-semibold text-[#1B1B17]">{result.title}</h3>
          <div className="mt-1 text-[12px] text-[#6E6E64]">
            {result.detectedLanguage
              ? `Detected source: ${result.detectedLanguage}`
              : `Source: ${result.sourceLanguage}`}
          </div>
        </div>
        <button
          type="button"
          onClick={session.download}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-[#CFE3DC] bg-[#F0F7F3] px-3 text-[12px] font-semibold text-[#137A5C] hover:bg-[#E7F3ED]"
        >
          <Download size={14} />
          PDF
        </button>
      </div>

      <MarkdownPreview markdown={result.overviewMarkdown} compact={isCompact} />

      {result.warnings.length > 0 && (
        <div className="rounded-md border border-[#FBF1DC] bg-[#FFFAEF] p-3 text-[12px] leading-relaxed text-[#B07814]">
          {result.warnings.map((warning) => (
            <div key={warning}>- {warning}</div>
          ))}
        </div>
      )}

      {!isCompact ? (
        <div className="min-h-0 rounded-md border border-[#F4F3EE] bg-[#FAF9F5] p-4">
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.04em] text-[#6E6E64]">
            Translated document
          </div>
          <MarkdownPreview markdown={result.translatedMarkdown} />
        </div>
      ) : (
        <div className="rounded-md bg-[#FAF9F5] px-3 py-2 text-[12px] text-[#6E6E64]">
          Expand the widget to review the full translated document.
        </div>
      )}
    </div>
  );
}

function MarkdownPreview({ markdown, compact = false }: { markdown: string; compact?: boolean }) {
  const lines = markdown.split(/\r?\n/);

  return (
    <div
      className={
        "text-[13px] leading-relaxed text-[#1B1B17] " +
        (compact ? "max-h-[150px] overflow-hidden" : "max-h-[460px] overflow-auto pr-2")
      }
    >
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();

        if (!line) return <div key={index} className="h-2" />;

        const heading = line.match(/^#{1,4}\s+(.+)$/);
        if (heading) {
          return (
            <h4 key={index} className="mt-3 text-[13px] font-semibold text-[#1B1B17] first:mt-0">
              {heading[1]}
            </h4>
          );
        }

        const bullet = line.match(/^[-*]\s+(.+)$/);
        if (bullet) {
          return (
            <div key={index} className="flex gap-2">
              <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A06B]" />
              <span>{stripInlineMarkdown(bullet[1])}</span>
            </div>
          );
        }

        return (
          <p key={index} className="mb-2 last:mb-0">
            {stripInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}
