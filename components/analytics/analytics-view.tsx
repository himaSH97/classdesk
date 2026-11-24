import { StatCards } from "@/components/dashboard/stat-cards";
import { Card } from "@/components/ui/card";
import type { getAnalytics } from "@/lib/data";
import { classColorTile } from "@/lib/styles";
import { cn } from "@/lib/utils";

type Analytics = ReturnType<typeof getAnalytics>;
const pct = (n: number) => `${Math.round(n * 100)}%`;
/** Below this, a bar is highlighted so problems stand out. */
const WARN = 0.85;

export function AnalyticsView({ a }: { a: Analytics }) {
  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          {a.term} · as of {a.dateHeading}
        </p>
      </header>

      <StatCards
        items={[
          { label: "Attendance", value: pct(a.avgAttendance), hint: `across ${a.sessionCount} sessions` },
          { label: "Avg. score", value: Math.round(a.avgScore), hint: "all students" },
          { label: "Submission rate", value: pct(a.submissionRate), hint: "on past-due work" },
          { label: "At risk", value: a.atRisk, hint: "below 80% attendance" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-4 py-5 lg:col-span-2">
          <CardTitle title="Attendance by session" aside="Each bar is one class meeting" />
          <ColumnChart items={a.trend} />
        </Card>

        <Card className="gap-4 py-5">
          <CardTitle title="Attendance by class" aside="Share present or late" />
          <div className="flex flex-col gap-3 px-5">
            {a.byClass.map((c) => (
              <HorizontalBar
                key={c.id}
                label={c.code}
                tile={classColorTile[c.color]}
                value={c.attendance}
                detail={`${pct(c.attendance)} · score ${Math.round(c.score)}`}
              />
            ))}
          </div>
        </Card>

        <Card className="gap-4 py-5">
          <CardTitle title="Students by performance" aside={`${a.studentCount} total`} />
          <StackedBar
            segments={[
              { label: "Strong", count: a.performance[0].count, className: "bg-emerald-500" },
              { label: "On track", count: a.performance[1].count, className: "bg-zinc-300" },
              { label: "Needs attention", count: a.performance[2].count, className: "bg-amber-400" },
            ]}
          />
        </Card>

        <Card className="gap-4 py-5 lg:col-span-2">
          <CardTitle title="Assignments by type" aside="Submission rate and average score" />
          <div className="flex flex-col gap-3 px-5">
            {a.types.map((t) => (
              <div key={t.type} className="grid grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.count} {t.count === 1 ? "assignment" : "assignments"}
                  </p>
                </div>
                <HorizontalBar label="Submitted" value={t.submissionRate} detail={pct(t.submissionRate)} bare />
                <HorizontalBar
                  label="Average"
                  value={(t.score ?? 0) / 100}
                  detail={t.score === null ? "—" : `${Math.round(t.score)}%`}
                  bare
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CardTitle({ title, aside }: { title: string; aside: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5">
      <h2 className="font-medium">{title}</h2>
      <p className="text-xs text-muted-foreground">{aside}</p>
    </div>
  );
}

/** Vertical bars, 0–100%. Bars under the warning line are highlighted. */
function ColumnChart({ items }: { items: { label: string; title: string; value: number }[] }) {
  return (
    <div className="px-5">
      <div className="flex gap-1.5" role="img" aria-label="Attendance by session">
        {items.map((item, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5" title={item.title}>
            {/* Fixed-height track so the percentage bar has something to measure against. */}
            <div className="flex h-40 w-full items-end">
              <div
                className={cn("w-full rounded-t-md transition-[height] duration-500", item.value < WARN ? "bg-amber-400" : "bg-foreground/80")}
                style={{ height: `${Math.max(item.value * 100, 3)}%` }}
              />
            </div>
            <span className="text-2xs text-muted-foreground tabular-nums">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBar({
  label,
  value,
  detail,
  tile,
  bare,
}: {
  label: string;
  value: number;
  detail: string;
  tile?: string;
  bare?: boolean;
}) {
  const bar = (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", value < WARN ? "bg-amber-400" : "bg-foreground/80")}
          style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }}
        />
      </div>
      <span className="w-28 shrink-0 text-right text-xs tabular-nums">{detail}</span>
    </div>
  );
  if (bare) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {bar}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md text-2xs font-semibold", tile)}>
        {label.split("-")[1]}
      </span>
      {bar}
    </div>
  );
}

function StackedBar({ segments }: { segments: { label: string; count: number; className: string }[] }) {
  const total = segments.reduce((n, s) => n + s.count, 0) || 1;
  return (
    <div className="flex flex-col gap-4 px-5">
      <div className="flex h-3 w-full gap-px overflow-hidden rounded-full bg-muted" role="img" aria-label={segments.map((s) => `${s.count} ${s.label}`).join(", ")}>
        {segments.map((s) => (
          <div key={s.label} className={s.className} style={{ width: `${(s.count / total) * 100}%` }} />
        ))}
      </div>
      <dl className="grid grid-cols-3 gap-3 text-sm">
        {segments.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-2 rounded-full", s.className)} aria-hidden />
              {s.label}
            </dt>
            <dd className="text-lg font-semibold tabular-nums">{s.count}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
