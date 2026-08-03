import { db } from "@/lib/db";
import { scanDirectory, type ScannedFile } from "./scanner";
import { classifyBook, slugify, SUBJECT_MAPPINGS, type BookType } from "./classifier";
import { validatePdf, estimateReadingTime } from "./pdf-validator";
import { generateCover, ensureCoversDir } from "./cover-generator";
import { createEmptyReport, addEntry, type ImportReport, type ImportReportEntry } from "./report";
import { copyFileSync, existsSync, mkdirSync, statSync } from "fs";
import { join, dirname } from "path";

export interface ImportOptions {
  /** Root path to scan for PDFs */
  libraryPath: string;
  /** Public books directory (where PDFs are copied) */
  booksDir: string;
  /** Public covers directory (where cover thumbnails are stored) */
  coversDir: string;
  /** Whether to copy PDFs into /public/books (true) or reference in-place (false) */
  copyFiles: boolean;
  /** Dry run — scan + classify but don't write to DB */
  dryRun: boolean;
  /** Skip cover generation (faster) */
  skipCovers: boolean;
  /** Whether to delete DB records for files no longer present (requires confirmation) */
  pruneRemoved: boolean;
}

export const DEFAULT_OPTIONS: ImportOptions = {
  libraryPath: process.env.NCERT_LIBRARY_PATH || "./ncert-books",
  booksDir: join(process.cwd(), "public", "books"),
  coversDir: join(process.cwd(), "public", "covers"),
  copyFiles: true,
  dryRun: false,
  skipCovers: false,
  pruneRemoved: false,
};

/**
 * Ensure all subject mappings exist in the database.
 * Idempotent — creates subjects if missing.
 */
export async function ensureSubjects(): Promise<void> {
  for (const s of SUBJECT_MAPPINGS) {
    await db.subject.upsert({
      where: { slug: s.slug },
      create: { name: s.name, slug: s.slug, description: s.description, color: s.color, icon: s.icon, sortOrder: s.sortOrder },
      update: { name: s.name, description: s.description, color: s.color, icon: s.icon, sortOrder: s.sortOrder },
    });
  }
  // Ensure English + Hindi languages exist
  await db.language.upsert({ where: { code: "en" }, update: {}, create: { name: "English", code: "en" } });
  await db.language.upsert({ where: { code: "hi" }, update: {}, create: { name: "Hindi", code: "hi" } });
}

/**
 * Main import orchestrator.
 * Scans → classifies → validates → generates covers → inserts into DB.
 */
export async function runImport(opts: Partial<ImportOptions> = {}): Promise<ImportReport> {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const report = createEmptyReport();

  console.log(`\n[import] Scanning: ${options.libraryPath}`);
  const files = scanDirectory(options.libraryPath);
  report.scanned = files.length;
  console.log(`[import] Found ${files.length} PDF files\n`);

  if (files.length === 0) {
    console.log("[import] No PDFs found. Check NCERT_LIBRARY_PATH in .env");
    return report;
  }

  // Ensure subjects + languages exist
  if (!options.dryRun) {
    await ensureSubjects();
  }

  // Track file hashes for dedup
  const seenHashes = new Map<string, string>(); // hash → bookId

  for (const file of files) {
    const entry = await processFile(file, options, seenHashes, report);
    if (entry) addEntry(report, entry);
  }

  // Prune removed files
  if (options.pruneRemoved && !options.dryRun) {
    await pruneRemovedBooks(options.libraryPath, report);
  }

  // Storage usage
  report.storageUsageBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);

  console.log("\n" + summarizeReportImport(report));
  return report;
}

async function processFile(
  file: ScannedFile,
  opts: ImportOptions,
  seenHashes: Map<string, string>,
  report: ImportReport,
): Promise<ImportReportEntry | null> {
  console.log(`[import] Processing: ${file.relativePath}`);

  // 1. Validate PDF
  const validation = await validatePdf(file.absolutePath);
  if (!validation.isValid) {
    report.brokenPdfs++;
    return { file: file.relativePath, status: "error", message: validation.error || "Invalid PDF" };
  }

  // 2. Check for duplicates (by hash)
  if (seenHashes.has(validation.fileHash)) {
    const existingId = seenHashes.get(validation.fileHash)!;
    return { file: file.relativePath, status: "duplicate", message: `Duplicate of book ${existingId}`, bookId: existingId };
  }

  // 3. Classify
  const classification = classifyBook(file.relativePath, file.fileName);
  if (classification.warnings.length > 0) {
    for (const w of classification.warnings) console.warn(`[import] ⚠ ${w}`);
    report.warnings += classification.warnings.length;
  }
  if (!classification.subjectSlug || !classification.classNum) {
    report.missingMetadata++;
    return { file: file.relativePath, status: "error", message: "Could not classify: missing subject or class" };
  }

  // 4. Build slug + paths
  const slug = slugify(classification.title);
  const subject = await db.subject.findUnique({ where: { slug: classification.subjectSlug } });
  const language = await db.language.findUnique({ where: { code: classification.language } });

  if (!subject || !language) {
    report.missingMetadata++;
    return { file: file.relativePath, status: "error", message: "Subject or language not found in DB" };
  }

  // 5. Copy PDF to /public/books (preserving structure)
  let pdfUrl = `/books/${file.relativePath}`;
  if (opts.copyFiles) {
    const destPath = join(opts.booksDir, file.relativePath);
    if (!existsSync(dirname(destPath))) mkdirSync(dirname(destPath), { recursive: true });
    if (!existsSync(destPath)) {
      copyFileSync(file.absolutePath, destPath);
    }
  }

  // 6. Generate cover
  let coverUrl: string | null = null;
  if (!opts.skipCovers && !opts.dryRun) {
    ensureCoversDir(opts.coversDir);
    coverUrl = await generateCover(file.absolutePath, slug, opts.coversDir, classification.title, classification.subjectName ?? undefined, classification.classNum ?? undefined);
  }
  if (!coverUrl) report.missingCovers++;

  // 7. Check if book already exists (by slug)
  const existing = await db.book.findUnique({ where: { slug } });
  const readingTime = estimateReadingTime(validation.pageCount);
  const fileSizeKb = Math.round(file.sizeBytes / 1024);

  const bookData = {
    title: classification.title,
    author: "NCERT",
    description: `${classification.subjectName} NCERT textbook for Class ${classification.classNum}. ${classification.bookType === "EXEMPLAR" ? "Exemplar problems. " : ""}Essential reading for UPSC/IAS preparation.`,
    subjectId: subject.id,
    languageId: language.id,
    classNum: classification.classNum,
    bookType: classification.bookType as BookType,
    pdfUrl,
    pages: validation.pageCount,
    fileSizeKb,
    edition: classification.bookType === "OLD" ? "Old NCERT" : classification.bookType === "EXEMPLAR" ? "Exemplar" : "New NCERT",
    publisher: "NCERT",
    publishedYear: new Date().getFullYear(),
    allowDownload: true,
    rating: 4.5,
    ratingCount: 0,
    downloadCount: 0,
    viewCount: 0,
  };

  if (opts.dryRun) {
    console.log(`[import] [DRY RUN] Would import: ${classification.title}`);
    return { file: file.relativePath, status: "imported", message: `[DRY RUN] ${classification.title}`, title: classification.title };
  }

  if (existing) {
    // Update existing record
    const updated = await db.book.update({ where: { id: existing.id }, data: bookData });
    seenHashes.set(validation.fileHash, updated.id);
    return { file: file.relativePath, status: "updated", message: classification.title, bookId: updated.id, title: classification.title };
  }

  // Create new record
  const created = await db.book.create({
    data: { ...bookData, slug, coverImage: coverUrl },
  });
  seenHashes.set(validation.fileHash, created.id);
  console.log(`[import] ✓ Imported: ${classification.title} (id: ${created.id})`);
  return { file: file.relativePath, status: "imported", message: classification.title, bookId: created.id, title: classification.title };
}

/** Remove DB records for books whose PDF files no longer exist. */
async function pruneRemovedBooks(libraryPath: string, report: ImportReport): Promise<void> {
  const allBooks = await db.book.findMany({ select: { id: true, slug: true, title: true, pdfUrl: true } });
  for (const book of allBooks) {
    // Only prune books that came from the import (pdfUrl starts with /books/)
    if (!book.pdfUrl.startsWith("/books/")) continue;
    const filePath = join(process.cwd(), "public", book.pdfUrl);
    if (!existsSync(filePath)) {
      console.log(`[import] Pruning removed book: ${book.title}`);
      await db.book.delete({ where: { id: book.id } }).catch(() => {});
      report.entries.push({ file: book.pdfUrl, status: "skipped", message: `Pruned (file removed): ${book.title}` });
    }
  }
}

function summarizeReportImport(report: ImportReport): string {
  const lines = [
    "═══════════════════════════════════════════════",
    "  NCERT Library Import Report",
    "═══════════════════════════════════════════════",
    `  Generated: ${new Date(report.generatedAt).toLocaleString()}`,
    "",
    `  PDFs scanned:     ${report.scanned}`,
    `  Imported:         ${report.imported}`,
    `  Updated:          ${report.updated}`,
    `  Skipped (exist):  ${report.skipped}`,
    `  Duplicates:       ${report.duplicates}`,
    `  Errors:           ${report.errors}`,
    `  Warnings:         ${report.warnings}`,
    `  Broken PDFs:      ${report.brokenPdfs}`,
    `  Missing covers:   ${report.missingCovers}`,
    `  Missing metadata: ${report.missingMetadata}`,
    `  Storage:          ${(report.storageUsageBytes / 1024 / 1024).toFixed(2)} MB`,
    "═══════════════════════════════════════════════",
  ];
  return lines.join("\n");
}
