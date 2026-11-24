// Small formatting helpers that are safe to use in client components
// (no data imports, so they don't pull the JSON into the browser bundle).

import type { AssignmentType } from "@/lib/data";

/** "in 2 days" / "tomorrow" / "today" / "yesterday" / "3 days ago" */
export function relativeDue(daysLeft: number) {
  if (daysLeft === 0) return "today";
  if (daysLeft === 1) return "tomorrow";
  if (daysLeft === -1) return "yesterday";
  return daysLeft > 0 ? `in ${daysLeft} days` : `${-daysLeft} days ago`;
}

export const assignmentTypeLabel: Record<AssignmentType, string> = {
  homework: "Homework",
  quiz: "Quiz",
  essay: "Essay",
  lab: "Lab",
  project: "Project",
  exam: "Exam",
};

// ---------- message timestamps ("YYYY-MM-DDTHH:mm", local school time) ----------
// Parsed by hand (no Date/timezone conversion) so server and client render the same text.

/** "2026-11-24T09:12" -> "9:12 AM" */
export function formatClock(sentAt: string) {
  const [h, m] = sentAt.slice(11, 16).split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dayDiff(date: string, today: string) {
  return Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000);
}

function shortDate(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${WEEKDAY[d.getUTCDay()]}, ${MONTH[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Divider label inside a thread: "Today", "Yesterday", or "Mon, Nov 23". */
export function formatDayLabel(date: string, today: string) {
  const diff = dayDiff(date, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return shortDate(date);
}

/** Inbox timestamp: time today, "Yesterday", weekday this week, else "Nov 16". */
export function formatInboxTime(sentAt: string, today: string) {
  const date = sentAt.slice(0, 10);
  const diff = dayDiff(date, today);
  if (diff === 0) return formatClock(sentAt);
  if (diff === 1) return "Yesterday";
  const d = new Date(`${date}T00:00:00Z`);
  if (diff < 7) return WEEKDAY[d.getUTCDay()];
  return `${MONTH[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
