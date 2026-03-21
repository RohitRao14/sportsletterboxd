import "dotenv/config";
import { PrismaClient, Prisma, Sport, EntityType, CompetitionType, EventStatus, ParticipantRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";

const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_URL ?? process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function loadJson<T>(filePath: string): T {
  const fullPath = path.join(__dirname, "data", filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Skipping missing file: ${fullPath}`);
    return [] as unknown as T;
  }
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

interface CircuitRecord {
  id: string;
  name: string;
  city?: string;
  country: string;
  lapLength?: number;
}

interface EntityRecord {
  id: string;
  sport: string;
  entityType: string;
  name: string;
  shortName?: string;
  country?: string;
  isActive?: boolean;
  metadata?: Prisma.InputJsonValue;
}

interface CompetitionRecord {
  id: string;
  sport: string;
  name: string;
  shortName?: string;
  competitionType: string;
  season: string;
  isActive?: boolean;
  metadata?: Prisma.InputJsonValue;
}

interface ParticipantRecord {
  entityId: string;
  role: string;
  result?: Prisma.InputJsonValue;
}

interface EventRecord {
  id: string;
  sport: string;
  competitionId: string;
  name: string;
  shortName?: string;
  startTime?: string;
  venue?: string;
  city?: string;
  country?: string;
  season: string;
  sportMeta?: Prisma.InputJsonValue;
  status?: string;
  isManual?: boolean;
  participants?: ParticipantRecord[];
}

async function seedCircuits() {
  const circuits = loadJson<CircuitRecord[]>("circuits.json");
  console.log(`Seeding ${circuits.length} circuits...`);
  for (const c of circuits) {
    await prisma.circuit.upsert({
      where: { id: c.id },
      update: { name: c.name, city: c.city, country: c.country, lapLength: c.lapLength },
      create: c,
    });
  }
}

async function seedEntities(file: string) {
  const entities = loadJson<EntityRecord[]>(file);
  console.log(`Seeding ${entities.length} entities from ${file}...`);
  for (const e of entities) {
    await prisma.entity.upsert({
      where: { id: e.id },
      update: {
        name: e.name,
        shortName: e.shortName,
        country: e.country,
        isActive: e.isActive ?? true,
        metadata: e.metadata,
      },
      create: {
        id: e.id,
        sport: e.sport as Sport,
        entityType: e.entityType as EntityType,
        name: e.name,
        shortName: e.shortName,
        country: e.country,
        isActive: e.isActive ?? true,
        metadata: e.metadata,
      },
    });
  }
}

async function seedCompetitions(file: string) {
  const competitions = loadJson<CompetitionRecord[]>(file);
  console.log(`Seeding ${competitions.length} competitions from ${file}...`);
  for (const c of competitions) {
    await prisma.competition.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        shortName: c.shortName,
        isActive: c.isActive ?? true,
        metadata: c.metadata,
      },
      create: {
        id: c.id,
        sport: c.sport as Sport,
        name: c.name,
        shortName: c.shortName,
        competitionType: c.competitionType as CompetitionType,
        season: c.season,
        isActive: c.isActive ?? true,
        metadata: c.metadata,
      },
    });
  }
}

async function seedEvents(file: string) {
  const events = loadJson<EventRecord[]>(file);
  console.log(`Seeding ${events.length} events from ${file}...`);
  for (const e of events) {
    const { participants, ...eventData } = e;

    await prisma.event.upsert({
      where: { id: e.id },
      update: {
        name: e.name,
        shortName: e.shortName,
        startTime: e.startTime ? new Date(e.startTime) : null,
        venue: e.venue,
        city: e.city,
        country: e.country,
        sportMeta: e.sportMeta,
        status: (e.status ?? "SCHEDULED") as EventStatus,
      },
      create: {
        id: eventData.id,
        sport: eventData.sport as Sport,
        competitionId: eventData.competitionId,
        name: eventData.name,
        shortName: eventData.shortName,
        startTime: eventData.startTime ? new Date(eventData.startTime) : null,
        venue: eventData.venue,
        city: eventData.city,
        country: eventData.country,
        season: eventData.season,
        sportMeta: eventData.sportMeta,
        status: (eventData.status ?? "SCHEDULED") as EventStatus,
        isManual: eventData.isManual ?? false,
      },
    });

    // Upsert participants
    if (participants && participants.length > 0) {
      for (const p of participants) {
        const entityExists = await prisma.entity.findUnique({
          where: { id: p.entityId },
          select: { id: true },
        });
        if (!entityExists) {
          console.warn(`  Skipping participant ${p.entityId} (entity not found) for event ${e.id}`);
          continue;
        }
        await prisma.eventParticipant.upsert({
          where: {
            eventId_entityId_role: {
              eventId: e.id,
              entityId: p.entityId,
              role: p.role as ParticipantRole,
            },
          },
          update: { result: p.result },
          create: {
            eventId: e.id,
            entityId: p.entityId,
            role: p.role as ParticipantRole,
            result: p.result,
          },
        });
      }
    }
  }
}

async function main() {
  console.log("Starting seed...");

  await seedCircuits();

  await seedEntities("f1/entities.json");
  await seedEntities("football/entities.json");
  await seedEntities("cricket/entities.json");
  await seedEntities("nfl/entities.json");
  await seedEntities("nba/entities.json");

  await seedCompetitions("f1/competitions.json");
  await seedCompetitions("football/competitions.json");
  await seedCompetitions("cricket/competitions.json");
  await seedCompetitions("nfl/competitions.json");
  await seedCompetitions("nba/competitions.json");

  await seedEvents("f1/events.json");
  await seedEvents("football/events.json");
  await seedEvents("cricket/events.json");
  await seedEvents("nfl/events.json");
  await seedEvents("nba/events.json");

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
