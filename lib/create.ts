// Builders for records created in the UI. There's no backend yet, so new records are
// shaped like the seeded overview rows and live on the page until it reloads.
// Client-safe: no JSON imports, so it can run in client components.

import type {
  AssignmentOverview,
  AssignmentType,
  ClassColor,
  ClassOverview,
  Performance,
  StudentOverview,
  Weekday,
} from "@/lib/data";

/** Marks a record created on this page (not linked to a detail page yet). */
export type Draft<T> = T & { draft: true };

let seq = 0;
const newId = (prefix: string) => `${prefix}-new-${Date.now().toString(36)}${seq++}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const dayDiff = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

export function shortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** "09:30" -> "9:30 AM" */
export function formatClockTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

// ---------- student ----------

export function makeStudent(
  input: { name: string; email: string; grade: string; classIds: string[] },
  classes: { id: string; code: string; name: string; color: ClassColor }[],
  today: string,
): Draft<StudentOverview> {
  const performance: Performance = "average";
  return {
    draft: true,
    id: newId("stu"),
    name: input.name.trim(),
    email: input.email.trim(),
    grade: input.grade,
    classIds: input.classIds,
    performance,
    // No sessions yet, so there's no history to calculate from.
    attendanceRate: 0,
    averageScore: 0,
    lastActive: today,
    initials: initialsOf(input.name),
    classes: input.classIds
      .map((id) => classes.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map((c) => ({ id: c.id, code: c.code, name: c.name, color: c.color })),
    lastActiveLabel: "Today",
    daysSinceActive: 0,
  };
}

// ---------- class ----------

export function makeClass(input: {
  name: string;
  code: string;
  subject: string;
  grade: string;
  room: string;
  color: ClassColor;
  days: Weekday[];
  start: string;
  end: string;
}): Draft<ClassOverview> {
  const days = WEEKDAYS.filter((d) => input.days.includes(d as Weekday)) as Weekday[];
  return {
    draft: true,
    id: newId("cls"),
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    subject: input.subject.trim() || "General",
    grade: input.grade,
    room: input.room.trim() || "TBA",
    color: input.color,
    status: "active",
    schedule: { days, start: input.start, end: input.end },
    attendanceRate: null,
    daysLabel: days.join(", "),
    timeLabel: `${formatClockTime(input.start)} – ${formatClockTime(input.end)}`,
    studentCount: 0,
    studentPreview: [],
    nextAssignment: null,
  };
}

// ---------- assignment ----------

/** Derived due-date fields, so editing a due date keeps the labels correct. */
export function dueFields(dueDate: string, today: string) {
  return { dueDate, daysLeft: dayDiff(today, dueDate), dueLabel: shortDate(dueDate) };
}

export function makeAssignment(
  input: { title: string; description: string; classId: string; type: AssignmentType; dueDate: string; maxPoints: number },
  ctx: { today: string; classSize: number; cls: { id: string; code: string; name: string; color: ClassColor } },
): Draft<AssignmentOverview> {
  return {
    draft: true,
    id: newId("asg"),
    classId: input.classId,
    title: input.title.trim(),
    description: input.description.trim(),
    published: false,
    type: input.type,
    assignedDate: ctx.today,
    maxPoints: input.maxPoints,
    submitted: 0,
    graded: 0,
    averageScore: null,
    status: "open",
    class: { id: ctx.cls.id, code: ctx.cls.code, name: ctx.cls.name, color: ctx.cls.color },
    classSize: ctx.classSize,
    submissionRate: 0,
    toGrade: 0,
    ...dueFields(input.dueDate, ctx.today),
  };
}

export { WEEKDAYS };
