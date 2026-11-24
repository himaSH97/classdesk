import { ReportsList } from "@/components/reports/reports-list";
import { getReportRows, meta } from "@/lib/data";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 pt-2">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Export the data behind your classes as spreadsheets. {meta.term}.
        </p>
      </header>

      <ReportsList rows={getReportRows()} />
    </div>
  );
}
