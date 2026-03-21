export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { name, startTime, venue, season, competitionId, homeScore, awayScore } = body;

  try {
    // Update scores on participants if provided
    if (homeScore !== undefined || awayScore !== undefined) {
      const participants = await prisma.eventParticipant.findMany({ where: { eventId: params.id } });
      for (const p of participants) {
        if ((p.role === "HOME_TEAM") && homeScore !== null && homeScore !== undefined) {
          await prisma.eventParticipant.update({ where: { id: p.id }, data: { result: { score: homeScore } } });
        }
        if ((p.role === "AWAY_TEAM") && awayScore !== null && awayScore !== undefined) {
          await prisma.eventParticipant.update({ where: { id: p.id }, data: { result: { score: awayScore } } });
        }
      }
    }

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
        ...(venue !== undefined && { venue: venue || null }),
        ...(season && { season }),
        ...(competitionId && { competitionId }),
      },
      include: { competition: true, participants: { include: { entity: true } } },
    });

    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      competition: true,
      participants: {
        include: { entity: true },
      },
      diaryEntry: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}
