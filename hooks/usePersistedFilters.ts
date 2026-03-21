"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface DiaryFilters {
  sport?: string;
  entityId?: string;
  rating?: string;
  viewingMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDir?: string;
  page?: string;
}

export function usePersistedFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: DiaryFilters = {
    sport: searchParams.get("sport") ?? undefined,
    entityId: searchParams.get("entityId") ?? undefined,
    rating: searchParams.get("rating") ?? undefined,
    viewingMethod: searchParams.get("viewingMethod") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    sortBy: searchParams.get("sortBy") ?? undefined,
    sortDir: searchParams.get("sortDir") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  };

  const setFilters = useCallback(
    (updates: Partial<DiaryFilters>, resetPage = true) => {
      const current = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val) current.set(key, val);
        else current.delete(key);
      }
      if (resetPage && !("page" in updates)) current.delete("page");
      router.push(`${pathname}?${current.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  return { filters, setFilters, clearFilters };
}
