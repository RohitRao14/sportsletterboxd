export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function makeEntityId(sport: string, type: string, name: string): string {
  return `${sport.toLowerCase()}-${type.toLowerCase()}-${slugify(name)}`;
}

export function makeCompetitionId(sport: string, name: string, season: string): string {
  return `${sport.toLowerCase()}-competition-${slugify(name)}-${slugify(season)}`;
}

export function makeEventId(sport: string, season: string, descriptor: string): string {
  return `${sport.toLowerCase()}-${slugify(season)}-${slugify(descriptor)}`;
}
