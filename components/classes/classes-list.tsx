"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CreateClassDialog } from "@/components/create/create-class-dialog";
import { Users } from "lucide-react";
import { classFilters } from "@/config/filters/classes";
import { ActiveFilterChips, FiltersButton } from "@/components/dashboard/filters-button";
import {
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
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { ClassOverview, ClassStatus } from "@/lib/data";
import { applyFilters, type FilterValues } from "@/lib/filters";
import { classColorTile as colorTile, tone } from "@/lib/styles";
import { cn } from "@/lib/utils";

const statusStyle: Record<ClassStatus, { label: string; className: string }> = {
  active: { label: "Active", className: tone.positive },
  upcoming: { label: "Upcoming", className: tone.info },
  archived: { label: "Archived", className: tone.neutral },
};

type Filter = "all" | ClassStatus;
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "archived", label: "Archived" },
];

// On xl screens every card (and the label row above them) shares these columns,
// so the list still scans like a table. Below xl each card stacks instead.
const COLUMNS =
  "xl:grid xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)_8.5rem_minmax(0,1.1fr)_minmax(0,1.6fr)_6rem] xl:items-center xl:gap-6";

// Compact rows: one line per class. Columns drop out as the screen narrows
// (class + status on phones, + schedule from sm, everything from lg).
const COMPACT_LG_COLUMNS =
  "lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_5rem_6rem_minmax(0,1fr)_6rem]";
const COMPACT_COLUMNS = cn(
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto]",
  COMPACT_LG_COLUMNS,
);

function dueText(daysLeft: number) {
  if (daysLeft === 0) return "today";
  if (daysLeft === 1) return "tomorrow";
  return `in ${daysLeft} days`;
}

export function ClassesList({ rows: seedRows }: { rows: ClassOverview[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [view, setView] = useState<Density>("compact");
  // Classes created on this page, shown first. They reset when the page reloads.
  const [added, setAdded] = useState<ClassOverview[]>([]);
  const rows = useMemo(() => [...added, ...seedRows], [added, seedRows]);

  // Controls update instantly; the list re-filters once typing/clicking pauses.
  const debouncedQuery = useDebouncedValue(query, 200);
  const debouncedFilters = useDebouncedValue(filterValues, 200);

  // Search + panel filters narrow the list first, then the tab picks within it.
  const matching = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const searched = q
      ? rows.filter((r) => [r.name, r.code, r.subject, r.room, r.grade].some((v) => v.toLowerCase().includes(q)))
      : rows;
    return applyFilters(searched, classFilters, debouncedFilters);
  }, [rows, debouncedQuery, debouncedFilters]);


  const visible = filter === "all" ? matching : matching.filter((r) => r.status === filter);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-full overflow-x-auto">
          <FilterTabs
            options={filters}
            value={filter}
            onChange={setFilter}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search classes"
            className="flex-1 sm:w-64 sm:flex-none"
          />
          {/* Always pinned to the right edge, even when the toolbar wraps. */}
          <div className="ml-auto flex items-center gap-2">
            <FiltersButton defs={classFilters} rows={rows} values={filterValues} onChange={setFilterValues} />
            <DensityToggle value={view} onChange={setView} />
            <CreateClassDialog onCreate={(c) => setAdded((prev) => [c, ...prev])} />
          </div>
        </div>
      </div>

      <ActiveFilterChips defs={classFilters} rows={rows} values={filterValues} onChange={setFilterValues} />

      <ColumnLabels
        id="class"
        density={view}
        expandedColumns={COLUMNS}
        compactLgColumns={COMPACT_LG_COLUMNS}
        labels={["Class", "Schedule", "Students", "Attendance", "Next due", "Status"]}
      />

      <MorphList id="class" items={visible} density={view}>
        {(row) => {
          const card = view === "expanded" ? <ClassCard row={row} /> : <CompactClassCard row={row} />;
          // Records created on this page have no detail page yet, so they aren't links.
          if ("draft" in row) return card;
          return (
            // Each row opens the class's page.
            <Link
              href={`/classes/${row.id}`}
              className="group/row block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {card}
            </Link>
          );
        }}
      </MorphList>

      {visible.length === 0 && (
        <EmptyState>No classes match{debouncedQuery ? ` "${debouncedQuery}"` : " these filters"}.</EmptyState>
      )}
    </section>
  );
}

function ClassCard({ row }: { row: ClassOverview }) {
  const status = statusStyle[row.status];

  return (
    <Card size="sm" data-morph-row className={cn("gap-4 px-4 transition-[box-shadow] duration-200 group-hover/row:shadow-md group-hover/row:ring-foreground/15", COLUMNS)}>
      {/* Class (plus the status badge on stacked layouts) */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
              colorTile[row.color],
            )}
            aria-hidden
          >
            {row.code.split("-")[1]}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{row.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.code} · {row.grade} · {row.room}
            </p>
          </div>
        </div>
        <Badge variant="ghost" className={cn("shrink-0 xl:hidden", status.className)}>
          {status.label}
        </Badge>
      </div>

      {/* Details: a labeled grid when stacked; plain columns on xl (via `contents`). */}
      <DetailGrid>
        <DetailCell label="Schedule">
          <p>{row.daysLabel}</p>
          <p className="text-xs text-muted-foreground">{row.timeLabel}</p>
        </DetailCell>

        <DetailCell label="Students">
          <div className="flex items-center gap-2">
            <AvatarGroup className="-space-x-1">
              {row.studentPreview.map((s) => (
                <Avatar key={s.id} title={s.name}>
                  <AvatarFallback className="text-2xs font-medium tracking-tight">{s.initials}</AvatarFallback>
                </Avatar>
              ))}
              {row.studentCount > row.studentPreview.length && (
                <AvatarGroupCount className="text-2xs font-medium tracking-tight">
                  +{row.studentCount - row.studentPreview.length}
                </AvatarGroupCount>
              )}
            </AvatarGroup>
            <span className="sr-only">{row.studentCount} students</span>
          </div>
        </DetailCell>

        <DetailCell label="Attendance">
          {row.attendanceRate === null ? (
            <span className="text-xs text-muted-foreground">Not started</span>
          ) : (
            <div className="flex items-center gap-2">
              <Progress
                value={Math.round(row.attendanceRate * 100)}
                aria-label={`${row.name} attendance`}
                className="flex-1"
              />
              <span className="w-9 text-right text-xs tabular-nums">
                {Math.round(row.attendanceRate * 100)}%
              </span>
            </div>
          )}
        </DetailCell>

        <DetailCell label="Next due">
          {row.nextAssignment ? (
            <>
              <p className="truncate">{row.nextAssignment.title}</p>
              <p
                className={cn(
                  "text-xs text-muted-foreground",
                  row.nextAssignment.daysLeft <= 2 && "font-medium text-amber-700",
                )}
              >
                {row.nextAssignment.dueLabel} · {dueText(row.nextAssignment.daysLeft)}
              </p>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Nothing due</span>
          )}
        </DetailCell>
      </DetailGrid>

      {/* Status column (xl only; stacked layouts show it next to the class name). */}
      <div className="hidden xl:flex xl:justify-end">
        <Badge variant="ghost" className={status.className}>
          {status.label}
        </Badge>
      </div>
    </Card>
  );
}

function CompactClassCard({ row }: { row: ClassOverview }) {
  const status = statusStyle[row.status];
  const next = row.nextAssignment;

  return (
    <Card size="sm" data-morph-row className={cn("px-3 py-2.5 transition-[box-shadow] duration-200 group-hover/row:shadow-md group-hover/row:ring-foreground/15", COMPACT_COLUMNS)}>
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md text-2xs font-semibold",
            colorTile[row.color],
          )}
          aria-hidden
        >
          {row.code.split("-")[1]}
        </div>
        <p className="min-w-0 truncate">
          <span className="font-medium">{row.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">{row.code}</span>
        </p>
      </div>

      <p className="hidden truncate text-muted-foreground sm:block">
        {row.daysLabel} · {row.timeLabel}
      </p>

      <p className="hidden items-center gap-1.5 tabular-nums lg:flex" title={`${row.studentCount} students`}>
        <Users className="size-3.5 text-muted-foreground" aria-hidden />
        {row.studentCount}
      </p>

      <p className="hidden tabular-nums lg:block">
        {row.attendanceRate === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          `${Math.round(row.attendanceRate * 100)}%`
        )}
      </p>

      <p
        className={cn(
          "hidden truncate lg:block",
          next && next.daysLeft <= 2 ? "font-medium text-amber-700" : "text-muted-foreground",
        )}
        title={next?.title}
      >
        {next ? `${next.dueLabel} · ${dueText(next.daysLeft)}` : "—"}
      </p>

      <div className="flex justify-end">
        <Badge variant="ghost" className={status.className}>
          {status.label}
        </Badge>
      </div>
    </Card>
  );
}

