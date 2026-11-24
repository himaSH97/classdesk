"use client";

import { addTransitionType, startTransition } from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { Rows2, Rows4, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

// Shared toolbar pieces for list pages (Classes, Students, ...).

/**
 * Segmented control for a list's primary filter (Apple-style): neutral gray
 * labels on a soft track; the selected segment is a crisp white pill with a
 * hairline edge. Segment corners are concentric with the track
 * (track radius − its 3px padding).
 *
 * The pill is a single sliding element (Base UI's Tabs.Indicator, positioned
 * from its --active-tab-* variables), so switching tabs glides it across and
 * resizes it to the new label instead of jumping.
 */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Tabs
      value={value}
      // Tagged transition: the list animates rows in/out/moving (see MorphList).
      onValueChange={(v) =>
        startTransition(() => {
          addTransitionType("list-filter");
          onChange(v as T);
        })
      }
    >
      <TabsList className="relative h-8 rounded-lg bg-muted/80 p-[3px]">
        <TabsPrimitive.Indicator
          className={cn(
            "absolute top-0 left-0 h-(--active-tab-height) w-(--active-tab-width)",
            "translate-x-(--active-tab-left) translate-y-(--active-tab-top)",
            "rounded-[calc(var(--radius)-3px)] bg-background shadow-sm ring-1 ring-foreground/[0.06]",
            "transition-[translate,width] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none",
          )}
        />
        {options.map((o) => (
          <TabsTrigger
            key={o.value}
            value={o.value}
            className={cn(
              // Transparent segments above the sliding pill; only the text color changes.
              "relative z-10 rounded-[calc(var(--radius)-3px)] px-3 text-muted-foreground transition-colors duration-200",
              "hover:text-foreground data-active:bg-transparent data-active:text-foreground",
              "group-data-[variant=default]/tabs-list:data-active:shadow-none",
            )}
          >
            {o.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-8"
      />
    </div>
  );
}

/** "All classes" + one option per class. */
export function ClassFilter({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const items = [{ value: "all", label: "All classes" }, ...options.map((o) => ({ value: o.id, label: o.label }))];
  return (
    <Select items={items} value={value} onValueChange={(v) => onChange(v ?? "all")}>
      <SelectTrigger aria-label="Filter by class" className="w-full sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export type Density = "expanded" | "compact";

/**
 * Expanded / compact switch. The change runs inside startTransition so the
 * <ViewTransition> wrappers in the list morph each row (see globals.css).
 */
export function DensityToggle({
  value,
  onChange,
}: {
  value: Density;
  onChange: (value: Density) => void;
}) {
  return (
    <ToggleGroup
      variant="outline"
      spacing={0}
      aria-label="Row density"
      value={[value]}
      // Single choice: ignore clicks that would leave nothing selected.
      onValueChange={(next) => {
        if (next[0])
          startTransition(() => {
            addTransitionType("list-density");
            onChange(next[0] as Density);
          });
      }}
    >
      <ToggleGroupItem value="expanded" aria-label="Expanded rows" title="Expanded rows">
        <Rows2 />
      </ToggleGroupItem>
      <ToggleGroupItem value="compact" aria-label="Compact rows" title="Compact rows">
        <Rows4 />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
