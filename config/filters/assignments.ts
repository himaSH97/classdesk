// Filters in the Assignments page's "Filters" panel.
// (Status lives in the tabs and class in the dropdown, so they aren't repeated.)

import type { AssignmentOverview, AssignmentType } from "@/lib/data";
import type { FilterDef } from "@/lib/filters";
import { assignmentTypeLabel as typeLabel } from "@/lib/format";

export const assignmentFilters: FilterDef<AssignmentOverview>[] = [
  {
    id: "type",
    label: "Type",
    kind: "checkboxes",
    // Only types that actually appear, in a fixed order
    options: (rows) =>
      (Object.keys(typeLabel) as AssignmentType[])
        .filter((t) => rows.some((r) => r.type === t))
        .map((t) => ({ value: t, label: typeLabel[t] })),
    match: (row, selected) => selected.includes(row.type),
  },
  {
    id: "due",
    label: "Due",
    kind: "choice",
    options: [
      { value: "past", label: "Past" },
      { value: "week", label: "This week" },
      { value: "later", label: "Later" },
    ],
    match: (row, value) => {
      if (value === "past") return row.daysLeft < 0;
      if (value === "week") return row.daysLeft >= 0 && row.daysLeft <= 7;
      return row.daysLeft > 7;
    },
  },
  {
    id: "submissions",
    label: "Submissions",
    kind: "choice",
    options: [
      { value: "low", label: "Under 50%" },
      { value: "mid", label: "50–89%" },
      { value: "high", label: "90%+" },
    ],
    match: (row, value) => {
      const rate = row.submissionRate;
      if (value === "low") return rate < 0.5;
      if (value === "mid") return rate >= 0.5 && rate < 0.9;
      return rate >= 0.9;
    },
  },
  {
    id: "points",
    label: "Max points",
    kind: "chips",
    options: (rows) =>
      [...new Set(rows.map((r) => r.maxPoints))]
        .sort((a, b) => a - b)
        .map((p) => ({ value: String(p), label: String(p) })),
    match: (row, selected) => selected.includes(String(row.maxPoints)),
  },
];
