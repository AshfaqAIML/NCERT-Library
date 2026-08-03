#!/usr/bin/env bun
/**
 * Import real NCERT books from ./ncert-books into the app.
 *
 * - Scans ncert-books (excluding the nested Website/ repo)
 * - Validates + classifies each PDF
 * - Uploads the PDF to Vercel Blob (public)
 * - Generates a cover thumbnail into /public/covers
 * - Upserts the book in the database (pdfUrl = Blob URL)
 * - Removes dummy/seed books (those whose pdfUrl starts with /books/)
 *
 * Env: DATABASE_URL (in .env), BLOB_READ_WRITE_TOKEN (in .env.local)
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { put, head } from "@vercel/blob";
import { db } from "../src/lib/db";
import { scanDirectory } from "../src/lib/import/scanner";
import { classifyBook } from "../src/lib/import/classifier";
import { validatePdf } from "../src/lib/import/pdf-validator";
import { generateCover, ensureCoversDir } from "../src/lib/import/cover-generator";
import { ensureSubjects } from "../src/lib/import/importer";

// ---------------------------------------------------------------------------
// Load .env + .env.local into process.env (only fill missing keys)
// ---------------------------------------------------------------------------
function loadEnvFile(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvFile(join(process.cwd(), ".env"));
loadEnvFile(join(process.cwd(), ".env.local"));

const EXCLUDE_DIRS = new Set(["Website", ".git"]);

function mainFilteredScan(): ReturnType<typeof scanDirectory> {
  const all = scanDirectory(process.env.NCERT_LIBRARY_PATH || "./ncert-books");
  return all.filter((f) => {
    const firstSeg = f.relativePath.split(/[\\/]/)[0];
    return !EXCLUDE_DIRS.has(firstSeg);
  });
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("✗ BLOB_READ_WRITE_TOKEN not found. Run `vercel blob create-store` first.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL not found in .env");
    process.exit(1);
  }

  const files = mainFilteredScan();
  console.log(`[import] Found ${files.length} real NCERT PDFs (Website/ excluded)`);

  if (files.length === 0) process.exit(0);

  await ensureSubjects();
  ensureCoversDir(join(process.cwd(), "public", "covers"));

  let imported = 0;
  let updated = 0;
  let errors = 0;
  let skipped = 0;

  for (const file of files) {
    console.log(`\n[import] → ${file.relativePath}`);
    try {
      const validation = await validatePdf(file.absolutePath);
      if (!validation.isValid) {
        console.error(`  ✗ invalid PDF: ${validation.error}`);
        errors++;
        continue;
      }

      const classification = classifyBook(file.relativePath, file.fileName);
      for (const w of classification.warnings) console.warn(`  ⚠ ${w}`);
      if (!classification.subjectSlug || !classification.classNum) {
        console.error("  ✗ could not classify (subject/class missing)");
        errors++;
        continue;
      }

      const subject = await db.subject.findUnique({ where: { slug: classification.subjectSlug } });
      const language = await db.language.findUnique({ where: { code: classification.language } });
      if (!subject || !language) {
        console.error(`  ✗ subject (${classification.subjectSlug}) or language (${classification.language}) missing`);
        errors++;
        continue;
      }

      // Slug derived from classified title
      const slug = classification.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);

      // Upload to Blob (skip if already present with the same size)
      const bytes = readFileSync(file.absolutePath);
      const blobPath = `books/${slug}.pdf`;
      let url: string;
      try {
        const existing = await head(blobPath);
        if (existing && existing.size === bytes.length) {
          url = existing.url;
          console.log(`  → blob already present, reusing: ${url.split("/").pop()}`);
        } else {
          const res = await put(blobPath, bytes, {
            access: "public",
            contentType: "application/pdf",
            addRandomSuffix: false,
          });
          url = res.url;
          console.log(`  → uploaded: ${url.split("/").pop()}`);
        }
      } catch {
        const res = await put(blobPath, bytes, {
          access: "public",
          contentType: "application/pdf",
          addRandomSuffix: false,
        });
        url = res.url;
        console.log(`  → uploaded: ${url.split("/").pop()}`);
      }

      // Cover thumbnail
      const coverUrl = await generateCover(
        file.absolutePath,
        slug,
        join(process.cwd(), "public", "covers"),
        classification.title,
        subject.name,
        classification.classNum,
      );

      const bookData = {
        title: classification.title,
        author: "NCERT",
        description: `${subject.name} NCERT textbook for Class ${classification.classNum}. Essential reading for UPSC/IAS preparation.`,
        subjectId: subject.id,
        languageId: language.id,
        classNum: classification.classNum,
        bookType: classification.bookType,
        pdfUrl: url,
        coverImage: coverUrl,
        pages: validation.pageCount,
        fileSizeKb: Math.round(file.sizeBytes / 1024),
        edition: classification.bookType === "OLD" ? "Old NCERT" : classification.bookType === "EXEMPLAR" ? "Exemplar" : "New NCERT",
        publisher: "NCERT",
        publishedYear: new Date().getFullYear(),
        allowDownload: true,
        rating: 4.5,
        ratingCount: 0,
        downloadCount: 0,
        viewCount: 0,
      };

      const existing = await db.book.findUnique({ where: { slug } });
      if (existing) {
        await db.book.update({ where: { id: existing.id }, data: bookData });
        console.log(`  ✓ updated: ${classification.title}`);
        updated++;
      } else {
        await db.book.create({ data: { ...bookData, slug } });
        console.log(`  ✓ imported: ${classification.title}`);
        imported++;
      }
    } catch (e) {
      console.error(`  ✗ failed: ${(e as Error).message}`);
      errors++;
    }
  }

  // Remove seed/dummy books (those served from /books/...)
  const removed = await db.book.deleteMany({ where: { pdfUrl: { startsWith: "/books/" } } });
  console.log(`\n[import] Removed ${removed.count} dummy books (/books/...)`);

  console.log(`\n═══════════════════════════════════`);
  console.log(`  Imported: ${imported}   Updated: ${updated}   Errors: ${errors}   Skipped: ${skipped}`);
  console.log(`═══════════════════════════════════`);
  await db.$disconnect();
  if (errors > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
