export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Sport } from "@prisma/client";

export async function GET() {
  const [total, bySport, avgRating, topRated, recentEntries, viewingMethodBreakdown] =
    await Promise.all([
      // Total entries
      prisma.diaryEntry.count(),

      // Count by sport
      prisma.diaryEntry.groupBy({
        by: ["sport"],
        _count: { id: true },
        _avg: { rating: true },
      }),

      // Overall average rating
      prisma.diaryEntry.aggregate({
        _avg: { rating: true },
      }),

      // Top rated entries (5 stars)
      prisma.diaryEntry.findMany({
        where: { rating: 5 },
        orderBy: { watchedAt: "desc" },
        take: 10,
        include: {
          event: {
            select: {
              name: true,
              sport: true,
              season: true,
              startTime: true,
            },
          },
        },
      }),

      // Recent entries
      prisma.diaryEntry.findMany({
        orderBy: { loggedAt: "desc" },
        take: 5,
        include: {
          event: {
            select: { name: true, sport: true, season: true },
          },
        },
      }),

      // Stream vs in-person breakdown
      prisma.diaryEntry.groupBy({
        by: ["viewingMethod"],
        _count: { id: true },
      }),
    ]);

  // Build sport stats map
  const sportStats: Record<
    string,
    { count: number; avgRating: number | null }
  > = {};
  for (const s of Object.values(Sport)) {
    sportStats[s] = { count: 0, avgRating: null };
  }
  for (const row of bySport) {
    sportStats[row.sport] = {
      count: row._count.id,
      avgRating: row._avg.rating,
    };
  }

  return NextResponse.json({
    total,
    avgRating: avgRating._avg.rating,
    bySport: sportStats,
    topRated,
    recentEntries,
    viewingMethodBreakdown: Object.fromEntries(
      viewingMethodBreakdown.map((r) => [r.viewingMethod, r._count.id])
    ),
  });
}
