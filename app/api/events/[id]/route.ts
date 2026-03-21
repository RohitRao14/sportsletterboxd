export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { name, startTime, venue, season, competitionId, homeScoreText, awayScoreText, homeInn1, homeInn2, awayInn1, awayInn2, cricketFormat, cricketResult } = body;

  try {
    // Update scores on participants if provided
    const isTest = cricketFormat === "Test";
    const hasScoreUpdate = homeScoreText !== undefined || awayScoreText !== undefined || homeInn1 !== undefined || homeInn2 !== undefined || awayInn1 !== undefined || awayInn2 !== undefined;
    if (hasScoreUpdate) {
      const participants = await prisma.eventParticipant.findMany({ where: { eventId: params.id } });
      for (const p of participants) {
        if (p.role === "HOME_TEAM") {
          const result = isTest
            ? { ...(homeInn1 ? { inn1: homeInn1 } : {}), ...(homeInn2 ? { inn2: homeInn2 } : {}) }
            : homeScoreText ? { scoreText: homeScoreText } : {};
          await prisma.eventParticipant.update({ where: { id: p.id }, data: { result } });
        }
        if (p.role === "AWAY_TEAM") {
          const result = isTest
            ? { ...(awayInn1 ? { inn1: awayInn1 } : {}), ...(awayInn2 ? { inn2: awayInn2 } : {}) }
            : awayScoreText ? { scoreText: awayScoreText } : {};
          await prisma.eventParticipant.update({ where: { id: p.id }, data: { result } });
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
        ...(cricketFormat !== undefined || cricketResult !== undefined ? {
          sportMeta: {
            ...(cricketFormat && { format: cricketFormat }),
            ...(cricketResult !== undefined && { cricketResult }),
          }
        } : {}),
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
