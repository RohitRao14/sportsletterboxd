"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const STORAGE_KEY = "diary-filters";

export interface DiaryFilters {
  sport?: string;
  entityId?: string;
  ratingMin?: string;
  ratingMax?: string;
  viewingMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  season?: string;
  sortBy?: string;
  sortDir?: string;
  page?: string;
}

export function usePersistedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasUrlParams = useRef(false);

  // On mount: if URL has no params, restore from localStorage
  useEffect(() => {
    const urlHasParams = searchParams.toString().length > 0;
    hasUrlParams.current = urlHasParams;

    if (!urlHasParams) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const params = JSON.parse(stored) as DiaryFilters;
          const qs = new URLSearchParams(
            Object.entries(params).filter(([, v]) => v) as [string, string][]
          ).toString();
          if (qs) {
            router.replace(`${pathname}?${qs}`);
          }
        }
      } catch {
        // ignore
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filters: DiaryFilters = {
    sport: searchParams.get("sport") ?? undefined,
    entityId: searchParams.get("entityId") ?? undefined,
    ratingMin: searchParams.get("ratingMin") ?? undefined,
    ratingMax: searchParams.get("ratingMax") ?? undefined,
    viewingMethod: searchParams.get("viewingMethod") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    season: searchParams.get("season") ?? undefined,
    sortBy: searchParams.get("sortBy") ?? undefined,
    sortDir: searchParams.get("sortDir") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  };

  const setFilters = useCallback(
    (updates: Partial<DiaryFilters>, resetPage = true) => {
      const current = new URLSearchParams(searchParams.toString());

      // Apply updates
      for (const [key, val] of Object.entries(updates)) {
        if (val) {
          current.set(key, val);
        } else {
          current.delete(key);
        }
      }

      if (resetPage && !("page" in updates)) {
        current.delete("page");
      }

      const qs = current.toString();
      router.push(`${pathname}?${qs}`);

      // Persist to localStorage (excluding page)
      const toStore: DiaryFilters = {};
      Array.from(current.entries()).forEach(([k, v]) => {
        if (k !== "page") {
          (toStore as Record<string, string>)[k] = v;
        }
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } catch {
        // ignore
      }
    },
    [pathname, router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [pathname, router]);

  return { filters, setFilters, clearFilters };
}
