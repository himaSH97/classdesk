import Link from "next/link";
import { StatCards } from "@/components/dashboard/stat-cards";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { assignmentTypeIcon } from "@/lib/assignment-icons";
import type { Overview } from "@/lib/data";
import { assignmentTypeLabel, relativeDue } from "@/lib/format";
import { avatarColor, classColorTile, tone } from "@/lib/styles";
import { cn } from "@/lib/utils";

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function OverviewView({ overview: o }: { overview: Overview }) {
  const attentionCount = o.attention.length;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          {o.dateHeading} · {o.term}
        </p>
      </header>

      <StatCards
        items={[
          {
            label: "Classes today",
            value: o.todayClasses.length,
            hint: o.todayClasses.length ? `next at ${o.todayClasses[0].startLabel}` : "nothing scheduled",
          },
          { label: "Due this week", value: o.dueThisWeek, hint: "in the next 7 days" },
          { label: "Unread messages", value: o.unreadTotal, hint: "from students" },
          { label: "Need attention", value: attentionCount, hint: "low attendance or struggling" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex flex-col gap-4">
          <TodayCard overview={o} />
          <DueCard overview={o} />
        </div>
        <div className="flex flex-col gap-4">
          <AttentionCard overview={o} />
          <MessagesCard overview={o} />
        </div>
      </div>
    </div>
  );
}

function CardHeader({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <h2 className="font-medium">{title}</h2>
      {aside}
    </div>
  );
}

function TodayCard({ overview: o }: { overview: Overview }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader title="Today" aside={<p className="text-xs text-muted-foreground">
          {o.todayClasses.length} {o.todayClasses.length === 1 ? "class" : "classes"}
        </p>} />
      {o.todayClasses.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No classes today.</p>
      ) : (
        <ul className="divide-y">
          {o.todayClasses.map((m) => {
            const recorded = m.sessionId !== null;
            const href = recorded ? `/sessions/${m.sessionId}` : `/classes/${m.id}`;
            const flagged = m.absent > 0;
            return (
              <li key={m.id}>
                <Link href={href} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60">
                  <span className="text-sm font-medium tabular-nums">{m.startLabel}</span>
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn("flex size-8 shrink-0 items-center justify-center rounded-md text-2xs font-semibold", classColorTile[m.color])}
                      aria-hidden
                    >
                      {m.code.split("-")[1]}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{m.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {m.room} · {m.timeLabel}
                      </span>
                    </span>
                  </span>
                  {recorded ? (
                    <Badge variant="ghost" className={flagged ? tone.warning : tone.positive}>
                      {flagged ? `${m.absent} absent` : `${m.present}/${m.total} present`}
                    </Badge>
                  ) : (
                    <Badge variant="ghost" className={tone.info}>
                      Upcoming
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function DueCard({ overview: o }: { overview: Overview }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader
        title="Due soon"
        aside={
          <Link href="/assignments" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            All assignments
          </Link>
        }
      />
      {o.dueSoon.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing due.</p>
      ) : (
        <ul className="divide-y">
          {o.dueSoon.map((a) => {
            const Icon = assignmentTypeIcon[a.type];
            const soon = a.daysLeft <= 2;
            return (
              <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_6rem]">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", classColorTile[a.class.color])} aria-hidden>
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.class.code} · {assignmentTypeLabel[a.type]}
                    </p>
                  </div>
                </div>
                <p className={cn("hidden text-sm sm:block", soon && "font-medium text-amber-700")}>
                  {a.dueLabel}
                  <span className="block text-xs text-muted-foreground">{relativeDue(a.daysLeft)}</span>
                </p>
                <div className="hidden items-center gap-2 sm:flex">
                  <Progress value={Math.round(a.submissionRate * 100)} aria-label={`${a.title} submissions`} className="flex-1" />
                  <span className="text-2xs tabular-nums">
                    {a.submitted}/{a.classSize}
                  </span>
                </div>
                <p className={cn("justify-self-end text-xs sm:hidden", soon ? "font-medium text-amber-700" : "text-muted-foreground")}>
                  {relativeDue(a.daysLeft)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function AttentionCard({ overview: o }: { overview: Overview }) {
  const shown = o.attention.slice(0, 5);
  return (
    <Card className="gap-0 py-0">
      <CardHeader
        title="Needs attention"
        aside={
          <Link href="/students" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            All students
          </Link>
        }
      />
      {shown.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Everyone is on track.</p>
      ) : (
        <ul className="divide-y">
          {shown.map((s) => {
            const lowAttendance = s.attendanceRate < 0.8;
            return (
              <li key={s.id}>
                <Link href={`/students/${s.id}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60">
                  <Avatar className="size-8" aria-hidden>
                    <AvatarFallback className={cn("text-2xs font-medium", avatarColor(s.id))}>{s.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.grade} · {pct(s.attendanceRate)} attendance
                    </p>
                  </div>
                  <Badge variant="ghost" className={lowAttendance ? tone.warning : tone.neutral}>
                    {lowAttendance ? "Low attendance" : "Struggling"}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function MessagesCard({ overview: o }: { overview: Overview }) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader
        title="Messages"
        aside={
          <Link href="/messages" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            Open inbox
          </Link>
        }
      />
      <ul className="divide-y">
        {o.threads.map((t) => (
          <li key={t.id}>
            <Link href="/messages" className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60">
              <Avatar className="size-8" aria-hidden>
                <AvatarFallback className={cn("text-2xs font-medium", avatarColor(t.studentId))}>{t.initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={cn("truncate text-sm", t.unread ? "font-semibold" : "font-medium")}>{t.name}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{t.timeLabel}</span>
                </div>
                <p className={cn("truncate text-xs", t.unread ? "text-foreground" : "text-muted-foreground")}>
                  {t.fromTeacher && "You: "}
                  {t.preview}
                </p>
              </div>
              {t.unread > 0 && (
                <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-2xs font-medium text-primary-foreground tabular-nums")}>
                  {t.unread}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
