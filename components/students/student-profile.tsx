import {
  Check,
  CircleMinus,
  Clock,
  ClipboardList,
  MessageSquare,
  X,
  type LucideIcon,
} from "lucide-react";
import { StatCards } from "@/components/dashboard/stat-cards";
import { StudentMessages } from "@/components/students/student-messages";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ActivityKind, AttendanceStatus, Performance, StudentProfile } from "@/lib/data";
import { avatarColor, classColorSoft, classColorTile, tone } from "@/lib/styles";
import { cn } from "@/lib/utils";

const performanceStyle: Record<Performance, { label: string; className: string }> = {
  strong: { label: "Strong", className: tone.positive },
  average: { label: "On track", className: tone.neutral },
  weak: { label: "Needs attention", className: tone.warning },
};

// Activity chip look per kind (attendance kinds use fixed status colors; due dates use the class color).
const activityStyle: Record<Exclude<ActivityKind, "due">, { icon: LucideIcon; className: string }> = {
  present: { icon: Check, className: "bg-emerald-50 text-emerald-950 ring-emerald-200/70" },
  late: { icon: Clock, className: "bg-amber-50 text-amber-950 ring-amber-200/70" },
  absent: { icon: X, className: "bg-rose-50 text-rose-950 ring-rose-200/70" },
  excused: { icon: CircleMinus, className: "bg-zinc-50 text-zinc-900 ring-zinc-200/80" },
  message: { icon: MessageSquare, className: "bg-sky-50 text-sky-950 ring-sky-200/70" },
};

const segment: Record<AttendanceStatus, { label: string; bar: string }> = {
  present: { label: "Present", bar: "bg-emerald-500" },
  late: { label: "Late", bar: "bg-amber-400" },
  absent: { label: "Absent", bar: "bg-rose-500" },
  excused: { label: "Excused", bar: "bg-zinc-300" },
};
const ORDER: AttendanceStatus[] = ["present", "late", "absent", "excused"];

const pct = (n: number) => `${Math.round(n * 100)}%`;

function rateClass(rate: number) {
  if (rate >= 0.95) return "text-emerald-700";
  if (rate < 0.8) return "text-amber-700";
  return "";
}

export function StudentProfileView({ student: s, today }: { student: StudentProfile; today: string }) {
  const perf = performanceStyle[s.performance];

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* Profile header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-14" aria-hidden>
            <AvatarFallback className={cn("text-base font-semibold", avatarColor(s.id))}>{s.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold">{s.name}</h1>
              <Badge variant="ghost" className={perf.className}>
                {perf.label}
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {s.grade} · {s.email}
            </p>
          </div>
        </div>
        <StudentMessages conversation={s.conversation} today={today} />
      </header>

      <StatCards
        items={[
          { label: "Attendance", value: pct(s.stats.attendanceRate), hint: `${s.stats.sessions} sessions recorded` },
          { label: "Avg. score", value: s.averageScore, hint: "out of 100" },
          { label: "Absences", value: s.stats.absences, hint: `${s.stats.unexcused} unexcused · ${s.stats.late} late` },
          { label: "Last active", value: s.lastActiveLabel, hint: s.daysSinceActive >= 5 ? "inactive for a while" : "recently active" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <ActivityCard student={s} />

        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <ClassesCard student={s} />
          <AttendanceCard student={s} />
        </div>
      </div>
    </div>
  );
}

// ---------- activity (day by day, newest first) ----------

function ActivityCard({ student: s }: { student: StudentProfile }) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-medium">Activity</h2>
        <p className="text-xs text-muted-foreground">Last {s.activity.length} days</p>
      </div>
      <ol className="divide-y">
        {s.activity.map((day, i) => {
          const weekend = day.weekday === "Sat" || day.weekday === "Sun";
          return (
            <li key={day.date} className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 px-4 py-3">
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm font-medium tabular-nums",
                    i === 0 ? "bg-foreground text-background" : "text-foreground",
                  )}
                >
                  {Number(day.date.slice(8))}
                </span>
                <span className="text-2xs text-muted-foreground">{day.weekday}</span>
              </div>
              {day.items.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {day.items.map((item) => {
                    const style = item.kind === "due" ? null : activityStyle[item.kind];
                    const Icon = style?.icon ?? ClipboardList;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex w-full min-w-0 items-center gap-2 rounded-xl py-1.5 pr-3 pl-1.5 ring-1 sm:w-auto sm:max-w-80",
                          style ? style.className : item.color && classColorSoft[item.color],
                        )}
                        title={`${item.title} — ${item.detail}`}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-xs">
                          <Icon className="size-3.5" strokeWidth={2} aria-hidden />
                        </span>
                        <span className="min-w-0 leading-tight">
                          <span className="block truncate text-xs font-medium">{item.title}</span>
                          <span className="block truncate text-2xs opacity-70">{item.detail}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{weekend ? "Weekend" : "No activity."}</p>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// ---------- side column ----------

function ClassesCard({ student: s }: { student: StudentProfile }) {
  return (
    <Card size="sm" className="gap-3 px-3">
      <p className="px-1 font-medium">Classes</p>
      <ul className="flex flex-col gap-1">
        {s.classDetails.map((c) => (
          <li key={c.id} className="flex items-start gap-3 rounded-lg px-1 py-1.5">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg text-2xs font-semibold",
                classColorTile[c.color],
              )}
              aria-hidden
            >
              {c.code.split("-")[1]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <span className={cn("shrink-0 text-xs font-medium tabular-nums", c.attendanceRate !== null && rateClass(c.attendanceRate))}>
                  {c.attendanceRate === null ? (c.status === "upcoming" ? "Starts Jan" : "—") : pct(c.attendanceRate)}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{c.scheduleLabel}</p>
              {c.nextDue && (
                <p className={cn("truncate text-xs", c.nextDue.daysLeft <= 2 ? "font-medium text-amber-700" : "text-muted-foreground")}>
                  Next: {c.nextDue.title} · {c.nextDue.dueLabel}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AttendanceCard({ student: s }: { student: StudentProfile }) {
  const total = s.stats.sessions;
  return (
    <Card size="sm" className="gap-3 px-4">
      <div className="flex items-baseline justify-between">
        <p className="font-medium">Attendance</p>
        <p className={cn("text-sm font-semibold tabular-nums", rateClass(s.stats.attendanceRate))}>
          {pct(s.stats.attendanceRate)}
        </p>
      </div>
      {total > 0 ? (
        <>
          <div className="flex h-2 w-full gap-px overflow-hidden rounded-full bg-muted" role="img"
            aria-label={ORDER.map((k) => `${s.counts[k]} ${segment[k].label.toLowerCase()}`).join(", ")}>
            {ORDER.filter((k) => s.counts[k] > 0).map((k) => (
              <div key={k} className={segment[k].bar} style={{ width: `${(s.counts[k] / total) * 100}%` }} />
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {ORDER.map((k) => (
              <div key={k} className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={cn("size-1.5 rounded-full", segment[k].bar)} aria-hidden />
                  {segment[k].label}
                </dt>
                <dd className="font-medium tabular-nums">{s.counts[k]}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">No sessions recorded this term.</p>
      )}
    </Card>
  );
}
