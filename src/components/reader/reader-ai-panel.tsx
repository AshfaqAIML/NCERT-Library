"use client";

import { useState } from "react";
import { Sparkles, X, Send, Loader2, FileText, HelpCircle, Layers, Languages, BookOpen, MessageSquare, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MCQ, Flashcard } from "@/lib/ai";

interface Props {
  open: boolean;
  onClose: () => void;
  pageText: string;
  bookTitle: string;
  subject?: string;
}

interface Msg { role: "user" | "assistant"; content: string }

/**
 * Reader-specific AI assistant with quick actions:
 * - Chat (context-aware: knows current page text + book)
 * - Summarize page
 * - Generate MCQs from page
 * - Generate flashcards from page
 * - Translate page/selection
 * - Explain (uses selected text if any)
 */
export function ReaderAiPanel({ open, onClose, pageText, bookTitle, subject }: Props) {
  const [tab, setTab] = useState("chat");
  if (!open) return null;

  return (
    <div className="absolute right-0 top-0 z-40 h-full w-full max-w-md border-l border-border/60 bg-background shadow-lift sm:w-96">
      <div className="flex items-center gap-2 border-b border-border/60 p-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white"><Sparkles className="h-4 w-4" /></span>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-none">AI Study Companion</p>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{bookTitle}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex h-[calc(100%-3.5rem)] flex-col">
        <TabsList className="m-2 grid grid-cols-3 bg-muted/60">
          <TabsTrigger value="chat" className="text-[11px]"><MessageSquare className="mr-1 h-3 w-3" /> Chat</TabsTrigger>
          <TabsTrigger value="tools" className="text-[11px]"><Sparkles className="mr-1 h-3 w-3" /> Tools</TabsTrigger>
          <TabsTrigger value="translate" className="text-[11px]"><Languages className="mr-1 h-3 w-3" /> Translate</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="mt-0 min-h-0 flex-1"><ChatPanel pageText={pageText} bookTitle={bookTitle} subject={subject} /></TabsContent>
        <TabsContent value="tools" className="mt-0 min-h-0 flex-1"><ToolsPanel pageText={pageText} /></TabsContent>
        <TabsContent value="translate" className="mt-0 min-h-0 flex-1"><TranslatePanel pageText={pageText} /></TabsContent>
      </Tabs>
    </div>
  );
}

function ChatPanel({ pageText, bookTitle, subject }: { pageText: string; bookTitle: string; subject?: string }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Namaste! 🙏 I can see you're reading "${bookTitle}". Ask me to explain anything on this page, summarize it, or quiz you.` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    const history = messages.slice(1);
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const ctx = `Book: ${bookTitle}${subject ? ` (${subject})` : ""}\n\nCurrent page content:\n${pageText.slice(0, 2000)}`;
      const res = await api<{ answer: string; citations: any[] }>("/api/ai/rag-chat", {
        method: "POST",
        body: JSON.stringify({ question: q, history, upscMode: true, preferredStyle: "detailed" }),
      });
      setMessages((m) => [...m, { role: "assistant", content: res.answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I couldn't reach the AI service. Please try again." }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="scroll-elegant flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-3">
          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
          {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…</div>}
        </div>
      </div>
      <div className="border-t border-border/60 p-2">
        <div className="flex items-end gap-1.5">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about this page…" className="min-h-[40px] resize-none text-xs" rows={1} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={send} disabled={loading || !input.trim()}><Send className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] text-white", isUser ? "bg-muted-foreground" : "bg-gradient-to-br from-emerald-500 to-teal-600")}>
        {isUser ? "U" : <Sparkles className="h-3 w-3" />}
      </span>
      <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
        <MarkdownLite content={msg.content} />
      </div>
    </div>
  );
}

function ToolsPanel({ pageText }: { pageText: string }) {
  const [result, setResult] = useState<string | MCQ[] | Flashcard[] | null>(null);
  const [loading, setLoading] = useState<null | "summarize" | "mcq" | "flashcards" | "explain">(null);

  async function run(kind: "summarize" | "mcq" | "flashcards" | "explain") {
    if (!pageText.trim()) { toast.error("No text on this page to process"); return; }
    setLoading(kind);
    setResult(null);
    try {
      const endpoint = kind === "summarize" ? "/api/ai/summarize" : kind === "mcq" ? "/api/ai/mcq" : kind === "flashcards" ? "/api/ai/flashcards" : "/api/ai/explain";
      const res = await api<any>(endpoint, { method: "POST", body: JSON.stringify({ text: pageText, count: 5 }) });
      setResult(kind === "summarize" ? res.summary : kind === "explain" ? res.explanation : kind === "mcq" ? res.mcqs : res.flashcards);
      toast.success(`${kind} ready`);
    } catch { toast.error("AI request failed"); }
    finally { setLoading(null); }
  }

  const tools = [
    { kind: "summarize" as const, label: "Summarize page", desc: "Crisp summary + key points", icon: FileText },
    { kind: "explain" as const, label: "Explain page", desc: "Simple layered explanation", icon: BookOpen },
    { kind: "mcq" as const, label: "Generate MCQs", desc: "5 UPSC-style questions", icon: HelpCircle },
    { kind: "flashcards" as const, label: "Flashcards", desc: "8 revision cards", icon: Layers },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-2 gap-2 border-b border-border/60 p-3">
        {tools.map((t) => (
          <button key={t.kind} onClick={() => run(t.kind)} disabled={!!loading} className="flex flex-col items-start gap-1 rounded-xl border border-border/60 bg-card p-2.5 text-left transition-colors hover:border-emerald-500/40 disabled:opacity-50">
            <t.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-medium">{t.label}</p>
            <p className="text-[10px] text-muted-foreground">{t.desc}</p>
          </button>
        ))}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3">
          {loading && <div className="flex flex-col items-center py-12"><Loader2 className="mb-2 h-7 w-7 animate-spin text-emerald-500" /><p className="text-xs text-muted-foreground">{loading}…</p></div>}
          {!result && !loading && <div className="flex flex-col items-center py-12 text-center"><Sparkles className="mb-2 h-8 w-8 text-muted-foreground/40" /><p className="text-xs text-muted-foreground">Pick a tool to generate study aids from this page.</p></div>}
          {typeof result === "string" && <MarkdownLite content={result} />}
          {Array.isArray(result) && result.length > 0 && "question" in result[0] && <McqList items={result as MCQ[]} />}
          {Array.isArray(result) && result.length > 0 && "front" in result[0] && <FlashcardList items={result as Flashcard[]} />}
        </div>
      </ScrollArea>
    </div>
  );
}

function TranslatePanel({ pageText }: { pageText: string }) {
  const [target, setTarget] = useState("Hindi");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const langs = ["Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Kannada", "Malayalam", "English"];

  async function run() {
    if (!pageText.trim()) { toast.error("No text to translate"); return; }
    setLoading(true); setResult(null);
    try {
      const res = await api<{ translation: string }>("/api/ai/translate", { method: "POST", body: JSON.stringify({ text: pageText.slice(0, 3000), target }) });
      setResult(res.translation);
    } catch { toast.error("Translation failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 p-3">
        <p className="mb-2 text-xs font-medium">Translate this page into:</p>
        <div className="mb-2 flex flex-wrap gap-1">
          {langs.map((l) => (
            <button key={l} onClick={() => setTarget(l)} className={cn("rounded-full border px-2 py-0.5 text-[10px] transition-colors", target === l ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-border text-muted-foreground hover:bg-accent")}>{l}</button>
          ))}
        </div>
        <Button size="sm" className="w-full" onClick={run} disabled={loading}><Languages className="mr-2 h-3.5 w-3.5" /> {loading ? "Translating…" : `Translate to ${target}`}</Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3">
          {loading && <div className="flex flex-col items-center py-12"><Loader2 className="mb-2 h-7 w-7 animate-spin text-emerald-500" /><p className="text-xs text-muted-foreground">Translating…</p></div>}
          {result && (
            <div className="rounded-xl border border-border/60 bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">{target} translation</p>
                <button onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied"); }} className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
              </div>
              <p className="text-xs leading-relaxed text-foreground/85">{result}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function McqList({ items }: { items: MCQ[] }) {
  const [sel, setSel] = useState<Record<number, number>>({});
  return (
    <div className="space-y-3">
      {items.map((m, i) => (
        <div key={i} className="rounded-xl border border-border/60 bg-card p-2.5">
          <p className="mb-2 text-xs font-medium"><span className="mr-1 text-emerald-600">Q{i + 1}.</span>{m.question}</p>
          <div className="space-y-1">
            {m.options.map((o, j) => {
              const s = sel[i]; const show = s !== undefined;
              return (
                <button key={j} onClick={() => setSel({ ...sel, [i]: j })} className={cn("flex w-full items-center gap-2 rounded-lg border px-2 py-1 text-left text-xs", show && j === m.answer ? "border-emerald-500 bg-emerald-500/10" : show && j === s ? "border-rose-500 bg-rose-500/10" : "border-border/60 hover:bg-accent/60")}>
                  <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold", show && j === m.answer ? "bg-emerald-500 text-white" : show && j === s ? "bg-rose-500 text-white" : "bg-muted")}>{String.fromCharCode(65 + j)}</span>
                  {o}
                </button>
              );
            })}
          </div>
          {sel[i] !== undefined && <p className="mt-1.5 rounded bg-muted/60 p-1.5 text-[10px] text-muted-foreground"><b>Explanation:</b> {m.explanation}</p>}
        </div>
      ))}
    </div>
  );
}
function FlashcardList({ items }: { items: Flashcard[] }) {
  const [flip, setFlip] = useState<Record<number, boolean>>({});
  return (
    <div className="space-y-2">
      {items.map((c, i) => (
        <button key={i} onClick={() => setFlip({ ...flip, [i]: !flip[i] })} className="block w-full rounded-xl border border-border/60 bg-card p-2.5 text-left">
          <p className="mb-0.5 text-[9px] font-semibold uppercase text-emerald-600">Card {i + 1} · {flip[i] ? "Answer" : "Term"}</p>
          <p className="text-xs leading-relaxed">{flip[i] ? c.back : c.front}</p>
        </button>
      ))}
    </div>
  );
}

function MarkdownLite({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <p key={i} className="mt-1 font-semibold text-xs">{line.slice(4)}</p>;
        if (line.startsWith("## ")) return <p key={i} className="mt-2 font-serif font-bold text-sm">{line.slice(3)}</p>;
        if (line.startsWith("# ")) return <p key={i} className="mt-2 font-serif font-bold text-base">{line.slice(2)}</p>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <p key={i} className="ml-2 before:content-['•'] before:mr-1 before:text-muted-foreground text-xs">{renderInline(line.slice(2))}</p>;
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i} className="text-xs">{renderInline(line)}</p>;
      })}
    </div>
  );
}
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i} className="rounded bg-muted px-1 text-[10px]">{p.slice(1, -1)}</code>;
    return <span key={i}>{p}</span>;
  });
}
