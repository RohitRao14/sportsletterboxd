export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Sport } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sport = searchParams.get("sport") as Sport | null;

  const where: { sport?: Sport } = {};
  if (sport && Object.values(Sport).includes(sport)) where.sport = sport;

  const competitions = await prisma.competition.findMany({
    where,
    orderBy: [{ sport: "asc" }, { season: "desc" }, { name: "asc" }],
    select: {
      id: true,
      sport: true,
      name: true,
      shortName: true,
      competitionType: true,
      season: true,
    },
  });

  return NextResponse.json(competitions);
}
