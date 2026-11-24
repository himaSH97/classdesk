import { ViewTransition } from "react";

/**
 * Templates remount on every navigation, so this wrapper animates each dashboard page.
 * Sidebar links tag navigations as nav-forward or nav-back (see components/dashboard/app-sidebar.tsx),
 * and those types pick the slide direction. The header and sidebar live in layout.tsx and stay put.
 * default="none" means navigations without a type (refresh, Suspense reveals) do not slide.
 */
const directional = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
} as const;

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={directional} exit={directional} default="none">
      {children}
    </ViewTransition>
  );
}
