import { readdirSync, statSync } from "fs";
import { join, relative, basename, dirname } from "path";

export interface ScannedFile {
  /** Absolute path to the PDF */
  absolutePath: string;
  /** Path relative to the library root */
  relativePath: string;
  /** Just the filename, e.g. "class-6-history-our-pasts-1.pdf" */
  fileName: string;
  /** Folder name (immediate parent) */
  folderName: string;
  /** File size in bytes */
  sizeBytes: number;
}

/**
 * Recursively scan a directory for PDF files.
 * Skips hidden files, temp files, and non-PDF files.
 * Returns a flat list of ScannedFile entries.
 */
export function scanDirectory(rootPath: string): ScannedFile[] {
  const results: ScannedFile[] = [];

  function walk(dir: string) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch (e) {
      console.warn(`[scanner] Cannot read directory: ${dir} — ${(e as Error).message}`);
      return;
    }

    for (const entry of entries) {
      // Skip hidden files/dirs (starting with .)
      if (entry.startsWith(".")) continue;
      // Skip common temp/system files
      if (/^(Thumbs\.db|\.DS_Store|desktop\.ini|~\$)/i.test(entry)) continue;

      const fullPath = join(dir, entry);
      let stats: ReturnType<typeof statSync>;
      try {
        stats = statSync(fullPath);
      } catch {
        continue;
      }

      if (stats.isDirectory()) {
        walk(fullPath);
      } else if (stats.isFile() && /\.pdf$/i.test(entry)) {
        // Skip files smaller than 1KB (likely corrupted/placeholder)
        if (stats.size < 1024) {
          console.warn(`[scanner] Skipping tiny file (likely corrupt): ${fullPath} (${stats.size} bytes)`);
          continue;
        }
        results.push({
          absolutePath: fullPath,
          relativePath: relative(rootPath, fullPath),
          fileName: basename(fullPath),
          folderName: basename(dirname(fullPath)),
          sizeBytes: stats.size,
        });
      }
    }
  }

  walk(rootPath);
  return results;
}
