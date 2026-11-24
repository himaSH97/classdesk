"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { ClassSwitcher } from "@/components/classes/class-switcher";
import { StudentSwitcher } from "@/components/students/student-switcher";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { brand, findNavItem } from "@/config/navigation";
import type { StudentDirectory } from "@/lib/data";

export function SiteHeader({ studentDirectory }: { studentDirectory: StudentDirectory }) {
  const pathname = usePathname();
  // Nested pages (e.g. /students/stu-01) link back to their section.
  const sectionHref = `/${pathname.split("/")[1] ?? ""}`;
  const section = findNavItem(sectionHref);
  const pageLabel = section?.label ?? pathname.replace(/^\//, "");
  // /students/:id and /classes/:id get a switcher in the breadcrumb.
  const detail = pathname.match(/^\/(students|classes)\/([^/]+)$/);
  const detailKind = detail?.[1] as "students" | "classes" | undefined;
  const detailId = detail?.[2];
  // /sessions/:id is a plain breadcrumb (no switcher), named after the session.
  const sessionId = pathname.match(/^\/sessions\/([^/]+)$/)?.[1];
  const sessionLabel = sessionId ? studentDirectory.sessions.find((s) => s.id === sessionId)?.label : undefined;

  return (
    // Floating primary-colored bar. Side margins match
    // the content's p-4 so it lines up with the cards below. Children (breadcrumb
    // links, switchers, icon buttons) are re-colored for the dark background via the
    // [&_...] selectors. Radii are concentric (see --radius-* in globals.css): header
    // padding is an even --header-pad so its buttons can use radius-header minus that padding.
    <header className="sticky top-2 z-10 border border-border bg-white mx-(--shell-gap) mt-(--shell-gap) flex shrink-0 items-center gap-2 rounded-(--radius-header) p-(--header-pad) text-foreground [&_a]:text-muted-foreground [&_a:hover]:text-foreground [&_[data-slot=breadcrumb-page]]:text-foreground [&_[data-slot=breadcrumb-separator]]:text-muted-foreground [&_button]:text-foreground [&_button:hover]:bg-foreground/10 [&_button:hover]:text-foreground">
      {/* On mobile the sidebar is a sheet, so it needs an opener outside it. */}
      <SidebarTrigger className="size-8 rounded-(--radius-header-item) md:hidden" />
      <Breadcrumb className="px-2">
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">{brand.name}</BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          {detailId ? (
            <>
              <BreadcrumbItem className="hidden sm:inline-flex">
                <BreadcrumbLink render={<Link href={sectionHref} />}>{pageLabel}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                {detailKind === "students" ? (
                  <StudentSwitcher key={detailId} directory={studentDirectory} currentId={detailId} />
                ) : (
                  <ClassSwitcher key={detailId} classes={studentDirectory.classes} currentId={detailId} />
                )}
              </BreadcrumbItem>
            </>
          ) : sessionId ? (
            <>
              <BreadcrumbItem className="hidden sm:inline-flex">
                <BreadcrumbLink render={<Link href={sectionHref} />}>{pageLabel}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{sessionLabel ?? "Session"}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Search" className="rounded-(--radius-header-item)">
          <Search />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="rounded-(--radius-header-item)">
          <Bell />
        </Button>
      </div>
    </header>
  );
}
