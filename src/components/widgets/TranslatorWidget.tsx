import { useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { Widget } from "./Widget";
import { ExpandOverlay } from "./ExpandOverlay";


type Lang = "FR" | "RN" | "EN" | "DE" | "ES" | "AR";

const SOURCE_LANGS: { code: Lang; label: string }[] = [
  { code: "FR", label: "French (FR)" },
  { code: "RN", label: "Kirundi (RN)" },
  { code: "EN", label: "English (EN)" },
  { code: "DE", label: "German (DE)" },
  { code: "ES", label: "Spanish (ES)" },
  { code: "AR", label: "Arabic (AR)" },
];

const TARGET_LANGS: { code: TargetLang; label: string }[] = [
  { code: "EN", label: "English (EN)" },
  { code: "DE", label: "German (DE)" },
  { code: "FR", label: "French (FR)" },
];
type TargetLang = "EN" | "DE" | "FR";

const EXTRACTED_BY_LANG: Record<Lang, string> = {
  FR: "Hier à Bujumbura, le personnel partenaire a signalé une situation sécuritaire calme. L'école de Gitega a rouvert après les vacances. Aucun incident n'a été noté sur la route frontalière Burundi–RDC.",
  RN: "Ejo i Bujumbura, abakozi b'abafatanyabikorwa bavuze ko umutekano uri mwiza. Ishuri ryo i Gitega ryongeye gufungurwa nyuma y'ibiruhuko. Nta kintu kibi cyabaye ku muhanda uhuza Uburundi na RDC.",
  EN: "Yesterday in Bujumbura, partner staff reported a calm security situation. The school in Gitega reopened after the holiday break. No incidents were noted on the Burundi–DRC border road.",
  DE: "Gestern berichteten die Partnermitarbeiter in Bujumbura über eine ruhige Sicherheitslage. Die Schule in Gitega wurde nach den Ferien wiedereröffnet. Auf der Grenzstraße Burundi–DRK wurden keine Vorfälle gemeldet.",
  ES: "Ayer en Bujumbura, el personal asociado informó de una situación de seguridad tranquila. La escuela de Gitega reabrió tras las vacaciones. No se registraron incidentes en la carretera fronteriza Burundi–RDC.",
  AR: "أفاد موظفو الشركاء أمس في بوجومبورا بأن الوضع الأمني هادئ. أعيد افتتاح المدرسة في جيتيغا بعد العطلة. لم تُسجل أي حوادث على الطريق الحدودي بين بوروندي وجمهورية الكونغو الديمقراطية.",
};

const TRANSLATED_BY_LANG: Record<TargetLang, string> = {
  EN: "Yesterday in Bujumbura, partner staff reported a calm security situation. The school in Gitega reopened after the holiday break. No incidents were noted on the Burundi–DRC border road.",
  DE: "Gestern berichteten Partnermitarbeiter in Bujumbura über eine ruhige Sicherheitslage. Die Schule in Gitega hat nach den Ferien wieder geöffnet. Auf der Grenzstraße Burundi–DRK wurden keine Vorfälle gemeldet.",
  FR: "Hier à Bujumbura, le personnel partenaire a signalé une situation sécuritaire calme. L'école de Gitega a rouvert après les vacances. Aucun incident n'a été signalé sur la route frontalière Burundi–RDC.",
};

const selectCls =
  "appearance-none rounded-xl border border-[#E5E5E0] bg-white py-1 pl-3 pr-7 text-[13px] text-[#6B7280] focus:border-[#0F766E] focus:outline-none";

export function TranslatorWidget({ onRemove }: { onRemove?: () => void }) {
  const [source, setSource] = useState<Lang>("FR");
  const [target, setTarget] = useState<TargetLang>("EN");
  const [text, setText] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onSource = (val: Lang) => {
    setSource(val);
    if (val === target) {
      // pick first target option different from new source
      const alt = TARGET_LANGS.find((l) => l.code !== val);
      if (alt) setTarget(alt.code);
    }
  };

  const onTarget = (val: TargetLang) => {
    setTarget(val);
    if ((val as Lang) === source) {
      const alt = SOURCE_LANGS.find((l) => l.code !== val);
      if (alt) setSource(alt.code);
    }
  };

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setOut(null);
    if (f) setText("");
    e.target.value = "";
  };

  const clearFile = () => {
    setFile(null);
    setText("");
    setOut(null);
  };

  const translate = () => {
    if (file) {
      const extracted = EXTRACTED_BY_LANG[source];
      setText(extracted);
      setOut(null);
      window.setTimeout(() => {
        setOut(TRANSLATED_BY_LANG[target]);
      }, 1000);
      return;
    }
    setOut(TRANSLATED_BY_LANG[target]);
  };

  const canTranslate = file !== null || text.trim().length > 0;

  return (
    <Widget title="Translator" onRemove={onRemove}>
      <div className="flex h-full flex-col gap-2" style={{ padding: 16 }}>


      {/* Language selectors */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            aria-label="Source language"
            value={source}
            onChange={(e) => onSource(e.target.value as Lang)}
            className={selectCls}
          >
            {SOURCE_LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
        <span className="text-[13px] text-[#9CA3AF]">→</span>
        <div className="relative">
          <select
            aria-label="Target language"
            value={target}
            onChange={(e) => onTarget(e.target.value as TargetLang)}
            className={selectCls}
          >
            {TARGET_LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <Chevron />
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={file !== null}
        placeholder={
          file
            ? "Text extracted from uploaded document will appear here for review..."
            : "Paste French, Kirundi, or other text here..."
        }
        className="min-h-[80px] flex-1 resize-none rounded-md border border-[#E5E5E0] bg-white p-2 text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#0F766E] focus:outline-none disabled:bg-[#FAFAF8] disabled:text-[#6B7280]"
      />

      {/* Upload row */}
      <div className="flex items-center justify-between gap-2">
        {file ? (
          <div className="flex min-w-0 items-center gap-1.5 rounded-md border border-[#E5E5E0] bg-white px-2 py-1 text-[12px] text-[#374151]">
            <Paperclip size={12} className="shrink-0 text-[#6B7280]" />
            <span className="truncate">{file.name}</span>
            <button
              type="button"
              onClick={clearFile}
              aria-label="Remove file"
              className="ml-1 rounded p-0.5 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151]"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onPickFile}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E5E0] bg-white px-2 py-1 text-[12px] font-medium text-[#374151] hover:border-[#0F766E] hover:text-[#0F766E]"
          >
            <Paperclip size={12} />
            Upload document
          </button>
        )}
        <span className="shrink-0 text-[11px] text-[#9CA3AF]">.pdf .docx .txt</span>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      <button
        type="button"
        onClick={translate}
        disabled={!canTranslate}
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
    </Widget>
  );
}


function Chevron() {
  return (
    <svg
      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 4.5l3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
