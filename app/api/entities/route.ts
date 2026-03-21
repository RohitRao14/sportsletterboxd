export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Sport, EntityType } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sport = searchParams.get("sport") as Sport | null;
  const entityType = searchParams.get("entityType") as EntityType | null;
  const q = searchParams.get("q")?.trim() ?? "";

  const where: {
    sport?: Sport;
    entityType?: EntityType;
    name?: { contains: string; mode: "insensitive" };
  } = {};
  if (sport && Object.values(Sport).includes(sport)) where.sport = sport;
  if (entityType && Object.values(EntityType).includes(entityType))
    where.entityType = entityType;
  if (q) where.name = { contains: q, mode: "insensitive" };

  const entities = await prisma.entity.findMany({
    where,
    orderBy: { name: "asc" },
    take: q ? 15 : undefined,
    select: {
      id: true,
      sport: true,
      entityType: true,
      name: true,
      shortName: true,
      country: true,
    },
  });

  return NextResponse.json(entities);
}
