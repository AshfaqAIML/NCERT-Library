/**
 * PDF chunking pipeline.
 * Extracts text from a PDF using pdfjs, detects chapters/sections/headings,
 * and splits into paragraph-level chunks (~500 chars) for retrieval.
 *
 * Output: Chunk[] ready for embedding + storage.
 */

export interface Chunk {
  chunkIndex: number;
  page: number;
  chapter: string | null;
  section: string | null;
  heading: string | null;
  text: string;
  chunkType: "paragraph" | "heading" | "definition" | "table" | "exercise";
}

export interface ExtractedPage {
  page: number;
  text: string;
  items: { str: string; x: number; y: number; height: number; fontName: string }[];
}

/**
 * Extract text from all pages of a PDF.
 * Uses pdf-parse (Node-native, no DOM required) for text extraction.
 * Falls back to page-by-page text via pdfjs if positional data is needed.
 */
export async function extractPdfText(pdfUrl: string): Promise<ExtractedPage[]> {
  const fs = await import("fs");
  const path = await import("path");

  // Resolve the PDF path: handle both relative URLs and absolute paths
  let filePath: string;
  if (pdfUrl.startsWith("http")) {
    // Remote URL — download (not supported in indexer; use local files)
    throw new Error("Remote URLs not supported by indexer. Use local /public/books/ paths.");
  } else if (pdfUrl.startsWith("/")) {
    filePath = path.join(process.cwd(), "public", pdfUrl);
  } else {
    filePath = path.join(process.cwd(), "public", "books", pdfUrl);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF file not found: ${filePath}`);
  }

  // Use unpdf for text extraction (Node-native, no DOMMatrix needed)
  const { extractText, getDocumentProxy } = await import("unpdf");
  const buffer = fs.readFileSync(filePath);
  const pdf = await getDocumentProxy({ data: new Uint8Array(buffer) });

  const pages: ExtractedPage[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const { text } = await extractText(page, { mergePages: false });
    const pageText = (text || "").replace(/\s+/g, " ").trim();
    if (!pageText) continue;
    // Create pseudo-items for heading detection
    const items = pageText.split(/(?<=[.!?])\s+/).map((str) => ({
      str,
      x: 0,
      y: 0,
      height: 10,
      fontName: "",
    }));
    pages.push({ page: i, text: pageText, items });
  }

  return pages;
}

/**
 * Chunk extracted pages into paragraph-level chunks with chapter/section detection.
 */
export function chunkPages(pages: ExtractedPage[]): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkIndex = 0;
  let currentChapter: string | null = null;
  let currentSection: string | null = null;
  let lastHeading: string | null = null;

  for (const page of pages) {
    // Detect chapter headings: "Chapter N" or "Unit N" or numbered headings (large font)
    for (const item of page.items) {
      const str = item.str.trim();
      if (!str) continue;
      // Heuristic: chapter titles are often short, bold/large, and contain "Chapter"/"Unit"
      const isChapter = /^chapter\s+\d+/i.test(str) || /^unit[-\s]+\d+/i.test(str);
      const isSection = /^[A-Z][A-Za-z\s]{5,60}$/.test(str) && item.height > 11 && str.split(" ").length <= 8;

      if (isChapter) {
        currentChapter = str;
        currentSection = null;
        chunks.push({
          chunkIndex: chunkIndex++,
          page: page.page,
          chapter: currentChapter,
          section: null,
          heading: str,
          text: str,
          chunkType: "heading",
        });
        lastHeading = str;
      } else if (isSection && str !== currentChapter) {
        currentSection = str;
        lastHeading = str;
      }
    }

    // Split page text into paragraphs
    const paragraphs = splitParagraphs(page.text);
    for (const para of paragraphs) {
      if (para.length < 30) continue; // skip tiny fragments

      // Detect chunk type
      let chunkType: Chunk["chunkType"] = "paragraph";
      if (/^(definition|def\.|meaning)\s*:/i.test(para)) chunkType = "definition";
      else if (/^(table|fig\.|figure)\s+\d+/i.test(para)) chunkType = "table";
      else if (/^(exercise|question|q\.|practice|activity)\s*\d+/i.test(para)) chunkType = "exercise";

      // Split long paragraphs into ~500-char chunks at sentence boundaries
      const subChunks = splitLongText(para, 500);
      for (const sub of subChunks) {
        chunks.push({
          chunkIndex: chunkIndex++,
          page: page.page,
          chapter: currentChapter,
          section: currentSection,
          heading: lastHeading,
          text: sub,
          chunkType,
        });
      }
    }
  }

  return chunks;
}

/** Split text into paragraphs by double-newline or sentence gaps. */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Split long text into chunks of ~maxLen at sentence boundaries. */
function splitLongText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = "";
  for (const s of sentences) {
    if ((current + " " + s).length > maxLen && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current = current ? current + " " + s : s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
