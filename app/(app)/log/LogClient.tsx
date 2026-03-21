"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sport } from "@prisma/client";
import { SportBadge } from "@/components/SportBadge";
import { StarRating } from "@/components/StarRating";
import { useToast } from "@/components/Toast";

// F1 uses event search; all others use team search
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

interface SelectedEvent {
  id: string;
  sport: Sport;
  name: string;
  startTime: string | null;
  venue: string | null;
  season: string;
}

const SPORTS = Object.values(Sport);

function defaultSeason(sport: Sport): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (sport === "NFL") return month >= 9 ? `${year}` : `${year - 1}`;
  if (sport === "NBA") return month >= 10 ? `${year}-${year + 1 - 2000}` : `${year - 1}-${year - 2000}`;
  return month >= 8 ? `${year}-${(year + 1) % 100}` : `${year - 1}-${year % 100}`;
}

export default function LogClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<"search" | "game_details" | "form">("search");
  const [sportFilter, setSportFilter] = useState<Sport | "">("");

  // ── Event search (F1 / All) ─────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Team search (non-F1) ────────────────────────────────────────────────
  const [teamQuery, setTeamQuery] = useState("");
  const [teamResults, setTeamResults] = useState<EntityResult[]>([]);
  const [teamSearching, setTeamSearching] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<EntityResult | null>(null);
  const teamDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Opponent search
  const [opponentQuery, setOpponentQuery] = useState("");
  const [opponentResults, setOpponentResults] = useState<EntityResult[]>([]);
  const [opponentSearching, setOpponentSearching] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<EntityResult | null>(null);
  const opponentDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Game details form
  const [isHome, setIsHome] = useState(true);
  const [myScore, setMyScore] = useState("");
  const [oppScore, setOppScore] = useState("");
  const [gameDate, setGameDate] = useState(new Date().toISOString().split("T")[0]);
  const [gameVenue, setGameVenue] = useState("");
  const [gameSeason, setGameSeason] = useState("2025-26");
  const [gameCompetitionId, setGameCompetitionId] = useState("");
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [creatingGame, setCreatingGame] = useState(false);

  // ── Rating form ─────────────────────────────────────────────────────────
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [rating, setRating] = useState(0);
  const [viewingMethod, setViewingMethod] = useState<"STREAM" | "IN_PERSON">("STREAM");
  const [watchedAt, setWatchedAt] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const isTeamMode = sportFilter !== "" && TEAM_SPORTS.includes(sportFilter as Sport);

  // ── Event search (F1) ───────────────────────────────────────────────────
  const searchEvents = useCallback(async (q: string, sport: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const params = new URLSearchParams({ q, limit: "15" });
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

  // ── Team search ─────────────────────────────────────────────────────────
  const searchTeams = useCallback(async (q: string, sport: string, setter: (r: EntityResult[]) => void, loadingSetter: (b: boolean) => void) => {
    if (!q.trim()) { setter([]); return; }
    loadingSetter(true);
    try {
      const params = new URLSearchParams({ q, sport });
      const res = await fetch(`/api/entities?${params}`);
      const data = await res.json();
      setter(Array.isArray(data) ? data : []);
    } catch { setter([]); }
    finally { loadingSetter(false); }
  }, []);

  useEffect(() => {
    if (!isTeamMode) return;
    if (teamDebounceRef.current) clearTimeout(teamDebounceRef.current);
    teamDebounceRef.current = setTimeout(() => searchTeams(teamQuery, sportFilter, setTeamResults, setTeamSearching), 300);
    return () => { if (teamDebounceRef.current) clearTimeout(teamDebounceRef.current); };
  }, [teamQuery, sportFilter, isTeamMode, searchTeams]);

  useEffect(() => {
    if (!isTeamMode || !selectedTeam) return;
    if (opponentDebounceRef.current) clearTimeout(opponentDebounceRef.current);
    opponentDebounceRef.current = setTimeout(() => searchTeams(opponentQuery, sportFilter, setOpponentResults, setOpponentSearching), 300);
    return () => { if (opponentDebounceRef.current) clearTimeout(opponentDebounceRef.current); };
  }, [opponentQuery, sportFilter, isTeamMode, selectedTeam, searchTeams]);

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

  // Reset team search when switching sport
  useEffect(() => {
    setSelectedTeam(null);
    setTeamQuery("");
    setTeamResults([]);
    setSelectedOpponent(null);
    setOpponentQuery("");
    setOpponentResults([]);
    setStep("search");
  }, [sportFilter]);

  function selectEvent(result: SearchResult) {
    setSelectedEvent({
      id: result.id,
      sport: result.sport,
      name: result.name,
      startTime: result.startTime,
      venue: result.venue,
      season: result.season,
    });
    setWatchedAt(result.startTime ? result.startTime.split("T")[0] : new Date().toISOString().split("T")[0]);
    setStep("form");
  }

  function selectTeam(entity: EntityResult) {
    setSelectedTeam(entity);
    setTeamQuery(entity.name);
    setTeamResults([]);
    setStep("game_details");
  }

  function selectOpponent(entity: EntityResult) {
    setSelectedOpponent(entity);
    setOpponentQuery(entity.name);
    setOpponentResults([]);
  }

  function buildEventName(): string {
    const myName = selectedTeam?.shortName ?? selectedTeam?.name ?? "My Team";
    const oppName = (selectedOpponent?.shortName ?? selectedOpponent?.name) ?? (opponentQuery || "Opponent");
    const hasScores = myScore !== "" && oppScore !== "";
    if (hasScores) {
      return isHome
        ? `${myName} ${myScore}–${oppScore} ${oppName}`
        : `${oppName} ${oppScore}–${myScore} ${myName}`;
    }
    return isHome ? `${myName} vs ${oppName}` : `${oppName} vs ${myName}`;
  }

  async function createGameAndContinue() {
    if (!selectedTeam || !gameDate) return;
    setCreatingGame(true);
    try {
      const eventName = buildEventName();
      const homeEntityId = isHome ? selectedTeam.id : selectedOpponent?.id;
      const awayEntityId = isHome ? selectedOpponent?.id : selectedTeam.id;
      const homeScore = isHome ? (myScore !== "" ? Number(myScore) : undefined) : (oppScore !== "" ? Number(oppScore) : undefined);
      const awayScore = isHome ? (oppScore !== "" ? Number(oppScore) : undefined) : (myScore !== "" ? Number(myScore) : undefined);

      const res = await fetch("/api/events", {
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
          homeScore: homeScore ?? null,
          awayScore: awayScore ?? null,
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
      setWatchedAt(gameDate);
      setStep("form");
    } catch {
      toast("Failed to create game", "error");
    } finally {
      setCreatingGame(false);
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
        body: JSON.stringify({ eventId: selectedEvent.id, rating, viewingMethod, notes: notes || null, watchedAt }),
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

  // ── Rating form (step === "form") ───────────────────────────────────────
  if (step === "form" && selectedEvent) {
    return (
      <div className="max-w-xl">
        <button
          onClick={() => { setStep(isTeamMode ? "game_details" : "search"); setSelectedEvent(null); setRating(0); }}
          className="text-sm text-gray-400 hover:text-white mb-6 inline-flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white mb-6">Log a Game</h1>
        <div className="bg-[#1a1d27] border border-blue-500/40 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <SportBadge sport={selectedEvent.sport} />
          </div>
          <p className="font-semibold text-white">{selectedEvent.name}</p>
          <div className="flex gap-3 text-xs text-gray-500 mt-1">
            {selectedEvent.startTime && <span>{new Date(selectedEvent.startTime).toLocaleDateString("en-GB")}</span>}
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
                <button key={m} type="button" onClick={() => setViewingMethod(m)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${viewingMethod === m ? "bg-blue-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                  {m === "STREAM" ? "📺 Stream" : "🎟️ In Person"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Date Watched *</label>
            <input type="date" value={watchedAt} onChange={(e) => setWatchedAt(e.target.value)} required
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
              placeholder="Thoughts, highlights, how was the atmosphere..."
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none resize-none" />
          </div>
          <button type="submit" disabled={saving || rating === 0}
            className="w-full py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save to Diary"}
          </button>
        </form>
      </div>
    );
  }

  // ── Game details form (step === "game_details", team mode) ──────────────
  if (step === "game_details" && selectedTeam) {
    return (
      <div className="max-w-xl">
        <button onClick={() => { setStep("search"); setSelectedTeam(null); setTeamQuery(""); }}
          className="text-sm text-gray-400 hover:text-white mb-6 inline-flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-white mb-6">Game Details</h1>

        {/* Selected team */}
        <div className="bg-[#1a1d27] border border-blue-500/40 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Team</p>
          <div className="flex items-center gap-2">
            <SportBadge sport={selectedTeam.sport} />
            <span className="font-semibold text-white">{selectedTeam.name}</span>
            {selectedTeam.country && <span className="text-xs text-gray-500">{selectedTeam.country}</span>}
          </div>
        </div>

        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 space-y-4">
          {/* Opponent */}
          <div className="relative">
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Opponent</label>
            <input
              type="text"
              value={opponentQuery}
              onChange={(e) => { setOpponentQuery(e.target.value); setSelectedOpponent(null); }}
              placeholder="Search for opponent team..."
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none"
            />
            {opponentSearching && <p className="text-xs text-gray-500 mt-1">Searching...</p>}
            {opponentResults.length > 0 && !selectedOpponent && (
              <div className="absolute z-10 w-full mt-1 bg-[#1a1d27] border border-[#2a2d3a] rounded-lg overflow-hidden shadow-xl">
                {opponentResults.filter(r => r.id !== selectedTeam.id).slice(0, 6).map(r => (
                  <button key={r.id} onClick={() => selectOpponent(r)}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#22263a] transition-colors border-b border-[#2a2d3a] last:border-0">
                    {r.name} {r.country && <span className="text-gray-500 text-xs">· {r.country}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Home/Away */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
              Your team played...
            </label>
            <div className="flex gap-2">
              {[true, false].map((home) => (
                <button key={String(home)} type="button" onClick={() => setIsHome(home)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isHome === home ? "bg-blue-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                  {home ? "At Home" : "Away"}
                </button>
              ))}
            </div>
          </div>

          {/* Score */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Score (optional)</label>
            <div className="flex items-center gap-2">
              <input type="number" min="0" value={myScore} onChange={(e) => setMyScore(e.target.value)}
                placeholder={selectedTeam.shortName ?? "Your team"}
                className="flex-1 bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none text-center" />
              <span className="text-gray-400 font-bold">–</span>
              <input type="number" min="0" value={oppScore} onChange={(e) => setOppScore(e.target.value)}
                placeholder={selectedOpponent?.shortName ?? (opponentQuery || "Opponent")}
                className="flex-1 bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none text-center" />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Date *</label>
            <input type="date" value={gameDate} onChange={(e) => setGameDate(e.target.value)} required
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Competition */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Competition</label>
            <select value={gameCompetitionId} onChange={(e) => setGameCompetitionId(e.target.value)}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
              <option value="">Other / Unknown</option>
              {competitions.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.season})</option>
              ))}
            </select>
          </div>

          {/* Season */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Season</label>
            <input type="text" value={gameSeason} onChange={(e) => setGameSeason(e.target.value)}
              placeholder="e.g. 2025-26"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none" />
          </div>

          {/* Venue */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Venue (optional)</label>
            <input type="text" value={gameVenue} onChange={(e) => setGameVenue(e.target.value)}
              placeholder="Stadium / arena name"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none" />
          </div>

          <button onClick={createGameAndContinue} disabled={!gameDate || creatingGame}
            className="w-full py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">
            {creatingGame ? "Creating..." : "Continue to Rating →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Search step ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">Log a Game</h1>

      {/* Sport tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
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
        /* ── Team search UI ── */
        <div>
          <p className="text-sm text-gray-400 mb-3">Search for your team to log a game</p>
          <div className="relative mb-2">
            <input
              type="text"
              value={teamQuery}
              onChange={(e) => setTeamQuery(e.target.value)}
              placeholder={`Search ${sportFilter} teams...`}
              autoFocus
              className="w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm"
            />
            {teamSearching && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Searching...</div>}
          </div>
          {teamResults.length > 0 && (
            <div className="space-y-2">
              {teamResults.map((r) => (
                <button key={r.id} onClick={() => selectTeam(r)}
                  className="w-full text-left bg-[#1a1d27] border border-[#2a2d3a] hover:border-blue-500/50 hover:bg-[#22263a] rounded-xl px-4 py-3 transition-colors">
                  <div className="flex items-center gap-2">
                    <SportBadge sport={r.sport} size="xs" />
                    <span className="text-sm font-medium text-white">{r.name}</span>
                    {r.country && <span className="text-xs text-gray-500 ml-auto">{r.country}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
          {teamQuery && !teamSearching && teamResults.length === 0 && (
            <p className="text-gray-400 text-sm">No teams found for &ldquo;{teamQuery}&rdquo;</p>
          )}
        </div>
      ) : (
        /* ── Event search UI (F1 / All) ── */
        <div>
          <div className="relative mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a match, race, or game..."
              autoFocus
              className="w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm"
            />
            {searching && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Searching...</div>}
          </div>
          {query && results.length > 0 && (
            <div className="space-y-2 mb-4">
              {results.map((result) => (
                <button key={result.id} onClick={() => !result.alreadyLogged && selectEvent(result)}
                  disabled={result.alreadyLogged}
                  className={`w-full text-left bg-[#1a1d27] border rounded-xl px-4 py-3 transition-colors ${result.alreadyLogged ? "border-[#2a2d3a] opacity-50 cursor-not-allowed" : "border-[#2a2d3a] hover:border-blue-500/50 hover:bg-[#22263a]"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <SportBadge sport={result.sport} size="xs" />
                    {result.alreadyLogged && <span className="text-xs text-green-400 bg-green-900/40 px-1.5 py-0.5 rounded">✓ Already logged</span>}
                  </div>
                  <p className="text-sm font-medium text-white">{result.name}</p>
                  <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                    {result.startTime && <span>{new Date(result.startTime).toLocaleDateString("en-GB")}</span>}
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
        </div>
      )}
    </div>
  );
}
