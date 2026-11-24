import { CalendarView } from "@/components/calendar/calendar-view";
import { classes, getCalendarEvents, getTermMonths, meta } from "@/lib/data";

export default function CalendarPage() {
  // Archived classes don't meet this term, so they're not filterable here.
  const classOptions = classes
    .filter((c) => c.status !== "archived")
    .map((c) => ({ id: c.id, label: `${c.code} · ${c.name}` }));

  return (
    <div className="flex flex-col gap-6 pt-2">
      <header>
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Class meetings, attendance, and due dates across {meta.term}.
        </p>
      </header>

      <CalendarView
        events={getCalendarEvents()}
        months={getTermMonths()}
        today={meta.today}
        classOptions={classOptions}
      />
    </div>
  );
}
