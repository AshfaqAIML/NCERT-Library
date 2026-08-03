"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Users, Upload, BarChart3, Download, Eye, Library,
  TrendingUp, Plus, Trash2, Pencil, Search, Loader2, ShieldCheck, X, CheckCircle2,
  FolderSearch, Play, FileWarning, HardDrive, AlertTriangle, Brain, Sparkles, Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, BarChart as RBar, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { useStore } from "@/lib/store";
import { api, formatNumber } from "@/lib/api-client";
import { CLASSES, LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BookT } from "@/lib/types";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "import", label: "Import", icon: FolderSearch },
  { id: "ai", label: "AI Engine", icon: Brain },
  { id: "books", label: "Books", icon: BookOpen },
  { id: "subjects", label: "Subjects", icon: Library },
  { id: "users", label: "Users", icon: Users },
  { id: "upload", label: "Upload", icon: Upload },
];

const PIE_COLORS = ["#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#0ea5e9", "#84cc16"];

export function AdminView() {
  const [tab, setTab] = useState("dashboard");
  const user = useStore((s) => s.user);
  const setAuthTab = useStore((s) => s.setAuthTab);
  const go = useStore((s) => s.go);

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
          <ShieldCheck className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="font-serif text-2xl font-bold">Admin access required</h2>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with an admin account to manage the library.</p>
        <Button className="mt-6 rounded-full" onClick={() => { setAuthTab("login"); go("auth"); }}>Sign in as admin</Button>
        <p className="mt-3 text-xs text-muted-foreground">Demo admin: <code className="rounded bg-muted px-1.5 py-0.5">admin@ncertias.in</code> / <code className="rounded bg-muted px-1.5 py-0.5">demo1234</code></p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-soft">
          <LayoutDashboard className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage books, subjects, users and analytics</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-56 lg:shrink-0">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  tab === n.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          {tab === "dashboard" && <Dashboard />}
          {tab === "books" && <ManageBooks />}
          {tab === "subjects" && <ManageSubjects />}
          {tab === "import" && <ImportPanel />}
          {tab === "ai" && <AIPanel />}
          {tab === "users" && <ManageUsers />}
          {tab === "upload" && <UploadBook />}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["admin-stats"],
    queryFn: () => api("/api/admin/stats"),
  });
  if (isLoading || !data) return <Skeleton />;

  const { counts, byClass, byType, topBooks, recentBooks, recentUsers } = data;
  const classData = byClass.map((b: any) => ({ name: `Cl ${b.classNum}`, count: b.count }));
  const typeData = byType.map((b: any) => ({ name: b.type === "NEW" ? "New NCERT" : "Old NCERT", value: b.count }));

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={BookOpen} label="Total books" value={counts.books} color="emerald" />
        <StatCard icon={Download} label="Downloads" value={formatNumber(counts.downloads)} color="amber" />
        <StatCard icon={Eye} label="Page views" value={formatNumber(counts.views)} color="violet" />
        <StatCard icon={Users} label="Users" value={counts.users} color="rose" />
        <StatCard icon={Library} label="Subjects" value={counts.subjects} color="sky" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Books by class</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <RBar data={classData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.9 0.008 80)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="oklch(0.5 0.01 60)" />
              <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.5 0.01 60)" allowDecimals={false} />
              <Tooltip cursor={{ fill: "oklch(0.5 0.01 60 / 0.08)" }} contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.9 0.008 80)" }} />
              <Bar dataKey="count" fill="oklch(0.55 0.12 162)" radius={[6, 6, 0, 0]} />
            </RBar>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">New vs Old NCERT</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {typeData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.9 0.008 80)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4">
            {typeData.map((t: any, i: number) => (
              <div key={t.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span className="text-muted-foreground">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top books + recent users */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <h3 className="mb-3 text-sm font-semibold">Top books by views</h3>
          <div className="space-y-2">
            {topBooks.map((b: any, i: number) => (
              <div key={b.id} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.title}</p>
                  <p className="text-[10px] text-muted-foreground">{b.subject?.name} · Cl {b.classNum}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatNumber(b.viewCount)}</p>
                  <p className="text-[10px] text-muted-foreground">views</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <h3 className="mb-3 text-sm font-semibold">Recently added books</h3>
          <div className="space-y-2">
            {recentBooks.map((b: any) => (
              <div key={b.id} className="flex items-center gap-3">
                <div className={cn("h-10 w-7 shrink-0 rounded bg-gradient-to-br", b.coverGradient)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.title}</p>
                  <p className="text-[10px] text-muted-foreground">{b.subject?.name}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{b.bookType === "NEW" ? "New" : "Old"}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent users */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <h3 className="mb-3 text-sm font-semibold">Recent users</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {recentUsers.map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                {(u.name || u.email)[0].toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.name || "User"}</p>
                <p className="truncate text-[10px] text-muted-foreground">{u.email}</p>
              </div>
              {u.role === "ADMIN" && <Badge className="bg-amber-500/15 text-amber-700 text-[10px]">Admin</Badge>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  };
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
      <span className={cn("mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl", colorMap[color])}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="font-serif text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ManageBooks() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data: books, isLoading } = useQuery<BookT[]>({ queryKey: ["admin-books"], queryFn: () => api("/api/admin/books") });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<BookT | null>(null);

  const filtered = (books || []).filter((b) => b.title.toLowerCase().includes(q.toLowerCase()) || b.author?.toLowerCase().includes(q.toLowerCase()));

  async function del(id: string) {
    if (!confirm("Delete this book permanently?")) return;
    setDeleting(id);
    try {
      await api(`/api/admin/books/${id}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["admin-books"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book deleted");
    } catch { toast.error("Delete failed"); }
    finally { setDeleting(null); }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-soft">
      <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-lg font-semibold">Manage books</h3>
          <p className="text-xs text-muted-foreground">{books?.length || 0} books in the library</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search books…" className="h-9 w-full pl-9 sm:w-64" />
        </div>
      </div>
      <div className="scroll-elegant max-h-[600px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Title</th>
              <th className="hidden p-3 font-medium md:table-cell">Subject</th>
              <th className="hidden p-3 font-medium sm:table-cell">Class</th>
              <th className="hidden p-3 font-medium sm:table-cell">Type</th>
              <th className="p-3 text-right font-medium">Views</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b border-border/40 hover:bg-accent/40">
                <td className="p-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-9 w-7 shrink-0 rounded bg-gradient-to-br", b.coverGradient)} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{b.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{b.author}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden p-3 md:table-cell"><Badge variant="secondary">{b.subject?.name}</Badge></td>
                <td className="hidden p-3 sm:table-cell">{b.classNum}</td>
                <td className="hidden p-3 sm:table-cell"><Badge variant="outline">{b.bookType === "NEW" ? "New" : "Old"}</Badge></td>
                <td className="p-3 text-right tabular-nums">{formatNumber(b.viewCount)}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600" onClick={() => del(b.id)} disabled={deleting === b.id}>
                      {deleting === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <EditBookDialog book={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditBookDialog({ book, onClose }: { book: BookT; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: subjects } = useQuery<any[]>({ queryKey: ["subjects"], queryFn: () => api("/api/subjects") });
  const [form, setForm] = useState({
    title: book.title, author: book.author || "", classNum: String(book.classNum),
    bookType: book.bookType, subjectId: book.subjectId, languageId: book.languageId,
    featured: book.featured, trending: book.trending, allowDownload: book.allowDownload, pages: String(book.pages),
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api(`/api/admin/books/${book.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form, classNum: Number(form.classNum), pages: Number(form.pages),
        }),
      });
      qc.invalidateQueries({ queryKey: ["admin-books"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book updated");
      onClose();
    } catch { toast.error("Update failed"); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit book</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Author"><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></Field>
            <Field label="Pages"><Input type="number" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class">
              <Select value={form.classNum} onValueChange={(v) => setForm({ ...form, classNum: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CLASSES.map((c) => <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Type">
              <Select value={form.bookType} onValueChange={(v) => setForm({ ...form, bookType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="NEW">New NCERT</SelectItem><SelectItem value="OLD">Old NCERT</SelectItem></SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Subject">
            <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{subjects?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="flex flex-wrap gap-4 pt-1">
            <Toggle label="Featured" checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} />
            <Toggle label="Trending" checked={form.trending} onChange={(v) => setForm({ ...form, trending: v })} />
            <Toggle label="Allow download" checked={form.allowDownload} onChange={(v) => setForm({ ...form, allowDownload: v })} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ManageSubjects() {
  const { data: subjects, isLoading } = useQuery<any[]>({ queryKey: ["subjects"], queryFn: () => api("/api/subjects") });
  if (isLoading || !subjects) return <Skeleton />;
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <h3 className="mb-4 font-serif text-lg font-semibold">Subjects</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1", subjectBadge(s.color))}>
              <Library className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.bookCount} books</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManageUsers() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["admin-stats"], queryFn: () => api("/api/admin/stats") });
  if (isLoading || !data) return <Skeleton />;
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <h3 className="mb-4 font-serif text-lg font-semibold">Users</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {data.recentUsers.map((u: any) => (
          <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">{(u.name || u.email)[0].toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{u.name || "User"}</p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
            {u.role === "ADMIN" && <Badge className="bg-amber-500/15 text-amber-700">Admin</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadBook() {
  const qc = useQueryClient();
  const { data: subjects } = useQuery<any[]>({ queryKey: ["subjects"], queryFn: () => api("/api/subjects") });
  const { data: languages } = useQuery<any[]>({ queryKey: ["languages"], queryFn: () => api("/api/subjects").then(() => [{ id: "1", name: "English", code: "en" }, { id: "2", name: "Hindi", code: "hi" }]) });
  const [form, setForm] = useState({ title: "", author: "", description: "", subjectId: "", languageId: "1", classNum: "6", bookType: "NEW", pages: "0", pdfUrl: "", featured: false, trending: false, allowDownload: true });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.title || !form.subjectId) { toast.error("Title and subject are required"); return; }
    setSaving(true);
    try {
      await api("/api/admin/books", { method: "POST", body: JSON.stringify({ ...form, classNum: Number(form.classNum), pages: Number(form.pages) }) });
      qc.invalidateQueries({ queryKey: ["admin-books"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book added to library");
      setForm({ ...form, title: "", author: "", description: "", pdfUrl: "" });
    } catch { toast.error("Could not add book"); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-serif text-lg font-semibold">Add a new book</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title *"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Themes in Indian History" /></Field>
        <Field label="Author"><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="NCERT" /></Field>
        <Field label="Subject *">
          <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>{subjects?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Language">
          <Select value={form.languageId} onValueChange={(v) => setForm({ ...form, languageId: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code === "en" ? "1" : "2"}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Class">
          <Select value={form.classNum} onValueChange={(v) => setForm({ ...form, classNum: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CLASSES.map((c) => <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Type">
          <Select value={form.bookType} onValueChange={(v) => setForm({ ...form, bookType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="NEW">New NCERT</SelectItem><SelectItem value="OLD">Old NCERT</SelectItem></SelectContent>
          </Select>
        </Field>
        <Field label="Pages"><Input type="number" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} /></Field>
        <Field label="PDF URL"><Input value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} placeholder="/books/your-file.pdf" /></Field>
      </div>
      <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-3" /></Field>
      <div className="mt-3 flex flex-wrap gap-4">
        <Toggle label="Featured" checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} />
        <Toggle label="Trending" checked={form.trending} onChange={(v) => setForm({ ...form, trending: v })} />
        <Toggle label="Allow download" checked={form.allowDownload} onChange={(v) => setForm({ ...form, allowDownload: v })} />
      </div>
      <Button className="mt-4" onClick={submit} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Add book
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2 text-sm">
      <span className={cn("flex h-5 w-9 items-center rounded-full p-0.5 transition-colors", checked ? "bg-emerald-500" : "bg-muted")}>
        <span className={cn("h-4 w-4 rounded-full bg-white shadow transition-transform", checked && "translate-x-4")} />
      </span>
      <span className="text-muted-foreground">{label}</span>
    </button>
  );
}
function subjectBadge(color: string) {
  const map: Record<string, string> = {
    amber: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300",
    emerald: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
    rose: "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300",
    violet: "bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300",
    sky: "bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300",
  };
  return map[color] ?? map.emerald;
}
function Skeleton() {
  return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}</div>;
}

// ===========================================================================
// Import Panel — auto-import NCERT PDFs from the configured library folder
// ===========================================================================
function ImportPanel() {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<any>(null);

  const { data: preview, isLoading } = useQuery<any>({
    queryKey: ["import-preview"],
    queryFn: () => api("/api/admin/import"),
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["admin-stats"],
    queryFn: () => api("/api/admin/stats"),
  });

  async function runImport(dryRun: boolean, skipCovers: boolean) {
    setRunning(true);
    setReport(null);
    try {
      const r = await api<any>("/api/admin/import", {
        method: "POST",
        body: JSON.stringify({ dryRun, skipCovers }),
      });
      setReport(r);
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-books"] });
      qc.invalidateQueries({ queryKey: ["books"] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
      toast.success(dryRun ? "Dry run complete" : `Imported ${r.imported} books`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Library folder status */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <FolderSearch className="h-4 w-4 text-emerald-600" />
          <h3 className="font-serif text-lg font-semibold">NCERT Library Folder</h3>
        </div>
        {isLoading ? (
          <Skeleton />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ImportStat icon={HardDrive} label="Library path" value={preview?.libraryPath || "—"} mono />
            <ImportStat icon={FileText} label="PDFs found" value={String(preview?.pdfCount || 0)} />
            <ImportStat icon={HardDrive} label="Storage" value={`${preview?.storageMB || 0} MB`} />
            <ImportStat
              icon={preview?.exists ? CheckCircle2 : AlertTriangle}
              label="Status"
              value={preview?.exists ? "Connected" : "Not found"}
              danger={!preview?.exists}
            />
          </div>
        )}
        {!preview?.exists && (
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">⚠ Library folder not found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set <code className="rounded bg-muted px-1">NCERT_LIBRARY_PATH</code> in <code className="rounded bg-muted px-1">.env</code> to point at your NCERT PDFs folder, then restart the server.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <h3 className="mb-3 font-serif text-lg font-semibold">Import Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => runImport(true, true)} disabled={running || !preview?.exists} variant="outline">
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderSearch className="mr-2 h-4 w-4" />}
            Dry Run (scan only)
          </Button>
          <Button onClick={() => runImport(false, false)} disabled={running || !preview?.exists} className="bg-emerald-600 hover:bg-emerald-700">
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Full Import (with covers)
          </Button>
          <Button onClick={() => runImport(false, true)} disabled={running || !preview?.exists} variant="outline">
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Import (skip covers)
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Or run from terminal: <code className="rounded bg-muted px-1">bun run import:ncert</code> · dry run: <code className="rounded bg-muted px-1">bun run import:ncert:dry</code>
        </p>
      </div>

      {/* Report */}
      {report && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h3 className="font-serif text-lg font-semibold">Import Report</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <ImportStat icon={FolderSearch} label="Scanned" value={String(report.scanned)} />
            <ImportStat icon={CheckCircle2} label="Imported" value={String(report.imported)} color="emerald" />
            <ImportStat icon={Pencil} label="Updated" value={String(report.updated)} color="sky" />
            <ImportStat icon={X} label="Duplicates" value={String(report.duplicates)} color="amber" />
            <ImportStat icon={FileWarning} label="Errors" value={String(report.errors)} danger={report.errors > 0} />
            <ImportStat icon={AlertTriangle} label="Missing covers" value={String(report.missingCovers)} danger={report.missingCovers > 0} />
          </div>
          {report.entries?.filter((e: any) => e.status === "error" || e.status === "duplicate" || e.status === "warning").length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issues found</p>
              <div className="scroll-elegant max-h-48 space-y-1 overflow-y-auto">
                {report.entries.filter((e: any) => e.status === "error" || e.status === "duplicate" || e.status === "warning").map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-border/50 px-2 py-1 text-xs">
                    <Badge variant={e.status === "error" ? "destructive" : "secondary"} className="text-[9px]">{e.status}</Badge>
                    <span className="truncate font-mono">{e.file}</span>
                    <span className="ml-auto truncate text-muted-foreground">{e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current library stats */}
      {stats && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <h3 className="mb-3 font-serif text-lg font-semibold">Current Library Status</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ImportStat icon={BookOpen} label="Total books" value={String(stats.counts?.books || 0)} />
            <ImportStat icon={Library} label="Subjects" value={String(stats.counts?.subjects || 0)} />
            <ImportStat icon={Download} label="Downloads" value={formatNumber(stats.counts?.downloads || 0)} />
            <ImportStat icon={Eye} label="Views" value={formatNumber(stats.counts?.views || 0)} />
          </div>
        </div>
      )}
    </div>
  );
}

function ImportStat({ icon: Icon, label, value, mono, danger, color }: { icon: any; label: string; value: string; mono?: boolean; danger?: boolean; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    sky: "text-sky-600 dark:text-sky-400",
    amber: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="rounded-xl border border-border/50 bg-background p-3">
      <Icon className={cn("mb-1.5 h-4 w-4", danger ? "text-rose-500" : color ? colorMap[color] : "text-emerald-600 dark:text-emerald-400")} />
      <p className={cn("truncate font-serif text-base font-bold leading-none", mono && "font-mono text-xs")}>{value}</p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

// ===========================================================================
// AI Engine Panel — knowledge base status, indexing, search analytics
// ===========================================================================
function AIPanel() {
  const qc = useQueryClient();
  const [indexing, setIndexing] = useState(false);
  const [indexResults, setIndexResults] = useState<any>(null);

  const { data: status, isLoading } = useQuery<any>({
    queryKey: ["ai-status"],
    queryFn: () => api("/api/ai/status"),
  });

  async function runIndex(force: boolean) {
    setIndexing(true);
    setIndexResults(null);
    try {
      const r = await api<any>("/api/ai/index", { method: "POST", body: JSON.stringify({ force }) });
      setIndexResults(r.results);
      qc.invalidateQueries({ queryKey: ["ai-status"] });
      toast.success(`Indexed ${r.results.length} books (${r.results.reduce((s: number, x: any) => s + x.chunksCreated, 0)} chunks)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Indexing failed");
    } finally {
      setIndexing(false);
    }
  }

  if (isLoading || !status) return <Skeleton />;

  return (
    <div className="space-y-4">
      {/* Knowledge base status */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-600" />
          <h3 className="font-serif text-lg font-semibold">Knowledge Base Status</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <AIStat icon={Database} label="Total chunks" value={String(status.totalChunks)} />
          <AIStat icon={BookOpen} label="Books indexed" value={`${status.indexedBooks}/${status.totalBooks}`} color="emerald" />
          <AIStat icon={Brain} label="Entities" value={String(status.totalEntities)} color="violet" />
          <AIStat icon={AlertTriangle} label="Unindexed" value={String(status.unindexedBooks)} danger={status.unindexedBooks > 0} />
          <AIStat icon={Sparkles} label="Success rate" value={`${status.successRate}%`} color={status.successRate > 70 ? "emerald" : "amber"} />
        </div>
      </div>

      {/* Indexing actions */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
        <h3 className="mb-3 font-serif text-lg font-semibold">Indexing</h3>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => runIndex(false)} disabled={indexing} className="bg-emerald-600 hover:bg-emerald-700">
            {indexing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            Index New Books
          </Button>
          <Button onClick={() => runIndex(true)} disabled={indexing} variant="outline">
            {indexing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            Re-index All (force)
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Or run from terminal: <code className="rounded bg-muted px-1">bun scripts/index-ai.ts</code> · force: <code className="rounded bg-muted px-1">bun scripts/index-ai.ts --force</code>
        </p>
        {indexResults && (
          <div className="mt-3 scroll-elegant max-h-48 space-y-1 overflow-y-auto">
            {indexResults.map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border/50 px-2 py-1 text-xs">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span className="truncate font-medium">{r.bookTitle}</span>
                <span className="ml-auto text-muted-foreground">{r.chunksCreated} chunks</span>
                {r.errors.length > 0 && <Badge variant="destructive" className="text-[9px]">{r.errors.length} err</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h3 className="font-serif text-base font-semibold">Search Analytics</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total questions</span><span className="font-semibold">{status.totalQuestions}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Successful retrievals</span><span className="font-semibold text-emerald-600">{status.totalQuestions - status.failedRetrievals}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Failed retrievals</span><span className="font-semibold text-rose-500">{status.failedRetrievals}</span></div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <h3 className="font-serif text-base font-semibold">Popular Questions</h3>
          </div>
          {status.popularQuestions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No questions yet. Ask the AI assistant to populate analytics.</p>
          ) : (
            <div className="scroll-elegant max-h-40 space-y-1 overflow-y-auto">
              {status.popularQuestions.map((q: any, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-accent/60">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-600">{q.count}</span>
                  <span className="truncate">{q.query}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unindexed books */}
      {status.unindexedBooks && status.unindexedBooks.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5">
          <div className="mb-2 flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-amber-600" />
            <h3 className="font-serif text-base font-semibold text-amber-700 dark:text-amber-400">Unindexed Books ({status.unindexedBooks.length})</h3>
          </div>
          <div className="scroll-elegant max-h-32 space-y-1 overflow-y-auto">
            {status.unindexedBooks.map((b: any) => (
              <div key={b.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs">
                <BookOpen className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{b.title}</span>
                <span className="ml-auto text-muted-foreground">{b.subject?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AIStat({ icon: Icon, label, value, danger, color }: { icon: any; label: string; value: string; danger?: boolean; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    violet: "text-violet-600 dark:text-violet-400",
    amber: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="rounded-xl border border-border/50 bg-background p-3">
      <Icon className={cn("mb-1.5 h-4 w-4", danger ? "text-rose-500" : color ? colorMap[color] : "text-emerald-600 dark:text-emerald-400")} />
      <p className="font-serif text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
