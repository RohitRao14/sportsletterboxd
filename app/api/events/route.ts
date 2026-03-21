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
    customCompetitionName,
    homeEntityId,
    awayEntityId,
    // T20/ODI
    homeScoreText,
    awayScoreText,
    // Test innings
    homeInn1,
    homeInn2,
    awayInn1,
    awayInn2,
    // Cricket meta
    cricketFormat,
    cricketResult,
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

  // Resolve competition
  let competitionId = providedCompetitionId ?? null;
  if (!competitionId && customCompetitionName) {
    // Create/upsert a named custom competition
    const slug = customCompetitionName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40);
    competitionId = `${sport.toLowerCase()}-competition-custom-${slug}-${season}`;
    await prisma.competition.upsert({
      where: { id: competitionId },
      update: {},
      create: {
        id: competitionId,
        sport: sport as Sport,
        name: customCompetitionName,
        shortName: customCompetitionName.slice(0, 20),
        competitionType: "TOURNAMENT",
        season,
        isActive: true,
      },
    });
  } else if (!competitionId) {
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

  const slug = name.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").slice(0, 60);
  const id = `${sport.toLowerCase()}-manual-${season}-${slug}-${Date.now()}`;

  const sportMeta: Record<string, string | string[]> = { participantNames, notes: notes ?? "" };
  if (cricketFormat) sportMeta.format = cricketFormat;
  if (cricketResult) sportMeta.cricketResult = cricketResult;

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
      sportMeta,
    },
    include: { competition: true },
  });

  // Build participant results
  const buildResult = (scoreText: string | null, inn1: string | null, inn2: string | null) => {
    if (cricketFormat === "Test") {
      const r: Record<string, string> = {};
      if (inn1) r.inn1 = inn1;
      if (inn2) r.inn2 = inn2;
      return Object.keys(r).length ? r : undefined;
    }
    return scoreText ? { scoreText } : undefined;
  };

  if (homeEntityId) {
    const result = buildResult(homeScoreText, homeInn1, homeInn2);
    await prisma.eventParticipant.create({
      data: { eventId: event.id, entityId: homeEntityId, role: ParticipantRole.HOME_TEAM, result },
    });
  }
  if (awayEntityId) {
    const result = buildResult(awayScoreText, awayInn1, awayInn2);
    await prisma.eventParticipant.create({
      data: { eventId: event.id, entityId: awayEntityId, role: ParticipantRole.AWAY_TEAM, result },
    });
  }

  return NextResponse.json(event, { status: 201 });
}
