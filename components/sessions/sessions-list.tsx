"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { attendanceFilters } from "@/config/filters/attendance";
import { ActiveFilterChips, FiltersButton } from "@/components/dashboard/filters-button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { applyFilters, type FilterValues } from "@/lib/filters";
import {
  ClassFilter,
  DensityToggle,
  FilterTabs,
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
import type { AttendanceStatus, SessionOverview } from "@/lib/data";
import { classColorTile, tone } from "@/lib/styles";
import { cn } from "@/lib/utils";

type Filter = "all" | "absences" | "full";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All sessions" },
  { value: "absences", label: "With absences" },
  { value: "full", label: "Full attendance" },
];

const hasAbsences = (s: SessionOverview) => s.counts.absent + s.counts.excused > 0;

/** Overall rating of a session, shown as the status badge. */
function rating(s: SessionOverview) {
  if (!hasAbsences(s)) return { label: "Full attendance", className: tone.positive };
  if (s.rate >= 0.85) return { label: "Good", className: tone.neutral };
  return { label: "Low turnout", className: tone.warning };
}

// Segment colors for the breakdown bar and its legend.
const segment: Record<AttendanceStatus, { label: string; bar: string; dot: string }> = {
  present: { label: "present", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  late: { label: "late", bar: "bg-amber-400", dot: "bg-amber-400" },
  absent: { label: "absent", bar: "bg-rose-500", dot: "bg-rose-500" },
  excused: { label: "excused", bar: "bg-zinc-300", dot: "bg-zinc-300" },
};
const ORDER: AttendanceStatus[] = ["present", "late", "absent", "excused"];

const COLUMNS =
  "xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_5rem_minmax(0,1.5fr)_7.5rem] xl:items-center xl:gap-6";
// Compact: session + status on phones, + breakdown from sm, everything from lg.
const COMPACT_LG_COLUMNS = "lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_5rem_minmax(0,1.3fr)_7.5rem]";
const COMPACT_COLUMNS = cn(
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_auto]",
  COMPACT_LG_COLUMNS,
);

function rateClass(rate: number) {
  if (rate >= 0.95) return "text-emerald-700";
  if (rate < 0.85) return "text-amber-700";
  return "";
}

export function SessionsList({
  rows,
  classOptions,
}: {
  rows: SessionOverview[];
  classOptions: { id: string; label: string }[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [classId, setClassId] = useState("all");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [density, setDensity] = useState<Density>("compact");

  // Panel controls update instantly; the list re-filters once clicking pauses.
  const debouncedFilters = useDebouncedValue(filterValues, 200);

  // Class + panel filters narrow the list first, then the tab picks within it.
  const matching = useMemo(() => {
    const byClass = classId === "all" ? rows : rows.filter((r) => r.class.id === classId);
    return applyFilters(byClass, attendanceFilters, debouncedFilters);
  }, [rows, classId, debouncedFilters]);


  const visible =
    filter === "all" ? matching : matching.filter((s) => (filter === "absences" ? hasAbsences(s) : !hasAbsences(s)));

  return (
    <section className="flex flex-col gap-4">
      {/* Sticky: the toolbar stays pinned at the top while the list scrolls beneath it. */}
      <div className="sticky top-0 z-20 -mx-4 -mt-4 flex flex-col gap-3 bg-white px-4 pt-4 pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-full overflow-x-auto">
          <FilterTabs
            options={filters}
            value={filter}
            onChange={setFilter}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 sm:flex-none">
            <ClassFilter options={classOptions} value={classId} onChange={setClassId} />
          </div>
          {/* Always pinned to the right edge, even when the toolbar wraps. */}
          <div className="ml-auto flex items-center gap-2">
            <FiltersButton defs={attendanceFilters} rows={rows} values={filterValues} onChange={setFilterValues} />
            <DensityToggle value={density} onChange={setDensity} />
          </div>
        </div>
      </div>

      <ActiveFilterChips defs={attendanceFilters} rows={rows} values={filterValues} onChange={setFilterValues} />

      <ColumnLabels
        id="session"
        density={density}
        expandedColumns={COLUMNS}
        compactLgColumns={COMPACT_LG_COLUMNS}
        labels={["Session", "Breakdown", "Rate", "Absent", "Status"]}
      />

      <MorphList id="session" items={visible} density={density}>
        {(row) => (
          // Each session opens its own page.
          <Link
            href={`/sessions/${row.id}`}
            className="group/row block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {density === "expanded" ? <SessionCard row={row} /> : <CompactSessionCard row={row} />}
          </Link>
        )}
      </MorphList>

      {visible.length === 0 && <EmptyState>No sessions match these filters.</EmptyState>}
    </section>
  );
}

/**
 * Calendar-style date tile, like Apple's Calendar icon: a tiny month label sits
 * tight above the day number, which carries the weight.
 * The month is a deliberate exception to the 11px type floor (9–10px): it's a
 * glanceable label, and the full date is also in the row text.
 */
function DateTile({ row, size }: { row: SessionOverview; size: "md" | "sm" }) {
  const md = size === "md";
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center",
        md ? "size-11 rounded-lg" : "size-8 rounded-md",
        classColorTile[row.class.color],
      )}
      aria-hidden
    >
      <span
        className={cn(
          "font-semibold tracking-wide uppercase opacity-70",
          // Exact line heights (= font size) keep the pair tight in every build.
          md ? "text-[10px] leading-[10px]" : "text-[9px] leading-[9px]",
        )}
      >
        {row.month}
      </span>
      <span
        className={cn("mt-px font-semibold tabular-nums", md ? "text-lg leading-[18px]" : "text-sm leading-[14px]")}
      >
        {row.day}
      </span>
    </div>
  );
}

function StatusBadge({ row, className }: { row: SessionOverview; className?: string }) {
  const r = rating(row);
  return (
    <Badge variant="ghost" className={cn(r.className, className)}>
      {r.label}
    </Badge>
  );
}

/** Segmented present / late / absent / excused bar. */
function BreakdownBar({ row }: { row: SessionOverview }) {
  return (
    <div
      className="flex h-2 w-full gap-px overflow-hidden rounded-full bg-muted"
      role="img"
      aria-label={ORDER.map((s) => `${row.counts[s]} ${segment[s].label}`).join(", ")}
    >
      {ORDER.filter((s) => row.counts[s] > 0).map((s) => (
        <div key={s} className={segment[s].bar} style={{ width: `${(row.counts[s] / row.total) * 100}%` }} />
      ))}
    </div>
  );
}

function BreakdownLegend({ row }: { row: SessionOverview }) {
  return (
    <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
      {ORDER.filter((s) => row.counts[s] > 0).map((s) => (
        <span key={s} className="inline-flex items-center gap-1">
          <span className={cn("size-1.5 rounded-full", segment[s].dot)} aria-hidden />
          <span className="tabular-nums">{row.counts[s]}</span> {segment[s].label}
        </span>
      ))}
    </p>
  );
}

function shortName(name: string) {
  const parts = name.split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts.at(-1)![0]}.` : name;
}

function Absentees({ row }: { row: SessionOverview }) {
  if (row.absentees.length === 0) return <span className="text-muted-foreground">Everyone attended</span>;
  return (
    <p className="truncate" title={row.absentees.map((a) => `${a.name}${a.status === "excused" ? " (excused)" : ""}`).join(", ")}>
      {row.absentees.map((a, i) => (
        <span key={a.id}>
          {i > 0 && ", "}
          <span className={a.status === "excused" ? "text-muted-foreground" : undefined}>
            {shortName(a.name)}
            {a.status === "excused" && " (excused)"}
          </span>
        </span>
      ))}
    </p>
  );
}

function SessionCard({ row }: { row: SessionOverview }) {
  return (
    <Card size="sm" data-morph-row className={cn("gap-4 px-4 transition-[box-shadow] duration-200 group-hover/row:shadow-md group-hover/row:ring-foreground/15", COLUMNS)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <DateTile row={row} size="md" />
          <div className="min-w-0">
            <p className="truncate font-medium">{row.class.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.class.code} · {row.dateLabel} · {row.timeLabel}
            </p>
          </div>
        </div>
        <StatusBadge row={row} className="shrink-0 xl:hidden" />
      </div>

      <DetailGrid className="sm:grid-cols-[minmax(0,1.6fr)_5rem_minmax(0,1.5fr)]">
        <DetailCell label="Breakdown">
          <div className="flex flex-col gap-1.5">
            <BreakdownBar row={row} />
            <BreakdownLegend row={row} />
          </div>
        </DetailCell>

        <DetailCell label="Rate">
          <p className={cn("text-base font-semibold tabular-nums", rateClass(row.rate))}>
            {Math.round(row.rate * 100)}%
          </p>
        </DetailCell>

        <DetailCell label="Absent">
          <Absentees row={row} />
        </DetailCell>
      </DetailGrid>

      <div className="hidden xl:flex xl:justify-end">
        <StatusBadge row={row} />
      </div>
    </Card>
  );
}

function CompactSessionCard({ row }: { row: SessionOverview }) {
  return (
    <Card size="sm" data-morph-row className={cn("px-3 py-2.5 transition-[box-shadow] duration-200 group-hover/row:shadow-md group-hover/row:ring-foreground/15", COMPACT_COLUMNS)}>
      <div className="flex min-w-0 items-center gap-3">
        <DateTile row={row} size="sm" />
        {/* Phones: date on its own line so a long class name can't push it out. */}
        <p className="min-w-0 sm:truncate">
          <span className="block truncate font-medium sm:inline">{row.class.name}</span>
          <span className="block truncate text-xs text-muted-foreground sm:ml-2 sm:inline">{row.dateLabel}</span>
        </p>
      </div>

      <div className="hidden sm:block">
        <BreakdownBar row={row} />
      </div>

      <p className={cn("hidden font-medium tabular-nums lg:block", rateClass(row.rate))}>
        {Math.round(row.rate * 100)}%
      </p>

      <div className="hidden min-w-0 lg:block">
        <Absentees row={row} />
      </div>

      <div className="flex justify-end">
        <StatusBadge row={row} />
      </div>
    </Card>
  );
}
