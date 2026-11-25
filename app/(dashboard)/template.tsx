import { PageTransition } from "@/components/dashboard/page-transition";

/**
 * Templates remount on every navigation, so this wrapper animates each dashboard page.
 * The header and sidebar live in layout.tsx and stay put; only the page content slides.
 */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
