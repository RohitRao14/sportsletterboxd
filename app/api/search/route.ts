export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Sport } from "@prisma/client";

type EventRow = {
  id: string;
  sport: Sport;
  name: string;
  short_name: string | null;
  start_time: Date | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  season: string;
  competition_id: string;
  sport_meta: unknown;
  status: string;
  is_manual: boolean;
  rank: number;
  already_logged: boolean;
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const sportParam = searchParams.get("sport");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  if (!q) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const sport =
    sportParam && Object.values(Sport).includes(sportParam as Sport)
      ? (sportParam as Sport)
      : null;

  // Build tsquery with prefix matching — sanitize each token
  const tokens = q
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);

  if (tokens.length === 0) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const tsQuery = tokens.map((t) => `${t}:*`).join(" & ");

  try {
    // Use raw SQL for FTS — Prisma doesn't have a tsvector query builder
    let ftsResults: EventRow[] = [];
    let trigramResults: EventRow[] = [];

    if (sport) {
      ftsResults = await prisma.$queryRaw<EventRow[]>`
        SELECT
          e.id, e.sport, e.name, e.short_name, e.start_time,
          e.venue, e.city, e.country, e.season, e.competition_id,
          e.sport_meta, e.status, e.is_manual,
          ts_rank(e.search_vector, to_tsquery('english', unaccent(${tsQuery}))) AS rank,
          EXISTS(SELECT 1 FROM diary_entries d WHERE d.event_id = e.id) AS already_logged
        FROM events e
        WHERE e.search_vector @@ to_tsquery('english', unaccent(${tsQuery}))
          AND e.sport = ${sport}::"Sport"
        ORDER BY rank DESC, e.start_time DESC NULLS LAST
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      ftsResults = await prisma.$queryRaw<EventRow[]>`
        SELECT
          e.id, e.sport, e.name, e.short_name, e.start_time,
          e.venue, e.city, e.country, e.season, e.competition_id,
          e.sport_meta, e.status, e.is_manual,
          ts_rank(e.search_vector, to_tsquery('english', unaccent(${tsQuery}))) AS rank,
          EXISTS(SELECT 1 FROM diary_entries d WHERE d.event_id = e.id) AS already_logged
        FROM events e
        WHERE e.search_vector @@ to_tsquery('english', unaccent(${tsQuery}))
        ORDER BY rank DESC, e.start_time DESC NULLS LAST
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Trigram fallback when FTS returns few results
    if (ftsResults.length < 5) {
      const seenIds = ftsResults.map((r) => r.id);
      const remaining = limit - ftsResults.length;

      if (sport) {
        if (seenIds.length > 0) {
          trigramResults = await prisma.$queryRaw<EventRow[]>`
            SELECT
              e.id, e.sport, e.name, e.short_name, e.start_time,
              e.venue, e.city, e.country, e.season, e.competition_id,
              e.sport_meta, e.status, e.is_manual,
              similarity(e.name, ${q}) AS rank,
              EXISTS(SELECT 1 FROM diary_entries d WHERE d.event_id = e.id) AS already_logged
            FROM events e
            WHERE e.name % ${q}
              AND e.sport = ${sport}::"Sport"
              AND e.id != ALL(${seenIds}::text[])
            ORDER BY rank DESC, e.start_time DESC NULLS LAST
            LIMIT ${remaining}
          `;
        } else {
          trigramResults = await prisma.$queryRaw<EventRow[]>`
            SELECT
              e.id, e.sport, e.name, e.short_name, e.start_time,
              e.venue, e.city, e.country, e.season, e.competition_id,
              e.sport_meta, e.status, e.is_manual,
              similarity(e.name, ${q}) AS rank,
              EXISTS(SELECT 1 FROM diary_entries d WHERE d.event_id = e.id) AS already_logged
            FROM events e
            WHERE e.name % ${q}
              AND e.sport = ${sport}::"Sport"
            ORDER BY rank DESC, e.start_time DESC NULLS LAST
            LIMIT ${remaining}
          `;
        }
      } else {
        if (seenIds.length > 0) {
          trigramResults = await prisma.$queryRaw<EventRow[]>`
            SELECT
              e.id, e.sport, e.name, e.short_name, e.start_time,
              e.venue, e.city, e.country, e.season, e.competition_id,
              e.sport_meta, e.status, e.is_manual,
              similarity(e.name, ${q}) AS rank,
              EXISTS(SELECT 1 FROM diary_entries d WHERE d.event_id = e.id) AS already_logged
            FROM events e
            WHERE e.name % ${q}
              AND e.id != ALL(${seenIds}::text[])
            ORDER BY rank DESC, e.start_time DESC NULLS LAST
            LIMIT ${remaining}
          `;
        } else {
          trigramResults = await prisma.$queryRaw<EventRow[]>`
            SELECT
              e.id, e.sport, e.name, e.short_name, e.start_time,
              e.venue, e.city, e.country, e.season, e.competition_id,
              e.sport_meta, e.status, e.is_manual,
              similarity(e.name, ${q}) AS rank,
              EXISTS(SELECT 1 FROM diary_entries d WHERE d.event_id = e.id) AS already_logged
            FROM events e
            WHERE e.name % ${q}
            ORDER BY rank DESC, e.start_time DESC NULLS LAST
            LIMIT ${remaining}
          `;
        }
      }
    }

    const results = [...ftsResults, ...trigramResults];
    return NextResponse.json({ results, total: results.length });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
