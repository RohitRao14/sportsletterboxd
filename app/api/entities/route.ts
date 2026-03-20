export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Sport, EntityType } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sport = searchParams.get("sport") as Sport | null;
  const entityType = searchParams.get("entityType") as EntityType | null;

  const where: { sport?: Sport; entityType?: EntityType } = {};
  if (sport && Object.values(Sport).includes(sport)) where.sport = sport;
  if (entityType && Object.values(EntityType).includes(entityType))
    where.entityType = entityType;

  const entities = await prisma.entity.findMany({
    where,
    orderBy: { name: "asc" },
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
