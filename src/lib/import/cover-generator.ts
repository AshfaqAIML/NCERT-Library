import { writeFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";

/**
 * Generate a cover image from the first page of a PDF.
 *
 * Strategy: use pdf-lib to extract page 1, then render it to an image.
 * Since pdf-lib can't rasterize (it only creates/modifies PDFs), we use
 * a different approach: extract the embedded images from page 1, or
 * generate a stylized text-based cover as a fallback.
 *
 * For true PDF rasterization in Node, we'd need pdfjs + a canvas lib.
 * Here we generate a beautiful gradient + text cover via sharp SVG.
 */
export async function generateCover(
  pdfPath: string,
  slug: string,
  coversDir: string,
  title?: string,
  subjectName?: string,
  classNum?: number,
): Promise<string | null> {
  const coverFile = join(coversDir, `${slug}.jpg`);
  const coverUrl = `/covers/${slug}.jpg`;

  if (existsSync(coverFile)) return coverUrl;

  try {
    ensureCoversDir(coversDir);

    // Generate a stylized cover (gradient + title text) via SVG → sharp
    const svg = buildCoverSvg(title || "NCERT Book", subjectName || "NCERT", classNum);
    await sharp(Buffer.from(svg))
      .resize(400, 560, { fit: "cover" })
      .jpeg({ quality: 85, progressive: true })
      .toFile(coverFile);

    return coverUrl;
  } catch (e) {
    console.warn(`[cover-generator] Failed for ${pdfPath}: ${(e as Error).message}`);
    return null;
  }
}

/** Build a beautiful SVG cover with gradient + title. */
function buildCoverSvg(title: string, subject: string, classNum?: number): string {
  const gradients: Record<string, string> = {
    History: ["#f59e0b", "#dc2626"],
    Geography: ["#10b981", "#0891b2"],
    Polity: ["#f43f5e", "#be185d"],
    "Political Science": ["#f43f5e", "#9333ea"],
    Economics: ["#8b5cf6", "#6366f1"],
    Science: ["#0ea5e9", "#3b82f6"],
    Psychology: ["#8b5cf6", "#a855f7"],
    Sociology: ["#f59e0b", "#84cc16"],
    "Art & Culture": ["#ec4899", "#f43f5e"],
    Environment: ["#10b981", "#16a34a"],
  };
  const [c1, c2] = gradients[subject] || ["#10b981", "#0891b2"];

  // Truncate title for display
  const displayTitle = (title.length > 40 ? title.slice(0, 37) + "…" : title);
  const subjectLabel = subject.toUpperCase();
  const classLabel = classNum ? `CLASS ${classNum}` : "";

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  return `<svg width="400" height="560" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1}"/>
      <stop offset="100%" style="stop-color:${c2}"/>
    </linearGradient>
    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1" fill="white" opacity="0.08"/>
    </pattern>
  </defs>
  <rect width="400" height="560" fill="url(#g)"/>
  <rect width="400" height="560" fill="url(#dots)"/>
  <rect x="0" y="0" width="12" height="560" fill="black" opacity="0.2"/>
  <rect x="0" y="0" width="120" height="560" fill="white" opacity="0.05"/>
  <text x="30" y="50" font-family="Georgia, serif" font-size="13" font-weight="bold" fill="white" opacity="0.9" letter-spacing="2">${esc(subjectLabel)}</text>
  <text x="30" y="70" font-family="Georgia, serif" font-size="11" fill="white" opacity="0.7" letter-spacing="1.5">${esc(classLabel)}</text>
  <text x="30" y="480" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="white" opacity="0.95">${esc(wrapText(displayTitle, 32))}</text>
  <text x="30" y="530" font-family="Georgia, serif" font-size="10" fill="white" opacity="0.6" letter-spacing="1">NCERT · FOR IAS</text>
</svg>`;
}

function wrapText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).length > maxLen) {
      lines.push(line);
      line = w;
    } else {
      line = line ? line + " " + w : w;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3).join("\n");
}

export function ensureCoversDir(coversDir: string): void {
  if (!existsSync(coversDir)) mkdirSync(coversDir, { recursive: true });
}
