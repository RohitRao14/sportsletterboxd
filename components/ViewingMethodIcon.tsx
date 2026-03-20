import { ViewingMethod } from "@prisma/client";

export function ViewingMethodIcon({
  method,
  showLabel = false,
}: {
  method: ViewingMethod;
  showLabel?: boolean;
}) {
  const icon = method === "IN_PERSON" ? "🎟️" : "📺";
  const label = method === "IN_PERSON" ? "In Person" : "Stream";

  return (
    <span
      className="inline-flex items-center gap-1 text-gray-400 text-xs"
      title={label}
    >
      <span>{icon}</span>
      {showLabel && <span>{label}</span>}
    </span>
  );
}
