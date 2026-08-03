#!/usr/bin/env bun
/**
 * NCERT Library Import Script
 *
 * Usage:
 *   bun run import:ncert              # full import (scan + classify + covers + DB)
 *   bun run import:ncert -- --dry-run # scan + classify only, no DB writes
 *   bun run import:ncert -- --skip-covers  # skip cover generation (faster)
 *   bun run import:ncert -- --prune   # delete DB records for removed files
 *
 * Configuration:
 *   Set NCERT_LIBRARY_PATH in .env to point at your NCERT PDFs folder.
 */

import { runImport } from "../src/lib/import/importer";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const skipCovers = args.includes("--skip-covers");
  const prune = args.includes("--prune");

  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  NCERT Library — Auto Import Utility          ║");
  console.log("╚═══════════════════════════════════════════════╝");
  console.log(`  Library path: ${process.env.NCERT_LIBRARY_PATH || "./ncert-books"}`);
  console.log(`  Mode: ${dryRun ? "DRY RUN (no writes)" : "FULL IMPORT"}`);
  console.log(`  Covers: ${skipCovers ? "SKIP" : "GENERATE"}`);
  console.log(`  Prune removed: ${prune ? "YES" : "NO"}`);
  console.log("");

  try {
    const report = await runImport({ dryRun, skipCovers, pruneRemoved: prune });
    if (report.errors > 0) {
      console.log(`\n⚠ ${report.errors} error(s) occurred. Review the report above.`);
      process.exit(1);
    }
    console.log(`\n✓ Import complete. ${report.imported} new, ${report.updated} updated, ${report.duplicates} duplicates skipped.`);
    process.exit(0);
  } catch (e) {
    console.error("\n✗ Import failed:", e);
    process.exit(1);
  }
}

main();
