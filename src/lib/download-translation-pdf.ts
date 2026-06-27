import type { TranslationResult } from "@/lib/api/translator";

type DownloadTranslationPdfInput = {
  result: TranslationResult;
  sourceFileName?: string;
};

type JsPdfDocument = InstanceType<typeof import("jspdf").jsPDF>;

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 52;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BRAND_GREEN: [number, number, number] = [19, 122, 92];
const BODY_TEXT: [number, number, number] = [27, 27, 23];
const MUTED_TEXT: [number, number, number] = [110, 110, 100];

export async function downloadTranslationPdf({
  result,
  sourceFileName,
}: DownloadTranslationPdfInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  doc.setProperties({
    title: result.title,
    subject: "Canopy translated document",
    creator: "Canopy",
  });

  drawDocumentHeader(doc, result, sourceFileName);
  y = 134;

  y = writeSectionTitle(doc, "Overview", y);
  y = writeMarkdown(doc, result.overviewMarkdown, y);

  if (result.warnings.length > 0) {
    y = writeSectionTitle(doc, "Translation notes", y + 8);
    y = writeMarkdown(doc, result.warnings.map((warning) => `- ${warning}`).join("\n"), y);
  }

  y = writeSectionTitle(doc, "Translated document", y + 12);
  writeMarkdown(doc, result.translatedMarkdown, y);
  drawFooters(doc);

  doc.save(`${toFileSlug(result.title || "canopy-translation")}.pdf`);
}

function drawDocumentHeader(
  doc: JsPdfDocument,
  result: TranslationResult,
  sourceFileName?: string,
) {
  doc.setFillColor(242, 241, 236);
  doc.rect(0, 0, PAGE_WIDTH, 112, "F");

  doc.setFillColor(...BRAND_GREEN);
  doc.circle(MARGIN + 6, MARGIN - 16, 5, "F");

  doc.setTextColor(...BODY_TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("CANOPY", MARGIN + 20, MARGIN - 11);

  doc.setFontSize(22);
  doc.text(result.title || "Translated document", MARGIN, MARGIN + 25, {
    maxWidth: CONTENT_WIDTH,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_TEXT);
  const metadata = [
    `Target: ${result.targetLanguage}`,
    result.detectedLanguage
      ? `Detected source: ${result.detectedLanguage}`
      : `Source: ${result.sourceLanguage}`,
    sourceFileName ? `File: ${sourceFileName}` : null,
  ]
    .filter(Boolean)
    .join("  |  ");
  doc.text(metadata, MARGIN, MARGIN + 48, { maxWidth: CONTENT_WIDTH });
}

function writeSectionTitle(doc: JsPdfDocument, title: string, y: number) {
  y = ensureSpace(doc, y, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BRAND_GREEN);
  doc.text(title, MARGIN, y);
  return y + 20;
}

function writeMarkdown(doc: JsPdfDocument, markdown: string, startY: number) {
  let y = startY;
  const lines = markdown.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      y += 8;
      continue;
    }

    const heading = line.match(/^#{1,4}\s+(.+)$/);
    if (heading) {
      y = ensureSpace(doc, y + 4, 28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(...BODY_TEXT);
      y = writeWrapped(doc, heading[1], y, { fontSize: 11.5, lineHeight: 15 });
      y += 4;
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      y = writeWrapped(doc, `- ${stripInlineMarkdown(bullet[1])}`, y, {
        fontSize: 10.5,
        lineHeight: 14.5,
        indent: 12,
      });
      y += 3;
      continue;
    }

    y = writeWrapped(doc, stripInlineMarkdown(line), y, {
      fontSize: 10.5,
      lineHeight: 14.5,
    });
    y += 5;
  }

  return y;
}

function writeWrapped(
  doc: JsPdfDocument,
  text: string,
  y: number,
  {
    fontSize,
    lineHeight,
    indent = 0,
  }: {
    fontSize: number;
    lineHeight: number;
    indent?: number;
  },
) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...BODY_TEXT);

  const wrapped = doc.splitTextToSize(text, CONTENT_WIDTH - indent) as string[];

  for (const line of wrapped) {
    y = ensureSpace(doc, y, lineHeight + 8);
    doc.text(line, MARGIN + indent, y);
    y += lineHeight;
  }

  return y;
}

function ensureSpace(doc: JsPdfDocument, y: number, needed: number) {
  if (y + needed <= PAGE_HEIGHT - MARGIN) return y;

  doc.addPage();
  return MARGIN;
}

function drawFooters(doc: JsPdfDocument) {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_TEXT);
    doc.text("CANOPY - Translation", MARGIN, PAGE_HEIGHT - 26);
    doc.text(String(page), PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 26, { align: "right" });
  }
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function toFileSlug(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${slug || "canopy-translation"}-translation`;
}
