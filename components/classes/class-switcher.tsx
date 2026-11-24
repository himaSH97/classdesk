"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, X } from "lucide-react";
import { SearchField } from "@/components/dashboard/list-controls";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClassColor, ClassStatus } from "@/lib/data";
import { classColorTile } from "@/lib/styles";
import { cn } from "@/lib/utils";

type ClassEntry = { id: string; code: string; name: string; color: ClassColor; status: ClassStatus; studentCount: number };

const statusItems = [
  { value: "all", label: "All classes" },
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "archived", label: "Archived" },
];

/**
 * Breadcrumb control on a class page. Opens a "Select Class" panel with the same
 * structure as the student selector: status filter, search, a list of classes, and
 * a black Select button. Clicking a class highlights it; Select opens its page.
 */
export function ClassSwitcher({ classes, currentId }: { classes: ClassEntry[]; currentId: string }) {
  const router = useRouter();
  const current = classes.find((c) => c.id === currentId);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(currentId);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return classes.filter(
      (c) =>
        (status === "all" || c.status === status) &&
        (!q || [c.name, c.code].some((v) => v.toLowerCase().includes(q))),
    );
  }, [classes, status, query]);

  function confirm() {
    setOpen(false);
    if (pending !== currentId) router.push(`/classes/${pending}`);
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
            aria-label={`${current.name}, switch class`}
          />
        }
      >
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
            <p className="text-base font-semibold">Select Class</p>
            <p className="text-sm text-muted-foreground">You can select other class here</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close" className="-mt-1 -mr-1 rounded-full" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </div>

        {/* Filter + search */}
        <div className="flex flex-col gap-3 px-5 pb-3">
          <div className="flex justify-end">
            <Select items={statusItems} value={status} onValueChange={(v) => setStatus(v ?? "all")}>
              <SelectTrigger aria-label="Filter by status" className="rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SearchField value={query} onChange={setQuery} placeholder="Search for Class" className="[&_input]:h-10 [&_input]:rounded-xl" />
        </div>

        {/* Classes */}
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {visible.length === 0 && <li className="px-3 py-10 text-center text-sm text-muted-foreground">No classes match.</li>}
          {visible.map((c) => {
            const selected = c.id === pending;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setPending(c.id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    selected ? "bg-muted" : "hover:bg-muted/60",
                  )}
                >
                  <span
                    className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold", classColorTile[c.color])}
                    aria-hidden
                  >
                    {c.code.split("-")[1]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.code} · {c.studentCount} {c.studentCount === 1 ? "student" : "students"}
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
