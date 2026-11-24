import { AssignmentsList } from "@/components/assignments/assignments-list";
import { StatCards } from "@/components/dashboard/stat-cards";
import { getAssignmentOverviews, getAssignmentStats, getClassOptions, getClassOverviews, meta } from "@/lib/data";

export default function AssignmentsPage() {
  const stats = getAssignmentStats();

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header>
        <h1 className="text-2xl font-semibold">Assignments</h1>
        <p className="text-sm text-muted-foreground">
          What&apos;s due, what&apos;s turned in, and what still needs grading in {meta.term}.
        </p>
      </header>

      <StatCards
        items={[
          { label: "Open", value: stats.open, hint: "accepting submissions" },
          { label: "Due this week", value: stats.dueThisWeek, hint: "in the next 7 days" },
          {
            label: "To grade",
            value: stats.toGrade,
            hint: `submissions across ${stats.toGradeAssignments} assignments`,
          },
          {
            label: "Submission rate",
            value: `${Math.round(stats.submissionRate * 100)}%`,
            hint: "on past-due work",
          },
        ]}
      />

      <AssignmentsList
        rows={getAssignmentOverviews()}
        classOptions={getClassOptions()}
        classes={getClassOverviews()
          .filter((c) => c.status !== "archived")
          .map((c) => ({ id: c.id, code: c.code, name: c.name, color: c.color, size: c.studentCount }))}
        today={meta.today}
      />
    </div>
  );
}
