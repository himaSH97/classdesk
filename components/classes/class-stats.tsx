import { StatCards } from "@/components/dashboard/stat-cards";
import { getClassStats } from "@/lib/data";

export function ClassStats() {
  const stats = getClassStats();

  return (
    <StatCards
      items={[
        { label: "Active classes", value: stats.activeClasses, hint: `of ${stats.totalClasses} this term` },
        { label: "Students enrolled", value: stats.activeStudents, hint: "across active classes" },
        { label: "Avg. attendance", value: `${Math.round(stats.avgAttendance * 100)}%`, hint: "active classes" },
        { label: "Due this week", value: stats.dueThisWeek, hint: "open assignments" },
      ]}
    />
  );
}
