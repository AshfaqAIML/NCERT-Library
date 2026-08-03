"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { BookFilters, BookT } from "@/lib/types";

export function useBooksSection(section: string, limit = 12) {
  return useQuery<BookT[]>({
    queryKey: ["books", "section", section, limit],
    queryFn: () => api(`/api/books?section=${section}&limit=${limit}`),
    staleTime: 60_000,
  });
}

export function useBooks(filters: Partial<BookFilters>, page = 1, pageSize = 24) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v && v !== "all") params.set(k, String(v));
  });
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return useQuery<{ total: number; pages: number; items: BookT[]; page: number }>({
    queryKey: ["books", "list", params.toString()],
    queryFn: () => api(`/api/books?${params.toString()}`),
    staleTime: 30_000,
  });
}

export function useBook(id: string | null) {
  return useQuery<BookT & { related: BookT[] }>({
    queryKey: ["book", id],
    queryFn: () => api(`/api/books/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: () => api(`/api/subjects`),
    staleTime: 5 * 60_000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => api(`/api/stats`),
    staleTime: 60_000,
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => api(`/api/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length > 1,
    staleTime: 30_000,
  });
}

export function useRecommendations() {
  return useQuery<{ recommendations: BookT[]; reason: string }>({
    queryKey: ["recommendations"],
    queryFn: () => api(`/api/recommendations`),
    staleTime: 60_000,
  });
}
