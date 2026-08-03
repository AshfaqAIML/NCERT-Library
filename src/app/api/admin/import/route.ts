import { requireAdmin } from "@/lib/auth";
import { handle } from "@/lib/http";
import { runImport, DEFAULT_OPTIONS } from "@/lib/import/importer";
import { existsSync, statSync } from "fs";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min for large libraries

// GET — preview the library folder (scan without importing)
export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const libPath = process.env.NCERT_LIBRARY_PATH || "./ncert-books";
    const exists = existsSync(libPath);
    let fileCount = 0;
    let sizeBytes = 0;
    if (exists) {
      const { scanDirectory } = await import("@/lib/import/scanner");
      const files = scanDirectory(libPath);
      fileCount = files.length;
      sizeBytes = files.reduce((s, f) => s + f.sizeBytes, 0);
    }
    return {
      libraryPath: libPath,
      exists,
      pdfCount: fileCount,
      storageBytes: sizeBytes,
      storageMB: Math.round((sizeBytes / 1024 / 1024) * 100) / 100,
    };
  });
}

// POST — trigger an import run
export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const report = await runImport({
      dryRun: body.dryRun ?? false,
      skipCovers: body.skipCovers ?? false,
      pruneRemoved: body.prune ?? false,
    });
    return report;
  });
}
