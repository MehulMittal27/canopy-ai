const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type DocumentCategory = "Field" | "Donor" | "Advocacy" | "Communications";
type DocumentFileType = "PDF" | "DOCX" | "XLSX";

type CreateUploadRequest = {
  action?: "create";
  orgId: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  category: DocumentCategory;
  source?: string;
  docDate?: string;
};

type CompleteUploadRequest = {
  action: "complete";
  orgId: string;
  documentId: string;
  s3Key: string;
  fileSizeBytes: number;
};

type DownloadRequest = {
  action: "download";
  orgId: string;
  documentId: string;
};

type UploadRequest = CreateUploadRequest | CompleteUploadRequest | DownloadRequest;

type AuthUser = {
  id: string;
  email?: string;
};

type OrgRow = {
  id: string;
  name: string;
  slug: string;
};

type DocumentRow = {
  id: string;
  org_id: string;
  title: string | null;
  file_type: DocumentFileType | null;
  category: DocumentCategory | null;
  source: string | null;
  doc_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  uploaded_by: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  s3_bucket: string | null;
  s3_key: string | null;
  file_url: string | null;
  upload_status: string | null;
};

type AwsConfig = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string | null;
  region: string;
  bucket: string;
};

const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
const UPLOAD_EXPIRES_SECONDS = 10 * 60;
const DOWNLOAD_EXPIRES_SECONDS = 5 * 60;
const SUPPORTED_CATEGORIES = new Set<DocumentCategory>([
  "Field",
  "Donor",
  "Advocacy",
  "Communications",
]);

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      throw new HttpError(405, "Method not allowed.");
    }

    const user = await getAuthenticatedUser(req);
    const payload = validatePayload(await req.json());
    const org = await requireOwnedOrg(payload.orgId, user.id);

    if (payload.action === "complete") {
      return jsonResponse(await completeUpload(payload));
    }

    if (payload.action === "download") {
      return jsonResponse(await createDownloadUrl(payload));
    }

    return jsonResponse(await createUpload(payload, user, org));
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected document upload failure.";

    if (status >= 500) {
      console.error("document-upload failed", error);
    }

    return jsonResponse({ error: message }, status);
  }
});

async function createUpload(payload: CreateUploadRequest, user: AuthUser, org: OrgRow) {
  const aws = getAwsConfig();
  const documentId = crypto.randomUUID();
  const fileName = sanitizeFileName(payload.fileName);
  const fileType = inferFileType(fileName, payload.mimeType);
  const s3Key = `${orgFilesPrefix(org)}/${payload.orgId}/documents/${documentId}/${fileName}`;
  const fileUrl = `https://${aws.bucket}.s3.${aws.region}.amazonaws.com/${encodeS3Key(s3Key)}`;
  const uploadUrl = await createPresignedS3Url({
    aws,
    method: "PUT",
    key: s3Key,
    expiresSeconds: UPLOAD_EXPIRES_SECONDS,
  });

  const [document] = await restInsert<DocumentRow>("documents", {
    id: documentId,
    org_id: payload.orgId,
    title: payload.title.trim(),
    file_type: fileType,
    category: payload.category,
    source: payload.source?.trim() || "Uploaded document",
    doc_date: payload.docDate || new Date().toISOString().slice(0, 10),
    uploaded_by: user.id,
    mime_type: payload.mimeType,
    file_size_bytes: payload.fileSizeBytes,
    s3_bucket: aws.bucket,
    s3_key: s3Key,
    file_url: fileUrl,
    upload_status: "pending",
  });

  if (!document) {
    throw new HttpError(500, "Document metadata was not created.");
  }

  return {
    document,
    documentId,
    s3Key,
    uploadUrl,
    expiresAt: new Date(Date.now() + UPLOAD_EXPIRES_SECONDS * 1000).toISOString(),
  };
}

async function completeUpload(payload: CompleteUploadRequest) {
  const existing = await getOwnedDocument(payload.orgId, payload.documentId);

  if (!existing.s3_key || existing.s3_key !== payload.s3Key) {
    throw new HttpError(403, "This upload key does not match the document.");
  }

  const [document] = await restUpdate<DocumentRow>(
    "documents",
    {
      id: `eq.${payload.documentId}`,
      org_id: `eq.${payload.orgId}`,
    },
    {
      upload_status: "uploaded",
      file_size_bytes: payload.fileSizeBytes,
    },
  );

  if (!document) {
    throw new HttpError(500, "Document metadata was not updated.");
  }

  return { document };
}

async function createDownloadUrl(payload: DownloadRequest) {
  const document = await getOwnedDocument(payload.orgId, payload.documentId);
  if (!document.s3_bucket || !document.s3_key) {
    throw new HttpError(404, "This document does not have an uploaded file yet.");
  }

  const aws = getAwsConfig();
  if (document.s3_bucket !== aws.bucket) {
    throw new HttpError(500, "Document bucket does not match the configured AWS bucket.");
  }

  const url = await createPresignedS3Url({
    aws,
    method: "GET",
    key: document.s3_key,
    expiresSeconds: DOWNLOAD_EXPIRES_SECONDS,
  });

  return {
    url,
    expiresAt: new Date(Date.now() + DOWNLOAD_EXPIRES_SECONDS * 1000).toISOString(),
  };
}

function validatePayload(value: unknown): UploadRequest {
  if (!value || typeof value !== "object") {
    throw new HttpError(400, "Missing document upload request.");
  }

  const payload = value as Partial<CreateUploadRequest & CompleteUploadRequest & DownloadRequest>;
  const action = payload.action ?? "create";
  const orgId = cleanRequiredString(payload.orgId, "Missing organization.");

  if (action === "complete") {
    return {
      action,
      orgId,
      documentId: cleanRequiredString(payload.documentId, "Missing document id."),
      s3Key: cleanRequiredString(payload.s3Key, "Missing S3 key."),
      fileSizeBytes: validateFileSize(payload.fileSizeBytes),
    };
  }

  if (action === "download") {
    return {
      action,
      orgId,
      documentId: cleanRequiredString(payload.documentId, "Missing document id."),
    };
  }

  if (action !== "create") {
    throw new HttpError(400, "Unsupported document upload action.");
  }

  const category = cleanRequiredString(payload.category, "Choose a document category.");
  if (!SUPPORTED_CATEGORIES.has(category as DocumentCategory)) {
    throw new HttpError(400, "Unsupported document category.");
  }

  const fileName = sanitizeFileName(cleanRequiredString(payload.fileName, "Missing file name."));
  const mimeType = cleanRequiredString(payload.mimeType, "Missing file type.");
  inferFileType(fileName, mimeType);

  return {
    action,
    orgId,
    title: cleanRequiredString(payload.title, "Add a document title.").slice(0, 160),
    fileName,
    mimeType,
    fileSizeBytes: validateFileSize(payload.fileSizeBytes),
    category: category as DocumentCategory,
    source: typeof payload.source === "string" ? payload.source.slice(0, 120) : undefined,
    docDate: validateDate(payload.docDate),
  };
}

async function getAuthenticatedUser(req: Request): Promise<AuthUser> {
  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "You must be signed in to upload documents.");
  }

  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const supabaseAnonKey = requiredEnv("SUPABASE_ANON_KEY");

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: supabaseAnonKey,
    },
  });

  if (!authResponse.ok) {
    throw new HttpError(401, "Your session expired. Please sign in again.");
  }

  const user = (await authResponse.json()) as Partial<AuthUser>;
  if (!user.id) {
    throw new HttpError(401, "Your session did not include a user id.");
  }

  return { id: user.id, email: user.email };
}

async function requireOwnedOrg(orgId: string, userId: string): Promise<OrgRow> {
  const rows = await restSelect<OrgRow>("orgs", {
    select: "id,name,slug",
    id: `eq.${orgId}`,
    admin_user_id: `eq.${userId}`,
    limit: "1",
  });

  const org = rows[0];
  if (!org) {
    throw new HttpError(403, "You cannot upload documents for this organization.");
  }

  return org;
}

async function getOwnedDocument(orgId: string, documentId: string): Promise<DocumentRow> {
  const rows = await restSelect<DocumentRow>("documents", {
    select: "*",
    id: `eq.${documentId}`,
    org_id: `eq.${orgId}`,
    limit: "1",
  });

  const document = rows[0];
  if (!document) {
    throw new HttpError(404, "Document not found.");
  }

  return document;
}

async function restSelect<T>(table: string, filters: Record<string, string>): Promise<T[]> {
  const url = new URL(`${requiredEnv("SUPABASE_URL")}/rest/v1/${table}`);
  Object.entries(filters).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    headers: serviceHeaders(),
  });

  return readRestResponse<T[]>(response);
}

async function restInsert<T>(table: string, body: Record<string, unknown>): Promise<T[]> {
  const response = await fetch(`${requiredEnv("SUPABASE_URL")}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...serviceHeaders(),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  return readRestResponse<T[]>(response);
}

async function restUpdate<T>(
  table: string,
  filters: Record<string, string>,
  body: Record<string, unknown>,
): Promise<T[]> {
  const url = new URL(`${requiredEnv("SUPABASE_URL")}/rest/v1/${table}`);
  Object.entries(filters).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      ...serviceHeaders(),
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  return readRestResponse<T[]>(response);
}

async function readRestResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Supabase document metadata request failed.";
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      message = body.message || body.error || message;
    } catch (_error) {
      message = await response.text();
    }
    throw new HttpError(response.status, message);
  }

  return (await response.json()) as T;
}

function serviceHeaders() {
  const serviceRoleKey = serviceRoleKeyEnv();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };
}

function serviceRoleKeyEnv() {
  const value = Deno.env.get("CANOPY_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!value) {
    throw new HttpError(500, "Missing CANOPY_SERVICE_ROLE_KEY configuration.");
  }
  return value;
}

function getAwsConfig(): AwsConfig {
  return {
    accessKeyId: requiredEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("AWS_SECRET_ACCESS_KEY"),
    sessionToken: Deno.env.get("AWS_SESSION_TOKEN"),
    region: requiredEnv("AWS_REGION"),
    bucket: requiredEnv("AWS_S3_BUCKET"),
  };
}

async function createPresignedS3Url({
  aws,
  method,
  key,
  expiresSeconds,
}: {
  aws: AwsConfig;
  method: "GET" | "PUT";
  key: string;
  expiresSeconds: number;
}) {
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${aws.region}/s3/aws4_request`;
  const host = `${aws.bucket}.s3.${aws.region}.amazonaws.com`;
  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${aws.accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSeconds),
    "X-Amz-SignedHeaders": "host",
  };

  if (aws.sessionToken) {
    params["X-Amz-Security-Token"] = aws.sessionToken;
  }

  const canonicalUri = `/${encodeS3Key(key)}`;
  const canonicalQuery = canonicalQueryString(params);
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    `host:${host}`,
    "",
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");
  const signingKey = await getSignatureKey(aws.secretAccessKey, dateStamp, aws.region, "s3");
  const signature = toHex(await hmac(signingKey, stringToSign));

  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

async function getSignatureKey(
  secretAccessKey: string,
  dateStamp: string,
  regionName: string,
  serviceName: string,
) {
  const kDate = await hmac(utf8(`AWS4${secretAccessKey}`), dateStamp);
  const kRegion = await hmac(kDate, regionName);
  const kService = await hmac(kRegion, serviceName);
  return hmac(kService, "aws4_request");
}

async function hmac(key: Uint8Array, value: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, utf8(value));
  return new Uint8Array(signature);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", utf8(value));
  return toHex(new Uint8Array(digest));
}

function canonicalQueryString(params: Record<string, string>) {
  return Object.entries(params)
    .sort(([aKey, aValue], [bKey, bValue]) => {
      if (aKey === bKey) return aValue.localeCompare(bValue);
      return aKey.localeCompare(bKey);
    })
    .map(([key, value]) => `${awsEncode(key)}=${awsEncode(value)}`)
    .join("&");
}

function encodeS3Key(key: string) {
  return key.split("/").map(awsEncode).join("/");
}

function awsEncode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function sanitizeFileName(fileName: string) {
  const safe = fileName
    .trim()
    .replace(/[^\w.\- ()]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 140);
  return safe || "document.pdf";
}

function orgFilesPrefix(org: OrgRow) {
  const source = org.slug || org.name || org.id;
  const firstName = source
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .find(Boolean);

  return `${firstName || "org"}-files`;
}

function inferFileType(fileName: string, mimeType: string): DocumentFileType {
  const lowerName = fileName.toLowerCase();
  const lowerMime = mimeType.toLowerCase();

  if (lowerName.endsWith(".pdf") || lowerMime === "application/pdf") return "PDF";
  if (
    lowerName.endsWith(".docx") ||
    lowerMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "DOCX";
  }
  if (
    lowerName.endsWith(".xlsx") ||
    lowerMime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "XLSX";
  }

  throw new HttpError(400, "Only PDF, DOCX, and XLSX documents are supported.");
}

function validateFileSize(value: unknown) {
  const size = Number(value);
  if (!Number.isFinite(size) || size <= 0) {
    throw new HttpError(400, "The selected file is empty.");
  }

  if (size > MAX_DOCUMENT_BYTES) {
    throw new HttpError(400, "Please upload a document under 25 MB.");
  }

  return Math.round(size);
}

function validateDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return new Date().toISOString().slice(0, 10);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, "Document date must use YYYY-MM-DD format.");
  }

  return value;
}

function cleanRequiredString(value: unknown, message: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, message);
  }
  return value.trim();
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new HttpError(500, `Missing ${name} configuration.`);
  }
  return value;
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function utf8(value: string) {
  return new TextEncoder().encode(value);
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
