// Filters in the Students page's "Filters" panel.
// (Performance lives in the tabs and class in the dropdown, so they aren't repeated.)

import { AT_RISK_ATTENDANCE } from "@/lib/constants";
import type { StudentOverview } from "@/lib/data";
import type { FilterDef } from "@/lib/filters";

const unique = (values: string[]) => [...new Set(values)];
const gradeNumber = (g: string) => parseInt(g.replace(/\D/g, ""));

export const studentFilters: FilterDef<StudentOverview>[] = [
  {
    id: "grade",
    label: "Grade",
    kind: "chips",
    options: (rows) =>
      unique(rows.map((r) => r.grade))
        .sort((a, b) => gradeNumber(a) - gradeNumber(b))
        .map((g) => ({ value: g, label: g.replace(/^Grade\s*/, "") })),
    match: (row, selected) => selected.includes(row.grade),
  },
  {
    id: "attendance",
    label: "Attendance",
    kind: "choice",
    options: [
      { value: "low", label: "Below 80%" },
      { value: "mid", label: "80–90%" },
      { value: "high", label: "90%+" },
    ],
    match: (row, value) => {
      const rate = row.attendanceRate;
      if (value === "low") return rate < AT_RISK_ATTENDANCE;
      if (value === "mid") return rate >= AT_RISK_ATTENDANCE && rate < 0.9;
      return rate >= 0.9;
    },
  },
  {
    id: "score",
    label: "Avg. score",
    kind: "choice",
    options: [
      { value: "low", label: "Below 65" },
      { value: "mid", label: "65–84" },
      { value: "high", label: "85+" },
    ],
    match: (row, value) => {
      const score = row.averageScore;
      if (value === "low") return score < 65;
      if (value === "mid") return score >= 65 && score < 85;
      return score >= 85;
    },
  },
  {
    id: "inactive",
    label: "Inactive 5+ days",
    description: "Hasn't been active in the last 5 days",
    kind: "switch",
    match: (row) => row.daysSinceActive >= 5,
  },
];
