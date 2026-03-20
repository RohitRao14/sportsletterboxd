/**
 * Annual season refresh helper.
 * Usage: npx ts-node scripts/refresh-season.ts --sport=F1 --from=2026 --to=2027
 *
 * Reads existing season data and creates a next-season template.
 * You then fill in the actual calendar/fixtures and re-seed.
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const sport = args.find((a) => a.startsWith("--sport="))?.split("=")[1];
const fromSeason = args.find((a) => a.startsWith("--from="))?.split("=")[1];
const toSeason = args.find((a) => a.startsWith("--to="))?.split("=")[1];

if (!sport || !fromSeason || !toSeason) {
  console.error("Usage: npx ts-node scripts/refresh-season.ts --sport=F1 --from=2026 --to=2027");
  process.exit(1);
}

const dataDir = path.join(__dirname, "../seed/data", sport.toLowerCase());

function transformId(id: string, from: string, to: string): string {
  return id.replace(new RegExp(from.replace(/\./g, "\\."), "g"), to);
}

// Refresh competitions
const compFile = path.join(dataDir, "competitions.json");
if (fs.existsSync(compFile)) {
  const comps = JSON.parse(fs.readFileSync(compFile, "utf8"));
  const next = comps
    .filter((c: { season: string }) => c.season === fromSeason)
    .map((c: { id: string; season: string; name: string; isActive: boolean }) => ({
      ...c,
      id: transformId(c.id, fromSeason, toSeason),
      season: toSeason,
      name: c.name.replace(fromSeason, toSeason),
      isActive: true,
    }));

  const outFile = path.join(dataDir, `competitions.${toSeason}.template.json`);
  fs.writeFileSync(outFile, JSON.stringify(next, null, 2));
  console.log(`Wrote ${next.length} competition templates to ${outFile}`);
}

// Refresh events (as templates — clear dates)
const eventsFile = path.join(dataDir, "events.json");
if (fs.existsSync(eventsFile)) {
  const events = JSON.parse(fs.readFileSync(eventsFile, "utf8"));
  const next = events
    .filter((e: { season: string }) => e.season === fromSeason)
    .map((e: { id: string; season: string; competitionId: string; name: string; startTime: string | null; status: string }) => ({
      ...e,
      id: transformId(e.id, fromSeason, toSeason),
      season: toSeason,
      competitionId: transformId(e.competitionId, fromSeason, toSeason),
      name: e.name.replace(fromSeason, toSeason),
      startTime: null, // Clear — fill in actual dates
      status: "SCHEDULED",
    }));

  const outFile = path.join(dataDir, `events.${toSeason}.template.json`);
  fs.writeFileSync(outFile, JSON.stringify(next, null, 2));
  console.log(`Wrote ${next.length} event templates to ${outFile}`);
  console.log("TODO: Fill in startTime dates, then rename to events.json and re-seed.");
}

console.log("Done.");
