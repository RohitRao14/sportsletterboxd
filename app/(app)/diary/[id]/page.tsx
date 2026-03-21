import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SportBadge } from "@/components/SportBadge";
import { StarRating } from "@/components/StarRating";
import { ViewingMethodIcon } from "@/components/ViewingMethodIcon";
import DeleteButton from "./DeleteButton";

export default async function DiaryEntryPage({
  params,
}: {
  params: { id: string };
}) {
  const entry = await prisma.diaryEntry.findUnique({
    where: { id: params.id },
    include: {
      event: {
        include: {
          competition: true,
          participants: { include: { entity: true } },
        },
      },
    },
  });

  if (!entry) notFound();

  const { event } = entry;

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link
        href="/diary"
        className="text-sm text-gray-400 hover:text-white transition-colors mb-6 inline-flex items-center gap-1"
      >
        ← Back to diary
      </Link>

      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-6 mt-4">
        {/* Sport + competition */}
        <div className="flex items-center gap-2 mb-3">
          <SportBadge sport={entry.sport} />
          <span className="text-sm text-gray-400">
            {event.competition.name}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">{event.name}</h1>

        {/* Participants */}
        {event.participants.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.participants.map((p) => {
              const isHome = p.role === "HOME_TEAM";
              const isAway = p.role === "AWAY_TEAM";
              const score = (p.result as { score?: number } | null)?.score;
              return (
                <span key={p.entityId} className="inline-flex items-center gap-1.5 text-sm text-white bg-white/5 px-3 py-1 rounded-lg">
                  {isHome && <span className="text-xs text-blue-400 font-medium">H</span>}
                  {isAway && <span className="text-xs text-gray-500 font-medium">A</span>}
                  <span>{p.entity.name}</span>
                  {score != null && <span className="text-gray-400 font-bold">{score}</span>}
                </span>
              );
            })}
          </div>
        )}

        {/* Event metadata */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-6">
          {event.startTime && (
            <div>
              <span className="text-gray-500 text-xs uppercase tracking-wider">Date</span>
              <p className="text-white mt-0.5">
                {new Date(event.startTime).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
          {event.venue && (
            <div>
              <span className="text-gray-500 text-xs uppercase tracking-wider">Venue</span>
              <p className="text-white mt-0.5">
                {event.venue}
                {event.city ? `, ${event.city}` : ""}
              </p>
            </div>
          )}
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wider">Season</span>
            <p className="text-white mt-0.5">{event.season}</p>
          </div>
        </div>

        <hr className="border-[#2a2d3a] mb-6" />

        {/* My entry */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">My Log</h2>
            <div className="flex gap-2">
              <Link
                href={`/diary/${entry.id}/edit`}
                className="px-3 py-1.5 rounded-lg text-sm bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
              >
                Edit
              </Link>
              <DeleteButton id={entry.id} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StarRating value={entry.rating} readonly size="lg" />
            <ViewingMethodIcon method={entry.viewingMethod} showLabel />
          </div>

          <div className="text-sm text-gray-400">
            Watched:{" "}
            <span className="text-white">
              {new Date(entry.watchedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="text-sm text-gray-400">
            Logged:{" "}
            <span className="text-white">
              {new Date(entry.loggedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          {entry.notes && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Notes</p>
              <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                {entry.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
