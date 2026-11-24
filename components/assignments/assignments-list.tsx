"use client";

import { useMemo, useState } from "react";
import { CreateAssignmentDialog } from "@/components/create/create-assignment-dialog";
import { AssignmentSheet, assignmentBadge } from "@/components/assignments/assignment-sheet";
import { assignmentFilters } from "@/config/filters/assignments";
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AssignmentOverview, AssignmentStatus, ClassColor } from "@/lib/data";
import { assignmentTypeIcon as typeIcon } from "@/lib/assignment-icons";
import { assignmentTypeLabel, relativeDue } from "@/lib/format";
import { classColorTile } from "@/lib/styles";
import { cn } from "@/lib/utils";


type Filter = "all" | AssignmentStatus;
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "grading", label: "Needs grading" },
  { value: "graded", label: "Graded" },
];

const COLUMNS =
  "xl:grid xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_7.5rem] xl:items-center xl:gap-6";
// Compact: assignment + status on phones, + due date from sm, everything from lg.
const COMPACT_LG_COLUMNS = "lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.1fr)_6rem_minmax(0,1fr)_7.5rem]";
const COMPACT_COLUMNS = cn(
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_auto]",
  COMPACT_LG_COLUMNS,
);

/** Open work due within 2 days is highlighted. */
const isDueSoon = (row: AssignmentOverview) => row.status === "open" && row.daysLeft <= 2;

function scoreClass(score: number) {
  if (score >= 85) return "text-emerald-700";
  if (score < 65) return "text-amber-700";
  return "";
}

export function AssignmentsList({
  rows: seedRows,
  classOptions,
  classes,
  today,
}: {
  rows: AssignmentOverview[];
  classOptions: { id: string; label: string }[];
  classes: { id: string; code: string; name: string; color: ClassColor; size: number }[];
  today: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [classId, setClassId] = useState("all");
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [density, setDensity] = useState<Density>("compact");
  // Assignments created on this page, shown first. They reset when the page reloads.
  const [added, setAdded] = useState<AssignmentOverview[]>([]);
  // Edits made in the detail sheet (drafts only; published text is locked).
  const [edits, setEdits] = useState<Record<string, Partial<AssignmentOverview>>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rows = useMemo(
    () => [...added, ...seedRows].map((r) => (edits[r.id] ? { ...r, ...edits[r.id] } : r)),
    [added, seedRows, edits],
  );
  const selected = rows.find((r) => r.id === selectedId) ?? null;
  function updateAssignment(id: string, patch: Partial<AssignmentOverview>) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  // Controls update instantly; the list re-filters once typing/clicking pauses.
  const debouncedQuery = useDebouncedValue(query, 200);
  const debouncedFilters = useDebouncedValue(filterValues, 200);

  // Class + search + panel filters narrow the list first, then the tab picks within it.
  const matching = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const narrowed = rows.filter(
      (r) =>
        (classId === "all" || r.classId === classId) &&
        (!q || [r.title, r.class.code, r.class.name, assignmentTypeLabel[r.type]].some((v) => v.toLowerCase().includes(q))),
    );
    return applyFilters(narrowed, assignmentFilters, debouncedFilters);
  }, [rows, classId, debouncedQuery, debouncedFilters]);


  // Drafts aren't accepting submissions, so they stay out of the Open tab.
  const visible = filter === "all" ? matching : matching.filter((r) => r.status === filter && (r.published || filter !== "open"));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
            placeholder="Search assignments"
            className="flex-1 sm:w-56 sm:flex-none"
          />
          {/* Always pinned to the right edge, even when the toolbar wraps. */}
          <div className="ml-auto flex items-center gap-2">
            <FiltersButton defs={assignmentFilters} rows={rows} values={filterValues} onChange={setFilterValues} />
            <DensityToggle value={density} onChange={setDensity} />
            <CreateAssignmentDialog classes={classes} today={today} onCreate={(a) => setAdded((prev) => [a, ...prev])} />
          </div>
        </div>
      </div>

      <ActiveFilterChips defs={assignmentFilters} rows={rows} values={filterValues} onChange={setFilterValues} />

      <ColumnLabels
        id="assignment"
        density={density}
        expandedColumns={COLUMNS}
        compactLgColumns={COMPACT_LG_COLUMNS}
        labels={["Assignment", "Due", "Submissions", "Grading", "Status"]}
      />

      <MorphList id="assignment" items={visible} density={density}>
        {(row) => (
          // Each row opens its details; keyboard users can use Enter or Space.
          <div
            role="button"
            tabIndex={0}
            aria-label={`Open ${row.title}`}
            onClick={() => setSelectedId(row.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedId(row.id);
              }
            }}
            className="group/row block cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {density === "expanded" ? <AssignmentCard row={row} /> : <CompactAssignmentCard row={row} />}
          </div>
        )}
      </MorphList>

      <AssignmentSheet
        row={selected}
        today={today}
        onClose={() => setSelectedId(null)}
        onUpdate={(patch) => selected && updateAssignment(selected.id, patch)}
      />

      {visible.length === 0 && (
        <EmptyState>No assignments match{debouncedQuery ? ` "${debouncedQuery}"` : " these filters"}.</EmptyState>
      )}
    </section>
  );
}

function TypeTile({ row, size }: { row: AssignmentOverview; size: "md" | "sm" }) {
  const Icon = typeIcon[row.type];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        size === "md" ? "size-10 rounded-lg" : "size-8 rounded-md",
        classColorTile[row.class.color],
      )}
      title={assignmentTypeLabel[row.type]}
      aria-hidden
    >
      <Icon className={size === "md" ? "size-[18px]" : "size-4"} strokeWidth={1.75} />
    </div>
  );
}

function StatusBadge({ row, className }: { row: AssignmentOverview; className?: string }) {
  const badge = assignmentBadge(row);
  return (
    <Badge variant="ghost" className={cn(badge.className, className)}>
      {badge.label}
    </Badge>
  );
}

function Grading({ row }: { row: AssignmentOverview }) {
  if (row.status === "open") return <span className="text-muted-foreground">After due date</span>;
  return (
    <div>
      {row.toGrade > 0 ? (
        <p className="font-medium text-amber-700">{row.toGrade} to grade</p>
      ) : (
        <p className="text-muted-foreground">All graded</p>
      )}
      {row.averageScore !== null && (
        <p className="text-xs text-muted-foreground">
          Avg. <span className={cn("font-medium", scoreClass(row.averageScore))}>{row.averageScore}%</span>
        </p>
      )}
    </div>
  );
}

function AssignmentCard({ row }: { row: AssignmentOverview }) {
  return (
    <Card size="sm" data-morph-row className={cn("gap-4 px-4 transition-[box-shadow] duration-200 group-hover/row:shadow-md group-hover/row:ring-foreground/15", COLUMNS)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <TypeTile row={row} size="md" />
          <div className="min-w-0">
            <p className="truncate font-medium">{row.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.class.code} · {assignmentTypeLabel[row.type]} · {row.maxPoints} pts
            </p>
          </div>
        </div>
        <StatusBadge row={row} className="shrink-0 xl:hidden" />
      </div>

      <DetailGrid className="sm:grid-cols-3">
        <DetailCell label="Due">
          <p>{row.dueLabel}</p>
          <p className={cn("text-xs", isDueSoon(row) ? "font-medium text-amber-700" : "text-muted-foreground")}>
            {relativeDue(row.daysLeft)}
          </p>
        </DetailCell>

        <DetailCell label="Submissions">
          <div className="flex items-center gap-2">
            <Progress
              value={Math.round(row.submissionRate * 100)}
              aria-label={`${row.title} submissions`}
              className="flex-1"
            />
            <span className="text-xs tabular-nums">
              {row.submitted}/{row.classSize}
            </span>
          </div>
        </DetailCell>

        <DetailCell label="Grading">
          <Grading row={row} />
        </DetailCell>
      </DetailGrid>

      <div className="hidden xl:flex xl:justify-end">
        <StatusBadge row={row} />
      </div>
    </Card>
  );
}

function CompactAssignmentCard({ row }: { row: AssignmentOverview }) {
  return (
    <Card size="sm" data-morph-row className={cn("px-3 py-2.5 transition-[box-shadow] duration-200 group-hover/row:shadow-md group-hover/row:ring-foreground/15", COMPACT_COLUMNS)}>
      <div className="flex min-w-0 items-center gap-3">
        <TypeTile row={row} size="sm" />
        <p className="min-w-0 truncate">
          <span className="font-medium">{row.title}</span>
          <span className="ml-2 text-xs text-muted-foreground">{row.class.code}</span>
        </p>
      </div>

      <p className={cn("hidden truncate sm:block", isDueSoon(row) ? "font-medium text-amber-700" : "text-muted-foreground")}>
        {row.dueLabel} · {relativeDue(row.daysLeft)}
      </p>

      <p className="hidden tabular-nums lg:block">
        {row.submitted}/{row.classSize}
      </p>

      <p className="hidden truncate lg:block">
        {row.status === "open" ? (
          <span className="text-muted-foreground">—</span>
        ) : row.toGrade > 0 ? (
          <span className="font-medium text-amber-700">{row.toGrade} to grade</span>
        ) : (
          <span className={cn("font-medium", scoreClass(row.averageScore ?? 0))}>Avg. {row.averageScore}%</span>
        )}
      </p>

      <div className="flex justify-end">
        <StatusBadge row={row} />
      </div>
    </Card>
  );
}
