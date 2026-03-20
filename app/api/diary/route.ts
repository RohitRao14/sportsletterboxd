export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Sport, ViewingMethod, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const sport = searchParams.get("sport") as Sport | null;
  const entityId = searchParams.get("entityId");
  const ratingMin = searchParams.get("ratingMin")
    ? parseInt(searchParams.get("ratingMin")!)
    : null;
  const ratingMax = searchParams.get("ratingMax")
    ? parseInt(searchParams.get("ratingMax")!)
    : null;
  const viewingMethod = searchParams.get("viewingMethod") as ViewingMethod | null;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const season = searchParams.get("season");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20"))
  );
  const sortBy = searchParams.get("sortBy") ?? "watchedAt";
  const sortDir = (searchParams.get("sortDir") ?? "desc") as "asc" | "desc";

  const where: Prisma.DiaryEntryWhereInput = {};

  if (sport && Object.values(Sport).includes(sport)) {
    where.sport = sport;
  }
  if (ratingMin !== null || ratingMax !== null) {
    where.rating = {};
    if (ratingMin !== null) where.rating.gte = ratingMin;
    if (ratingMax !== null) where.rating.lte = ratingMax;
  }
  if (
    viewingMethod &&
    Object.values(ViewingMethod).includes(viewingMethod)
  ) {
    where.viewingMethod = viewingMethod;
  }
  if (dateFrom || dateTo) {
    where.watchedAt = {};
    if (dateFrom) where.watchedAt.gte = new Date(dateFrom);
    if (dateTo) where.watchedAt.lte = new Date(dateTo);
  }
  if (season) {
    where.season = season;
  }
  if (entityId) {
    where.event = {
      participants: {
        some: { entityId },
      },
    };
  }

  const allowedSortFields: Record<string, Prisma.DiaryEntryOrderByWithRelationInput> = {
    watchedAt: { watchedAt: sortDir },
    loggedAt: { loggedAt: sortDir },
    rating: { rating: sortDir },
    eventName: { event: { name: sortDir } },
    startTime: { event: { startTime: sortDir } },
  };

  const orderBy = allowedSortFields[sortBy] ?? { watchedAt: sortDir };

  const [total, entries] = await Promise.all([
    prisma.diaryEntry.count({ where }),
    prisma.diaryEntry.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        event: {
          include: {
            competition: true,
            participants: {
              include: { entity: true },
            },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    entries,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { eventId, rating, viewingMethod, notes, watchedAt } = body;

  if (!eventId || !rating || !viewingMethod || !watchedAt) {
    return NextResponse.json(
      { error: "eventId, rating, viewingMethod, and watchedAt are required" },
      { status: 400 }
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  if (!Object.values(ViewingMethod).includes(viewingMethod)) {
    return NextResponse.json(
      { error: "Invalid viewingMethod" },
      { status: 400 }
    );
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const existing = await prisma.diaryEntry.findUnique({
    where: { eventId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Entry already exists for this event" },
      { status: 409 }
    );
  }

  const entry = await prisma.diaryEntry.create({
    data: {
      eventId,
      rating,
      viewingMethod,
      notes: notes ?? null,
      watchedAt: new Date(watchedAt),
      sport: event.sport,
      season: event.season,
    },
    include: {
      event: {
        include: {
          competition: true,
          participants: { include: { entity: true } },
        },
      },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
