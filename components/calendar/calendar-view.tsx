"use client";

import { startTransition, useMemo, useState, ViewTransition } from "react";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { ClassFilter } from "@/components/dashboard/list-controls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { assignmentTypeIcon } from "@/lib/assignment-icons";
import type { CalendarEvent, CalendarEventKind } from "@/lib/data";
import { classColorSoft } from "@/lib/styles";
import { cn } from "@/lib/utils";

// ---------- date helpers (UTC, matching lib/data) ----------

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const WEEKDAYS_MON_FIRST = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function monthDays(month: string) {
  const [y, m] = month.split("-").map(Number);
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => iso(new Date(Date.UTC(y, m - 1, i + 1))));
}
/** 0 = Monday … 6 = Sunday */
const mondayIndex = (date: string) => (utc(date).getUTCDay() + 6) % 7;
const isWeekend = (date: string) => mondayIndex(date) >= 5;
const fmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
  utc(date).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
const daysBetween = (from: string, to: string) => Math.round((utc(to).getTime() - utc(from).getTime()) / 86_400_000);

function daysLeftLabel(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days left`;
}

// ---------- view ----------

export function CalendarView({
  events,
  months,
  today,
  classOptions,
}: {
  events: CalendarEvent[];
  /** Term months, "YYYY-MM" */
  months: string[];
  /** Fixed "today" from the mock data, YYYY-MM-DD */
  today: string;
  classOptions: { id: string; label: string }[];
}) {
  const initialMonth = months.includes(today.slice(0, 7)) ? today.slice(0, 7) : months[0];
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string | null>(today);
  const [classId, setClassId] = useState("all");
  const [kinds, setKinds] = useState<CalendarEventKind[]>(["class", "due"]);

  const filtered = useMemo(
    () => events.filter((e) => kinds.includes(e.kind) && (classId === "all" || e.classId === classId)),
    [events, kinds, classId],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of filtered) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [filtered]);

  const monthIndex = months.indexOf(month);
  // Month changes run in a transition so the agenda and grid crossfade.
  const goToMonth = (m: string) => startTransition(() => setMonth(m));

  function selectDay(date: string) {
    setSelected(date);
    document.getElementById(`day-${date}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: month pills on the left; filters pinned right. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            disabled={monthIndex <= 0}
            onClick={() => goToMonth(months[monthIndex - 1])}
          >
            <ChevronLeft />
          </Button>
          {months.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => goToMonth(m)}
              aria-pressed={m === month}
              className={cn(
                "h-8 shrink-0 rounded-full px-3.5 text-sm transition-colors",
                m === month
                  ? "bg-foreground font-medium text-background"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {fmt(`${m}-01`, { month: "short" })}
            </button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            disabled={monthIndex >= months.length - 1}
            onClick={() => goToMonth(months[monthIndex + 1])}
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 sm:flex-none">
            <ClassFilter options={classOptions} value={classId} onChange={setClassId} />
          </div>
          <ToggleGroup
            multiple
            variant="outline"
            spacing={0}
            aria-label="Event types"
            className="ml-auto"
            value={kinds}
            // Keep at least one type visible.
            onValueChange={(next) => next.length > 0 && setKinds(next as CalendarEventKind[])}
          >
            <ToggleGroupItem value="class" className="px-3">
              Classes
            </ToggleGroupItem>
            <ToggleGroupItem value="due" className="px-3">
              Due dates
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/* Agenda: one row per day of the month. */}
        <Card className="order-2 gap-0 py-0 lg:order-1">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-medium">{fmt(`${month}-01`, { month: "long", year: "numeric" })}</h2>
            <p className="text-xs text-muted-foreground">
              {monthDays(month).reduce((n, d) => n + (byDate.get(d)?.length ?? 0), 0)} events
            </p>
          </div>
          <ViewTransition key={month} name="calendar-agenda" share="auto" enter="auto" default="none">
            <ol className="divide-y">
              {monthDays(month).map((date) => (
                <AgendaDay
                  key={date}
                  date={date}
                  events={byDate.get(date) ?? []}
                  isToday={date === today}
                  isPast={date < today}
                  isSelected={date === selected}
                />
              ))}
            </ol>
          </ViewTransition>
        </Card>

        {/* Side column: month grid + upcoming deadlines (sticky on desktop). */}
        <div className="order-1 flex flex-col gap-4 lg:sticky lg:top-20 lg:order-2">
          <MiniMonth
            month={month}
            byDate={byDate}
            today={today}
            selected={selected}
            onSelect={selectDay}
            onPrev={monthIndex > 0 ? () => goToMonth(months[monthIndex - 1]) : undefined}
            onNext={monthIndex < months.length - 1 ? () => goToMonth(months[monthIndex + 1]) : undefined}
          />
          <Upcoming events={filtered} today={today} />
        </div>
      </div>
    </div>
  );
}

// ---------- agenda ----------

function AgendaDay({
  date,
  events,
  isToday,
  isPast,
  isSelected,
}: {
  date: string;
  events: CalendarEvent[];
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
}) {
  return (
    <li
      id={`day-${date}`}
      className={cn(
        "grid scroll-mt-24 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 px-4 py-3 transition-colors",
        isSelected && "bg-muted/50",
      )}
      aria-current={isToday ? "date" : undefined}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full text-sm font-medium tabular-nums",
            isToday && "bg-foreground text-background",
            !isToday && isPast && "text-muted-foreground",
          )}
        >
          {Number(date.slice(8))}
        </span>
        <span className="text-2xs text-muted-foreground">{fmt(date, { weekday: "short" })}</span>
      </div>

      {events.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {events.map((e) => (
            <EventChip key={e.id} event={e} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{isWeekend(date) ? "Weekend" : "No events."}</p>
      )}
    </li>
  );
}

function EventChip({ event }: { event: CalendarEvent }) {
  const Icon = event.kind === "due" && event.assignmentType ? assignmentTypeIcon[event.assignmentType] : BookOpen;
  const a = event.attendance;
  const missing = a ? a.absent + a.excused : 0;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center gap-2 rounded-xl py-1.5 pr-3 pl-1.5 ring-1 sm:w-auto sm:max-w-72",
        classColorSoft[event.color],
      )}
      title={`${event.title} — ${event.kind === "due" ? `due · ${event.className}` : event.detail}`}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-xs">
        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-xs font-medium">
          {event.kind === "due" ? `Due: ${event.title}` : event.title}
        </span>
        <span className="block truncate text-2xs opacity-70">
          {event.detail}
          {a && (
            <span className={cn(missing > 0 ? "font-medium text-rose-700 opacity-100" : undefined)}>
              {" · "}
              {missing > 0 ? `${missing} absent` : "all present"}
            </span>
          )}
        </span>
      </span>
    </div>
  );
}

// ---------- mini month ----------

type DayMarks = { full: boolean; absences: boolean; due: boolean };

function marksFor(events: CalendarEvent[]): DayMarks {
  const recorded = events.filter((e) => e.attendance);
  const absences = recorded.some((e) => e.attendance!.absent + e.attendance!.excused > 0);
  return {
    absences,
    full: recorded.length > 0 && !absences,
    due: events.some((e) => e.kind === "due"),
  };
}

function MiniMonth({
  month,
  byDate,
  today,
  selected,
  onSelect,
  onPrev,
  onNext,
}: {
  month: string;
  byDate: Map<string, CalendarEvent[]>;
  today: string;
  selected: string | null;
  onSelect: (date: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const days = monthDays(month);
  const marks = days.map((d) => marksFor(byDate.get(d) ?? []));
  const legend = [
    { label: "Full attendance", dot: "bg-emerald-500", count: marks.filter((m) => m.full).length },
    { label: "Absences", dot: "bg-rose-500", count: marks.filter((m) => m.absences).length },
    { label: "Due", dot: "bg-amber-500", count: marks.filter((m) => m.due).length },
  ];

  return (
    <Card size="sm" className="gap-3 px-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" aria-label="Previous month" disabled={!onPrev} onClick={onPrev}>
          <ChevronLeft />
        </Button>
        <p className="font-medium">{fmt(`${month}-01`, { month: "long", year: "numeric" })}</p>
        <Button variant="ghost" size="icon-sm" aria-label="Next month" disabled={!onNext} onClick={onNext}>
          <ChevronRight />
        </Button>
      </div>

      <ViewTransition key={month} name="calendar-mini" share="auto" enter="auto" default="none">
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAYS_MON_FIRST.map((d) => (
            <span key={d} className="pb-1 text-2xs font-medium text-muted-foreground">
              {d}
            </span>
          ))}
          {Array.from({ length: mondayIndex(days[0]) }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {days.map((date, i) => {
            const m = marks[i];
            const isToday = date === today;
            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelect(date)}
                aria-label={`${fmt(date, { weekday: "long", month: "long", day: "numeric" })}${m.due ? ", something due" : ""}${m.absences ? ", absences" : ""}`}
                aria-pressed={date === selected}
                className="group flex flex-col items-center gap-0.5 py-0.5"
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs tabular-nums transition-colors",
                    isToday
                      ? "bg-foreground font-medium text-background"
                      : date === selected
                        ? "bg-muted font-medium ring-1 ring-foreground/15"
                        : "group-hover:bg-muted",
                    !isToday && isWeekend(date) && "text-muted-foreground",
                  )}
                >
                  {Number(date.slice(8))}
                </span>
                <span className="flex h-1.5 items-center gap-0.5" aria-hidden>
                  {m.full && <span className="size-1 rounded-full bg-emerald-500" />}
                  {m.absences && <span className="size-1 rounded-full bg-rose-500" />}
                  {m.due && <span className="size-1 rounded-full bg-amber-500" />}
                </span>
              </button>
            );
          })}
        </div>
      </ViewTransition>

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 border-t pt-3 text-2xs text-muted-foreground">
        {legend.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1">
            <span className={cn("size-1.5 rounded-full", l.dot)} aria-hidden />
            {l.label}
            <span className="rounded-full bg-muted px-1.5 font-medium tabular-nums text-foreground">{l.count}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}

// ---------- upcoming deadlines ----------

function Upcoming({ events, today }: { events: CalendarEvent[]; today: string }) {
  const next = events.filter((e) => e.kind === "due" && e.date >= today).slice(0, 4);

  return (
    <Card size="sm" className="gap-3 px-3">
      <p className="px-1 font-medium">Upcoming deadlines</p>
      {next.length === 0 ? (
        <p className="px-1 pb-1 text-xs text-muted-foreground">Nothing due soon.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {next.map((e) => {
            const days = daysBetween(today, e.date);
            const Icon = e.assignmentType ? assignmentTypeIcon[e.assignmentType] : BookOpen;
            return (
              <li key={e.id} className={cn("rounded-xl p-3 ring-1", classColorSoft[e.color])}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm leading-snug font-medium">{e.title}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-2xs font-medium shadow-xs",
                      days <= 2 && "text-amber-700",
                    )}
                  >
                    {daysLeftLabel(days)}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs opacity-75">
                  <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
                  {fmt(e.date, { weekday: "short", month: "short", day: "numeric" })} · {e.className}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
