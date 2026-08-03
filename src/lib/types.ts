// Shared types for the NCERT Library platform

export type View = "home" | "library" | "book" | "reader" | "profile" | "admin" | "auth";

export type BookType = "NEW" | "OLD";
export type Role = "USER" | "ADMIN";

export interface SubjectT {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string | null;
  sortOrder: number;
}

export interface LanguageT {
  id: string;
  name: string;
  code: string;
}

export interface BookT {
  id: string;
  title: string;
  slug: string;
  author: string | null;
  description: string | null;
  subjectId: string;
  languageId: string;
  classNum: number;
  bookType: BookType;
  coverImage: string | null;
  coverGradient: string | null;
  pdfUrl: string;
  pages: number;
  fileSizeKb: number;
  edition: string | null;
  publisher: string | null;
  publishedYear: number | null;
  rating: number;
  ratingCount: number;
  downloadCount: number;
  viewCount: number;
  trending: boolean;
  featured: boolean;
  recentlyAdded: boolean;
  allowDownload: boolean;
  chapters: string | null;
  createdAt: string;
  subject?: SubjectT;
  language?: LanguageT;
}

export interface BookFilters {
  q: string;
  classNum: number | "all";
  language: string | "all";
  subject: string | "all";
  bookType: BookType | "all";
  sort: "popular" | "rating" | "newest" | "downloads" | "title";
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: Role;
  bio?: string | null;
}

export type SortKey = BookFilters["sort"];

export interface HighlightT {
  id: string;
  page: number;
  text: string;
  color: string;
  kind: "HIGHLIGHT" | "UNDERLINE" | "STRIKETHROUGH";
  note?: string | null;
  createdAt: string;
}

export interface BookmarkT {
  id: string;
  page: number;
  label?: string | null;
  createdAt: string;
}

export interface NoteT {
  id: string;
  page: number;
  content: string;
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressT {
  currentPage: number;
  totalPages: number;
  percent: number;
  lastReadAt: string;
}
