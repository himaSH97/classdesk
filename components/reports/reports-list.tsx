"use client";

import { Download, FileSpreadsheet, GraduationCap, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { getReportRows } from "@/lib/data";

type Rows = ReturnType<typeof getReportRows>;

/** Quote a value for CSV when it contains a comma, quote, or newline. */
function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv<T extends Record<string, string | number>>(rows: T[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(","))].join("\n");
}

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const templates = [
  {
    key: "roster",
    icon: GraduationCap,
    title: "Student roster",
    description: "Every student with their classes, attendance, average score, and last activity.",
    file: "student-roster.csv",
    count: (r: Rows) => `${r.roster.length} students`,
  },
  {
    key: "sessions",
    icon: ClipboardList,
    title: "Attendance by session",
    description: "One row per class meeting with how many students were present, late, absent, or excused.",
    file: "attendance-by-session.csv",
    count: (r: Rows) => `${r.sessions.length} sessions`,
  },
  {
    key: "assignments",
    icon: FileSpreadsheet,
    title: "Assignment summary",
    description: "Each assignment with its due date, submissions, grading progress, and average score.",
    file: "assignment-summary.csv",
    count: (r: Rows) => `${r.assignments.length} assignments`,
  },
] as const;

export function ReportsList({ rows }: { rows: Rows }) {
  return (
    <div className="flex flex-col gap-3">
      {templates.map((t) => {
        const Icon = t.icon;
        return (
          <Card key={t.key} size="sm" className="flex-row items-center gap-4 px-5 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground" aria-hidden>
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t.title}</p>
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">{t.count(rows)} · CSV</p>
            </div>
            <Button
              variant="outline"
              className="shrink-0"
              onClick={() => {
                const data = rows[t.key as keyof Rows] as Record<string, string | number>[];
                download(t.file, toCsv(data));
              }}
            >
              <Download />
              Download
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
