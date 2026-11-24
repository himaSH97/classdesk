import Link from "next/link";
import { StatCards } from "@/components/dashboard/stat-cards";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AttendanceStatus, SessionDetail } from "@/lib/data";
import { avatarColor, classColorTile, tone } from "@/lib/styles";
import { cn } from "@/lib/utils";

const pct = (n: number) => `${Math.round(n * 100)}%`;

const statusStyle: Record<AttendanceStatus, { label: string; className: string; bar: string }> = {
  present: { label: "Present", className: tone.positive, bar: "bg-emerald-500" },
  late: { label: "Late", className: tone.warning, bar: "bg-amber-400" },
  absent: { label: "Absent", className: "bg-rose-50 text-rose-800 ring-1 ring-rose-600/20", bar: "bg-rose-500" },
  excused: { label: "Excused", className: tone.neutral, bar: "bg-zinc-300" },
};
const ORDER: AttendanceStatus[] = ["present", "late", "absent", "excused"];

export function SessionDetailView({ detail: d }: { detail: SessionDetail }) {
  const rating =
    d.counts.absent + d.counts.excused === 0
      ? { label: "Full attendance", className: tone.positive }
      : d.rate >= 0.85
        ? { label: "Good", className: tone.neutral }
        : { label: "Low turnout", className: tone.warning };

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex items-center gap-4">
        <div
          className={cn("flex size-14 shrink-0 flex-col items-center justify-center rounded-xl leading-none", classColorTile[d.class.color])}
          aria-hidden
        >
          <span className="text-2xs font-semibold tracking-wide uppercase opacity-70">{d.month}</span>
          <span className="mt-0.5 text-lg font-semibold tabular-nums">{d.day}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-semibold">{d.class.name}</h1>
            <Badge variant="ghost" className={rating.className}>
              {rating.label}
            </Badge>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {d.dateLabel} · {d.timeLabel} · {d.room}
          </p>
        </div>
      </header>

      <StatCards
        items={[
          { label: "Attendance", value: pct(d.rate), hint: `${d.total} students in class` },
          { label: "Present", value: d.counts.present, hint: d.counts.late ? `plus ${d.counts.late} late` : "all on time" },
          { label: "Absent", value: d.counts.absent, hint: `${d.counts.excused} excused` },
          { label: "Late", value: d.counts.late, hint: "arrived after start time" },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <Card className="gap-0 py-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-medium">Students</h2>
            <p className="text-xs text-muted-foreground">Absences listed first</p>
          </div>
          <ul className="divide-y">
            {d.roster.map((r) => {
              const st = statusStyle[r.status];
              return (
                <li key={r.id}>
                  <Link href={`/students/${r.id}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60">
                    <Avatar className="size-8" aria-hidden>
                      <AvatarFallback className={cn("text-2xs font-medium", avatarColor(r.id))}>{r.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.grade}</p>
                    </div>
                    <Badge variant="ghost" className={st.className}>
                      {st.label}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="flex flex-col gap-4">
          <Card size="sm" className="gap-3 px-4">
            <div className="flex items-baseline justify-between">
              <p className="font-medium">Breakdown</p>
              <p className="text-sm font-semibold tabular-nums">{pct(d.rate)}</p>
            </div>
            <div
              className="flex h-2 w-full gap-px overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={ORDER.map((k) => `${d.counts[k]} ${statusStyle[k].label.toLowerCase()}`).join(", ")}
            >
              {ORDER.filter((k) => d.counts[k] > 0).map((k) => (
                <div key={k} className={statusStyle[k].bar} style={{ width: `${(d.counts[k] / d.total) * 100}%` }} />
              ))}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              {ORDER.map((k) => (
                <div key={k} className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <span className={cn("size-1.5 rounded-full", statusStyle[k].bar)} aria-hidden />
                    {statusStyle[k].label}
                  </dt>
                  <dd className="font-medium tabular-nums">{d.counts[k]}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card size="sm" className="gap-2 px-4">
            <p className="font-medium">Class</p>
            <p className="text-sm">{d.class.name}</p>
            <p className="text-xs text-muted-foreground">{d.scheduleLabel}</p>
            <Link href={`/classes/${d.classId}`} className="text-xs font-medium text-foreground underline-offset-4 hover:underline">
              Open class →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
