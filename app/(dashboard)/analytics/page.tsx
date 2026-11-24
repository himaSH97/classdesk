import { AnalyticsView } from "@/components/analytics/analytics-view";
import { getAnalytics } from "@/lib/data";

export default function AnalyticsPage() {
  return <AnalyticsView a={getAnalytics()} />;
}
