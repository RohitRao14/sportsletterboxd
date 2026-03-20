export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Sport, EventStatus } from "@prisma/client";

// POST /api/events — create a manual event
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, sport, season, startTime, venue, city, country, notes } = body;

  if (!name || !sport || !season) {
    return NextResponse.json(
      { error: "name, sport, and season are required" },
      { status: 400 }
    );
  }

  if (!Object.values(Sport).includes(sport)) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  // Ensure a "manual" competition exists for this sport+season
  const manualCompetitionId = `${sport.toLowerCase()}-competition-manual-${season}`;
  await prisma.competition.upsert({
    where: { id: manualCompetitionId },
    update: {},
    create: {
      id: manualCompetitionId,
      sport: sport as Sport,
      name: `Manual Entries (${sport} ${season})`,
      shortName: "Manual",
      competitionType: "TOURNAMENT",
      season,
      isActive: true,
    },
  });

  // Generate a stable ID from the name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  const id = `${sport.toLowerCase()}-manual-${season}-${slug}-${Date.now()}`;

  const event = await prisma.event.create({
    data: {
      id,
      sport: sport as Sport,
      competitionId: manualCompetitionId,
      name,
      season,
      startTime: startTime ? new Date(startTime) : null,
      venue: venue ?? null,
      city: city ?? null,
      country: country ?? null,
      status: EventStatus.COMPLETED,
      isManual: true,
      sportMeta: { participantNames: [], notes: notes ?? "" },
    },
    include: {
      competition: true,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
