"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, Sparkles, BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

interface Citation {
  index: number;
  bookTitle: string;
  chapter: string | null;
  page: number;
}

const BRANCH_COLORS = [
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-lime-500 to-green-600",
];

export function MindMapGenerator({ bookId }: { bookId?: string }) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [mindmap, setMindmap] = useState<MindMapNode | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setMindmap(null);
    try {
      const res = await api<{ mindmap: MindMapNode | null; citations: Citation[]; message?: string }>("/api/ai/mindmap", {
        method: "POST",
        body: JSON.stringify({ topic, bookId }),
      });
      if (res.mindmap) {
        setMindmap(res.mindmap);
        setCitations(res.citations);
      } else {
        toast.info(res.message || "No content found");
      }
    } catch {
      toast.error("Could not generate mind map");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g. 'Federalism', 'Mughal Empire')…"
          onKeyDown={(e) => e.key === "Enter" && generate()}
          className="h-10"
        />
        <Button onClick={generate} disabled={loading || !topic.trim()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
          Generate
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <Brain className="h-12 w-12 text-violet-500" />
            <Sparkles className="absolute -right-2 -top-2 h-5 w-5 animate-pulse text-amber-400" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Generating mind map…</p>
        </div>
      )}

      {/* Mind map visualization */}
      <AnimatePresence>
        {mindmap && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-x-auto rounded-2xl border border-border/60 bg-gradient-to-br from-violet-500/[0.04] via-card to-card p-8 shadow-soft"
          >
            <div className="min-w-[600px]">
              {/* Root */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-3 text-center text-white shadow-lift"
                >
                  <p className="font-serif text-lg font-bold">{mindmap.label}</p>
                </motion.div>

                {/* Connector line */}
                <div className="h-6 w-px bg-border" />

                {/* Branches */}
                {mindmap.children && (
                  <div className="flex flex-wrap justify-center gap-6">
                    {mindmap.children.map((branch, i) => (
                      <BranchNode key={branch.id} node={branch} colorIndex={i} depth={0} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Citations */}
            {citations.length > 0 && (
              <div className="mt-6 border-t border-border/40 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sources</p>
                <div className="flex flex-wrap gap-1.5">
                  {citations.map((c) => (
                    <Badge key={c.index} variant="secondary" className="text-[10px]">
                      <BookOpen className="mr-1 h-2.5 w-2.5" /> {c.bookTitle} · p.{c.page}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Restart */}
            <div className="mt-4 text-center">
              <Button variant="ghost" size="sm" onClick={() => { setMindmap(null); setTopic(""); }}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> New mind map
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!mindmap && !loading && (
        <div className="rounded-2xl border border-dashed py-12 text-center">
          <Brain className="mx-auto mb-2 h-10 w-10 text-violet-500/40" />
          <p className="text-sm text-muted-foreground">Enter a topic to generate a visual mind map from NCERT content.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {["Federalism", "Harappan Civilisation", "Monsoon", "Fundamental Rights", "Mughal Empire"].map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className="rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-violet-500/40 hover:text-foreground"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BranchNode({ node, colorIndex, depth }: { node: MindMapNode; colorIndex: number; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const color = BRANCH_COLORS[colorIndex % BRANCH_COLORS.length];

  return (
    <div className="flex flex-col items-center">
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: depth * 0.1 }}
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "rounded-xl bg-gradient-to-br px-4 py-2 text-center text-white shadow-soft transition-transform hover:scale-105",
          color,
          depth === 0 && "min-w-[120px]",
          depth > 0 && "text-xs",
        )}
      >
        <p className={cn("font-medium leading-tight", depth === 0 ? "text-sm" : "text-xs")}>{node.label}</p>
        {node.children && node.children.length > 0 && (
          <span className="mt-0.5 block text-[9px] opacity-80">{expanded ? "− collapse" : `+ ${node.children.length}`}</span>
        )}
      </motion.button>

      {/* Children */}
      <AnimatePresence>
        {expanded && node.children && node.children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="h-4 w-px bg-border" />
            <div className="flex flex-wrap justify-center gap-3">
              {node.children.map((child, i) => (
                <BranchNode key={child.id} node={child} colorIndex={colorIndex + i + 1} depth={depth + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
