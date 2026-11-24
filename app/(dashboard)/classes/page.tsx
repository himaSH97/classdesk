import { ClassStats } from "@/components/classes/class-stats";
import { ClassesList } from "@/components/classes/classes-list";
import { getClassOverviews, meta } from "@/lib/data";

export default function ClassesPage() {
  return (
    <div className="flex flex-col gap-6 pt-2">
      <header>
        <h1 className="text-2xl font-semibold">Classes</h1>
        <p className="text-sm text-muted-foreground">
          Schedules, enrollment, and what&apos;s due next for {meta.term}.
        </p>
      </header>

      <ClassStats />
      <ClassesList rows={getClassOverviews()} />
    </div>
  );
}
