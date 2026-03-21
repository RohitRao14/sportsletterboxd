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
  const [homeQuery, setHomeQuery] = useState("");
  const [homeResults, setHomeResults] = useState<EntityResult[]>([]);
  const [homeSearching, setHomeSearching] = useState(false);
  const [selectedHome, setSelectedHome] = useState<EntityResult | null>(null);
  const homeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Away team
  const [awayQuery, setAwayQuery] = useState("");
  const [awayResults, setAwayResults] = useState<EntityResult[]>([]);
  const [awaySearching, setAwaySearching] = useState(false);
  const [selectedAway, setSelectedAway] = useState<EntityResult | null>(null);
  const awayDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Game details
  const [myScore, setMyScore] = useState("");
  const [oppScore, setOppScore] = useState("");
  const [myInn2, setMyInn2] = useState("");
  const [oppInn2, setOppInn2] = useState("");
  const [cricketFormat, setCricketFormat] = useState<"T20" | "ODI" | "Test">("T20");
  const [cricketResult, setCricketResult] = useState("");
  const [gameDate, setGameDate] = useState(new Date().toISOString().split("T")[0]);
  const [gameVenue, setGameVenue] = useState("");
  const [gameSeason, setGameSeason] = useState("2025-26");
  const [gameCompetitionId, setGameCompetitionId] = useState("");
  const [customCompetitionName, setCustomCompetitionName] = useState("");
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  // Rating
  const [rating, setRating] = useState(0);
  const [viewingMethod, setViewingMethod] = useState<"STREAM" | "IN_PERSON">("STREAM");
  const [watchedAt, setWatchedAt] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const hasSelection = isTeamMode ? !!selectedHome : !!selectedEvent;

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
    if (homeDebounceRef.current) clearTimeout(homeDebounceRef.current);
    homeDebounceRef.current = setTimeout(() => searchEntities(homeQuery, sportFilter, setHomeResults, setHomeSearching), 300);
    return () => { if (homeDebounceRef.current) clearTimeout(homeDebounceRef.current); };
  }, [homeQuery, sportFilter, isTeamMode, searchEntities]);

  useEffect(() => {
    if (!isTeamMode) return;
    if (awayDebounceRef.current) clearTimeout(awayDebounceRef.current);
    awayDebounceRef.current = setTimeout(() => searchEntities(awayQuery, sportFilter, setAwayResults, setAwaySearching), 300);
    return () => { if (awayDebounceRef.current) clearTimeout(awayDebounceRef.current); };
  }, [awayQuery, sportFilter, isTeamMode, searchEntities]);

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
    setSelectedHome(null); setHomeQuery(""); setHomeResults([]);
    setSelectedAway(null); setAwayQuery(""); setAwayResults([]);
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

      if (isTeamMode && selectedHome) {
        // Create the event first
        const homeName = selectedHome.shortName ?? selectedHome.name;
        const awayName = (selectedAway?.shortName ?? selectedAway?.name) ?? (awayQuery || "Away");
        const hasScores = myScore !== "" && oppScore !== "";
        const eventName = hasScores
          ? `${homeName} ${myScore} – ${oppScore} ${awayName}`
          : `${homeName} vs ${awayName}`;

        const homeEntityId = selectedHome.id.startsWith("__manual__") ? null : selectedHome.id;
        const awayEntityId = selectedAway && !selectedAway.id.startsWith("__manual__") ? selectedAway.id : null;
        const hScoreText = myScore || null;
        const aScoreText = oppScore || null;
        const hInn2 = myInn2 || null;
        const aInn2 = oppInn2 || null;

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
            customCompetitionName: (!gameCompetitionId && customCompetitionName) ? customCompetitionName : null,
            homeEntityId,
            awayEntityId,
            homeScoreText: hScoreText,
            awayScoreText: aScoreText,
            homeInn1: sportFilter === "CRICKET" && cricketFormat === "Test" ? hScoreText : null,
            homeInn2: sportFilter === "CRICKET" && cricketFormat === "Test" ? hInn2 : null,
            awayInn1: sportFilter === "CRICKET" && cricketFormat === "Test" ? aScoreText : null,
            awayInn2: sportFilter === "CRICKET" && cricketFormat === "Test" ? aInn2 : null,
            cricketFormat: sportFilter === "CRICKET" ? cricketFormat : null,
            cricketResult: sportFilter === "CRICKET" ? (cricketResult || null) : null,
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
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
        <button onClick={() => setSportFilter("")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${sportFilter === "" ? "bg-blue-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
          All
        </button>
        {SPORTS.map((s) => (
          <button key={s} onClick={() => setSportFilter(sportFilter === s ? "" : s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${sportFilter === s ? "bg-blue-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Cricket format selector — shown immediately when CRICKET is selected */}
      {sportFilter === "CRICKET" && (
        <div className="mb-4">
          <label className="text-xs text-gray-400 block mb-1.5">Format</label>
          <div className="flex gap-1.5">
            {(["T20", "ODI", "Test"] as const).map(f => (
              <button key={f} type="button" onClick={() => setCricketFormat(f)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${cricketFormat === f ? "bg-blue-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {isTeamMode ? (
        /* ── Team search ── */
        <div className="space-y-3 mb-4">
          {/* Home team */}
          <div className="relative">
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
              <span className="text-blue-400 font-semibold">H</span> Home Team
            </label>
            <input
              type="text"
              value={homeQuery}
              onChange={(e) => { setHomeQuery(e.target.value); setSelectedHome(null); }}
              placeholder={`Search ${sportFilter} teams...`}
              autoFocus
              className={inputCls}
            />
            {homeSearching && <p className="text-xs text-gray-500 mt-1">Searching...</p>}
            {homeQuery && !homeSearching && !selectedHome && (
              <div className="absolute z-10 w-full mt-1 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden shadow-xl">
                {homeResults.map(r => (
                  <button key={r.id} onClick={() => { setSelectedHome(r); setHomeQuery(r.name); setHomeResults([]); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#22263a] transition-colors border-b border-[#2a2d3a] last:border-0 flex items-center gap-2">
                    <SportBadge sport={r.sport} size="xs" />
                    <span>{r.name}</span>
                    {r.country && <span className="text-gray-500 text-xs ml-auto">{r.country}</span>}
                  </button>
                ))}
                <button onClick={() => { const manual = { id: `__manual__${homeQuery}`, sport: sportFilter as Sport, entityType: "manual", name: homeQuery, shortName: null, country: null }; setSelectedHome(manual); setHomeResults([]); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-blue-400 hover:bg-[#22263a] transition-colors flex items-center gap-2">
                  + Use &ldquo;{homeQuery}&rdquo;
                </button>
              </div>
            )}
            {selectedHome && (
              <div className="mt-1 flex items-center gap-2 text-xs text-blue-400">
                <span>✓ {selectedHome.name}</span>
                <button onClick={() => { setSelectedHome(null); setHomeQuery(""); }} className="text-gray-500 hover:text-white">✕ change</button>
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="relative">
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">
              <span className="text-gray-500 font-semibold">A</span> Away Team
            </label>
            <input
              type="text"
              value={awayQuery}
              onChange={(e) => { setAwayQuery(e.target.value); setSelectedAway(null); }}
              placeholder={`Search ${sportFilter} teams...`}
              className={inputCls}
            />
            {awaySearching && <p className="text-xs text-gray-500 mt-1">Searching...</p>}
            {awayQuery && !awaySearching && !selectedAway && (
              <div className="absolute z-10 w-full mt-1 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl overflow-hidden shadow-xl">
                {awayResults.filter(r => r.id !== selectedHome?.id).slice(0, 6).map(r => (
                  <button key={r.id} onClick={() => { setSelectedAway(r); setAwayQuery(r.name); setAwayResults([]); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-[#22263a] transition-colors border-b border-[#2a2d3a] last:border-0 flex items-center gap-2">
                    <SportBadge sport={r.sport} size="xs" />
                    <span>{r.name}</span>
                    {r.country && <span className="text-gray-500 text-xs ml-auto">{r.country}</span>}
                  </button>
                ))}
                <button onClick={() => { const manual = { id: `__manual__${awayQuery}`, sport: sportFilter as Sport, entityType: "manual", name: awayQuery, shortName: null, country: null }; setSelectedAway(manual); setAwayResults([]); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-blue-400 hover:bg-[#22263a] transition-colors flex items-center gap-2">
                  + Use &ldquo;{awayQuery}&rdquo;
                </button>
              </div>
            )}
            {selectedAway && (
              <div className="mt-1 flex items-center gap-2 text-xs text-blue-400">
                <span>✓ {selectedAway.name}</span>
                <button onClick={() => { setSelectedAway(null); setAwayQuery(""); }} className="text-gray-500 hover:text-white">✕ change</button>
              </div>
            )}
          </div>
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
              <div className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-xl p-5 space-y-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Game Details</p>

                {/* Score */}
                {sportFilter === "CRICKET" ? (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">
                      Score (optional){cricketFormat === "Test" ? " — 1st innings" : ""}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">{selectedHome?.shortName ?? selectedHome?.name ?? "Home"}</p>
                        <input type="text" value={myScore} onChange={e => setMyScore(e.target.value)}
                          placeholder={cricketFormat === "T20" ? "185/4 (20 ov)" : cricketFormat === "ODI" ? "287/6 (50 ov)" : "320/8 dec"}
                          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-2 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">{selectedAway?.shortName ?? selectedAway?.name ?? (awayQuery || "Away")}</p>
                        <input type="text" value={oppScore} onChange={e => setOppScore(e.target.value)}
                          placeholder={cricketFormat === "T20" ? "180/6 (20 ov)" : cricketFormat === "ODI" ? "245 (48.2 ov)" : "245"}
                          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-2 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                      </div>
                    </div>
                    {cricketFormat === "Test" && (
                      <div className="mt-2">
                        <label className="text-xs text-gray-400 block mb-1.5">2nd innings</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={myInn2} onChange={e => setMyInn2(e.target.value)}
                            placeholder="156/3 dec" className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-2 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                          <input type="text" value={oppInn2} onChange={e => setOppInn2(e.target.value)}
                            placeholder="98" className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-2 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                      </div>
                    )}
                    <div className="mt-2">
                      <label className="text-xs text-gray-400 block mb-1.5">Result (optional)</label>
                      <input type="text" value={cricketResult} onChange={e => setCricketResult(e.target.value)}
                        placeholder="e.g. India won by 45 runs"
                        className={inputCls} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Score (optional)</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 text-center">
                        <p className="text-xs text-gray-600 mb-1">{selectedHome?.shortName ?? selectedHome?.name ?? "Home"}</p>
                        <input type="text" inputMode="numeric" value={myScore} onChange={e => setMyScore(e.target.value)}
                          placeholder="–" className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-2 py-2 text-sm text-white text-center focus:border-blue-500 focus:outline-none" />
                      </div>
                      <span className="text-gray-500 text-lg mt-4">:</span>
                      <div className="flex-1 text-center">
                        <p className="text-xs text-gray-600 mb-1">{selectedAway?.shortName ?? selectedAway?.name ?? (awayQuery || "Away")}</p>
                        <input type="text" inputMode="numeric" value={oppScore} onChange={e => setOppScore(e.target.value)}
                          placeholder="–" className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-2 py-2 text-sm text-white text-center focus:border-blue-500 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Date + Competition */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Date *</label>
                    <input type="date" value={gameDate} onChange={e => setGameDate(e.target.value)} required className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Competition</label>
                    <select value={gameCompetitionId} onChange={e => { setGameCompetitionId(e.target.value); if (e.target.value !== "__custom__") setCustomCompetitionName(""); }}
                      className={inputCls}>
                      <option value="">Other / Unknown</option>
                      {competitions.map(c => <option key={c.id} value={c.id}>{c.shortName ?? c.name}</option>)}
                      <option value="__custom__">+ Type custom name...</option>
                    </select>
                    {gameCompetitionId === "__custom__" && (
                      <input type="text" value={customCompetitionName} onChange={e => setCustomCompetitionName(e.target.value)}
                        placeholder="e.g. IPL 2026" className={`${inputCls} mt-1.5`} />
                    )}
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
