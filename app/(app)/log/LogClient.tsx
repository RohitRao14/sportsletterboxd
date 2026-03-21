"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sport } from "@prisma/client";
import { SportBadge } from "@/components/SportBadge";
import { StarRating } from "@/components/StarRating";
import { useToast } from "@/components/Toast";

const TEAM_SPORTS: Sport[] = ["FOOTBALL", "NFL", "CRICKET", "NBA"];

interface SearchResult {
  id: string;
  sport: Sport;
  name: string;
  shortName: string | null;
  startTime: string | null;
  venue: string | null;
  city: string | null;
  season: string;
  competitionId: string;
  status: string;
  isManual: boolean;
  alreadyLogged: boolean;
}

interface EntityResult {
  id: string;
  sport: Sport;
  entityType: string;
  name: string;
  shortName: string | null;
  country: string | null;
}

interface Competition {
  id: string;
  sport: Sport;
  name: string;
  shortName: string | null;
  season: string;
}

const SPORTS = Object.values(Sport);

function defaultSeason(sport: Sport): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (sport === "NFL") return month >= 9 ? `${year}` : `${year - 1}`;
  if (sport === "NBA") return month >= 10 ? `${year}-${(year + 1) % 100}` : `${year - 1}-${year % 100}`;
  return month >= 8 ? `${year}-${(year + 1) % 100}` : `${year - 1}-${year % 100}`;
}

const inputCls = "w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none";

export default function LogClient() {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const [sportFilter, setSportFilter] = useState<Sport | "">("");
  const isTeamMode = sportFilter !== "" && TEAM_SPORTS.includes(sportFilter as Sport);

  // ── Event search (F1/All) ────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SearchResult | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Team search ──────────────────────────────────────────────────────────
  const [teamQuery, setTeamQuery] = useState("");
  const [teamResults, setTeamResults] = useState<EntityResult[]>([]);
  const [teamSearching, setTeamSearching] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<EntityResult | null>(null);
  const teamDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Opponent
  const [opponentQuery, setOpponentQuery] = useState("");
  const [opponentResults, setOpponentResults] = useState<EntityResult[]>([]);
  const [opponentSearching, setOpponentSearching] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<EntityResult | null>(null);
  const opponentDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Game details
  const [isHome, setIsHome] = useState(true);
  const [myScore, setMyScore] = useState("");
  const [oppScore, setOppScore] = useState("");
  const [gameDate, setGameDate] = useState(new Date().toISOString().split("T")[0]);
  const [gameVenue, setGameVenue] = useState("");
  const [gameSeason, setGameSeason] = useState("2025-26");
  const [gameCompetitionId, setGameCompetitionId] = useState("");
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  // Rating
  const [rating, setRating] = useState(0);
  const [viewingMethod, setViewingMethod] = useState<"STREAM" | "IN_PERSON">("STREAM");
  const [watchedAt, setWatchedAt] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const hasSelection = isTeamMode ? !!selectedTeam : !!selectedEvent;

  // ── Search: events ───────────────────────────────────────────────────────
  const searchEvents = useCallback(async (q: string, sport: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const params = new URLSearchParams({ q, limit: "10" });
      if (sport) params.set("sport", sport);
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    if (isTeamMode) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchEvents(query, sportFilter), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, sportFilter, isTeamMode, searchEvents]);

  // ── Search: teams ────────────────────────────────────────────────────────
  const searchEntities = useCallback(async (
    q: string, sport: string,
    setter: (r: EntityResult[]) => void,
    loadingSetter: (b: boolean) => void
  ) => {
    if (!q.trim()) { setter([]); return; }
    loadingSetter(true);
    try {
      const res = await fetch(`/api/entities?${new URLSearchParams({ q, sport })}`);
      const data = await res.json();
      setter(Array.isArray(data) ? data : []);
    } catch { setter([]); }
    finally { loadingSetter(false); }
  }, []);

  useEffect(() => {
    if (!isTeamMode) return;
    if (teamDebounceRef.current) clearTimeout(teamDebounceRef.current);
    teamDebounceRef.current = setTimeout(() => searchEntities(teamQuery, sportFilter, setTeamResults, setTeamSearching), 300);
    return () => { if (teamDebounceRef.current) clearTimeout(teamDebounceRef.current); };
  }, [teamQuery, sportFilter, isTeamMode, searchEntities]);

  useEffect(() => {
    if (!isTeamMode) return;
    if (opponentDebounceRef.current) clearTimeout(opponentDebounceRef.current);
    opponentDebounceRef.current = setTimeout(() => searchEntities(opponentQuery, sportFilter, setOpponentResults, setOpponentSearching), 300);
    return () => { if (opponentDebounceRef.current) clearTimeout(opponentDebounceRef.current); };
  }, [opponentQuery, sportFilter, isTeamMode, searchEntities]);

  // Load competitions when sport changes
  useEffect(() => {
    if (!isTeamMode) return;
    setGameCompetitionId("");
    setGameSeason(defaultSeason(sportFilter as Sport));
    fetch(`/api/competitions?sport=${sportFilter}`)
      .then(r => r.json())
      .then((data: Competition[]) => setCompetitions(data.filter(c => !c.name.startsWith("Manual"))))
      .catch(() => setCompetitions([]));
  }, [sportFilter, isTeamMode]);

  // Reset on sport change
  useEffect(() => {
    setSelectedTeam(null); setTeamQuery(""); setTeamResults([]);
    setSelectedOpponent(null); setOpponentQuery(""); setOpponentResults([]);
    setSelectedEvent(null); setQuery(""); setResults([]);
    setRating(0); setNotes("");
  }, [sportFilter]);

  // Scroll to form when selection is made
  useEffect(() => {
    if (hasSelection) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [hasSelection]);

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setSaving(true);

    try {
      let eventId: string;

      if (isTeamMode && selectedTeam) {
        // Create the event first
        const myName = selectedTeam.shortName ?? selectedTeam.name;
        const oppName = (selectedOpponent?.shortName ?? selectedOpponent?.name) ?? (opponentQuery || "Opponent");
        const hasScores = myScore !== "" && oppScore !== "";
        const eventName = hasScores
          ? (isHome ? `${myName} ${myScore}–${oppScore} ${oppName}` : `${oppName} ${oppScore}–${myScore} ${myName}`)
          : (isHome ? `${myName} vs ${oppName}` : `${oppName} vs ${myName}`);

        const homeEntityId = isHome ? selectedTeam.id : selectedOpponent?.id;
        const awayEntityId = isHome ? selectedOpponent?.id : selectedTeam.id;
        const hScore = isHome ? (myScore !== "" ? Number(myScore) : null) : (oppScore !== "" ? Number(oppScore) : null);
        const aScore = isHome ? (oppScore !== "" ? Number(oppScore) : null) : (myScore !== "" ? Number(myScore) : null);

        const evRes = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: eventName,
            sport: sportFilter,
            season: gameSeason,
            startTime: gameDate,
            venue: gameVenue || null,
            competitionId: gameCompetitionId || null,
            homeEntityId: homeEntityId ?? null,
            awayEntityId: awayEntityId ?? null,
            homeScore: hScore,
            awayScore: aScore,
          }),
        });
        if (!evRes.ok) throw new Error("Failed to create event");
        const ev = await evRes.json();
        eventId = ev.id;
      } else if (!isTeamMode && selectedEvent) {
        eventId = selectedEvent.id;
      } else {
        return;
      }

      const res = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, rating, viewingMethod, notes: notes || null, watchedAt }),
      });
      if (res.ok) {
        toast("Entry logged!");
        router.push("/diary");
      } else {
        const data = await res.json();
        toast(data.error ?? "Failed to log", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-6">Log a Game</h1>

      {/* Sport tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        <button onClick={() => setSportFilter("")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sportFilter === "" ? "bg-blue-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
          All
        </button>
        {SPORTS.map((s) => (
          <button key={s} onClick={() => setSportFilter(sportFilter === s ? "" : s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sportFilter === s ? "bg-blue-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
            {s}
          </button>
        ))}
      </div>

      {isTeamMode ? (
        /* ── Team search ── */
        <div className="relative mb-4">
          <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Your Team</label>
          <input
            type="text"
            value={teamQuery}
            onChange={(e) => { setTeamQuery(e.target.value); setSelectedTeam(null); }}
            placeholder={`Search ${sportFilter} teams...`}
            autoFocus
            className={inputCls}
          />
          {teamSearching && <p className="text-xs text-gray-500 mt-1">Searching...</p>}
          {teamResults.length > 0 && !selectedTeam && (
            <div className="absolute z-10 w-full mt-1 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden shadow-xl">
              {teamResults.map(r => (
                <button key={r.id} onClick={() => { setSelectedTeam(r); setTeamQuery(r.name); setTeamResults([]); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#22263a] transition-colors border-b border-[#2a2d3a] last:border-0 flex items-center gap-2">
                  <SportBadge sport={r.sport} size="xs" />
                  <span>{r.name}</span>
                  {r.country && <span className="text-gray-500 text-xs ml-auto">{r.country}</span>}
                </button>
              ))}
            </div>
          )}
          {selectedTeam && (
            <div className="mt-1 flex items-center gap-2 text-xs text-blue-400">
              <span>✓ {selectedTeam.name}</span>
              <button onClick={() => { setSelectedTeam(null); setTeamQuery(""); }} className="text-gray-500 hover:text-white">✕ change</button>
            </div>
          )}
        </div>
      ) : (
        /* ── Event search ── */
        <div className="relative mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedEvent(null); }}
            placeholder="Search for a race or game..."
            autoFocus
            className={inputCls}
          />
          {searching && <p className="text-xs text-gray-500 mt-1">Searching...</p>}
          {results.length > 0 && !selectedEvent && (
            <div className="absolute z-10 w-full mt-1 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden shadow-xl">
              {results.map(r => (
                <button key={r.id} onClick={() => { if (!r.alreadyLogged) { setSelectedEvent(r); setQuery(r.name); setResults([]); } }}
                  disabled={r.alreadyLogged}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#22263a] transition-colors border-b border-[#2a2d3a] last:border-0 ${r.alreadyLogged ? "opacity-40 cursor-not-allowed" : "text-white"}`}>
                  <div className="flex items-center gap-2">
                    <SportBadge sport={r.sport} size="xs" />
                    <span>{r.name}</span>
                    {r.alreadyLogged && <span className="text-xs text-green-400 ml-auto">✓ logged</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 ml-6">
                    {r.startTime && new Date(r.startTime).toLocaleDateString("en-GB")} {r.venue && `· ${r.venue}`}
                  </div>
                </button>
              ))}
            </div>
          )}
          {selectedEvent && (
            <div className="mt-1 flex items-center gap-2 text-xs text-blue-400">
              <span>✓ {selectedEvent.name}</span>
              <button onClick={() => { setSelectedEvent(null); setQuery(""); }} className="text-gray-500 hover:text-white">✕ change</button>
            </div>
          )}
        </div>
      )}

      {/* ── Full form (shown after selection) ── */}
      {hasSelection && (
        <div ref={formRef} className="mt-2">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Game details — team mode only */}
            {isTeamMode && (
              <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5 space-y-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Game Details</p>

                {/* Opponent */}
                <div className="relative">
                  <label className="text-xs text-gray-400 block mb-1.5">Opponent</label>
                  <input
                    type="text"
                    value={opponentQuery}
                    onChange={(e) => { setOpponentQuery(e.target.value); setSelectedOpponent(null); }}
                    placeholder="Search or type opponent name..."
                    className={inputCls}
                  />
                  {opponentSearching && <p className="text-xs text-gray-500 mt-1">Searching...</p>}
                  {opponentResults.length > 0 && !selectedOpponent && (
                    <div className="absolute z-10 w-full mt-1 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden shadow-xl">
                      {opponentResults.filter(r => r.id !== selectedTeam?.id).slice(0, 6).map(r => (
                        <button key={r.id} type="button" onClick={() => { setSelectedOpponent(r); setOpponentQuery(r.name); setOpponentResults([]); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#22263a] transition-colors border-b border-[#2a2d3a] last:border-0">
                          {r.name} {r.country && <span className="text-gray-500 text-xs">· {r.country}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Home/Away + Score on same row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Venue</label>
                    <div className="flex gap-1.5">
                      {[true, false].map(home => (
                        <button key={String(home)} type="button" onClick={() => setIsHome(home)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${isHome === home ? "bg-blue-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                          {home ? "Home" : "Away"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Score (optional)</label>
                    <div className="flex items-center gap-1.5">
                      <input type="number" min="0" value={myScore} onChange={e => setMyScore(e.target.value)}
                        placeholder="–" className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-2 py-2 text-sm text-white text-center focus:border-blue-500 focus:outline-none" />
                      <span className="text-gray-500 text-sm">:</span>
                      <input type="number" min="0" value={oppScore} onChange={e => setOppScore(e.target.value)}
                        placeholder="–" className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-2 py-2 text-sm text-white text-center focus:border-blue-500 focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* Date + Competition */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Date *</label>
                    <input type="date" value={gameDate} onChange={e => setGameDate(e.target.value)} required className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Competition</label>
                    <select value={gameCompetitionId} onChange={e => setGameCompetitionId(e.target.value)}
                      className={inputCls}>
                      <option value="">Other</option>
                      {competitions.map(c => <option key={c.id} value={c.id}>{c.shortName ?? c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Season + Venue */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Season</label>
                    <input type="text" value={gameSeason} onChange={e => setGameSeason(e.target.value)} placeholder="e.g. 2025-26" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Venue (optional)</label>
                    <input type="text" value={gameVenue} onChange={e => setGameVenue(e.target.value)} placeholder="Stadium name" className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {/* Rating + diary fields */}
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5 space-y-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Your Review</p>

              <div>
                <label className="text-xs text-gray-400 block mb-2">Rating *</label>
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-2">How did you watch?</label>
                <div className="flex gap-2">
                  {(["STREAM", "IN_PERSON"] as const).map(m => (
                    <button key={m} type="button" onClick={() => setViewingMethod(m)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewingMethod === m ? "bg-blue-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                      {m === "STREAM" ? "📺 Stream" : "🎟️ In Person"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-2">Date Watched *</label>
                <input type="date" value={watchedAt} onChange={e => setWatchedAt(e.target.value)} required
                  className={inputCls} />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-2">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  placeholder="Thoughts, highlights, atmosphere..."
                  className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none resize-none" />
              </div>
            </div>

            <button type="submit" disabled={saving || rating === 0}
              className="w-full py-3 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 text-sm">
              {saving ? "Saving..." : "Save to Diary"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
