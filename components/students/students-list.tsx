"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CreateStudentDialog } from "@/components/create/create-student-dialog";
import { studentFilters } from "@/config/filters/students";
import { ActiveFilterChips, FiltersButton } from "@/components/dashboard/filters-button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { applyFilters, type FilterValues } from "@/lib/filters";
import {
  ClassFilter,
  DensityToggle,
  FilterTabs,
  SearchField,
  type Density,
} from "@/components/dashboard/list-controls";
import {
  ColumnLabels,
  DetailCell,
  DetailGrid,
  EmptyState,
  MorphList,
} from "@/components/dashboard/list-parts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ClassColor, Performance, StudentOverview } from "@/lib/data";
import { avatarColor, classColorTile, tone } from "@/lib/styles";
import { cn } from "@/lib/utils";

const performanceStyle: Record<Performance, { label: string; className: string }> = {
  strong: { label: "Strong", className: tone.positive },
  average: { label: "On track", className: tone.neutral },
  weak: { label: "Needs attention", className: tone.warning },
};

type Filter = "all" | Performance;
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "strong", label: "Strong" },
  { value: "average", label: "On track" },
  { value: "weak", label: "Needs attention" },
];

// Same layout system as the Classes list: on xl every card shares these columns
// with the label row; below xl cards stack into a labeled grid.
const COLUMNS =
  "xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.1fr)_6rem_7rem_8.5rem] xl:items-center xl:gap-6";

// Compact: student + status on phones, + classes from sm, everything from lg.
const COMPACT_LG_COLUMNS =
  "lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_6rem_5rem_7rem_8.5rem]";
const COMPACT_COLUMNS = cn(
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto]",
  COMPACT_LG_COLUMNS,
);

/** Rows are links: lift slightly on hover. */
const ROW_HOVER = "transition-[box-shadow] duration-200 group-hover/row:shadow-md group-hover/row:ring-foreground/15";

function scoreClass(score: number) {
  if (score >= 85) return "text-emerald-700";
  if (score < 65) return "text-amber-700";
  return "";
}

/** Inactive for 5+ days gets flagged. */
const isStale = (row: StudentOverview) => row.daysSinceActive >= 5;

export function StudentsList({
  rows: seedRows,
  classOptions,
  directoryClasses,
  today,
}: {
  rows: StudentOverview[];
  classOptions: { id: string; label: string }[];
  directoryClasses: { id: string; code: string; name: string; color: ClassColor }[];
  today: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [classId, setClassId] = useState("all");
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [view, setView] = useState<Density>("compact");
  // Students created on this page, shown first. They reset when the page reloads.
  const [added, setAdded] = useState<StudentOverview[]>([]);
  const rows = useMemo(() => [...added, ...seedRows], [added, seedRows]);

  // Controls update instantly; the list re-filters once typing/clicking pauses.
  const debouncedQuery = useDebouncedValue(query, 200);
  const debouncedFilters = useDebouncedValue(filterValues, 200);

  // Class + search + panel filters narrow the list first, then the tab picks within it.
  const matching = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const narrowed = rows.filter(
      (r) =>
        (classId === "all" || r.classIds.includes(classId)) &&
        (!q || [r.name, r.email, r.grade].some((v) => v.toLowerCase().includes(q))),
    );
    return applyFilters(narrowed, studentFilters, debouncedFilters);
  }, [rows, classId, debouncedQuery, debouncedFilters]);


  const visible = filter === "all" ? matching : matching.filter((r) => r.performance === filter);

  return (
    <section className="flex flex-col gap-4">
      {/* Sticky: the toolbar stays pinned at the top while the list scrolls beneath it. */}
      <div className="sticky top-0 z-20 -mx-4 -mt-4 flex flex-col gap-3 bg-white px-4 pt-4 pb-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-full overflow-x-auto">
          <FilterTabs
            options={filters}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ClassFilter options={classOptions} value={classId} onChange={setClassId} />
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search students"
            className="flex-1 sm:w-56 sm:flex-none"
          />
          {/* Always pinned to the right edge, even when the toolbar wraps. */}
          <div className="ml-auto flex items-center gap-2">
            <FiltersButton defs={studentFilters} rows={rows} values={filterValues} onChange={setFilterValues} />
            <DensityToggle value={view} onChange={setView} />
            <CreateStudentDialog
              classes={directoryClasses}
              today={today}
              onCreate={(s) => setAdded((prev) => [s, ...prev])}
            />
          </div>
        </div>
      </div>

      <ActiveFilterChips defs={studentFilters} rows={rows} values={filterValues} onChange={setFilterValues} />

      <ColumnLabels
        id="student"
        density={view}
        expandedColumns={COLUMNS}
        compactLgColumns={COMPACT_LG_COLUMNS}
        labels={["Student", "Classes", "Attendance", "Avg. score", "Last active", "Status"]}
      />

      <MorphList id="student" items={visible} density={view}>
        {(row) => {
          const card = view === "expanded" ? <StudentCard row={row} /> : <CompactStudentCard row={row} />;
          // Records created on this page have no detail page yet, so they aren't links.
          if ("draft" in row) return card;
          return (
            // Each card opens the student's page.
            <Link
              href={`/students/${row.id}`}
              className="group/row block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {card}
            </Link>
          );
        }}
      </MorphList>

      {visible.length === 0 && (
        <EmptyState>No students match{debouncedQuery ? ` "${debouncedQuery}"` : " these filters"}.</EmptyState>
      )}
    </section>
  );
}

function StudentAvatar({ row, size }: { row: StudentOverview; size: "md" | "sm" }) {
  return (
    <Avatar className={size === "md" ? "size-10" : "size-8"} aria-hidden>
      <AvatarFallback className={cn("font-medium", size === "md" ? "text-xs" : "text-2xs", avatarColor(row.id))}>
        {row.initials}
      </AvatarFallback>
    </Avatar>
  );
}

function StatusBadge({ performance, className }: { performance: Performance; className?: string }) {
  const style = performanceStyle[performance];
  return (
    <Badge variant="ghost" className={cn(style.className, className)}>
      {style.label}
    </Badge>
  );
}

function StudentCard({ row }: { row: StudentOverview }) {
  const attendance = Math.round(row.attendanceRate * 100);

  return (
    <Card size="sm" data-morph-row className={cn("gap-4 px-4", ROW_HOVER, COLUMNS)}>
      {/* Student (plus the status badge on stacked layouts) */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <StudentAvatar row={row} size="md" />
          <div className="min-w-0">
            <p className="truncate font-medium">{row.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.grade} · {row.email}
            </p>
          </div>
        </div>
        <StatusBadge performance={row.performance} className="shrink-0 xl:hidden" />
      </div>

      {/* Details: a labeled grid when stacked; plain columns on xl (via `contents`). */}
      <DetailGrid>
        <DetailCell label="Classes">
          <div className="flex flex-wrap gap-1">
            {row.classes.map((c) => (
              <span
                key={c.id}
                title={c.name}
                className={cn("rounded-md px-1.5 py-0.5 text-2xs font-medium", classColorTile[c.color])}
              >
                {c.code}
              </span>
            ))}
          </div>
        </DetailCell>

        <DetailCell label="Attendance">
          <div className="flex items-center gap-2">
            <Progress value={attendance} aria-label={`${row.name} attendance`} className="flex-1" />
            <span className="w-9 text-right text-xs tabular-nums">{attendance}%</span>
          </div>
        </DetailCell>

        <DetailCell label="Avg. score">
          <p className="tabular-nums">
            <span className={cn("font-medium", scoreClass(row.averageScore))}>{row.averageScore}</span>
            <span className="text-xs text-muted-foreground"> / 100</span>
          </p>
        </DetailCell>

        <DetailCell label="Last active">
          <p className={cn(isStale(row) ? "font-medium text-amber-700" : "text-muted-foreground")}>
            {row.lastActiveLabel}
          </p>
        </DetailCell>
      </DetailGrid>

      {/* Status column (xl only; stacked layouts show it next to the name). */}
      <div className="hidden xl:flex xl:justify-end">
        <StatusBadge performance={row.performance} />
      </div>
    </Card>
  );
}

function CompactStudentCard({ row }: { row: StudentOverview }) {
  return (
    <Card size="sm" data-morph-row className={cn("px-3 py-2.5", ROW_HOVER, COMPACT_COLUMNS)}>
      <div className="flex min-w-0 items-center gap-3">
        <StudentAvatar row={row} size="sm" />
        <p className="min-w-0 truncate">
          <span className="font-medium">{row.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">{row.grade}</span>
        </p>
      </div>

      <p className="hidden truncate text-muted-foreground sm:block" title={row.classes.map((c) => c.name).join(", ")}>
        {row.classes.map((c) => c.code).join(", ")}
      </p>

      <p className="hidden tabular-nums lg:block">{Math.round(row.attendanceRate * 100)}%</p>

      <p className={cn("hidden font-medium tabular-nums lg:block", scoreClass(row.averageScore))}>
        {row.averageScore}
      </p>

      <p className={cn("hidden truncate lg:block", isStale(row) ? "font-medium text-amber-700" : "text-muted-foreground")}>
        {row.lastActiveLabel}
      </p>

      <div className="flex justify-end">
        <StatusBadge performance={row.performance} />
      </div>
    </Card>
  );
}

