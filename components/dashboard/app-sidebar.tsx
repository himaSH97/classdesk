"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ChartColumn,
  ChevronsUpDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Mail,
  PanelLeft,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  brand,
  currentUser,
  navFooter,
  navSections,
  type NavIconName,
  type NavItem,
} from "@/config/navigation";

// Maps icon names from config/navigation.ts to components.
const iconMap: Record<NavIconName, LucideIcon> = {
  overview: LayoutDashboard,
  classes: BookOpen,
  students: Users,
  assignments: ClipboardList,
  sessions: CalendarCheck,
  calendar: CalendarDays,
  messages: Mail,
  analytics: ChartColumn,
  reports: FileText,
  settings: Settings,
};

// Collapsed rail inner width is 50px (3rem icon width + inset padding + 2px).
// 9px each side leaves exactly 32px, the collapsed button size, so icons sit centered.
const RAIL_PAD = "group-data-[collapsible=icon]:px-[9px]";

export function AppSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      {/*
        Collapsed rail: items stay left-aligned (so nothing jumps while the width
        animates) and RAIL_PAD puts the 32px buttons exactly on the rail's center.
      */}
      <SidebarHeader className={RAIL_PAD}>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              size="lg"
              onClick={collapsed ? toggleSidebar : undefined}
              aria-label={collapsed ? "Expand sidebar" : brand.name}
              tooltip={collapsed ? "Expand sidebar" : undefined}
              className="group/logo min-w-0 flex-1 p-0 group-data-[collapsible=icon]:flex-none hover:bg-transparent active:bg-transparent group-data-[collapsible=icon]:cursor-pointer"
            >
              <div className="relative flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="transition-opacity duration-150 group-data-[collapsible=icon]:group-hover/logo:opacity-0">
                  {brand.mark}
                </span>
                <PanelLeft
                  aria-hidden
                  className="absolute opacity-0 transition-opacity duration-150 group-data-[collapsible=icon]:group-hover/logo:opacity-100"
                />
              </div>
              <span className="truncate font-semibold">{brand.name}</span>
            </SidebarMenuButton>
            <SidebarTrigger className="ml-auto shrink-0 transition-opacity duration-200 group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.id} className={RAIL_PAD}>
            {section.title && <SidebarGroupLabel>{section.title}</SidebarGroupLabel>}
            <SidebarMenu>
              {section.items.map((item) => (
                <NavMenuItem key={item.id} item={item} active={isActive(item.href)} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className={RAIL_PAD}>
        <SidebarMenu>
          {navFooter.map((item) => (
            <NavMenuItem key={item.id} item={item} active={isActive(item.href)} />
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={currentUser.name}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                {currentUser.initials}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{currentUser.name}</span>
                <span className="truncate text-xs">{currentUser.role}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

// Every sidebar link in display order, so moving down the list slides content one way and moving up slides it the other.
const navOrder = [...navSections.flatMap((section) => section.items), ...navFooter];

function navIndex(pathname: string) {
  return navOrder.findIndex((i) =>
    i.href === "/" ? pathname === "/" : pathname === i.href || pathname.startsWith(`${i.href}/`)
  );
}

function NavMenuItem({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = iconMap[item.icon];
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const transitionTypes = navOrder.findIndex((i) => i.id === item.id) < navIndex(pathname) ? ["nav-back"] : ["nav-forward"];

  return (
    <SidebarMenuItem>
      {/* The active item uses the button's own active background. A morphing view-transition pill
          was tried, but the browser draws transition overlays above the page, so the solid color
          covered the icon and label while it slid. */}
      <SidebarMenuButton
        render={<Link href={item.href} transitionTypes={transitionTypes} />}
        isActive={active}
        // No base-ui tooltip here: its hover handling calls flushSync on click, which cancels the
        // page view transition. On the collapsed rail the label is a native title instead.
        title={collapsed ? item.label : undefined}
      >
        <Icon />
        <span>{item.label}</span>
      </SidebarMenuButton>
      {item.badge !== undefined && (
        <SidebarMenuBadge className="rounded-full bg-sidebar-primary px-1 text-2xs leading-none text-sidebar-primary-foreground peer-hover/menu-button:text-sidebar-primary-foreground peer-data-active/menu-button:text-sidebar-primary-foreground">
          {item.badge}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}
