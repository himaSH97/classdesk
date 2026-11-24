import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getStudentDirectory } from "@/lib/data";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        
        {/* Outer radius = header radius + header margin, so the corners are concentric. */}
        <SidebarInset className="md:peer-data-[variant=inset]:rounded-(--radius-shell) bg-white">
          
          {/* The header needs the student list for the switcher on student pages. */}
          <SiteHeader studentDirectory={getStudentDirectory()} />
          {/* SidebarInset already renders <main>, so the page wrapper is a div. */}
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
