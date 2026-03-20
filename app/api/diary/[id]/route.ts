export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ViewingMethod } from "@prisma/client";

const include = {
  event: {
    include: {
      competition: true,
      participants: { include: { entity: true } },
    },
  },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const entry = await prisma.diaryEntry.findUnique({
    where: { id: params.id },
    include,
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { rating, viewingMethod, notes, watchedAt } = body;

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  if (
    viewingMethod !== undefined &&
    !Object.values(ViewingMethod).includes(viewingMethod)
  ) {
    return NextResponse.json(
      { error: "Invalid viewingMethod" },
      { status: 400 }
    );
  }

  try {
    const entry = await prisma.diaryEntry.update({
      where: { id: params.id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(viewingMethod !== undefined && { viewingMethod }),
        ...(notes !== undefined && { notes }),
        ...(watchedAt !== undefined && { watchedAt: new Date(watchedAt) }),
      },
      include,
    });

    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.diaryEntry.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
}
