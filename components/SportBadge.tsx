"use client";

import { Sport } from "@prisma/client";

const SPORT_COLORS: Record<Sport, { bg: string; text: string; label: string }> = {
  F1: { bg: "bg-red-900/60", text: "text-red-300", label: "F1" },
  FOOTBALL: { bg: "bg-green-900/60", text: "text-green-300", label: "Football" },
  NFL: { bg: "bg-blue-900/60", text: "text-blue-300", label: "NFL" },
  CRICKET: { bg: "bg-yellow-900/60", text: "text-yellow-300", label: "Cricket" },
  NBA: { bg: "bg-orange-900/60", text: "text-orange-300", label: "NBA" },
};

export function SportBadge({ sport, size = "sm" }: { sport: Sport; size?: "xs" | "sm" }) {
  const { bg, text, label } = SPORT_COLORS[sport];
  const sizeClass = size === "xs" ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span className={`inline-flex items-center rounded font-semibold tracking-wide ${bg} ${text} ${sizeClass}`}>
      {label}
    </span>
  );
}
