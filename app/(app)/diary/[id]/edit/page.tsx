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
    include: { event: { include: { competition: true } } },
  });

  if (!entry) notFound();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-6">Edit Entry</h1>
      <EditForm entry={JSON.parse(JSON.stringify(entry))} />
    </div>
  );
}
