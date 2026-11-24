import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getStudentDirectory } from "@/lib/data";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {/* Locked to the viewport height so the page itself never scrolls; only the content area below does. */}
      <SidebarProvider className="h-svh overflow-hidden">
        <AppSidebar />

        {/* Outer radius = header radius + header margin, so the corners are concentric.
            min-h-0 + overflow-hidden keep the card at the viewport height; the content scrolls inside it. */}
        <SidebarInset className="min-h-0 overflow-hidden md:peer-data-[variant=inset]:rounded-(--radius-shell) bg-white">

          {/* The header needs the student list for the switcher on student pages. */}
          <SiteHeader studentDirectory={getStudentDirectory()} />
          {/* SidebarInset already renders <main>, so the page wrapper is a div. */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
