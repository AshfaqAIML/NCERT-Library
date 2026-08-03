# NCERT Library for IAS

> A premium, production-ready educational platform hosting NCERT books for UPSC & IAS aspirants — read online, highlight, bookmark, take notes, search inside books, and let AI help you master every page.

Built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma, PDF.js, Framer Motion, and z-ai-web-dev-sdk.

> **Live Demo:** [https://ncert-library.vercel.app](https://ncert-library.vercel.app/) — browse and read the full NCERT library online

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [Importing NCERT Books](#importing-ncert-books)
- [AI Study Assistant](#ai-study-assistant)
- [API Reference](#api-reference)
- [PDF Reader Features](#pdf-reader-features)
- [Admin Panel](#admin-panel)
- [Deployment](#deployment)
- [Live Demo](#live-demo)
- [Demo Accounts](#demo-accounts)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)
- [License](#license)

---

## Overview

NCERT Library for IAS is a centralized platform where UPSC aspirants can:

- **Browse** NCERT books organized by subject (History, Geography, Polity, Economics, Science, Psychology, Sociology, Art & Culture, and more) and class (6–12)
- **Read online** with a world-class PDF.js reader featuring virtualized scrolling, text selection, highlights, sticky notes, bookmarks, in-book search, drawing tools, and 6 reading themes
- **Study with AI** — a RAG-grounded AI assistant that answers questions with citations from the actual book content, generates summaries, MCQs, flashcards, mind maps, revision notes, and translates to 9 Indian languages
- **Track progress** — reading streaks, daily goals, study calendar heatmap, reading time analytics, and personalized recommendations
- **Manage** the library via an admin panel with auto-import, analytics, book management, and AI knowledge base indexing

### Design Philosophy

The interface combines the best of **Kindle** (distraction-free reading), **Google Books** (discovery), **Notion** (clean UI), **PDF.js** (powerful reading), **Medium** (beautiful typography), and **Coursera** (structured learning) — with a warm scholarly palette (emerald primary, paper/ink neutrals), soft shadows, glassmorphism, and smooth Framer Motion animations.

---

## Features

### Library & Discovery
- Home page with hero search, 12 subject cards, trending marquee, featured/recent/recommended grids, benefits, stats, testimonials, CTA
- Library page with sidebar filters (class 6–12, subject, language, old/new/exemplar NCERT), sort options, pagination, mobile sheet
- Book details with large cover, metadata tabs (About / Details / Contents / Reviews), related books, AI teaser, read/download
- Book reviews with star ratings + text reviews + helpful voting
- Personalized recommendations based on reading history
- Global command palette (⌘K) for instant search across books, subjects, and topics
- Reading streak notification toast on home page

### PDF.js Reader (World-Class)
- **Virtualized continuous-scroll** rendering with page virtualization, canvas recycling, and prefetching
- **Text layer** for selectable/searchable text
- **Highlight system** — 11 colors, underline, strikethrough, floating selection toolbar with copy/share/comment/AI-explain
- **Annotation system** — sticky notes, drawing canvas (pen, highlighter, rectangle, arrow, line, text box, eraser) with undo/redo
- **Bookmark system** — per-page bookmarks with folders, search, quick navigation
- **Search** — full-text search with case-sensitive, whole-word, regex options, match navigation, highlighted snippets
- **Reading modes** — Light, Dark, Sepia, Paper, Night, High Contrast
- **Zoom** — 25%–800% presets, fit width, fit page, pinch zoom
- **Thumbnails** — lazy-loaded virtualized thumbnail sidebar
- **Table of contents** — auto-detected chapters with jump navigation
- **Keyboard shortcuts** — arrows, PageUp/Down, Space, Home/End, Ctrl+F/B/±, F11, T (theme), A (AI), Z (focus mode), Esc
- **Focus mode** — hides all chrome for distraction-free reading
- **Settings dialog** — theme, layout (continuous/single/two-page), reading direction, page transition, spacing, zoom, sidebar defaults, auto-save interval
- **Reading progress** — automatic save/resume, time spent, pages read today, daily streak, average speed, estimated completion time
- **Bottom progress bar** — expandable stats, page navigation
- **Export** — notes/highlights/bookmarks as Markdown, TXT, or JSON

### AI Study Assistant (RAG-Grounded)
- **RAG chat** — retrieves relevant chunks from the knowledge base, answers with clickable citations (book, class, chapter, page)
- **Hallucination prevention** — answers ONLY from retrieved context; says "I don't know" when no context found
- **Summarize** — page, chapter, or section summaries
- **Explain** — explain selected text or difficult concepts
- **MCQ generator** — UPSC-style multiple choice questions with interactive quiz UI and explanations
- **Flashcards** — flip-card revision cards
- **Notes generator** — UPSC notes, one-page notes, revision notes
- **Revision generator** — quick / 5-min / 10-min / one-page / cheat-sheet / last-minute
- **Mind maps** — visual hierarchical concept maps with expandable branches
- **Translate** — 9 Indian languages (Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Urdu)
- **Multi-book search** — "What is Federalism?" searches Polity + History + Economics and combines the answer
- **Quiz from reading history** — generates personalized quizzes from books the user has actually read
- **Context-aware** — knows current book, chapter, page, and selected text
- **AI memory** — remembers preferred style, difficulty, weak/strong topics, recent questions

### Profile & Study Tracking
- **Overview** — stat tiles, achievements, resume-reading rows with progress bars
- **Goals** — daily page goal, reading streak, 30-day activity heatmap, summary stats, continue-reading list
- **Calendar** — 90-day activity heatmap, weekly goal progress, upcoming schedule, today's reading
- **Quiz** — AI-generated quizzes from reading history with interactive UI and results
- **History** — reading history with progress bars
- **Bookmarks / Highlights / Notes** — full CRUD with search, pin, tag, filter

### Auth & User Accounts
- Email/password registration and login
- Demo account quick-login
- HMAC signed-cookie sessions
- Profile editing, reading history, achievements

### Admin Panel
- **Dashboard** — total books, downloads, views, users; books-by-class bar chart, new-vs-old pie chart, top books, recent users, recent uploads
- **Import** — auto-import NCERT PDFs from folder, dry-run, full import, skip covers, live report
- **AI Engine** — knowledge base status (chunks, books indexed, entities), indexing actions, search analytics (success rate, popular questions), unindexed books
- **Books** — searchable table with edit/delete, edit dialog (title, author, class, type, subject, featured, trending, allow download)
- **Subjects** — grid with book counts
- **Users** — list with roles
- **Upload** — add new books manually with cover, PDF, metadata

### Auto-Import System
- Recursive directory scanner (skips hidden/temp/duplicate files)
- Auto-classifier (class 6–12, subject, language, old/new/exemplar from filenames + folders)
- PDF validator (magic bytes, page count, SHA-256 hash for dedup)
- Cover generator (stylized SVG→JPEG with subject-colored gradients)
- File watcher for auto-import of new PDFs without restart
- Import script: `bun run import:ncert`

### SEO & Performance
- Metadata, Open Graph, Twitter cards, JSON-LD structured data
- `robots.txt`, `sitemap.xml`, `manifest.webmanifest`
- Code splitting (reader loaded via `next/dynamic` with `ssr: false`)
- Image optimization with Sharp
- LRU page render cache with canvas recycling
- Debounced auto-save
- Lazy-loaded thumbnails via IntersectionObserver

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (New York) |
| **Database** | Prisma ORM + SQLite |
| **PDF Rendering** | pdfjs-dist (Mozilla PDF.js) |
| **PDF Generation** | pdf-lib |
| **AI** | z-ai-web-dev-sdk (LLM chat, VLM, TTS, ASR) |
| **Animations** | Framer Motion |
| **State** | Zustand (client) + TanStack Query (server) |
| **Auth** | Custom HMAC signed-cookie sessions |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Image Processing** | Sharp |
| **Package Manager** | Bun |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/) 1.0+
- A terminal / command prompt

### Installation

```bash
# 1. Clone or download the project
cd ncert-library-for-ias

# 2. Install dependencies
bun install

# 3. Set up the database
bun run db:push

# 4. (Optional) Seed with sample books for testing
bun prisma/seed.ts

# 5. Start the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the NCERT Library with sample books.

### Importing Your Real NCERT Books

```bash
# 1. Place your NCERT PDFs in ncert-books/ (see Importing section below)
# 2. Run the import
bun run import:ncert

# 3. Index the AI knowledge base
bun run index:ai --force

# 4. Restart the dev server
bun run dev
```

Your real NCERT books will now appear in the library with full AI, reader, and search features.

---

## Project Structure

```
ncert-library-for-ias/
├── prisma/
│   ├── schema.prisma          # 27 database models
│   └── seed.ts                # Seeds sample books + demo users
│
├── scripts/
│   ├── import-ncert.ts        # NCERT PDF auto-import script
│   ├── watch-ncert.ts         # File watcher for auto-import
│   └── index-ai.ts            # AI knowledge base indexer
│
├── src/
│   ├── app/
│   │   ├── page.tsx           # SPA shell + view router
│   │   ├── layout.tsx         # Root layout, fonts, SEO metadata
│   │   ├── globals.css        # Design tokens, themes, utilities
│   │   ├── share/[token]/     # Public highlight share page
│   │   └── api/               # 46 API route handlers
│   │       ├── ai/            # RAG chat, search, summarize, MCQ, flashcards, mindmap, etc.
│   │       ├── auth/          # register, login, logout, me
│   │       ├── books/         # CRUD, bookmarks, highlights, notes, drawings, progress, reviews
│   │       ├── admin/         # stats, books, import
│   │       ├── reader/        # settings, analytics, export
│   │       ├── profile/       # user profile + stats
│   │       └── ...            # stats, subjects, search, recommendations, rate, share, reading-goals, study-calendar
│   │
│   ├── components/
│   │   ├── home/              # HomeView, streak notification
│   │   ├── library/           # LibraryView with filters
│   │   ├── books/             # BookCard, BookCover, BookDetails, Reviews, RatingWidget
│   │   ├── reader/            # 16 reader components + 7 hooks
│   │   │   ├── hooks/         # use-pdf-document, use-pdf-render, use-annotations, use-reading-progress, use-reader-settings, use-text-search, use-keyboard-shortcuts
│   │   │   ├── pdf-virtual-scroll.tsx
│   │   │   ├── reader-toolbar.tsx
│   │   │   ├── reader-sidebar.tsx
│   │   │   ├── reader-ai-panel.tsx
│   │   │   ├── drawing-canvas.tsx
│   │   │   ├── selection-toolbar.tsx
│   │   │   ├── search-panel.tsx
│   │   │   ├── notes-panel.tsx
│   │   │   ├── settings-dialog.tsx
│   │   │   └── ...
│   │   ├── profile/           # Profile, ReadingGoals, StudyCalendar, PracticeQuiz
│   │   ├── admin/             # Admin panel with 6 tabs
│   │   ├── auth/              # Login/Register
│   │   ├── ai/                # AiAssistantDock, MindMapGenerator
│   │   ├── layout/            # Header, Footer, CommandPalette
│   │   └── shared/            # AnimatedCounter
│   │
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   ├── auth.ts            # HMAC signed-cookie sessions
│   │   ├── ai.ts              # z-ai-web-dev-sdk wrapper
│   │   ├── store.ts           # Zustand SPA router
│   │   ├── http.ts            # API helpers
│   │   ├── import/            # Auto-import services
│   │   │   ├── scanner.ts     # Directory scanner
│   │   │   ├── classifier.ts  # Subject/class detection
│   │   │   ├── pdf-validator.ts
│   │   │   ├── cover-generator.ts
│   │   │   ├── importer.ts    # Main orchestrator
│   │   │   └── report.ts
│   │   └── ai-engine/         # RAG engine
│   │       ├── tokenizer.ts   # TF-IDF tokenizer
│   │       ├── chunker.ts     # PDF text extraction + chunking
│   │       ├── indexer.ts     # Knowledge base builder
│   │       ├── retriever.ts   # Top-k retrieval + re-ranking + citations
│   │       └── llm.ts         # LLM abstraction + ragChat()
│   │
│   └── hooks/
│       └── use-books.ts       # TanStack Query hooks
│
├── public/
│   ├── books/                 # PDF files (copied by import)
│   ├── covers/                # Generated cover images
│   ├── logo.svg
│   ├── robots.txt
│   ├── sitemap.xml
│   └── manifest.webmanifest
│
├── ncert-books/               # Place your NCERT PDFs here
├── .env                       # Environment variables
├── package.json
└── README.md
```

---

## Database Schema

The platform uses 27 Prisma models:

### Core Catalogue
- **Subject** — 15 subjects (History, Geography, Polity, Political Science, Economics, Science, Psychology, Sociology, Art & Culture, Environment, Biology, Chemistry, Physics, Mathematics, Social Science)
- **Language** — English, Hindi
- **Book** — title, slug, author, description, subject, class, bookType (NEW/OLD/EXEMPLAR), coverImage, pdfUrl, pages, fileSizeKb, rating, downloadCount, viewCount, trending, featured, recentlyAdded, allowDownload, chapters (JSON TOC)

### User & Engagement
- **User** — email, name, passwordHash, role (USER/ADMIN), avatar, bio
- **Bookmark** — per-page bookmarks with color, folder, label
- **ReadingProgress** — currentPage, totalPages, percent, scrollY, timeSpentSec, pagesReadToday, streak
- **Highlight** — text, color (11 colors), kind (HIGHLIGHT/UNDERLINE/STRIKETHROUGH), rects (JSON), label, category, pinned
- **Note** — content, x/y position, pinned, color, tags
- **Download** — download tracking
- **SearchHistory** — search query logging
- **Achievement** — gamification (FIRST_BOOK, TEN_BOOKS, READER_100, STREAK_7, etc.)
- **Review** — text reviews with rating, title, content, helpful count

### Reader Extensions
- **Drawing** — freehand drawings + shape annotations (PEN, HIGHLIGHTER, RECTANGLE, ARROW, LINE, TEXT_BOX)
- **ReadingSession** — discrete reading sessions with start/end/duration
- **ReaderSettings** — per-user preferences (theme, zoom, layout, spacing, direction, transitions, auto-save)
- **NoteTag** + **NoteTagLink** — tagging system for notes
- **ExportHistory** — audit of export operations

### AI Study Assistant
- **KnowledgeChunk** — the vector store (TF-IDF tokens + term frequencies for retrieval)
- **KnowledgeEntity** — knowledge graph entities (person, place, event, concept, law, date)
- **Conversation** — chat sessions with message history
- **AIMemory** — preferredStyle, difficultyLevel, weakTopics, strongTopics, recentQuestions, upscMode
- **Flashcard** — saved AI-generated flashcards with decks and review tracking
- **RevisionSession** — generated revision content (quick, 5min, cheat-sheet, etc.)
- **StudyAnalytic** — event tracking (question, summary, flashcard, mcq, revision, chat, rating)
- **QuestionHistory** — query history with citations and helpful feedback

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Database (SQLite — default)
DATABASE_URL=file:./db/custom.db

# NCERT Library Path (where your PDFs live)
NCERT_LIBRARY_PATH=./ncert-books

# Auth secret (for session signing)
AUTH_SECRET=your-secret-key-change-in-production
```

### NCERT Books Folder Structure

Place your NCERT PDFs in the `ncert-books/` folder with this structure:

```
ncert-books/
├── Science/
│   ├── class-6-science.pdf
│   ├── class-7-science.pdf
│   ├── class-8-science.pdf
│   ├── class-9-science.pdf
│   ├── class-9-science-exemplar-problems.pdf
│   └── class-10-science.pdf
│
├── Psychology/
│   ├── class-11-psychology.pdf
│   └── class-12-psychology.pdf
│
├── Society/
│   ├── class-11-introducing-sociology.pdf
│   ├── class-11-understanding-society.pdf
│   ├── class-12-indian-society.pdf
│   └── class-12-social-change-and-development-in-india.pdf
│
├── Economy/
│   ├── class-9-economics.pdf
│   ├── class-10-understanding-economic-development.pdf
│   ├── class-11-indian-economic-development.pdf
│   └── class-12-introductory-macroeconomics.pdf
│
├── Political Science/
│   ├── class-11-political-theory.pdf
│   ├── class-11-indian-constitution-at-work.pdf
│   ├── class-12-contemporary-world-politics.pdf
│   └── class-12-politics-in-india-since-independence.pdf
│
├── Polity/
│   ├── class-6-social-and-political-life-1.pdf
│   ├── class-7-social-and-political-life-2.pdf
│   ├── class-8-social-and-political-life-3.pdf
│   ├── class-9-democratic-politics-1.pdf
│   ├── class-10-democratic-politics-2.pdf
│   ├── class-11-political-theory.pdf
│   ├── class-11-indian-constitution-at-work.pdf
│   └── class-12-contemporary-world-politics.pdf
│
├── Geography/
│   ├── class-6-geography-the-earth-our-habitat.pdf
│   ├── class-7-geography-our-environment.pdf
│   ├── class-8-geography-resources-and-development.pdf
│   ├── class-9-geography-contemporary-india-1.pdf
│   ├── class-10-geography-contemporary-india-2.pdf
│   ├── class-11-geography-fundamentals-of-physical-geography.pdf
│   ├── class-11-geography-india-physical-environment.pdf
│   └── class-12-fundamentals-of-human-geography.pdf
│
├── Art & Culture/
│   ├── class-11-an-introduction-to-indian-art.pdf
│   ├── class-11-living-craft-traditions-of-india.pdf
│   └── class-12-craft-traditions-of-india.pdf
│
└── History/
    ├── class-6-history-our-pasts-1.pdf
    ├── class-7-history-our-pasts-2.pdf
    ├── class-8-history-our-pasts-3.pdf
    ├── class-9-history-india-and-the-contemporary-world-1.pdf
    ├── class-10-history-india-and-the-contemporary-world-2.pdf
    ├── class-11-history-themes-in-world-history.pdf
    ├── class-12-history-themes-in-indian-history-1.pdf
    ├── class-12-history-themes-in-indian-history-2.pdf
    └── class-12-history-themes-in-indian-history-3.pdf
```

**Total: 48 NCERT books across 9 subject folders**

> **Note on folder names:** The classifier accepts both "Economics"/"Economy" and "Sociology"/"Society" — use whichever you prefer. Books are classified by filename keywords first, with folder name as fallback.

**Filename convention:** `class-{N}-{subject-slug}[-{subtitle}].pdf`

The import script auto-detects:
- **Class** (6–12) from the filename
- **Subject** from folder name + filename keywords
- **Book type** (NEW/OLD/EXEMPLAR) from filename
- **Volume** (Roman numerals) from trailing numbers
- **Duplicates** by SHA-256 file hash

---

## Importing NCERT Books

### Step 1: Place PDFs

Copy your NCERT PDF folders into `ncert-books/` (see structure above).

### Step 2: Run Import

```bash
# Full import (scan + classify + covers + DB)
bun run import:ncert

# Dry run (scan only, no writes)
bun run import:ncert:dry

# Skip cover generation (faster)
bun run import:ncert -- --skip-covers

# Prune removed books (deletes DB records for files no longer present)
bun run import:ncert -- --prune
```

### Step 3: Index AI Knowledge Base

```bash
# Index all books (skips already-indexed)
bun run index:ai

# Force re-index everything
bun run index:ai:force
```

### Step 4: File Watcher (Optional)

For auto-import of new PDFs without restart:

```bash
bun run watch:ncert
```

### What the Import Does

1. **Scans** `ncert-books/` recursively for PDF files
2. **Classifies** each book (class, subject, language, edition, title) from filename + folder
3. **Validates** each PDF (magic bytes, page count, file hash for dedup)
4. **Copies** PDFs to `public/books/` preserving folder structure
5. **Generates** stylized cover images (SVG→JPEG with subject-colored gradients)
6. **Inserts** database records (title, slug, subject, class, pages, file size, cover, description, reading time)
7. **Creates** new subjects if missing (Psychology, Sociology, Political Science)
8. **Reports** duplicates, broken PDFs, missing covers, missing metadata

---

## AI Study Assistant

The AI uses a **Retrieval-Augmented Generation (RAG)** pipeline to answer questions grounded in the actual NCERT book content.

### How It Works

1. **Indexing** — Each book's text is extracted, chunked into ~500-char paragraphs, tokenized, and stored with TF-IDF vectors in the `KnowledgeChunk` table
2. **Retrieval** — When a user asks a question, the system retrieves the top-k most relevant chunks using TF-IDF cosine similarity + keyword overlap boosting
3. **Re-ranking** — Heading and definition chunks get a slight boost
4. **Context compression** — Retrieved chunks are compressed to fit within token limits
5. **Generation** — The LLM receives the context + question and generates an answer with strict instructions to only use the provided context
6. **Citations** — Every answer includes clickable source citations (book, class, chapter, page)

### Hallucination Prevention

- The AI answers **ONLY** from retrieved context
- If no relevant context is found, it says "I couldn't find this in the NCERT books I've indexed"
- Citations are generated from actual retrieved chunks — never fabricated

### Swappable Architecture

The AI engine is designed to be swappable:

- **Vector store:** Currently SQLite-backed TF-IDF → swap interface for Qdrant/Pinecone/Weaviate
- **Embeddings:** Currently TF-IDF + keyword overlap → swap interface for OpenAI/Cohere neural embeddings
- **LLM:** Currently z-ai-web-dev-sdk → swap interface for GPT-5/Claude/Gemini

---

## API Reference

### Books
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books` | List books (filter, sort, paginate, section) |
| GET | `/api/books/[id]` | Get book details + related books |
| GET | `/api/subjects` | List all subjects with book counts |
| GET | `/api/stats` | Platform statistics |
| GET | `/api/search?q=` | Search books, subjects, topics |
| GET | `/api/recommendations` | Personalized recommendations |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current session |

### Reader Annotations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/DELETE | `/api/books/[id]/bookmarks` | Bookmarks |
| GET/POST/PATCH/DELETE | `/api/books/[id]/highlights` | Highlights |
| GET/POST/PATCH/DELETE | `/api/books/[id]/notes` | Notes |
| GET/POST/PATCH/DELETE | `/api/books/[id]/drawings` | Drawings |
| GET/PUT | `/api/books/[id]/progress` | Reading progress |
| POST | `/api/books/[id]/download` | Track download |
| GET/POST/PATCH/DELETE | `/api/books/[id]/reviews` | Reviews |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/rag-chat` | RAG-grounded chat with citations |
| POST | `/api/ai/search` | Semantic search |
| POST | `/api/ai/related` | Find related chapters/books |
| POST | `/api/ai/summarize` | Summarize text |
| POST | `/api/ai/explain` | Explain text |
| POST | `/api/ai/mcq` | Generate MCQs |
| POST | `/api/ai/flashcards` | Generate flashcards |
| POST | `/api/ai/notes` | Generate UPSC notes |
| POST | `/api/ai/revision` | Generate revision content |
| POST | `/api/ai/mindmap` | Generate mind map |
| POST | `/api/ai/translate` | Translate text |
| POST | `/api/ai/quiz-from-history` | Quiz from reading history |
| POST | `/api/ai/chat` | General chat (non-RAG) |
| GET | `/api/ai/status` | Knowledge base status (admin) |
| POST | `/api/ai/index` | Trigger indexing (admin) |

### Profile & Study
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PATCH | `/api/profile` | User profile + stats |
| GET/PUT | `/api/reading-goals` | Reading goals + heatmap |
| GET | `/api/study-calendar` | 90-day study calendar |
| GET/PUT | `/api/reader/settings` | Reader preferences |
| GET | `/api/reader/analytics` | Reader analytics (admin) |
| POST | `/api/reader/export` | Log export |
| POST | `/api/rate` | Rate a book |
| POST | `/api/share` | Create shareable highlight |
| GET | `/api/share/[token]` | Resolve share token |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard analytics |
| GET/POST | `/api/admin/books` | List/create books |
| PATCH/DELETE | `/api/admin/books/[id]` | Update/delete book |
| GET/POST | `/api/admin/import` | Preview/trigger NCERT import |

---

## PDF Reader Features

The reader is a modular, world-class reading experience built from 16 components + 7 hooks:

### Rendering
- Virtualized continuous-scroll with page virtualization
- LRU page render cache (14-page cache) with canvas recycling
- DPR-aware canvas rendering
- Prefetching of adjacent pages
- Text layer for selectable/searchable text

### Annotations
- **Highlights:** 11 colors, underline, strikethrough, floating selection toolbar
- **Sticky notes:** Color-coded, pinnable, searchable
- **Drawings:** Pen, highlighter, rectangle, arrow, line, text box, eraser with undo/redo
- **Bookmarks:** Per-page, labeled, folder-organized

### Navigation
- Page-by-page (buttons + keyboard)
- Continuous scroll
- Go-to-page input
- Table of contents with jump navigation
- Thumbnail sidebar (lazy-loaded)
- In-book full-text search (case/whole-word/regex)

### Reading Modes
- Light, Dark, Sepia, Paper, Night, High Contrast
- Focus mode (hides all chrome)

### Zoom & Layout
- 25%–800% zoom presets
- Fit width, fit page
- Rotate
- Single page, continuous, two-page layouts
- LTR/RTL reading direction
- Adjustable page spacing

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| → / PageDown / Space | Next page |
| ← / PageUp / Shift+Space | Previous page |
| Home / End | First / last page |
| + / - | Zoom in / out |
| Ctrl+F | Search |
| Ctrl+B | Bookmark |
| F / F11 | Fullscreen |
| T | Cycle theme |
| A | Open AI |
| Z | Focus mode |
| Esc | Exit |

### Progress Tracking
- Automatic save/resume
- Time spent, pages read today
- Daily streak
- Average reading speed
- Estimated completion time
- 30s heartbeat session tracking

### Export
- Notes, highlights, bookmarks as Markdown, TXT, or JSON

---

## Admin Panel

Access via the header **Admin** button (requires admin role).

### Tabs

1. **Dashboard** — Total books, downloads, views, users; books-by-class bar chart; new-vs-old pie chart; top books; recent users
2. **Import** — NCERT folder status, import actions (dry run / full / skip covers), live report, current library stats
3. **AI Engine** — Knowledge base status (chunks, books indexed, entities), indexing actions, search analytics (success rate, popular questions), unindexed books
4. **Books** — Searchable table with edit/delete, edit dialog
5. **Subjects** — Grid with book counts
6. **Users** — List with roles
7. **Upload** — Add new books manually

---

## Deployment

### Production Build

```bash
# Build the standalone production bundle
bun run build

# Start the production server
bun run start
```

The build outputs a standalone server in `.next/standalone/`.

### Docker

Create a `Dockerfile`:

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY . .

# Build
RUN bun run build

# Expose port
EXPOSE 3000

# Start
CMD ["bun", "run", "start"]
```

Build and run:

```bash
docker build -t ncert-library .
docker run -p 3000:3000 -v $(pwd)/db:/app/db -v $(pwd)/ncert-books:/app/ncert-books ncert-library
```

### Vercel / Netlify

The app is configured with `output: "standalone"` for easy deployment to any Node.js host. For Vercel:

1. Push to GitHub
2. Import in Vercel
3. Set environment variables (`DATABASE_URL`, `NCERT_LIBRARY_PATH`, `AUTH_SECRET`)
4. Deploy

### Database Migration (PostgreSQL)

To use PostgreSQL instead of SQLite in production:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to your PostgreSQL connection string
3. Run `bun run db:push`

---

## Live Demo

Try the production deployment:

**<https://ncert-library.vercel.app/>**

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@ncertias.in` | `demo1234` |
| Aspirant | `aspirant@ncertias.in` | `demo1234` |

---

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server (port 3000) |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run migrations |
| `bun run db:reset` | Reset database |
| `bun run import:ncert` | Import NCERT PDFs |
| `bun run import:ncert:dry` | Dry-run import (scan only) |
| `bun run watch:ncert` | File watcher for auto-import |
| `bun run index:ai` | Index AI knowledge base |
| `bun run index:ai:force` | Force re-index all books |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./db/custom.db` | Prisma database URL (SQLite or PostgreSQL) |
| `NCERT_LIBRARY_PATH` | `./ncert-books` | Path to your NCERT PDFs folder |
| `AUTH_SECRET` | `ncert-library-ias-demo-secret-2024` | Secret for HMAC session signing (change in production!) |

---

## License

This project is built for educational purposes. NCERT books are public domain educational material published by the National Council of Educational Research and Training (NCERT), Government of India.

---

## Acknowledgements

- [Next.js](https://nextjs.org/) — React framework
- [Prisma](https://www.prisma.io/) — Database ORM
- [PDF.js](https://mozilla.github.io/pdf.js/) — Mozilla PDF renderer
- [shadcn/ui](https://ui.shadcn.com/) — UI component library
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) — Animation library
- [Lucide](https://lucide.dev/) — Icon library
- [Recharts](https://recharts.org/) — Charting library
- [z-ai-web-dev-sdk](https://www.npmjs.com/package/z-ai-web-dev-sdk) — AI SDK

---

**Built for UPSC/IAS aspirants. Happy studying! 📚**
