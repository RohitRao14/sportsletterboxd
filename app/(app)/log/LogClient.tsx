"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sport } from "@prisma/client";
import { SportBadge } from "@/components/SportBadge";
import { StarRating } from "@/components/StarRating";
import { useToast } from "@/components/Toast";

interface SearchResult {
  id: string;
  sport: Sport;
  name: string;
  short_name: string | null;
  start_time: string | null;
  venue: string | null;
  city: string | null;
  season: string;
  competition_id: string;
  status: string;
  is_manual: boolean;
  already_logged: boolean;
}

interface SelectedEvent {
  id: string;
  sport: Sport;
  name: string;
  startTime: string | null;
  venue: string | null;
  season: string;
  competitionName?: string;
}

const SPORTS = Object.values(Sport);

export default function LogClient() {
  const router = useRouter();
  const { toast } = useToast();

  // Step 1: Search
  const [step, setStep] = useState<"search" | "form">("search");
  const [query, setQuery] = useState("");
  const [sportFilter, setSportFilter] = useState<Sport | "">("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Step 2: Form
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [rating, setRating] = useState(0);
  const [viewingMethod, setViewingMethod] = useState<"STREAM" | "IN_PERSON">("STREAM");
  const [watchedAt, setWatchedAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Manual event form
  const [manualName, setManualName] = useState("");
  const [manualSport, setManualSport] = useState<Sport>("FOOTBALL");
  const [manualSeason, setManualSeason] = useState("2025-26");
  const [manualDate, setManualDate] = useState("");
  const [manualVenue, setManualVenue] = useState("");
  const [creatingManual, setCreatingManual] = useState(false);

  const search = useCallback(async (q: string, sport: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams({ q, limit: "15" });
      if (sport) params.set("sport", sport);
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(query, sportFilter);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, sportFilter, search]);

  function selectEvent(result: SearchResult) {
    setSelectedEvent({
      id: result.id,
      sport: result.sport,
      name: result.name,
      startTime: result.start_time,
      venue: result.venue,
      season: result.season,
    });
    setStep("form");
  }

  async function createManualAndSelect() {
    if (!manualName.trim()) return;
    setCreatingManual(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualName,
          sport: manualSport,
          season: manualSeason,
          startTime: manualDate || null,
          venue: manualVenue || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const event = await res.json();
      setSelectedEvent({
        id: event.id,
        sport: event.sport,
        name: event.name,
        startTime: event.startTime,
        venue: event.venue,
        season: event.season,
      });
      setShowManual(false);
      setStep("form");
    } catch {
      toast("Failed to create event", "error");
    } finally {
      setCreatingManual(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent || rating === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          rating,
          viewingMethod,
          notes: notes || null,
          watchedAt,
        }),
      });
      if (res.ok) {
        toast("Entry logged!");
        router.push("/diary");
      } else {
        const data = await res.json();
        toast(data.error ?? "Failed to log", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  if (step === "form" && selectedEvent) {
    return (
      <div className="max-w-xl">
        <button
          onClick={() => { setStep("search"); setSelectedEvent(null); setRating(0); }}
          className="text-sm text-gray-400 hover:text-white mb-6 inline-flex items-center gap-1"
        >
          ← Back to search
        </button>

        <h1 className="text-2xl font-bold text-white mb-6">Log a Game</h1>

        {/* Selected event card */}
        <div className="bg-[#1a1d27] border border-blue-500/40 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <SportBadge sport={selectedEvent.sport} />
          </div>
          <p className="font-semibold text-white">{selectedEvent.name}</p>
          <div className="flex gap-3 text-xs text-gray-500 mt-1">
            {selectedEvent.startTime && (
              <span>{new Date(selectedEvent.startTime).toLocaleDateString("en-GB")}</span>
            )}
            {selectedEvent.venue && <span>{selectedEvent.venue}</span>}
            <span>{selectedEvent.season}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 space-y-5">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Rating *</label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">How did you watch? *</label>
            <div className="flex gap-2">
              {(["STREAM", "IN_PERSON"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewingMethod(m)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewingMethod === m
                      ? "bg-blue-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {m === "STREAM" ? "📺 Stream" : "🎟️ In Person"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Date Watched *</label>
            <input
              type="date"
              value={watchedAt}
              onChange={(e) => setWatchedAt(e.target.value)}
              required
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Thoughts, highlights, how was the atmosphere..."
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || rating === 0}
            className="w-full py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save to Diary"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">Log a Game</h1>

      {/* Sport tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        <button
          onClick={() => setSportFilter("")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            sportFilter === ""
              ? "bg-blue-600 text-white"
              : "bg-white/10 text-gray-300 hover:bg-white/20"
          }`}
        >
          All
        </button>
        {SPORTS.map((s) => (
          <button
            key={s}
            onClick={() => setSportFilter(sportFilter === s ? "" : s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sportFilter === s
                ? "bg-blue-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a match, race, or game..."
          autoFocus
          className="w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm"
        />
        {searching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            Searching...
          </div>
        )}
      </div>

      {/* Results */}
      {query && results.length > 0 && (
        <div className="space-y-2 mb-4">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => !result.already_logged && selectEvent(result)}
              disabled={result.already_logged}
              className={`w-full text-left bg-[#1a1d27] border rounded-xl px-4 py-3 transition-colors ${
                result.already_logged
                  ? "border-[#2a2d3a] opacity-50 cursor-not-allowed"
                  : "border-[#2a2d3a] hover:border-blue-500/50 hover:bg-[#22263a]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <SportBadge sport={result.sport} size="xs" />
                {result.already_logged && (
                  <span className="text-xs text-green-400 bg-green-900/40 px-1.5 py-0.5 rounded">
                    ✓ Already logged
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-white">{result.name}</p>
              <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                {result.start_time && (
                  <span>
                    {new Date(result.start_time).toLocaleDateString("en-GB")}
                  </span>
                )}
                {result.venue && <span>{result.venue}</span>}
                <span>{result.season}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {query && !searching && results.length === 0 && (
        <p className="text-gray-400 text-sm mb-4">No results found for &ldquo;{query}&rdquo;</p>
      )}

      {/* Manual entry link */}
      <div className="mt-4 border-t border-[#2a2d3a] pt-4">
        <button
          onClick={() => setShowManual(!showManual)}
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showManual ? "↑ Hide" : "Can't find it? Add manually"}
        </button>

        {showManual && (
          <div className="mt-4 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-white text-sm">Add custom event</h3>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Event name *"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={manualSport}
                onChange={(e) => setManualSport(e.target.value as Sport)}
                className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white"
              >
                {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                type="text"
                value={manualSeason}
                onChange={(e) => setManualSeason(e.target.value)}
                placeholder="Season (e.g. 2025-26)"
                className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white"
              />
              <input
                type="text"
                value={manualVenue}
                onChange={(e) => setManualVenue(e.target.value)}
                placeholder="Venue (optional)"
                className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={createManualAndSelect}
              disabled={!manualName.trim() || creatingManual}
              className="w-full py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {creatingManual ? "Creating..." : "Use this event →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
