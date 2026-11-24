import { SessionsList } from "@/components/sessions/sessions-list";
import { StatCards } from "@/components/dashboard/stat-cards";
import { classes, getAttendanceStats, getSessionOverviews } from "@/lib/data";

export default function SessionsPage() {
  const stats = getAttendanceStats();
  // Only classes that actually meet have sessions to filter by.
  const classOptions = classes
    .filter((c) => c.status === "active")
    .map((c) => ({ id: c.id, label: `${c.code} · ${c.name}` }));

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header>
        <h1 className="text-2xl font-semibold">Sessions</h1>
        <p className="text-sm text-muted-foreground">
          Every class session, who showed up, and who didn&apos;t.
        </p>
      </header>

      <StatCards
        items={[
          {
            label: "Attendance rate",
            value: `${Math.round(stats.rate * 100)}%`,
            hint: `last 7 days · ${stats.sessionsThisWeek} sessions`,
          },
          { label: "Absences", value: stats.absences, hint: `last 7 days · ${stats.unexcused} unexcused` },
          { label: "Late arrivals", value: stats.late, hint: "last 7 days" },
          { label: "At-risk students", value: stats.atRisk, hint: "below 80% attendance" },
        ]}
      />

      <SessionsList rows={getSessionOverviews()} classOptions={classOptions} />
    </div>
  );
}
