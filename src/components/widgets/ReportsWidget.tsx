import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Loader2, UploadCloud } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createDocumentDownloadUrl,
  getDocuments,
  uploadDocumentToS3,
  type CanopyDocument,
  type DocumentCategory,
  type DocumentFileType,
} from "@/lib/api/documents";
import { useNgoStore } from "@/lib/ngo-store";
import { Widget } from "./Widget";
import { ExpandOverlay } from "./ExpandOverlay";

interface Doc {
  id: string;
  title: string;
  date: string;
  source: string;
  type: DocumentFileType;
  category: DocumentCategory;
  fileSize: string;
  uploadedAt: string;
  s3Key?: string | null;
}

interface UploadDraft {
  file: File;
  title: string;
  category: DocumentCategory;
  source: string;
  docDate: string;
}

const BK: Doc[] = [
  { id: "bk-q3-field", title: "Q3 Field Report — Gitega Education Program", date: "12 Sep 2026", source: "Field team", type: "PDF", category: "Field", fileSize: "—", uploadedAt: "Demo data" },
  { id: "bk-gbv-outcomes", title: "GBV Prevention Workshop Outcomes", date: "28 Aug 2026", source: "Partner: AFEM", type: "DOCX", category: "Field", fileSize: "—", uploadedAt: "Demo data" },
  { id: "bk-annual-donor", title: "Annual Donor Report 2025", date: "15 Mar 2026", source: "HQ Bonn", type: "PDF", category: "Donor", fileSize: "—", uploadedAt: "Demo data" },
  { id: "bk-curriculum", title: "Vocational Training Curriculum v2", date: "02 Feb 2026", source: "Education lead", type: "DOCX", category: "Field", fileSize: "—", uploadedAt: "Demo data" },
  { id: "bk-risk-brief", title: "Burundi Country Risk Brief", date: "10 Jan 2026", source: "Operations", type: "PDF", category: "Donor", fileSize: "—", uploadedAt: "Demo data" },
  { id: "bk-capacity", title: "Partner Capacity Assessment — AFEM", date: "05 Dec 2025", source: "M&E", type: "DOCX", category: "Field", fileSize: "—", uploadedAt: "Demo data" },
  { id: "bk-quarterly-donor", title: "Quarterly Donor Update Q4 2025", date: "10 Nov 2025", source: "HQ Bonn", type: "PDF", category: "Donor", fileSize: "—", uploadedAt: "Demo data" },
];

const WTG: Doc[] = [
  { id: "wtg-donkey-trade", title: "Donkey Trade Investigation — Ghana", date: "18 Sep 2026", source: "Field team", type: "PDF", category: "Field", fileSize: "—", uploadedAt: "Demo data" },
  { id: "wtg-stray-dog", title: "Stray Dog Program Annual Report", date: "05 Sep 2026", source: "Partner: HSI", type: "PDF", category: "Donor", fileSize: "—", uploadedAt: "Demo data" },
  { id: "wtg-policy", title: "Animal Welfare Policy Submission", date: "20 Jul 2026", source: "Advocacy", type: "DOCX", category: "Field", fileSize: "—", uploadedAt: "Demo data" },
  { id: "wtg-social-digest", title: "Social Media Monitoring Digest Q2", date: "30 Jun 2026", source: "Comms", type: "DOCX", category: "Donor", fileSize: "—", uploadedAt: "Demo data" },
  { id: "wtg-strategy", title: "WTG Strategy 2026-2028", date: "11 Jan 2026", source: "HQ Berlin", type: "PDF", category: "Donor", fileSize: "—", uploadedAt: "Demo data" },
  { id: "wtg-kenya-shelters", title: "Field Visit Report — Kenya Shelters", date: "20 Oct 2025", source: "Programs", type: "PDF", category: "Field", fileSize: "—", uploadedAt: "Demo data" },
];

type Tab = "All" | "Field" | "Donor";

const CATEGORIES: DocumentCategory[] = ["Field", "Donor", "Advocacy", "Communications"];

export function ReportsWidget({ onRemove }: { onRemove?: () => void }) {
  const current = useNgoStore((s) => s.current);
  const { org } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fallbackRows = current?.id === "wtg" ? WTG : BK;
  const [tab, setTab] = useState<Tab>("All");
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<UploadDraft | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
    enabled: Boolean(org),
  });

  const rows = useMemo(() => {
    if (!documentsQuery.data) return fallbackRows;
    return documentsQuery.data.map(toDocRow);
  }, [documentsQuery.data, fallbackRows]);

  const filtered = rows.filter((r) => (tab === "All" ? true : r.category === tab));

  const fullFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? filtered.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.source.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q),
        )
      : filtered;
  }, [filtered, search]);

  const uploadMutation = useMutation({
    mutationFn: async (nextDraft: UploadDraft) => {
      if (!org) throw new Error("You must be signed in to upload documents.");
      return uploadDocumentToS3({
        orgId: org.id,
        file: nextDraft.file,
        title: nextDraft.title,
        category: nextDraft.category,
        source: nextDraft.source,
        docDate: nextDraft.docDate,
      });
    },
    onSuccess: async () => {
      setDraft(null);
      setUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error) => {
      setUploadError(error instanceof Error ? error.message : "Document upload failed.");
    },
  });

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = inferFileType(file);
    if (!fileType) {
      setUploadError("Only PDF, DOCX, and XLSX documents are supported.");
      event.target.value = "";
      return;
    }

    setUploadError(null);
    setDraft({
      file,
      title: titleFromFileName(file.name),
      category: "Field",
      source: current?.name ? `${current.name} team` : "Uploaded document",
      docDate: new Date().toISOString().slice(0, 10),
    });
  };

  const submitUpload = (event: FormEvent) => {
    event.preventDefault();
    if (!draft || uploadMutation.isPending) return;
    uploadMutation.mutate(draft);
  };

  const viewDocument = async (doc: Doc) => {
    setDownloadError(null);

    if (!doc.s3Key || !org) {
      setDownloadError("This document does not have an uploaded file attached yet.");
      return;
    }

    const nextWindow = window.open("about:blank", "_blank", "noopener,noreferrer");
    try {
      const url = await createDocumentDownloadUrl(org.id, doc.id);
      if (nextWindow) {
        nextWindow.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (error) {
      nextWindow?.close();
      setDownloadError(error instanceof Error ? error.message : "Could not open document.");
    }
  };

  const tabs = (
    <Segment value={tab} onChange={setTab} options={["All", "Field", "Donor"]} />
  );
  const headerRight = (
    <div className="flex items-center gap-2">
      <UploadButton
        disabled={!org || uploadMutation.isPending}
        loading={uploadMutation.isPending}
        onClick={() => fileInputRef.current?.click()}
      />
      {tabs}
    </div>
  );
  const statusMessage =
    uploadError ||
    downloadError ||
    (documentsQuery.isError ? "Live documents could not load. Showing the demo list." : null);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={onFileChange}
      />

      <Widget
        title="Reports & Documents"
        onRemove={onRemove}
        onExpand={() => setExpanded(true)}
        headerRight={headerRight}
      >
        <DocList
          rows={filtered}
          isLoading={documentsQuery.isLoading}
          message={statusMessage}
          onView={viewDocument}
        />
      </Widget>

      {expanded && (
        <ExpandOverlay
          title="Reports & Documents"
          onClose={() => setExpanded(false)}
          headerRight={headerRight}
        >
          <div
            style={{
              padding: "12px 22px",
              borderBottom: "1px solid #EBEAE4",
              background: "#FFFFFF",
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 16,
                color: "#22221E",
                background: "transparent",
              }}
            />
          </div>
          <DocList
            rows={fullFiltered}
            isLoading={documentsQuery.isLoading}
            message={statusMessage}
            onView={viewDocument}
            variant="table"
          />
        </ExpandOverlay>
      )}

      {draft && (
        <UploadDialog
          draft={draft}
          error={uploadError}
          loading={uploadMutation.isPending}
          onChange={(nextDraft) => {
            setDraft(nextDraft);
            setUploadError(null);
          }}
          onCancel={() => {
            if (uploadMutation.isPending) return;
            setDraft(null);
            setUploadError(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          onSubmit={submitUpload}
        />
      )}
    </>
  );
}

function DocList({
  rows,
  isLoading,
  message,
  onView,
  variant = "list",
}: {
  rows: Doc[];
  isLoading?: boolean;
  message?: string | null;
  onView: (doc: Doc) => void;
  variant?: "list" | "table";
}) {
  if (variant === "table") {
    return (
      <DocumentTable
        rows={rows}
        isLoading={isLoading}
        message={message}
        onView={onView}
      />
    );
  }

  return (
    <ul className="flex flex-col">
      {(isLoading || message) && (
        <li
          className="flex items-center gap-2"
          style={{
            padding: "10px 18px",
            borderBottom: "1px solid #F4F3EE",
            color: message ? "#B07814" : "#6E6E64",
            fontSize: 12.5,
          }}
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          <span>{message ?? "Loading documents..."}</span>
        </li>
      )}
      {rows.map((d, i) => {
        const tile = tileStyleForType(d.type);
        return (
          <li
            key={d.id}
            className="flex items-center gap-3 transition-colors hover:bg-[#FAF9F5]"
            style={{
              padding: "13px 18px",
              borderTop: i === 0 && !isLoading && !message ? "none" : "1px solid #F4F3EE",
            }}
          >
            <div
              className="flex shrink-0 items-center justify-center"
              style={{
                width: 38,
                height: 44,
                borderRadius: 9,
                background: tile.bg,
                color: tile.color,
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            >
              {d.type}
            </div>
            <div className="min-w-0 flex-1">
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  letterSpacing: "-0.005em",
                  color: "#22221E",
                }}
              >
                {d.title}
              </div>
              <div style={{ fontSize: 12.5, color: "#9B9B90", marginTop: 3 }}>
                {d.date} · {d.source}
              </div>
            </div>
            <button
              type="button"
              className="shrink-0 transition-colors"
              onClick={() => onView(d)}
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "#137A5C",
                background: "#FFFFFF",
                border: "1px solid #CFE3DC",
                borderRadius: 9,
                padding: "6px 14px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F0F7F3")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
            >
              View
            </button>
          </li>
        );
      })}
      {rows.length === 0 && !isLoading && (
        <li
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#9B9B90",
            fontSize: 13,
          }}
        >
          No documents match.
        </li>
      )}
    </ul>
  );
}

function DocumentTable({
  rows,
  isLoading,
  message,
  onView,
}: {
  rows: Doc[];
  isLoading?: boolean;
  message?: string | null;
  onView: (doc: Doc) => void;
}) {
  const gridTemplateColumns = "minmax(300px, 1.6fr) minmax(110px, .55fr) minmax(150px, .7fr) minmax(110px, .5fr) minmax(130px, .65fr) 82px";

  return (
    <div style={{ overflowX: "auto" }}>
      {(isLoading || message) && (
        <div
          className="flex items-center gap-2"
          style={{
            padding: "10px 22px",
            borderBottom: "1px solid #F4F3EE",
            color: message ? "#B07814" : "#6E6E64",
            fontSize: 12.5,
            minWidth: 900,
          }}
        >
          {isLoading && <Loader2 size={14} className="animate-spin" />}
          <span>{message ?? "Loading documents..."}</span>
        </div>
      )}

      <div
        className="grid items-center"
        style={{
          gridTemplateColumns,
          minWidth: 900,
          padding: "12px 22px",
          borderBottom: "1px solid #F4F3EE",
          color: "#9B9B90",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        <div>Document</div>
        <div>Category</div>
        <div>Source</div>
        <div>File size</div>
        <div>Uploaded</div>
        <div />
      </div>

      {rows.map((doc) => {
        const tile = tileStyleForType(doc.type);
        return (
          <div
            key={doc.id}
            className="grid items-center transition-colors hover:bg-[#FAF9F5]"
            style={{
              gridTemplateColumns,
              minWidth: 900,
              padding: "13px 22px",
              borderBottom: "1px solid #F4F3EE",
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: 38,
                  height: 44,
                  borderRadius: 9,
                  background: tile.bg,
                  color: tile.color,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                {doc.type}
              </div>
              <div className="min-w-0">
                <div
                  className="truncate"
                  style={{
                    fontSize: 14.5,
                    fontWeight: 700,
                    letterSpacing: "-0.005em",
                    color: "#22221E",
                  }}
                >
                  {doc.title}
                </div>
                <div style={{ fontSize: 12.5, color: "#9B9B90", marginTop: 3 }}>
                  Document date · {doc.date}
                </div>
              </div>
            </div>
            <div style={tableCellStyle}>{doc.category}</div>
            <div className="truncate" style={tableCellStyle}>{doc.source}</div>
            <div style={tableCellStyle}>{doc.fileSize}</div>
            <div style={tableCellStyle}>{doc.uploadedAt}</div>
            <div className="flex justify-end">
              <button
                type="button"
                className="shrink-0 transition-colors"
                onClick={() => onView(doc)}
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#137A5C",
                  background: "#FFFFFF",
                  border: "1px solid #CFE3DC",
                  borderRadius: 9,
                  padding: "6px 14px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F0F7F3")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
              >
                View
              </button>
            </div>
          </div>
        );
      })}

      {rows.length === 0 && !isLoading && (
        <div
          style={{
            minWidth: 900,
            padding: "40px 20px",
            textAlign: "center",
            color: "#9B9B90",
            fontSize: 13,
          }}
        >
          No documents match.
        </div>
      )}
    </div>
  );
}

function UploadButton({
  disabled,
  loading,
  onClick,
}: {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 transition-colors"
      style={{
        background: disabled ? "#F2F1EC" : "#E7F3ED",
        color: disabled ? "#9B9B90" : "#137A5C",
        border: "1px solid #CFE3DC",
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 700,
        padding: "6px 10px",
      }}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
      Upload
    </button>
  );
}

function UploadDialog({
  draft,
  error,
  loading,
  onChange,
  onCancel,
  onSubmit,
}: {
  draft: UploadDraft;
  error: string | null;
  loading: boolean;
  onChange: (draft: UploadDraft) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const type = inferFileType(draft.file) ?? "PDF";

  return (
    <div style={{ fontFamily: '"Schibsted Grotesk", -apple-system, "Helvetica Neue", Arial, sans-serif' }}>
      <div
        aria-hidden
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 70,
          background: "rgba(20,20,18,.44)",
        }}
      />
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-label="Upload document"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          zIndex: 71,
          width: "min(520px, calc(100vw - 32px))",
          transform: "translate(-50%, -50%)",
          background: "#FFFFFF",
          border: "1px solid #EBEAE4",
          borderRadius: 18,
          boxShadow: "0 24px 80px rgba(20,20,18,.24)",
          overflow: "hidden",
        }}
      >
        <div
          className="flex items-center gap-3"
          style={{ padding: "18px 20px", borderBottom: "1px solid #F2F1EC" }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "#E7F3ED",
              color: "#137A5C",
            }}
          >
            <FileUp size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div style={{ color: "#1B1B17", fontSize: 17, fontWeight: 700 }}>
              Upload document
            </div>
            <div className="truncate" style={{ color: "#9B9B90", fontSize: 12.5, marginTop: 2 }}>
              {draft.file.name} · {formatBytes(draft.file.size)}
            </div>
          </div>
          <div
            style={{
              ...tileStyleForType(type),
              borderRadius: 9,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.04em",
              padding: "8px 9px",
            }}
          >
            {type}
          </div>
        </div>

        <div className="grid gap-4" style={{ padding: 20 }}>
          <label className="grid gap-1.5">
            <span style={labelStyle}>Title</span>
            <input
              value={draft.title}
              required
              onChange={(event) => onChange({ ...draft, title: event.target.value })}
              style={inputStyle}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span style={labelStyle}>Category</span>
              <select
                value={draft.category}
                onChange={(event) =>
                  onChange({ ...draft, category: event.target.value as DocumentCategory })
                }
                style={inputStyle}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span style={labelStyle}>Document date</span>
              <input
                type="date"
                value={draft.docDate}
                onChange={(event) => onChange({ ...draft, docDate: event.target.value })}
                style={inputStyle}
              />
            </label>
          </div>

          <label className="grid gap-1.5">
            <span style={labelStyle}>Source</span>
            <input
              value={draft.source}
              onChange={(event) => onChange({ ...draft, source: event.target.value })}
              style={inputStyle}
            />
          </label>

          {error && (
            <div
              style={{
                color: "#CC4444",
                background: "#FBE9E7",
                border: "1px solid #F5C8C2",
                borderRadius: 10,
                padding: "9px 11px",
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          className="flex justify-end gap-2"
          style={{ padding: "0 20px 20px" }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              border: "1px solid #EBEAE4",
              background: "#FFFFFF",
              color: "#6E6E64",
              borderRadius: 10,
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2"
            style={{
              border: "1px solid #137A5C",
              background: "#137A5C",
              color: "#FFFFFF",
              borderRadius: 10,
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Upload
          </button>
        </div>
      </form>
    </div>
  );
}

function Segment<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <div
      className="inline-flex"
      style={{ background: "#F2F1EC", borderRadius: 11, padding: 3 }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              color: active ? "#1B1B17" : "#9B9B90",
              background: active ? "#FFFFFF" : "transparent",
              boxShadow: active ? "0 1px 2px rgba(20,20,18,.10)" : "none",
              borderRadius: 8,
              padding: "5px 11px",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function toDocRow(document: CanopyDocument): Doc {
  return {
    id: document.id,
    title: document.title || "Untitled document",
    date: formatDate(document.doc_date || document.created_at),
    source: document.source || "Uploaded document",
    type: document.file_type || "PDF",
    category: document.category || "Field",
    fileSize:
      typeof document.file_size_bytes === "number"
        ? formatBytes(document.file_size_bytes)
        : "—",
    uploadedAt: formatDate(document.created_at),
    s3Key: document.s3_key,
  };
}

function inferFileType(file: File): DocumentFileType | null {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  if (name.endsWith(".pdf") || mime === "application/pdf") return "PDF";
  if (
    name.endsWith(".docx") ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "DOCX";
  }
  if (
    name.endsWith(".xlsx") ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "XLSX";
  }
  return null;
}

function titleFromFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function tileStyleForType(type: DocumentFileType) {
  if (type === "PDF") return { bg: "#FBE9E7", color: "#CC4444" };
  if (type === "XLSX") return { bg: "#E7F3ED", color: "#137A5C" };
  return { bg: "#E8EEFA", color: "#3F6CC4" };
}

const labelStyle = {
  color: "#6E6E64",
  fontSize: 12,
  fontWeight: 700,
} satisfies CSSProperties;

const tableCellStyle = {
  color: "#6E6E64",
  fontSize: 13,
  fontWeight: 600,
  paddingRight: 18,
} satisfies CSSProperties;

const inputStyle = {
  width: "100%",
  border: "1px solid #EBEAE4",
  borderRadius: 10,
  background: "#FFFFFF",
  color: "#22221E",
  outline: "none",
  padding: "10px 11px",
  fontSize: 14,
} satisfies CSSProperties;
