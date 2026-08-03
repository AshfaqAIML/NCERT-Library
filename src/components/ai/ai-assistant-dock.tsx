"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, X, Send, Loader2, MessageSquare, FileText, HelpCircle,
  Layers, BookOpen, Bot, User as UserIcon, Copy, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MCQ, Flashcard } from "@/lib/ai";

interface Msg { role: "user" | "assistant"; content: string }

export function AiAssistantDock() {
  const open = useStore((s) => s.aiOpen);
  const setOpen = useStore((s) => s.setAiOpen);
  const context = useStore((s) => s.aiContext);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border/60 bg-background shadow-lift"
          >
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-soft">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-serif text-sm font-semibold leading-none">AI Study Companion</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {context?.bookTitle ? `Reading: ${context.bookTitle}` : "Your UPSC mentor"}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <AiTabs />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function AiTabs() {
  const [tab, setTab] = useState("chat");
  return (
    <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
      <TabsList className="m-2 grid grid-cols-4 bg-muted/60">
        <TabsTrigger value="chat" className="text-xs"><MessageSquare className="mr-1 h-3.5 w-3.5" /> Chat</TabsTrigger>
        <TabsTrigger value="summarize" className="text-xs"><FileText className="mr-1 h-3.5 w-3.5" /> Sum</TabsTrigger>
        <TabsTrigger value="mcq" className="text-xs"><HelpCircle className="mr-1 h-3.5 w-3.5" /> MCQ</TabsTrigger>
        <TabsTrigger value="cards" className="text-xs"><Layers className="mr-1 h-3.5 w-3.5" /> Cards</TabsTrigger>
      </TabsList>
      <TabsContent value="chat" className="mt-0 min-h-0 flex-1"><ChatPanel /></TabsContent>
      <TabsContent value="summarize" className="mt-0 min-h-0 flex-1"><ToolPanel kind="summarize" /></TabsContent>
      <TabsContent value="mcq" className="mt-0 min-h-0 flex-1"><ToolPanel kind="mcq" /></TabsContent>
      <TabsContent value="cards" className="mt-0 min-h-0 flex-1"><ToolPanel kind="flashcards" /></TabsContent>
    </Tabs>
  );
}

function ChatPanel() {
  const context = useStore((s) => s.aiContext);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Namaste! 🙏 I'm your AI study companion. Ask me to explain a concept, summarise a chapter, or quiz you on NCERT topics. How can I help your UPSC prep today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    const history = messages.filter((m) => !(m.role === "assistant" && m === messages[0]));
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      // Use RAG-grounded chat (retrieves from knowledge base + cites sources)
      const res = await api<{ answer: string; citations: any[]; hasContext: boolean }>("/api/ai/rag-chat", {
        method: "POST",
        body: JSON.stringify({
          question: q,
          history,
          bookId: context?.bookId,
          upscMode: true,
          preferredStyle: "detailed",
        }),
      });
      setMessages((m) => [...m, { role: "assistant", content: res.answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't reach the AI service right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "Explain the Mauryan administration",
    "Summarise the Fundamental Rights",
    "What is the difference between weather and climate?",
    "Generate 3 MCQs on the Harappan Civilisation",
  ];

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="scroll-elegant flex-1 overflow-y-auto px-4">
        <div className="space-y-4 py-4">
          {messages.map((m, i) => (
            <Bubble key={i} msg={m} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          )}
        </div>
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Try asking</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button key={s} onClick={() => setInput(s)} className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-emerald-500/40 hover:text-foreground">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border/60 p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your NCERT book…"
            className="min-h-[44px] resize-none text-sm"
            rows={1}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <Button size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={send} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white", isUser ? "bg-muted-foreground" : "bg-gradient-to-br from-emerald-500 to-teal-600")}>
        {isUser ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </span>
      <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
        <MarkdownLite content={msg.content} />
      </div>
    </div>
  );
}

function ToolPanel({ kind }: { kind: "summarize" | "mcq" | "flashcards" }) {
  const context = useStore((s) => s.aiContext);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | MCQ[] | Flashcard[] | null>(null);

  async function run() {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const endpoint = kind === "summarize" ? "/api/ai/summarize" : kind === "mcq" ? "/api/ai/mcq" : "/api/ai/flashcards";
      const res = await api<any>(endpoint, { method: "POST", body: JSON.stringify({ text, count: kind === "mcq" ? 5 : 8 }) });
      setResult(kind === "summarize" ? res.summary : kind === "mcq" ? res.mcqs : res.flashcards);
    } catch {
      toast.error("AI request failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const placeholders = {
    summarize: "Paste a chapter or passage to summarise…",
    mcq: "Paste a passage to generate UPSC-style MCQs from…",
    flashcards: "Paste a passage to generate revision flashcards…",
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 p-4">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholders[kind]}
          className="min-h-[100px] resize-none text-sm"
        />
        <Button className="mt-2 w-full" onClick={run} disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {loading ? "Generating…" : `Generate ${kind === "summarize" ? "summary" : kind === "mcq" ? "MCQs" : "flashcards"}`}
        </Button>
        {context?.bookTitle && (
          <p className="mt-2 text-[10px] text-muted-foreground">Context: {context.bookTitle}</p>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Your AI-generated content will appear here.</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm text-muted-foreground">Crafting your {kind === "summarize" ? "summary" : kind}…</p>
            </div>
          )}
          {typeof result === "string" && <MarkdownLite content={result} />}
          {Array.isArray(result) && kind === "mcq" && <McqList items={result as MCQ[]} />}
          {Array.isArray(result) && kind === "flashcards" && <FlashcardList items={result as Flashcard[]} />}
        </div>
      </ScrollArea>
    </div>
  );
}

function McqList({ items }: { items: MCQ[] }) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No MCQs generated. Try a different passage.</p>;
  return (
    <div className="space-y-4">
      {items.map((m, i) => (
        <div key={i} className="rounded-xl border border-border/60 bg-card p-3">
          <p className="mb-2 text-sm font-medium"><span className="mr-1 text-emerald-600">Q{i + 1}.</span>{m.question}</p>
          <div className="space-y-1.5">
            {m.options.map((opt, j) => {
              const sel = selected[i];
              const isSel = sel === j;
              const isCorrect = j === m.answer;
              const showState = sel !== undefined;
              return (
                <button
                  key={j}
                  onClick={() => setSelected((s) => ({ ...s, [i]: j }))}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors",
                    showState && isCorrect ? "border-emerald-500 bg-emerald-500/10" : isSel ? "border-rose-500 bg-rose-500/10" : "border-border/60 hover:bg-accent/60"
                  )}
                >
                  <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold", showState && isCorrect ? "bg-emerald-500 text-white" : isSel ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground")}>
                    {String.fromCharCode(65 + j)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
          {selected[i] !== undefined && (
            <p className="mt-2 rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground"><span className="font-semibold">Explanation: </span>{m.explanation}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function FlashcardList({ items }: { items: Flashcard[] }) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No flashcards generated.</p>;
  return (
    <div className="space-y-2.5">
      {items.map((c, i) => {
        const isFlipped = flipped[i];
        return (
          <button
            key={i}
            onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
            className="block w-full rounded-xl border border-border/60 bg-card p-3 text-left transition-all hover:shadow-soft"
          >
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
              <Layers className="h-3 w-3" /> Card {i + 1} · {isFlipped ? "Answer" : "Term"}
            </div>
            <p className="text-sm leading-relaxed">{isFlipped ? c.back : c.front}</p>
          </button>
        );
      })}
    </div>
  );
}

// Minimal markdown renderer (bold, headings, lists, code)
function MarkdownLite({ content }: { content: string }) {
  const lines = content.split("\n");
  const out: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (line.startsWith("### ")) out.push(<p key={i} className="mt-2 font-serif text-sm font-bold">{line.slice(4)}</p>);
    else if (line.startsWith("## ")) out.push(<p key={i} className="mt-3 font-serif text-base font-bold">{line.slice(3)}</p>);
    else if (line.startsWith("# ")) out.push(<p key={i} className="mt-3 font-serif text-lg font-bold">{line.slice(2)}</p>);
    else if (line.startsWith("- ") || line.startsWith("* ")) out.push(<p key={i} className="ml-3 before:content-['•'] before:mr-1.5 before:text-muted-foreground">{renderInline(line.slice(2))}</p>);
    else if (/^\d+\.\s/.test(line)) out.push(<p key={i} className="ml-3">{renderInline(line)}</p>);
    else if (line.trim() === "") out.push(<div key={i} className="h-2" />);
    else out.push(<p key={i}>{renderInline(line)}</p>);
  });
  return <div className="space-y-0.5">{out}</div>;
}

function renderInline(text: string): React.ReactNode {
  // bold **x** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i} className="rounded bg-muted px-1 py-0.5 text-xs">{p.slice(1, -1)}</code>;
    return <span key={i}>{p}</span>;
  });
}
