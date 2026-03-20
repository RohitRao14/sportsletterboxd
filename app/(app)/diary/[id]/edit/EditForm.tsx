"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/StarRating";
import { useToast } from "@/components/Toast";

interface Entry {
  id: string;
  rating: number;
  viewingMethod: "STREAM" | "IN_PERSON";
  notes: string | null;
  watchedAt: string;
  event: {
    name: string;
    competition: { name: string };
  };
}

export default function EditForm({ entry }: { entry: Entry }) {
  const router = useRouter();
  const { toast } = useToast();
  const [rating, setRating] = useState(entry.rating);
  const [viewingMethod, setViewingMethod] = useState(entry.viewingMethod);
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [watchedAt, setWatchedAt] = useState(
    new Date(entry.watchedAt).toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/diary/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, viewingMethod, notes: notes || null, watchedAt }),
      });
      if (res.ok) {
        toast("Entry updated");
        router.push(`/diary/${entry.id}`);
      } else {
        toast("Failed to update", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 space-y-5">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Event</p>
        <p className="text-white font-medium">{entry.event.name}</p>
        <p className="text-gray-400 text-sm">{entry.event.competition.name}</p>
      </div>

      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Rating</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">How did you watch?</label>
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
        <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Date Watched</label>
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
          placeholder="How was it? Any thoughts..."
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-300 bg-white/10 hover:bg-white/20 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || rating === 0}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
