import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditForm from "./EditForm";

export default async function EditEntryPage({
  params,
}: {
  params: { id: string };
}) {
  const entry = await prisma.diaryEntry.findUnique({
    where: { id: params.id },
    include: {
      event: {
        include: {
          competition: true,
          participants: { include: { entity: true } },
        },
      },
    },
  });

  if (!entry) notFound();

  // Load competitions for the same sport
  const competitions = await prisma.competition.findMany({
    where: { sport: entry.event.sport, isActive: true },
    orderBy: [{ season: "desc" }, { name: "asc" }],
    select: { id: true, name: true, shortName: true, season: true },
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-6">Edit Entry</h1>
      <EditForm
        entry={JSON.parse(JSON.stringify(entry))}
        competitions={JSON.parse(JSON.stringify(competitions))}
      />
    </div>
  );
}
