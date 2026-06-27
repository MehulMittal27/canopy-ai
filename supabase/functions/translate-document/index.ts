const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SourceLanguage = "auto" | "en" | "fr" | "de" | "es" | "rn" | "ar";
type TargetLanguage = "en" | "fr" | "de" | "es";

type TranslationRequest =
  | {
      inputType: "text";
      sourceLanguage: SourceLanguage;
      targetLanguage: TargetLanguage;
      text: string;
    }
  | {
      inputType: "pdf";
      sourceLanguage: SourceLanguage;
      targetLanguage: TargetLanguage;
      file: {
        name: string;
        mimeType: string;
        base64: string;
      };
    };

const MAX_TEXT_CHARS = 45_000;
const MAX_PDF_BYTES = 8 * 1024 * 1024;

const SOURCE_LANGUAGES: Record<SourceLanguage, string> = {
  auto: "Detect automatically",
  en: "English",
  fr: "French",
  de: "German",
  es: "Spanish",
  rn: "Kirundi",
  ar: "Arabic",
};

const TARGET_LANGUAGES: Record<TargetLanguage, string> = {
  en: "English",
  fr: "French",
  de: "German",
  es: "Spanish",
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    detectedLanguage: {
      type: ["string", "null"],
      description: "Detected source language, or null if the user supplied a source language.",
    },
    sourceLanguage: {
      type: "string",
      description: "The source language used for the translation.",
    },
    targetLanguage: {
      type: "string",
      description: "The target language used for the translation.",
    },
    title: {
      type: "string",
      description: "A concise translated document title.",
    },
    overviewMarkdown: {
      type: "string",
      description: "A target-language overview of the document in Markdown.",
    },
    translatedMarkdown: {
      type: "string",
      description: "The translated document in Markdown.",
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "Any limitations, truncation notes, or uncertainty.",
    },
  },
  required: [
    "detectedLanguage",
    "sourceLanguage",
    "targetLanguage",
    "title",
    "overviewMarkdown",
    "translatedMarkdown",
    "warnings",
  ],
};

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

    await requireAuthenticatedUser(req);

    const payload = validatePayload(await req.json());
    const result = await translateWithOpenAI(payload);

    return jsonResponse(result);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected translation failure.";

    if (status >= 500) {
      console.error("translate-document failed", error);
    }

    return jsonResponse({ error: message }, status);
  }
});

async function requireAuthenticatedUser(req: Request) {
  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "You must be signed in to translate documents.");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new HttpError(500, "Supabase function environment is missing auth configuration.");
  }

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authorization,
      apikey: supabaseAnonKey,
    },
  });

  if (!authResponse.ok) {
    throw new HttpError(401, "Your session expired. Please sign in again.");
  }
}

function validatePayload(value: unknown): TranslationRequest {
  if (!value || typeof value !== "object") {
    throw new HttpError(400, "Missing translation request.");
  }

  const payload = value as Partial<TranslationRequest>;
  const sourceLanguage = String(payload.sourceLanguage ?? "") as SourceLanguage;
  const targetLanguage = String(payload.targetLanguage ?? "") as TargetLanguage;

  if (!(sourceLanguage in SOURCE_LANGUAGES)) {
    throw new HttpError(400, "Unsupported source language.");
  }

  if (!(targetLanguage in TARGET_LANGUAGES)) {
    throw new HttpError(400, "Unsupported target language.");
  }

  if (payload.inputType === "text") {
    const text = typeof payload.text === "string" ? payload.text.trim() : "";

    if (!text) {
      throw new HttpError(400, "Paste text before translating.");
    }

    if (text.length > MAX_TEXT_CHARS) {
      throw new HttpError(
        400,
        "Text is too long for this demo translator. Please split it into sections.",
      );
    }

    return {
      inputType: "text",
      sourceLanguage,
      targetLanguage,
      text,
    };
  }

  if (payload.inputType === "pdf") {
    const file = payload.file;

    if (!file || typeof file !== "object") {
      throw new HttpError(400, "Missing PDF file.");
    }

    const name = sanitizeFileName(String(file.name ?? "document.pdf"));
    const mimeType = String(file.mimeType ?? "application/pdf");
    const base64 = String(file.base64 ?? "").replace(/^data:application\/pdf;base64,/, "");

    if (mimeType !== "application/pdf" || !name.toLowerCase().endsWith(".pdf")) {
      throw new HttpError(400, "Only PDF uploads are supported in this version.");
    }

    if (!base64) {
      throw new HttpError(400, "The PDF could not be read.");
    }

    if (base64ByteLength(base64) > MAX_PDF_BYTES) {
      throw new HttpError(
        400,
        "PDF is too large for this demo translator. Please use a file under 8 MB.",
      );
    }

    return {
      inputType: "pdf",
      sourceLanguage,
      targetLanguage,
      file: {
        name,
        mimeType,
        base64,
      },
    };
  }

  throw new HttpError(400, "Unsupported translation input type.");
}

async function translateWithOpenAI(payload: TranslationRequest) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");

  if (!apiKey) {
    throw new HttpError(500, "OpenAI API key is not configured for the translation function.");
  }

  const model = Deno.env.get("OPENAI_TRANSLATION_MODEL") || "gpt-4o";
  const targetName = TARGET_LANGUAGES[payload.targetLanguage];
  const sourceName = SOURCE_LANGUAGES[payload.sourceLanguage];
  const instructions = buildInstructions(sourceName, targetName, payload.inputType);
  const content: Array<Record<string, unknown>> = [{ type: "input_text", text: instructions }];

  if (payload.inputType === "pdf") {
    content.push({
      type: "input_file",
      filename: payload.file.name,
      file_data: `data:application/pdf;base64,${payload.file.base64}`,
    });
  } else {
    content.push({
      type: "input_text",
      text: `Source text:\n\n${payload.text}`,
    });
  }

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.2,
      max_output_tokens: 12_000,
      text: {
        format: {
          type: "json_schema",
          name: "canopy_translation",
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });

  if (!openAiResponse.ok) {
    const detail = await openAiResponse.text();
    console.error("OpenAI translation error", detail);
    throw new HttpError(502, "OpenAI could not translate this document right now.");
  }

  const data = await openAiResponse.json();
  const rawText = extractOutputText(data);
  const parsed = parseJsonObject(rawText);

  return {
    detectedLanguage:
      typeof parsed.detectedLanguage === "string" && parsed.detectedLanguage.trim()
        ? parsed.detectedLanguage.trim()
        : null,
    sourceLanguage: asNonEmptyString(parsed.sourceLanguage, sourceName),
    targetLanguage: asNonEmptyString(parsed.targetLanguage, targetName),
    title: asNonEmptyString(parsed.title, "Translated document"),
    overviewMarkdown: asNonEmptyString(parsed.overviewMarkdown, "No overview returned."),
    translatedMarkdown: asNonEmptyString(parsed.translatedMarkdown, "No translation returned."),
    warnings: Array.isArray(parsed.warnings)
      ? parsed.warnings.filter((item) => typeof item === "string" && item.trim())
      : [],
  };
}

function buildInstructions(sourceName: string, targetName: string, inputType: "text" | "pdf") {
  return [
    "You are Canopy's document translator for small NGOs.",
    `Translate the supplied ${inputType === "pdf" ? "PDF" : "text"} into ${targetName}.`,
    `Source language: ${sourceName}. If source language is Detect automatically, detect it and report the detected language.`,
    "Preserve the document's logical structure with headings and bullet lists where useful.",
    "Do not invent facts, dates, funders, legal requirements, locations, or names.",
    "If a section is unreadable, mark it as [unreadable] in the target language.",
    "Write the overview and translation in the target language.",
    "Return only valid JSON that matches the schema.",
    "The overview should be short: 3-5 bullets covering what the document is about, why it matters, and any action items.",
  ].join("\n");
}

function extractOutputText(data: unknown): string {
  if (data && typeof data === "object" && "output_text" in data) {
    const outputText = (data as { output_text?: unknown }).output_text;
    if (typeof outputText === "string" && outputText.trim()) return outputText;
  }

  const output = (data as { output?: Array<{ content?: Array<{ text?: unknown }> }> })?.output;
  const text = output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((value): value is string => typeof value === "string")
    .join("\n");

  if (!text?.trim()) {
    throw new HttpError(502, "OpenAI returned an empty translation.");
  }

  return text;
}

function parseJsonObject(rawText: string): Record<string, unknown> {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    throw new HttpError(502, "OpenAI returned a translation in an unexpected format.");
  }
}

function asNonEmptyString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function sanitizeFileName(value: string) {
  const sanitized = value.replace(/[^\w.\-() ]+/g, "").trim();
  return sanitized || "document.pdf";
}

function base64ByteLength(value: string) {
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return Math.floor((value.length * 3) / 4) - padding;
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
