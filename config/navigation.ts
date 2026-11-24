// Single source of truth for the sidebar and breadcrumbs.
// Add, rename, or reroute sections and items here; the UI reads from this file.

export type NavIconName =
  | "overview"
  | "classes"
  | "students"
  | "assignments"
  | "sessions"
  | "calendar"
  | "messages"
  | "analytics"
  | "reports"
  | "settings";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: NavIconName;
  badge?: number;
}

export interface NavSection {
  id: string;
  title?: string;
  items: NavItem[];
}

export const brand = {
  name: "ClassDesk",
  mark: "C",
};

export const navSections: NavSection[] = [
  {
    id: "main",
    title: "Main menu",
    items: [
      { id: "overview", label: "Overview", href: "/", icon: "overview" },
      { id: "classes", label: "Classes", href: "/classes", icon: "classes" },
      { id: "students", label: "Students", href: "/students", icon: "students" },
      { id: "assignments", label: "Assignments", href: "/assignments", icon: "assignments" },
      { id: "sessions", label: "Sessions", href: "/sessions", icon: "sessions" },
      { id: "calendar", label: "Calendar", href: "/calendar", icon: "calendar" },
      { id: "messages", label: "Messages", href: "/messages", icon: "messages", badge: 2 },
    ],
  },
  {
    id: "insights",
    title: "Insights",
    items: [
      { id: "analytics", label: "Analytics", href: "/analytics", icon: "analytics" },
      { id: "reports", label: "Reports", href: "/reports", icon: "reports" },
    ],
  },
];

export const navFooter: NavItem[] = [
  { id: "settings", label: "Settings", href: "/settings", icon: "settings" },
];

export const currentUser = {
  name: "Teacher Name",
  role: "Teacher",
  initials: "TN",
};

export function getAllNavItems(): NavItem[] {
  return [...navSections.flatMap((s) => s.items), ...navFooter];
}

export function findNavItem(href: string): NavItem | undefined {
  return getAllNavItems().find((item) => item.href === href);
}
