import { supabase } from "@/lib/supabase";

export type SourceLanguage = "auto" | "en" | "fr" | "de" | "es" | "rn" | "ar";
export type TargetLanguage = "en" | "fr" | "de" | "es";

export type TranslationResult = {
  detectedLanguage: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  title: string;
  overviewMarkdown: string;
  translatedMarkdown: string;
  warnings: string[];
};

export type TranslateDocumentInput =
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
      file: File;
    };

export const MAX_TRANSLATION_PDF_BYTES = 8 * 1024 * 1024;

export async function translateDocument(input: TranslateDocumentInput): Promise<TranslationResult> {
  const body =
    input.inputType === "pdf"
      ? {
          inputType: "pdf",
          sourceLanguage: input.sourceLanguage,
          targetLanguage: input.targetLanguage,
          file: {
            name: input.file.name,
            mimeType: input.file.type || "application/pdf",
            base64: await fileToBase64(input.file),
          },
        }
      : {
          inputType: "text",
          sourceLanguage: input.sourceLanguage,
          targetLanguage: input.targetLanguage,
          text: input.text,
        };

  const { data, error } = await supabase.functions.invoke<TranslationResult>("translate-document", {
    body,
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (!data) {
    throw new Error("No translation was returned.");
  }

  return data;
}

async function fileToBase64(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(new Error("Could not read the PDF file.")));
    reader.readAsDataURL(file);
  });

  const [, base64 = ""] = dataUrl.split(",");
  return base64;
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

  return maybeContext.message || "Translation failed.";
}
