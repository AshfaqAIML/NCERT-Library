/**
 * Optional file watcher for the NCERT library folder.
 * Automatically imports new PDFs when they appear in the watched folder.
 *
 * Usage:
 *   bun run watch:ncert
 *
 * Requires NCERT_LIBRARY_PATH to be set.
 */
import { watch, type FSWatcher } from "fs";
import { join } from "path";
import { runImport } from "../src/lib/import/importer";

const LIBRARY_PATH = process.env.NCERT_LIBRARY_PATH || "./ncert-books";
const DEBOUNCE_MS = 2000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let running = false;

export function startWatcher(path: string = LIBRARY_PATH): FSWatcher {
  console.log(`[watcher] Watching: ${path}`);
  console.log(`[watcher] New PDFs will be auto-imported (debounced ${DEBOUNCE_MS}ms)\n`);

  const watcher = watch(path, { recursive: true }, (eventType, filename) => {
    if (!filename || !/\.pdf$/i.test(filename)) return;
    // Debounce: wait a bit for the file write to complete
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (running) return;
      running = true;
      console.log(`\n[watcher] Change detected: ${filename}. Re-running import...`);
      try {
        await runImport({ skipCovers: false });
      } catch (e) {
        console.error("[watcher] Import error:", e);
      } finally {
        running = false;
      }
    }, DEBOUNCE_MS);
  });

  // Initial import on startup
  runImport({ skipCovers: false }).catch(console.error);

  return watcher;
}

// Run if called directly
if (require.main === module) {
  const watcher = startWatcher();
  process.on("SIGINT", () => {
    console.log("\n[watcher] Stopping...");
    watcher.close();
    process.exit(0);
  });
}
