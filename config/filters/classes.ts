// Filters available in the Classes page's "Filters" panel.
// Add, remove, or reorder entries here; the panel and the list read from this.
// (Status lives in the tabs, so it isn't repeated here.)

import type { ClassOverview } from "@/lib/data";
import type { FilterDef } from "@/lib/filters";

const unique = (values: string[]) => [...new Set(values)];

export const classFilters: FilterDef<ClassOverview>[] = [
  {
    id: "subject",
    label: "Subject",
    kind: "checkboxes",
    options: (rows) =>
      unique(rows.map((r) => r.subject))
        .sort()
        .map((s) => ({ value: s, label: s })),
    match: (row, selected) => selected.includes(row.subject),
  },
  {
    id: "grade",
    label: "Grade",
    kind: "chips",
    // "Grade 10" -> chip "10", sorted numerically
    options: (rows) =>
      unique(rows.map((r) => r.grade))
        .sort((a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")))
        .map((g) => ({ value: g, label: g.replace(/^Grade\s*/, "") })),
    match: (row, selected) => selected.includes(row.grade),
  },
  {
    id: "days",
    label: "Meets on",
    kind: "chips",
    options: ["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => ({ value: d, label: d })),
    // Any of the picked days
    match: (row, selected) => selected.some((d) => row.schedule.days.includes(d as never)),
  },
  {
    id: "attendance",
    label: "Attendance",
    kind: "choice",
    options: [
      { value: "low", label: "Below 85%" },
      { value: "mid", label: "85–95%" },
      { value: "high", label: "95%+" },
    ],
    match: (row, value) => {
      const rate = row.attendanceRate;
      if (rate === null) return false; // hasn't started; no attendance yet
      if (value === "low") return rate < 0.85;
      if (value === "mid") return rate >= 0.85 && rate < 0.95;
      return rate >= 0.95;
    },
  },
  {
    id: "dueSoon",
    label: "Work due this week",
    description: "Has an assignment due in the next 7 days",
    kind: "switch",
    match: (row) => row.nextAssignment !== null && row.nextAssignment.daysLeft <= 7,
  },
];
