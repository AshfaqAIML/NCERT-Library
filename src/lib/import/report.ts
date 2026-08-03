export interface ImportReportEntry {
  file: string;
  status: "imported" | "updated" | "skipped" | "duplicate" | "error" | "warning";
  message: string;
  bookId?: string;
  title?: string;
}

export interface ImportReport {
  scanned: number;
  imported: number;
  updated: number;
  skipped: number;
  duplicates: number;
  errors: number;
  warnings: number;
  missingCovers: number;
  missingMetadata: number;
  brokenPdfs: number;
  entries: ImportReportEntry[];
  storageUsageBytes: number;
  generatedAt: string;
}

export function createEmptyReport(): ImportReport {
  return {
    scanned: 0, imported: 0, updated: 0, skipped: 0, duplicates: 0,
    errors: 0, warnings: 0, missingCovers: 0, missingMetadata: 0, brokenPdfs: 0,
    entries: [], storageUsageBytes: 0, generatedAt: new Date().toISOString(),
  };
}

export function addEntry(report: ImportReport, entry: ImportReportEntry): void {
  report.entries.push(entry);
  switch (entry.status) {
    case "imported": report.imported++; break;
    case "updated": report.updated++; break;
    case "skipped": report.skipped++; break;
    case "duplicate": report.duplicates++; break;
    case "error": report.errors++; report.brokenPdfs++; break;
    case "warning": report.warnings++; break;
  }
}

export function summarizeReport(report: ImportReport): string {
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
  if (report.entries.some((e) => e.status === "error" || e.status === "warning" || e.status === "duplicate")) {
    lines.push("", "  Details:");
    for (const e of report.entries.filter((x) => x.status !== "imported" && x.status !== "updated" && x.status !== "skipped")) {
      lines.push(`  [${e.status.toUpperCase()}] ${e.file}: ${e.message}`);
    }
    lines.push("═══════════════════════════════════════════════");
  }
  return lines.join("\n");
}
