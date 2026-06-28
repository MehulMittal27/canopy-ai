import { supabase } from "@/lib/supabase";

export type DocumentCategory = "Field" | "Donor" | "Advocacy" | "Communications";
export type DocumentFileType = "PDF" | "DOCX" | "XLSX";

export interface CanopyDocument {
  id: string;
  org_id: string;
  title: string | null;
  file_type: DocumentFileType | null;
  category: DocumentCategory | null;
  source: string | null;
  doc_date: string | null;
  created_at: string | null;
  updated_at?: string | null;
  uploaded_by?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  s3_bucket?: string | null;
  s3_key?: string | null;
  file_url?: string | null;
  upload_status?: "pending" | "uploaded" | "failed" | null;
}

export interface UploadDocumentInput {
  orgId: string;
  file: File;
  title: string;
  category: DocumentCategory;
  source?: string;
  docDate?: string;
}

interface CreateUploadResponse {
  document: CanopyDocument;
  documentId: string;
  s3Key: string;
  uploadUrl: string;
  expiresAt: string;
}

interface CompleteUploadResponse {
  document: CanopyDocument;
}

interface DownloadUrlResponse {
  url: string;
  expiresAt: string;
}

const BASE_DOCUMENT_COLUMNS = "id, org_id, title, file_type, category, source, doc_date, created_at";
const EXTENDED_DOCUMENT_COLUMNS = `${BASE_DOCUMENT_COLUMNS}, updated_at, uploaded_by, mime_type, file_size_bytes, s3_bucket, s3_key, file_url, upload_status`;

export async function getDocuments(): Promise<CanopyDocument[]> {
  const { data, error } = await selectDocuments(EXTENDED_DOCUMENT_COLUMNS);

  if (error && isMissingUploadColumnError(error)) {
    const fallback = await selectDocuments(BASE_DOCUMENT_COLUMNS, false);
    if (fallback.error) throw fallback.error;
    return sortDocuments((fallback.data ?? []) as unknown as CanopyDocument[]);
  }

  if (error) throw error;
  return sortDocuments((data ?? []) as unknown as CanopyDocument[]);
}

export async function uploadDocumentToS3(input: UploadDocumentInput): Promise<CanopyDocument> {
  const create = await invokeDocumentUpload<CreateUploadResponse>({
    action: "create",
    orgId: input.orgId,
    title: input.title,
    category: input.category,
    source: input.source,
    docDate: input.docDate,
    fileName: input.file.name,
    mimeType: getMimeType(input.file),
    fileSizeBytes: input.file.size,
  });

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(create.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": getMimeType(input.file),
      },
      body: input.file,
    });
  } catch (_error) {
    throw new Error(
      "S3 upload was blocked. Check the bucket CORS AllowedOrigins for this app URL.",
    );
  }

  if (!uploadResponse.ok) {
    throw new Error(await getS3UploadErrorMessage(uploadResponse));
  }

  const complete = await invokeDocumentUpload<CompleteUploadResponse>({
    action: "complete",
    orgId: input.orgId,
    documentId: create.documentId,
    s3Key: create.s3Key,
    fileSizeBytes: input.file.size,
  });

  return complete.document;
}

export async function createDocumentDownloadUrl(
  orgId: string,
  documentId: string,
): Promise<string> {
  const result = await invokeDocumentUpload<DownloadUrlResponse>({
    action: "download",
    orgId,
    documentId,
  });

  return result.url;
}

function selectDocuments(columns: string, filterUploaded = true) {
  let query = supabase
    .from("documents")
    .select(columns)
    .order("doc_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (filterUploaded) {
    query = query.or("upload_status.is.null,upload_status.eq.uploaded");
  }

  return query;
}

async function invokeDocumentUpload<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>("document-upload", { body });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (!data) {
    throw new Error("Document upload did not return a response.");
  }

  return data;
}

function sortDocuments(documents: CanopyDocument[]) {
  return [...documents].sort((a, b) => {
    const docDate = dateMs(b.doc_date) - dateMs(a.doc_date);
    if (docDate !== 0) return docDate;
    return dateMs(b.created_at) - dateMs(a.created_at);
  });
}

function isMissingUploadColumnError(error: { message?: string; code?: string }) {
  return (
    error.code === "42703" ||
    /updated_at|uploaded_by|mime_type|file_size_bytes|s3_bucket|s3_key|file_url|upload_status/i.test(
      error.message ?? "",
    )
  );
}

function getMimeType(file: File) {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (name.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  return "application/octet-stream";
}

async function getS3UploadErrorMessage(response: Response) {
  const fallback = `S3 upload failed with ${response.status} ${response.statusText}.`;

  try {
    const body = await response.text();
    const code = body.match(/<Code>([^<]+)<\/Code>/)?.[1];
    const message = body.match(/<Message>([^<]+)<\/Message>/)?.[1];
    if (code || message) {
      return `S3 upload failed: ${[code, message].filter(Boolean).join(" - ")}`;
    }
  } catch (_error) {
    // Fall through to the status message.
  }

  return fallback;
}

function dateMs(value: string | null | undefined) {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

async function getFunctionErrorMessage(error: unknown) {
  const maybeContext = error as { context?: Response; message?: string };

  if (maybeContext.context instanceof Response) {
    try {
      const body = (await maybeContext.context.clone().json()) as { error?: string };
      if (body.error) return body.error;
    } catch (_error) {
      // Fall through to the Supabase error message.
    }
  }

  return maybeContext.message || "Document upload failed.";
}
