import { useCallback, useMemo, useState } from "react";
import {
  MAX_TRANSLATION_PDF_BYTES,
  translateDocument,
  type SourceLanguage,
  type TargetLanguage,
  type TranslationResult,
} from "@/lib/api/translator";
import { downloadTranslationPdf } from "@/lib/download-translation-pdf";

type TranslatorStatus = "idle" | "translating" | "success" | "error";

export function useTranslatorSession() {
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>("auto");
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>("en");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<TranslatorStatus>("idle");

  const canTranslate = useMemo(
    () => status !== "translating" && (Boolean(file) || text.trim().length > 0),
    [file, status, text],
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setStatus("idle");
  }, []);

  const updateSourceLanguage = useCallback(
    (value: SourceLanguage) => {
      setSourceLanguage(value);
      clearResult();
    },
    [clearResult],
  );

  const updateTargetLanguage = useCallback(
    (value: TargetLanguage) => {
      setTargetLanguage(value);
      clearResult();
    },
    [clearResult],
  );

  const updateText = useCallback(
    (value: string) => {
      setText(value);
      if (value.trim()) setFile(null);
      clearResult();
    },
    [clearResult],
  );

  const selectFile = useCallback(
    (nextFile: File) => {
      const isPdf =
        nextFile.type === "application/pdf" || nextFile.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        setError("Only PDF uploads are supported in this version.");
        setStatus("error");
        return false;
      }

      if (nextFile.size > MAX_TRANSLATION_PDF_BYTES) {
        setError("PDF is too large for this demo translator. Please use a file under 8 MB.");
        setStatus("error");
        return false;
      }

      setFile(nextFile);
      setText("");
      clearResult();
      return true;
    },
    [clearResult],
  );

  const clearFile = useCallback(() => {
    setFile(null);
    clearResult();
  }, [clearResult]);

  const reset = useCallback(() => {
    setText("");
    setFile(null);
    setResult(null);
    setError(null);
    setStatus("idle");
  }, []);

  const translate = useCallback(async () => {
    if (status === "translating") return;

    if (!file && !text.trim()) {
      setError("Paste text or upload a PDF before translating.");
      setStatus("error");
      return;
    }

    setError(null);
    setStatus("translating");

    try {
      const nextResult = await translateDocument(
        file
          ? {
              inputType: "pdf",
              sourceLanguage,
              targetLanguage,
              file,
            }
          : {
              inputType: "text",
              sourceLanguage,
              targetLanguage,
              text,
            },
      );

      setResult(nextResult);
      setStatus("success");
    } catch (nextError) {
      setResult(null);
      setError(nextError instanceof Error ? nextError.message : "Translation failed.");
      setStatus("error");
    }
  }, [file, sourceLanguage, status, targetLanguage, text]);

  const download = useCallback(async () => {
    if (!result) return;
    try {
      await downloadTranslationPdf({ result, sourceFileName: file?.name });
    } catch (_error) {
      setError("Could not generate the translated PDF.");
      setStatus("error");
    }
  }, [file?.name, result]);

  return {
    sourceLanguage,
    targetLanguage,
    text,
    file,
    result,
    error,
    status,
    canTranslate,
    updateSourceLanguage,
    updateTargetLanguage,
    updateText,
    selectFile,
    clearFile,
    reset,
    translate,
    download,
  };
}

export type TranslatorSession = ReturnType<typeof useTranslatorSession>;
