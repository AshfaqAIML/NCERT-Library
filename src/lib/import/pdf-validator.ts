import { createHash } from "crypto";
import { readFileSync } from "fs";

/**
 * Validate a PDF file: check magic bytes, extract page count, compute hash.
 * Returns null for corrupted/broken PDFs.
 */
export interface PdfValidation {
  isValid: boolean;
  pageCount: number;
  fileHash: string;
  error?: string;
}

export async function validatePdf(filePath: string): Promise<PdfValidation> {
  // 1. Check magic bytes (%PDF)
  let header: Buffer;
  try {
    header = readFileSync(filePath, { encoding: null }) as unknown as Buffer;
  } catch (e) {
    return { isValid: false, pageCount: 0, fileHash: "", error: `Cannot read file: ${(e as Error).message}` };
  }

  if (!header || header.length < 5) {
    return { isValid: false, pageCount: 0, fileHash: "", error: "File is empty or too small" };
  }

  const magic = header.slice(0, 5).toString("ascii");
  if (magic !== "%PDF-") {
    return { isValid: false, pageCount: 0, fileHash: "", error: `Not a valid PDF (magic bytes: ${magic})` };
  }

  // 2. Compute file hash (for deduplication)
  const fileHash = createHash("sha256").update(header).digest("hex").slice(0, 32);

  // 3. Extract page count using pdf-lib (lightweight, no worker needed)
  let pageCount = 0;
  try {
    const { PDFDocument } = await import("pdf-lib");
    const bytes = readFileSync(filePath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    pageCount = doc.getPageCount();
  } catch (e) {
    return { isValid: false, pageCount: 0, fileHash, error: `Corrupted PDF: ${(e as Error).message}` };
  }

  if (pageCount === 0) {
    return { isValid: false, pageCount: 0, fileHash, error: "PDF has 0 pages" };
  }

  return { isValid: true, pageCount, fileHash };
}

/** Estimate reading time in minutes (~1.5 min/page for NCERT material). */
export function estimateReadingTime(pageCount: number): number {
  return Math.max(10, Math.round(pageCount * 1.5));
}
