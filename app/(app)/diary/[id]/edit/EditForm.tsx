"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/StarRating";
import { SportBadge } from "@/components/SportBadge";
import { useToast } from "@/components/Toast";
import { Sport } from "@prisma/client";

interface Participant {
  id: string;
  role: string;
  result: { score?: number } | null;
  entity: { id: string; name: string; shortName: string | null };
}

interface Entry {
  id: string;
  rating: number;
  viewingMethod: "STREAM" | "IN_PERSON";
  notes: string | null;
  watchedAt: string;
  event: {
    id: string;
    name: string;
    sport: Sport;
    season: string;
    startTime: string | null;
    venue: string | null;
    isManual: boolean;
    competitionId: string;
    competition: { id: string; name: string; shortName: string | null };
    participants: Participant[];
  };
}

interface Competition {
  id: string;
  name: string;
  shortName: string | null;
  season: string;
}

const inputCls = "w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none";

export default function EditForm({ entry, competitions }: { entry: Entry; competitions: Competition[] }) {
  const router = useRouter();
  const { toast } = useToast();

  // Diary fields
  const [rating, setRating] = useState(entry.rating);
  const [viewingMethod, setViewingMethod] = useState(entry.viewingMethod);
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [watchedAt, setWatchedAt] = useState(new Date(entry.watchedAt).toISOString().split("T")[0]);

  // Event fields (only for manual events)
  const homeParticipant = entry.event.participants.find(p => p.role === "HOME_TEAM");
  const awayParticipant = entry.event.participants.find(p => p.role === "AWAY_TEAM");
  const [eventName, setEventName] = useState(entry.event.name);
  const [eventDate, setEventDate] = useState(entry.event.startTime ? new Date(entry.event.startTime).toISOString().split("T")[0] : "");
  const [venue, setVenue] = useState(entry.event.venue ?? "");
  const [season, setSeason] = useState(entry.event.season);
  const [competitionId, setCompetitionId] = useState(entry.event.competitionId);
  const [homeScore, setHomeScore] = useState(homeParticipant?.result?.score != null ? String(homeParticipant.result.score) : "");
  const [awayScore, setAwayScore] = useState(awayParticipant?.result?.score != null ? String(awayParticipant.result.score) : "");

  const [saving, setSaving] = useState(false);
  const isManual = entry.event.isManual;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Update event details if manual
      if (isManual) {
        const evRes = await fetch(`/api/events/${entry.event.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: eventName,
            startTime: eventDate || null,
            venue: venue || null,
            season,
            competitionId: competitionId || null,
            homeScore: homeScore !== "" ? Number(homeScore) : null,
            awayScore: awayScore !== "" ? Number(awayScore) : null,
          }),
        });
        if (!evRes.ok) throw new Error("Failed to update event");
      }

      // Update diary entry
      const res = await fetch(`/api/diary/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, viewingMethod, notes: notes || null, watchedAt }),
      });
      if (!res.ok) throw new Error("Failed to update entry");

      toast("Entry updated");
      router.push(`/diary/${entry.id}`);
    } catch {
      toast("Failed to update", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Event info (read-only for seeded, editable for manual) */}
      {isManual ? (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <SportBadge sport={entry.event.sport} />
            <p className="text-xs text-gray-500 uppercase tracking-wider">Game Details</p>
          </div>

          {/* Teams + score */}
          {(homeParticipant || awayParticipant) && (
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Score</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 mb-1">{homeParticipant?.entity.shortName ?? homeParticipant?.entity.name ?? "Home"}</p>
                  <input type="number" min="0" value={homeScore} onChange={e => setHomeScore(e.target.value)}
                    placeholder="–" className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-2 py-2 text-sm text-white text-center focus:border-blue-500 focus:outline-none" />
                </div>
                <span className="text-gray-500 text-lg font-bold">:</span>
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500 mb-1">{awayParticipant?.entity.shortName ?? awayParticipant?.entity.name ?? "Away"}</p>
                  <input type="number" min="0" value={awayScore} onChange={e => setAwayScore(e.target.value)}
                    placeholder="–" className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-2 py-2 text-sm text-white text-center focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Date</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Competition</label>
              <select value={competitionId} onChange={e => setCompetitionId(e.target.value)} className={inputCls}>
                <option value="">Other</option>
                {competitions.filter(c => !c.name.startsWith("Manual")).map(c => (
                  <option key={c.id} value={c.id}>{c.shortName ?? c.name} ({c.season})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Season</label>
              <input type="text" value={season} onChange={e => setSeason(e.target.value)} placeholder="e.g. 2025-26" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Venue</label>
              <input type="text" value={venue} onChange={e => setVenue(e.target.value)} placeholder="Stadium name" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Event name</label>
            <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} className={inputCls} />
          </div>
        </div>
      ) : (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <SportBadge sport={entry.event.sport} />
            <span className="text-xs text-gray-500">{entry.event.competition.name}</span>
          </div>
          <p className="text-white font-medium">{entry.event.name}</p>
        </div>
      )}

      {/* Diary fields */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-5 space-y-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Your Review</p>

        <div>
          <label className="text-xs text-gray-400 block mb-2">Rating</label>
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-2">How did you watch?</label>
          <div className="flex gap-2">
            {(["STREAM", "IN_PERSON"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setViewingMethod(m)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewingMethod === m ? "bg-blue-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                {m === "STREAM" ? "📺 Stream" : "🎟️ In Person"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-2">Date Watched</label>
          <input type="date" value={watchedAt} onChange={e => setWatchedAt(e.target.value)} required className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-2">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="How was it? Any thoughts..."
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none resize-none" />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-300 bg-white/10 hover:bg-white/20 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving || rating === 0}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
