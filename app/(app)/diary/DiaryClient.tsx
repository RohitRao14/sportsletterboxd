"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePersistedFilters } from "@/hooks/usePersistedFilters";
import { SportBadge } from "@/components/SportBadge";
import { StarRating } from "@/components/StarRating";
import { ViewingMethodIcon } from "@/components/ViewingMethodIcon";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { Sport } from "@prisma/client";

interface Entity {
  id: string;
  name: string;
  shortName: string | null;
  sport?: string;
  country?: string | null;
}

interface Participant {
  entityId: string;
  role: string;
  result: { score?: number; scoreText?: string } | null;
  entity: Entity;
}

interface Event {
  id: string;
  name: string;
  sport: Sport;
  season: string;
  startTime: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  competition: { name: string; shortName: string | null };
  participants: Participant[];
  sportMeta: { format?: string } | null;
}

interface DiaryEntry {
  id: string;
  rating: number;
  viewingMethod: "STREAM" | "IN_PERSON";
  notes: string | null;
  watchedAt: string;
  loggedAt: string;
  sport: Sport;
  event: Event;
}

interface DiaryResponse {
  entries: DiaryEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const SPORTS = Object.values(Sport);

export default function DiaryClient() {
  const { filters, setFilters, clearFilters } = usePersistedFilters();
  const { toast } = useToast();
  const router = useRouter();

  const [data, setData] = useState<DiaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Team filter search
  const [teamQuery, setTeamQuery] = useState("");
  const [teamResults, setTeamResults] = useState<Entity[]>([]);
  const [teamSearching, setTeamSearching] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Entity | null>(null);
  const teamDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync selectedTeam display when entityId filter is cleared
  useEffect(() => {
    if (!filters.entityId) { setSelectedTeam(null); setTeamQuery(""); }
  }, [filters.entityId]);

  // Debounced team search
  useEffect(() => {
    if (!teamQuery.trim()) { setTeamResults([]); return; }
    if (teamDebounceRef.current) clearTimeout(teamDebounceRef.current);
    teamDebounceRef.current = setTimeout(async () => {
      setTeamSearching(true);
      try {
        const params = new URLSearchParams({ q: teamQuery });
        if (filters.sport) params.set("sport", filters.sport);
        const res = await fetch(`/api/entities?${params}`);
        const d = await res.json();
        setTeamResults(Array.isArray(d) ? d : []);
      } catch { setTeamResults([]); }
      finally { setTeamSearching(false); }
    }, 300);
    return () => { if (teamDebounceRef.current) clearTimeout(teamDebounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamQuery, filters.sport]);

  const fetchDiary = useCallback(async (f: typeof filters) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.sport) params.set("sport", f.sport);
    if (f.entityId) params.set("entityId", f.entityId);
    if (f.rating) params.set("rating", f.rating);
    if (f.viewingMethod) params.set("viewingMethod", f.viewingMethod);
    if (f.dateFrom) params.set("dateFrom", f.dateFrom);
    if (f.dateTo) params.set("dateTo", f.dateTo);
    if (f.sortBy) params.set("sortBy", f.sortBy);
    if (f.sortDir) params.set("sortDir", f.sortDir);
    params.set("page", f.page ?? "1");
    params.set("pageSize", "20");

    try {
      const res = await fetch(`/api/diary?${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      toast("Failed to load diary", "error");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    fetchDiary(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/diary/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Entry deleted");
      fetchDiary(filters);
    } else {
      toast("Failed to delete", "error");
    }
    setDeleteId(null);
  }

  const hasActiveFilters = !!(
    filters.sport || filters.entityId || filters.rating ||
    filters.viewingMethod || filters.dateFrom || filters.dateTo
  );

  const FilterSidebar = (
    <div className="space-y-5">
      {/* Sport */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Sport</label>
        <div className="flex flex-wrap gap-1.5">
          {SPORTS.map((s) => (
            <button
              key={s}
              onClick={() => setFilters({ sport: filters.sport === s ? "" : s })}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filters.sport === s
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Team */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Team</label>
        {selectedTeam ? (
          <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 text-sm">
            <span className="text-white truncate">{selectedTeam.name}</span>
            <button onClick={() => { setSelectedTeam(null); setTeamQuery(""); setFilters({ entityId: "" }); }}
              className="text-gray-500 hover:text-white ml-2 flex-shrink-0">✕</button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={teamQuery}
              onChange={e => setTeamQuery(e.target.value)}
              placeholder="Search teams..."
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            />
            {teamSearching && <p className="text-xs text-gray-500 mt-1">Searching...</p>}
            {teamResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden shadow-xl">
                {teamResults.slice(0, 6).map(r => (
                  <button key={r.id} onClick={() => { setSelectedTeam(r); setTeamQuery(r.name); setTeamResults([]); setFilters({ entityId: r.id }); }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#22263a] transition-colors border-b border-[#2a2d3a] last:border-0">
                    <span>{r.name}</span>
                    {r.country && <span className="text-gray-500 text-xs ml-1">· {r.country}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rating */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setFilters({ rating: filters.rating === String(r) ? "" : String(r) })}
              className={`w-9 h-9 rounded text-sm font-medium transition-colors ${
                filters.rating === String(r)
                  ? "bg-yellow-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {r}★
            </button>
          ))}
        </div>
      </div>

      {/* Viewing Method */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Viewing</label>
        <div className="flex gap-1.5">
          {["STREAM", "IN_PERSON"].map((m) => (
            <button
              key={m}
              onClick={() =>
                setFilters({ viewingMethod: filters.viewingMethod === m ? "" : m })
              }
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                filters.viewingMethod === m
                  ? "bg-blue-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {m === "STREAM" ? "📺 Stream" : "🎟️ In Person"}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Date Watched</label>
        <div className="space-y-2">
          <input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => setFilters({ dateFrom: e.target.value })}
            className="w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white"
            placeholder="From"
          />
          <input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) => setFilters({ dateTo: e.target.value })}
            className="w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white"
            placeholder="To"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full py-2 rounded-lg text-sm text-red-400 border border-red-900/50 hover:bg-red-900/20 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Diary</h1>
            {data && (
              <p className="text-gray-400 text-sm mt-0.5">
                {data.total} {data.total === 1 ? "entry" : "entries"}
                {hasActiveFilters ? " (filtered)" : ""}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden px-3 py-2 rounded-lg text-sm bg-white/10 text-gray-300 hover:bg-white/20"
          >
            Filters {hasActiveFilters ? "●" : ""}
          </button>
          <select
            value={`${filters.sortBy ?? "watchedAt"}-${filters.sortDir ?? "desc"}`}
            onChange={(e) => {
              const [sortBy, sortDir] = e.target.value.split("-");
              setFilters({ sortBy, sortDir });
            }}
            className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="watchedAt-desc">Watched (newest)</option>
            <option value="watchedAt-asc">Watched (oldest)</option>
            <option value="loggedAt-desc">Logged (newest)</option>
            <option value="rating-desc">Rating (highest)</option>
            <option value="rating-asc">Rating (lowest)</option>
            <option value="startTime-desc">Event date (newest)</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-20 bg-white/5 backdrop-blur-sm border border-white/8 rounded-xl p-4">
            {FilterSidebar}
          </div>
        </aside>

        {/* Mobile filter drawer */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileFilterOpen(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-black/70 backdrop-blur-md border-l border-white/10 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Filters</h2>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              {FilterSidebar}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-28 bg-[#1a1d27] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !data || data.entries.length === 0 ? (
            <EmptyState
              title={hasActiveFilters ? "No entries match your filters" : "No entries yet"}
              description={
                hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Start logging games you've watched"
              }
              action={
                !hasActiveFilters ? (
                  <Link
                    href="/log"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Log your first game
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="space-y-3">
                {data.entries.map((entry) => (
                  <DiaryEntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={() => setDeleteId(entry.id)}
                    onEdit={() => router.push(`/diary/${entry.id}/edit`)}
                  />
                ))}
              </div>
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                onPageChange={(p) => setFilters({ page: String(p) }, false)}
              />
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete entry?"
        message="This will permanently remove this diary entry."
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

const sportBorderColor: Record<string, string> = {
  FOOTBALL: "border-l-green-500",
  F1: "border-l-red-500",
  CRICKET: "border-l-yellow-400",
  NFL: "border-l-amber-500",
  NBA: "border-l-orange-500",
};

function DiaryEntryCard({
  entry,
  onDelete,
  onEdit,
}: {
  entry: DiaryEntry;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const home = entry.event.participants.find(p => p.role === "HOME_TEAM");
  const away = entry.event.participants.find(p => p.role === "AWAY_TEAM");
  const homeScore = (home?.result as { scoreText?: string; score?: number } | null)?.scoreText ?? (home?.result as { score?: number } | null)?.score?.toString();
  const awayScore = (away?.result as { scoreText?: string; score?: number } | null)?.scoreText ?? (away?.result as { score?: number } | null)?.score?.toString();
  const hasScore = homeScore != null && awayScore != null;
  const borderCls = sportBorderColor[entry.sport] ?? "border-l-blue-500";

  return (
    <div className={`bg-white/5 backdrop-blur-sm border-t border-r border-b border-white/8 border-l-2 ${borderCls} rounded-xl p-4 hover:bg-white/8 transition-colors group`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <SportBadge sport={entry.sport} size="xs" />
            {entry.sport === "CRICKET" && (entry.event.sportMeta as { format?: string } | null)?.format && (
              <span className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                {(entry.event.sportMeta as { format?: string })!.format}
              </span>
            )}
            {(() => {
              const compName = entry.event.competition.shortName ?? entry.event.competition.name;
              return compName && !compName.startsWith("Manual") ? (
                <span className="text-xs text-gray-500">{compName}</span>
              ) : null;
            })()}
          </div>

          {/* Scoreline — prominent when scores exist */}
          {home && away && hasScore ? (
            <div className="flex items-center gap-2 my-1.5 flex-wrap">
              <span className="text-sm font-bold text-white">{home.entity.shortName ?? home.entity.name}</span>
              <span className="text-lg font-black text-white tracking-tight tabular-nums">{homeScore}</span>
              <span className="text-gray-500 font-bold">–</span>
              <span className="text-lg font-black text-white tracking-tight tabular-nums">{awayScore}</span>
              <span className="text-sm font-bold text-white">{away.entity.shortName ?? away.entity.name}</span>
            </div>
          ) : home && away ? (
            <p className="text-sm font-semibold text-gray-300 my-1.5">
              {home.entity.shortName ?? home.entity.name} <span className="text-gray-500 font-normal">vs</span> {away.entity.shortName ?? away.entity.name}
            </p>
          ) : (
            <Link href={`/diary/${entry.id}`} className="group/link">
              <h3 className="font-semibold text-white text-sm leading-snug group-hover/link:text-blue-400 transition-colors my-1">
                {entry.event.name}
              </h3>
            </Link>
          )}

          {/* Footer row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <StarRating value={entry.rating} readonly size="sm" />
            <ViewingMethodIcon method={entry.viewingMethod} />
            <span className="text-xs text-gray-500">
              {new Date(entry.watchedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {entry.event.venue && (
              <span className="text-xs text-gray-600 truncate">{entry.event.venue}</span>
            )}
          </div>

          {entry.notes && (
            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{entry.notes}</p>
          )}
        </div>

        <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs" title="Edit">✏️</button>
          <button onClick={onDelete} className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors text-xs" title="Delete">🗑️</button>
        </div>
      </div>
    </div>
  );
}
