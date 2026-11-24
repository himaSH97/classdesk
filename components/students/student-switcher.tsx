"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, X } from "lucide-react";
import { ClassFilter, SearchField } from "@/components/dashboard/list-controls";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Performance, StudentDirectory } from "@/lib/data";
import { avatarColor } from "@/lib/styles";
import { cn } from "@/lib/utils";

const performanceLabel: Record<Performance, string> = {
  strong: "Strong",
  average: "On track",
  weak: "Needs attention",
};
const performanceItems = [
  { value: "all", label: "All students" },
  { value: "strong", label: "Strong" },
  { value: "average", label: "On track" },
  { value: "weak", label: "Needs attention" },
];

/**
 * Breadcrumb control on a student's page. Opens a "Select Student" panel (modeled on
 * the reference): class and performance filters, search, students grouped by class.
 * Clicking a student highlights them; the black Select button opens their page.
 */
export function StudentSwitcher({ directory, currentId }: { directory: StudentDirectory; currentId: string }) {
  const router = useRouter();
  const current = directory.students.find((s) => s.id === currentId);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(currentId);
  const [classId, setClassId] = useState("all");
  const [performance, setPerformance] = useState("all");
  const [query, setQuery] = useState("");
  // Groups start open for the current student's classes; the rest collapse.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(current?.classIds ?? []));

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directory.classes
      .filter((c) => classId === "all" || c.id === classId)
      .map((c) => ({
        ...c,
        students: directory.students.filter(
          (s) =>
            s.classIds.includes(c.id) &&
            (performance === "all" || s.performance === performance) &&
            (!q || s.name.toLowerCase().includes(q)),
        ),
      }))
      .filter((g) => g.students.length > 0);
  }, [directory, classId, performance, query]);

  // Searching or narrowing shows every matching group open.
  const isOpen = (id: string) =>
    expanded.has(id) || query.trim() !== "" || classId !== "all" || performance !== "all";

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirm() {
    setOpen(false);
    if (pending !== currentId) router.push(`/students/${pending}`);
  }

  if (!current) return null;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setPending(currentId);
        else setQuery("");
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            className="-mx-1 flex items-center gap-1.5 rounded-md px-1 py-0.5 font-medium text-foreground transition-colors hover:bg-muted"
            aria-label={`${current.name}, switch student`}
          />
        }
      >
        <Avatar className="size-5" aria-hidden>
          <AvatarFallback className={cn("text-[9px] font-medium", avatarColor(current.id))}>{current.initials}</AvatarFallback>
        </Avatar>
        <span className="max-w-[40vw] truncate">{current.name}</span>
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="flex max-h-[min(38rem,80svh)] w-[min(25rem,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <p className="text-base font-semibold">Select Student</p>
            <p className="text-sm text-muted-foreground">You can select other student here</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close" className="-mt-1 -mr-1 rounded-full" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </div>

        {/* Filters + search */}
        <div className="flex flex-col gap-3 px-5 pb-3">
          <div className="flex justify-end gap-2 [&_[data-slot=select-trigger]]:rounded-full">
            <ClassFilter options={directory.classes.map((c) => ({ id: c.id, label: c.code }))} value={classId} onChange={setClassId} />
            <Select items={performanceItems} value={performance} onValueChange={(v) => setPerformance(v ?? "all")}>
              <SelectTrigger aria-label="Filter by performance" className="rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {performanceItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SearchField value={query} onChange={setQuery} placeholder="Search for Student" className="[&_input]:h-10 [&_input]:rounded-xl" />
        </div>

        {/* Groups */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {groups.length === 0 && <p className="px-3 py-10 text-center text-sm text-muted-foreground">No students match.</p>}
          {groups.map((g) => {
            const opened = isOpen(g.id);
            return (
              <section key={g.id} className="border-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggle(g.id)}
                  aria-expanded={opened}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/60"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground" aria-hidden>
                    #
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {g.code} · {g.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {g.students.length} {g.students.length === 1 ? "student" : "students"}
                    </span>
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", opened && "rotate-180")} />
                </button>

                {opened && (
                  <ul className="flex flex-col gap-0.5 pb-2">
                    {g.students.map((s) => {
                      const selected = s.id === pending;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => setPending(s.id)}
                            aria-pressed={selected}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                              selected ? "bg-muted" : "hover:bg-muted/60",
                            )}
                          >
                            <Avatar className="size-9" aria-hidden>
                              <AvatarFallback className={cn("text-2xs font-medium", avatarColor(s.id))}>{s.initials}</AvatarFallback>
                            </Avatar>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{s.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {performanceLabel[s.performance]}
                              </span>
                            </span>
                            {selected && (
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                                <Check className="size-3.5" strokeWidth={3} />
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <Button className="h-11 w-full rounded-xl text-sm" onClick={confirm}>
            Select
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
