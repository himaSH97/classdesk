// Filters in the Sessions page's "Filters" panel.
// (Absences vs. full attendance live in the tabs and class in the dropdown.)

import type { SessionOverview } from "@/lib/data";
import type { FilterDef } from "@/lib/filters";

export const attendanceFilters: FilterDef<SessionOverview>[] = [
  {
    id: "weekday",
    label: "Meets on",
    kind: "chips",
    options: ["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => ({ value: d, label: d })),
    match: (row, selected) => selected.includes(row.weekday),
  },
  {
    id: "when",
    label: "When",
    kind: "choice",
    options: [
      { value: "recent", label: "Last 7 days" },
      { value: "previous", label: "8–14 days ago" },
      { value: "older", label: "Older" },
    ],
    match: (row, value) => {
      if (value === "recent") return row.daysAgo <= 6;
      if (value === "previous") return row.daysAgo >= 7 && row.daysAgo <= 13;
      return row.daysAgo >= 14;
    },
  },
  {
    id: "rate",
    label: "Rate",
    kind: "choice",
    options: [
      { value: "low", label: "Below 85%" },
      { value: "mid", label: "85–95%" },
      { value: "high", label: "95%+" },
    ],
    match: (row, value) => {
      if (value === "low") return row.rate < 0.85;
      if (value === "mid") return row.rate >= 0.85 && row.rate < 0.95;
      return row.rate >= 0.95;
    },
  },
  {
    id: "late",
    label: "Has late arrivals",
    description: "At least one student arrived late",
    kind: "switch",
    match: (row) => row.counts.late > 0,
  },
  {
    id: "unexcused",
    label: "Has unexcused absences",
    description: "At least one absence wasn't excused",
    kind: "switch",
    match: (row) => row.counts.absent > 0,
  },
];
