import { OverviewView } from "@/components/overview/overview-view";
import { getOverview } from "@/lib/data";

export default function OverviewPage() {
  return <OverviewView overview={getOverview()} />;
}
