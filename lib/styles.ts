// Shared color mappings. Full class strings so Tailwind can see them when scanning.

import type { ClassColor } from "@/lib/data";

/** Soft tile/chip colors for each class. */
export const classColorTile: Record<ClassColor, string> = {
  violet: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-800",
  sky: "bg-sky-100 text-sky-700",
  rose: "bg-rose-100 text-rose-700",
  emerald: "bg-emerald-100 text-emerald-700",
  indigo: "bg-indigo-100 text-indigo-700",
};

/** Status-style pill: soft background with a hairline ring. */
export const tone = {
  positive: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15",
  info: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/15",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20",
  neutral: "bg-muted text-muted-foreground ring-1 ring-border",
} as const;

const avatarPalette = [
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-emerald-100 text-emerald-700",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
];

/** Stable avatar color per id. */
export function avatarColor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}

/** Very soft surface for event chips/cards in a class's color (calendar). */
export const classColorSoft: Record<ClassColor, string> = {
  violet: "bg-violet-50 text-violet-950 ring-violet-200/70",
  amber: "bg-amber-50 text-amber-950 ring-amber-200/70",
  sky: "bg-sky-50 text-sky-950 ring-sky-200/70",
  rose: "bg-rose-50 text-rose-950 ring-rose-200/70",
  emerald: "bg-emerald-50 text-emerald-950 ring-emerald-200/70",
  indigo: "bg-indigo-50 text-indigo-950 ring-indigo-200/70",
};
