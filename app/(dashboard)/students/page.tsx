import { StudentsList } from "@/components/students/students-list";
import { getClassOptions, getStudentDirectory, getStudentOverviews, getStudentStats, meta } from "@/lib/data";

export default function StudentsPage() {
  const stats = getStudentStats();

  // Summary numbers sit inline in the header instead of in stat cards.
  const summary = [
    { value: stats.total, label: "students" },
    { value: `${Math.round(stats.avgAttendance * 100)}%`, label: "attendance" },
    { value: Math.round(stats.avgScore), label: "avg. score" },
    { value: stats.needsAttention, label: "need attention" },
  ];

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Students</h1>
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {summary.map((item, i) => (
            <span key={item.label} className="inline-flex items-baseline gap-x-2">
              {i > 0 && <span aria-hidden>·</span>}
              <span className="font-medium text-foreground tabular-nums">{item.value}</span>
              {item.label}
            </span>
          ))}
          <span className="text-muted-foreground/70">in {meta.term}</span>
        </p>
      </header>

      <StudentsList
        rows={getStudentOverviews()}
        classOptions={getClassOptions()}
        directoryClasses={getStudentDirectory().classes}
        today={meta.today}
      />
    </div>
  );
}
