"use client";

import * as pdfjsLib from "pdfjs-dist";

// Configure the PDF.js worker. We try the local bundled worker via ?url
// (handled by Next.js webpack) and fall back to a version-matched CDN.
let configured = false;

export async function ensureWorker() {
  if (configured) return;
  try {
    // dynamic import returns the URL of the emitted worker asset
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
  configured = true;
}

export { pdfjsLib };
