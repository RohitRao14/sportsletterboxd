"use client";

import { useEffect, useState } from "react";
import { Sport } from "@prisma/client";
import { SportBadge } from "@/components/SportBadge";
import { StarRating } from "@/components/StarRating";

interface StatsData {
  total: number;
  avgRating: number | null;
  bySport: Record<string, { count: number; avgRating: number | null }>;
  topRated: Array<{
    id: string;
    rating: number;
    watchedAt: string;
    event: { name: string; sport: Sport; season: string; startTime: string | null };
  }>;
  recentEntries: Array<{
    id: string;
    rating: number;
    loggedAt: string;
    event: { name: string; sport: Sport; season: string };
  }>;
  viewingMethodBreakdown: { STREAM?: number; IN_PERSON?: number };
}

export default function StatsClient() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-[#1a1d27] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return <div className="text-gray-400">Failed to load stats.</div>;

  const total = data.total;
  const stream = data.viewingMethodBreakdown.STREAM ?? 0;
  const inPerson = data.viewingMethodBreakdown.IN_PERSON ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Stats</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Logged" value={total} />
        <StatCard
          label="Avg Rating"
          value={data.avgRating ? `${data.avgRating.toFixed(1)} ★` : "—"}
        />
        <StatCard
          label="In Person"
          value={inPerson}
          sub={total ? `${Math.round((inPerson / total) * 100)}%` : undefined}
        />
        <StatCard
          label="Streamed"
          value={stream}
          sub={total ? `${Math.round((stream / total) * 100)}%` : undefined}
        />
      </div>

      {/* By sport */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">By Sport</h2>
        <div className="space-y-3">
          {Object.values(Sport).map((sport) => {
            const stats = data.bySport[sport];
            if (!stats || stats.count === 0) return null;
            const pct = total ? (stats.count / total) * 100 : 0;
            return (
              <div key={sport}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <SportBadge sport={sport} size="xs" />
                    <span className="text-sm text-white font-medium">{stats.count}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {stats.avgRating && (
                      <span>{stats.avgRating.toFixed(1)} avg</span>
                    )}
                    <span>{Math.round(pct)}%</span>
                  </div>
                </div>
                <div className="h-2 bg-[#2a2d3a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {total === 0 && (
            <p className="text-gray-500 text-sm">No entries yet. Start logging!</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top rated */}
        {data.topRated.length > 0 && (
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Top Rated (5★)</h2>
            <div className="space-y-3">
              {data.topRated.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <SportBadge sport={entry.event.sport} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {entry.event.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.watchedAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <StarRating value={entry.rating} readonly size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent */}
        {data.recentEntries.length > 0 && (
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Recently Logged</h2>
            <div className="space-y-3">
              {data.recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <SportBadge sport={entry.event.sport} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {entry.event.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.loggedAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <StarRating value={entry.rating} readonly size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
