#!/usr/bin/env bun
import { indexAllBooks, getIndexStats } from "../src/lib/ai-engine/indexer";

async function main() {
  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  NCERT Library — AI Knowledge Base Indexer     ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  const stats0 = await getIndexStats();
  console.log(`Before: ${stats0.indexedBooks}/${stats0.totalBooks} books indexed, ${stats0.totalChunks} chunks\n`);

  const results = await indexAllBooks(process.argv.includes("--force"));

  console.log("\n═══════════════════════════════════════════════");
  console.log("  Indexing Results");
  console.log("═══════════════════════════════════════════════");
  let totalChunks = 0, totalPages = 0, errors = 0;
  for (const r of results) {
    console.log(`  ${r.bookTitle}: ${r.chunksCreated} chunks from ${r.pagesProcessed} pages${r.errors.length ? " ⚠ " + r.errors.join("; ") : ""}`);
    totalChunks += r.chunksCreated;
    totalPages += r.pagesProcessed;
    errors += r.errors.length;
  }
  console.log("───────────────────────────────────────────────");
  console.log(`  Total: ${totalChunks} chunks, ${totalPages} pages, ${errors} errors\n`);

  const stats1 = await getIndexStats();
  console.log(`After: ${stats1.indexedBooks}/${stats1.totalBooks} books indexed, ${stats1.totalChunks} chunks`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
