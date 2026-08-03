"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, PenLine, Trash2, ThumbsUp, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, timeAgo } from "@/lib/api-client";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Review {
  id: string;
  userId: string;
  rating: number;
  title: string | null;
  content: string;
  helpful: number;
  createdAt: string;
  user: { name: string | null; email: string };
}

export function ReviewsSection({ bookId }: { bookId: string }) {
  const user = useStore((s) => s.user);
  const setAuthTab = useStore((s) => s.setAuthTab);
  const go = useStore((s) => s.go);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery<{ reviews: Review[]; userReviewId: string | null }>({
    queryKey: ["reviews", bookId],
    queryFn: () => api(`/api/books/${bookId}/reviews`),
  });

  async function submit() {
    if (!content.trim()) { toast.error("Please write your review"); return; }
    setSubmitting(true);
    try {
      await api(`/api/books/${bookId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, title, content }),
      });
      qc.invalidateQueries({ queryKey: ["reviews", bookId] });
      qc.invalidateQueries({ queryKey: ["book", bookId] });
      setShowForm(false);
      setTitle("");
      setContent("");
      toast.success("Review posted!");
    } catch {
      toast.error("Could not post review");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(reviewId: string) {
    try {
      await api(`/api/books/${bookId}/reviews`, { method: "DELETE", body: JSON.stringify({ reviewId }) });
      qc.invalidateQueries({ queryKey: ["reviews", bookId] });
      toast.success("Review deleted");
    } catch { toast.error("Could not delete"); }
  }

  async function markHelpful(reviewId: string) {
    try {
      await api<{ helpful: number }>(`/api/books/${bookId}/reviews`, { method: "PATCH", body: JSON.stringify({ reviewId }) });
      qc.invalidateQueries({ queryKey: ["reviews", bookId] });
      toast.success("Marked as helpful");
    } catch { toast.error("Sign in to mark helpful"); }
  }

  const reviews = data?.reviews ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-serif text-lg font-semibold">Reviews ({reviews.length})</h3>
        </div>
        {user && !data?.userReviewId && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <PenLine className="mr-1.5 h-3.5 w-3.5" /> Write a review
          </Button>
        )}
        {!user && (
          <Button size="sm" variant="outline" onClick={() => { setAuthTab("login"); go("auth"); }}>
            Sign in to review
          </Button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <Label className="text-sm">Your rating:</Label>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="rounded p-0.5 hover:scale-110 transition-transform">
                  <Star className={cn("h-5 w-5", s <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/40")} />
                </button>
              ))}
            </div>
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title (optional)"
            className="mb-2"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts on this book..."
            rows={4}
            className="mb-3"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Post review
            </Button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                    {(r.user.name || r.user.email)[0].toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{r.user.name || "Aspirant"}</p>
                    <p className="text-[10px] text-muted-foreground">{timeAgo(r.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("h-3.5 w-3.5", s <= r.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30")} />
                  ))}
                </div>
              </div>
              {r.title && <p className="mb-1 font-medium text-sm">{r.title}</p>}
              <p className="text-sm leading-relaxed text-foreground/80">{r.content}</p>
              <div className="mt-2 flex items-center gap-3">
                <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ThumbsUp className="h-3 w-3" /> Helpful ({r.helpful})
                </button>
                {r.userId === user?.id && (
                  <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
