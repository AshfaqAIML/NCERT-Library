/**
 * Subject mapping + classification config for NCERT auto-import.
 *
 * Maps folder names and filename slugs to canonical subject records.
 * Handles the 9 subject folders in the user's NCERT library structure.
 */

export interface SubjectMapping {
  name: string;
  slug: string;
  folderAliases: string[];
  filenameKeywords: string[];
  icon: string;
  color: string;
  sortOrder: number;
  description: string;
}

export const SUBJECT_MAPPINGS: SubjectMapping[] = [
  {
    name: "History", slug: "history",
    folderAliases: ["History", "history"],
    filenameKeywords: ["history", "our-pasts", "themes-in-world", "themes-in-indian"],
    icon: "Landmark", color: "amber", sortOrder: 1,
    description: "Ancient, medieval & modern Indian history plus world history — core UPSC material.",
  },
  {
    name: "Geography", slug: "geography",
    folderAliases: ["Geography", "geography"],
    filenameKeywords: ["geography", "the-earth-our-habitat", "our-environment", "resources-and-development", "contemporary-india", "fundamentals-of-physical", "india-physical-environment", "fundamentals-of-human"],
    icon: "Globe2", color: "emerald", sortOrder: 2,
    description: "Physical, human & Indian geography — the earth, climate, resources and environment.",
  },
  {
    name: "Polity", slug: "polity",
    folderAliases: ["Polity", "polity"],
    filenameKeywords: ["social-and-political-life", "democratic-politics"],
    icon: "Scale", color: "rose", sortOrder: 3,
    description: "Constitution, democratic politics & Indian governance for classes 6-10.",
  },
  {
    name: "Political Science", slug: "political-science",
    folderAliases: ["Political Science", "political-science", "PoliticalScience"],
    filenameKeywords: ["political-theory", "indian-constitution-at-work", "contemporary-world-politics", "politics-in-india"],
    icon: "Landmark", color: "rose", sortOrder: 4,
    description: "Political theory, Indian constitution & contemporary world politics (classes 11-12).",
  },
  {
    name: "Economics", slug: "economics",
    folderAliases: ["Economics", "economics", "Economy", "economy"],
    filenameKeywords: ["economics", "understanding-economic-development", "indian-economic-development", "introductory-macroeconomics", "introductory-microeconomics"],
    icon: "TrendingUp", color: "violet", sortOrder: 5,
    description: "Micro & macroeconomics, Indian economic development & public finance.",
  },
  {
    name: "Science", slug: "science",
    folderAliases: ["Science", "science"],
    filenameKeywords: ["science"],
    icon: "FlaskConical", color: "sky", sortOrder: 6,
    description: "General science fundamentals across physics, chemistry & biology.",
  },
  {
    name: "Psychology", slug: "psychology",
    folderAliases: ["Psychology", "psychology"],
    filenameKeywords: ["psychology"],
    icon: "Brain", color: "violet", sortOrder: 7,
    description: "Introduction to psychology & human behaviour — popular UPSC optional.",
  },
  {
    name: "Sociology", slug: "sociology",
    folderAliases: ["Sociology", "sociology", "Society", "society"],
    filenameKeywords: ["introducing-sociology", "understanding-society", "indian-society", "social-change-and-development"],
    icon: "Users", color: "amber", sortOrder: 8,
    description: "Sociology — introducing sociology, understanding society & Indian social structure.",
  },
  {
    name: "Art & Culture", slug: "art-culture",
    folderAliases: ["Art & Culture", "Art-and-Culture", "art-culture", "ArtCulture"],
    filenameKeywords: ["indian-art", "living-craft-traditions", "craft-traditions"],
    icon: "Palette", color: "rose", sortOrder: 9,
    description: "Indian art, architecture, music, dance & literary heritage.",
  },
  {
    name: "Environment", slug: "environment",
    folderAliases: ["Environment", "environment"],
    filenameKeywords: ["environment", "ecology", "biodiversity"],
    icon: "Leaf", color: "emerald", sortOrder: 10,
    description: "Ecology, biodiversity, climate change & conservation.",
  },
];

export type BookType = "NEW" | "OLD" | "EXEMPLAR";

export interface ClassificationResult {
  classNum: number | null;
  subjectSlug: string | null;
  subjectName: string | null;
  bookType: BookType;
  title: string;
  language: string;
  volume?: string | null;
  warnings: string[];
}

/**
 * Classify a PDF from its folder path + filename.
 * Filename convention: class-{N}-{subject-slug}[-{subtitle}].pdf
 */
export function classifyBook(filePath: string, fileName: string): ClassificationResult {
  const warnings: string[] = [];
  const baseName = fileName.replace(/\.pdf$/i, "");

  // 1. Class number
  const classMatch = baseName.match(/class[-_ ]?(\d{1,2})/i);
  const classNum = classMatch ? parseInt(classMatch[1], 10) : null;
  if (!classNum || classNum < 6 || classNum > 12) {
    warnings.push(`Could not determine valid class (6-12) from filename "${fileName}"`);
  }

  // 2. Subject — trust filename keywords over folder name when they conflict
  const parts = filePath.split("/");
  const folderName = parts.slice(-2, -1)[0] || "";
  let subject: SubjectMapping | null = null;

  for (const s of SUBJECT_MAPPINGS) {
    if (s.filenameKeywords.some((kw) => baseName.toLowerCase().includes(kw))) {
      subject = s;
      break;
    }
  }
  if (!subject) {
    for (const s of SUBJECT_MAPPINGS) {
      if (s.folderAliases.some((alias) => folderName.toLowerCase() === alias.toLowerCase())) {
        subject = s;
        break;
      }
    }
  }

  if (subject) {
    const folderSubject = SUBJECT_MAPPINGS.find((s) =>
      s.folderAliases.some((alias) => folderName.toLowerCase() === alias.toLowerCase())
    );
    if (folderSubject && folderSubject.slug !== subject.slug) {
      warnings.push(
        `Folder "${folderName}" suggests "${folderSubject.name}" but filename suggests "${subject.name}" — using filename subject.`
      );
    }
  }

  if (!subject) {
    warnings.push(`Could not determine subject from folder "${folderName}" or filename "${fileName}"`);
  }

  // 3. Book type
  let bookType: BookType = "NEW";
  if (/exemplar/i.test(baseName)) bookType = "EXEMPLAR";
  else if (/\bold\b|legacy/i.test(baseName) || /\bold\b/i.test(folderName)) bookType = "OLD";

  // 4. Volume
  const volumeMatch = baseName.match(/-(\d+)$/);
  const volume = volumeMatch ? toRoman(parseInt(volumeMatch[1], 10)) : null;

  // 5. Title
  const title = buildTitle(baseName, subject?.name, classNum, volume, bookType);

  // 6. Language
  const language = /hindi|urdu|tamil|telugu|bengali|marathi|gujarati|kannada|malayalam/i.test(baseName)
    ? detectLanguage(baseName)
    : "en";

  return { classNum, subjectSlug: subject?.slug ?? null, subjectName: subject?.name ?? null, bookType, title, language, volume, warnings };
}

function detectLanguage(baseName: string): string {
  if (/hindi/i.test(baseName)) return "hi";
  if (/urdu/i.test(baseName)) return "ur";
  if (/tamil/i.test(baseName)) return "ta";
  if (/telugu/i.test(baseName)) return "te";
  if (/bengali/i.test(baseName)) return "bn";
  return "en";
}

function buildTitle(baseName: string, subjectName: string | undefined, classNum: number | null, volume: string | null, bookType: BookType): string {
  let subtitle = baseName.replace(/^class[-_ ]?\d{1,2}[-_ ]?/i, "");
  if (subjectName) {
    const subjectSlug = subjectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    subtitle = subtitle.replace(new RegExp(`^${subjectSlug}[-_]?`, "i"), "");
  }
  subtitle = subtitle.replace(/[-_ ]?\d+$/, "");
  const isExemplar = bookType === "EXEMPLAR";
  subtitle = subtitle.replace(/exemplar[-_ ]?problems?/i, "").replace(/[-_]+$/g, "");

  let title = subtitle.split(/[-_]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  if (!title) title = subjectName || "NCERT Book";
  if (volume) title += ` - ${volume}`;
  if (isExemplar) title += " (Exemplar Problems)";
  if (classNum) title += ` · Class ${classNum}`;
  return title;
}

function toRoman(num: number): string {
  const romans: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let result = "";
  for (const [val, sym] of romans) { while (num >= val) { result += sym; num -= val; } }
  return result || String(num);
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}
