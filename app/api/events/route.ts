export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Sport, EventStatus, ParticipantRole } from "@prisma/client";

// POST /api/events — create a manual event
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    name,
    sport,
    season,
    startTime,
    venue,
    city,
    country,
    notes,
    competitionId: providedCompetitionId,
    homeEntityId,
    awayEntityId,
    homeScore,
    awayScore,
  } = body;

  if (!name || !sport || !season) {
    return NextResponse.json(
      { error: "name, sport, and season are required" },
      { status: 400 }
    );
  }

  if (!Object.values(Sport).includes(sport)) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  // Use provided competitionId or fall back to auto-generated manual one
  let competitionId = providedCompetitionId ?? null;
  if (!competitionId) {
    competitionId = `${sport.toLowerCase()}-competition-manual-${season}`;
    await prisma.competition.upsert({
      where: { id: competitionId },
      update: {},
      create: {
        id: competitionId,
        sport: sport as Sport,
        name: `Manual Entries (${sport} ${season})`,
        shortName: "Manual",
        competitionType: "TOURNAMENT",
        season,
        isActive: true,
      },
    });
  }

  // Build participant names for search vector
  const participantNames: string[] = [];
  if (homeEntityId) {
    const e = await prisma.entity.findUnique({ where: { id: homeEntityId }, select: { name: true, shortName: true } });
    if (e) { participantNames.push(e.name); if (e.shortName) participantNames.push(e.shortName); }
  }
  if (awayEntityId) {
    const e = await prisma.entity.findUnique({ where: { id: awayEntityId }, select: { name: true, shortName: true } });
    if (e) { participantNames.push(e.name); if (e.shortName) participantNames.push(e.shortName); }
  }

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
      competitionId,
      name,
      season,
      startTime: startTime ? new Date(startTime) : null,
      venue: venue ?? null,
      city: city ?? null,
      country: country ?? null,
      status: EventStatus.COMPLETED,
      isManual: true,
      sportMeta: { participantNames, notes: notes ?? "" },
    },
    include: { competition: true },
  });

  // Create participant records
  if (homeEntityId) {
    await prisma.eventParticipant.create({
      data: {
        eventId: event.id,
        entityId: homeEntityId,
        role: ParticipantRole.HOME_TEAM,
        result: homeScore != null ? { score: homeScore } : undefined,
      },
    });
  }
  if (awayEntityId) {
    await prisma.eventParticipant.create({
      data: {
        eventId: event.id,
        entityId: awayEntityId,
        role: ParticipantRole.AWAY_TEAM,
        result: awayScore != null ? { score: awayScore } : undefined,
      },
    });
  }

  return NextResponse.json(event, { status: 201 });
}
