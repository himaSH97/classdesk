import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCards } from "@/components/dashboard/stat-cards";
import { assignmentTypeIcon } from "@/lib/assignment-icons";
import type { AssignmentStatus, AttendanceStatus, ClassProfile, Performance, SessionOverview } from "@/lib/data";
import { assignmentTypeLabel, relativeDue } from "@/lib/format";
import { avatarColor, classColorTile, tone } from "@/lib/styles";
import { cn } from "@/lib/utils";

const pct = (n: number) => `${Math.round(n * 100)}%`;

const performanceStyle: Record<Performance, { label: string; className: string }> = {
  strong: { label: "Strong", className: tone.positive },
  average: { label: "On track", className: tone.neutral },
  weak: { label: "Needs attention", className: tone.warning },
};

const assignmentStyle: Record<AssignmentStatus, { label: string; className: string }> = {
  open: { label: "Open", className: tone.info },
  grading: { label: "Needs grading", className: tone.warning },
  graded: { label: "Graded", className: tone.positive },
};

const rateClass = (rate: number) => (rate >= 0.95 ? "text-emerald-700" : rate < 0.8 ? "text-amber-700" : "");

export function ClassProfileView({ profile: c }: { profile: ClassProfile }) {
  const notStarted = c.status === "upcoming" && c.sessionCount === 0;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex items-center gap-4">
        <div
          className={cn("flex size-14 shrink-0 items-center justify-center rounded-xl text-lg font-semibold", classColorTile[c.color])}
          aria-hidden
        >
          {c.code.split("-")[1]}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold">{c.name}</h1>
            <Badge variant="ghost" className={c.status === "active" ? tone.positive : c.status === "upcoming" ? tone.info : tone.neutral}>
              {c.status === "active" ? "Active" : c.status === "upcoming" ? "Upcoming" : "Archived"}
            </Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {c.code} · {c.grade} · {c.room} · {c.scheduleLabel}
          </p>
        </div>
      </header>

      <StatCards
        items={[
          { label: "Students", value: c.studentCount, hint: `${c.subject} class` },
          {
            label: "Attendance",
            value: c.attendanceRate === null ? "—" : pct(c.attendanceRate),
            hint: notStarted ? `starts ${c.startLabel ?? "soon"}` : `${c.sessionCount} sessions recorded`,
          },
          { label: "Avg. score", value: c.averageScore === null ? "—" : Math.round(c.averageScore), hint: "across the roster" },
          { label: "Open work", value: c.openAssignments, hint: `${c.toGrade} submissions to grade` },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex flex-col gap-4">
          <AssignmentsCard assignments={c.assignments} />
          <SessionsCard sessions={c.sessions} notStarted={notStarted} />
        </div>
        <RosterCard roster={c.roster} atRisk={c.atRiskCount} />
      </div>
    </div>
  );
}

function AssignmentsCard({ assignments }: { assignments: ClassProfile["assignments"] }) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-medium">Assignments</h2>
        <p className="text-xs text-muted-foreground">{assignments.length} total</p>
      </div>
      {assignments.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No assignments yet.</p>
      ) : (
        <ul className="divide-y">
          {assignments.map((a) => {
            const Icon = assignmentTypeIcon[a.type];
            return (
              <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_6rem_auto]">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden>
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {assignmentTypeLabel[a.type]} · {a.maxPoints} pts
                    </p>
                  </div>
                </div>
                <p className="hidden text-sm sm:block">
                  {a.dueLabel}
                  <span className="block text-xs text-muted-foreground">{relativeDue(a.daysLeft)}</span>
                </p>
                <div className="hidden items-center gap-2 sm:flex">
                  <Progress value={Math.round(a.submissionRate * 100)} aria-label={`${a.title} submissions`} className="flex-1" />
                  <span className="text-2xs tabular-nums">
                    {a.submitted}/{a.classSize}
                  </span>
                </div>
                <Badge variant="ghost" className={cn("justify-self-end", assignmentStyle[a.status].className)}>
                  {assignmentStyle[a.status].label}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

const statusDot: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500",
  late: "bg-amber-400",
  absent: "bg-rose-500",
  excused: "bg-zinc-300",
};

function SessionsCard({ sessions, notStarted }: { sessions: SessionOverview[]; notStarted: boolean }) {
  const recent = sessions.slice(0, 8);
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-medium">Recent sessions</h2>
        <p className="text-xs text-muted-foreground">{sessions.length} recorded</p>
      </div>
      {recent.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {notStarted ? "This class hasn't started yet." : "No sessions recorded yet."}
        </p>
      ) : (
        <ul className="divide-y">
          {recent.map((s) => (
            <li key={s.id} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
              <div className="flex flex-col items-center leading-none">
                <span className="text-2xs font-medium text-muted-foreground uppercase">{s.month}</span>
                <span className="mt-0.5 text-sm font-semibold tabular-nums">{s.day}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm">{s.dateLabel}</p>
                <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  {(Object.keys(s.counts) as AttendanceStatus[])
                    .filter((k) => s.counts[k] > 0)
                    .map((k) => (
                      <span key={k} className="inline-flex items-center gap-1">
                        <span className={cn("size-1.5 rounded-full", statusDot[k])} aria-hidden />
                        <span className="tabular-nums">{s.counts[k]}</span> {k}
                      </span>
                    ))}
                </p>
              </div>
              <span className={cn("text-sm font-semibold tabular-nums", rateClass(s.rate))}>{pct(s.rate)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function RosterCard({ roster, atRisk }: { roster: ClassProfile["roster"]; atRisk: number }) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-medium">Students</h2>
        <p className="text-xs text-muted-foreground">
          {roster.length} enrolled{atRisk > 0 ? ` · ${atRisk} at risk` : ""}
        </p>
      </div>
      {roster.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No students enrolled.</p>
      ) : (
        <ul className="divide-y">
          {roster.map((r) => {
            const perf = performanceStyle[r.performance];
            return (
              <li key={r.id}>
                <Link href={`/students/${r.id}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60">
                  <Avatar className="size-8" aria-hidden>
                    <AvatarFallback className={cn("text-2xs font-medium", avatarColor(r.id))}>{r.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.grade} · score {r.averageScore}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn("text-xs font-medium tabular-nums", r.attendanceRate !== null && rateClass(r.attendanceRate))}>
                      {r.attendanceRate === null ? "—" : pct(r.attendanceRate)}
                    </span>
                    <Badge variant="ghost" className={cn("h-4 px-1.5 text-2xs", perf.className)}>
                      {perf.label}
                    </Badge>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
