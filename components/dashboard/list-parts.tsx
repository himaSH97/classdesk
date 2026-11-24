import { ViewTransition } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Density } from "./list-controls";

// Shared layout pieces for the card lists (Classes, Students, Assignments, Attendance).
//
// Layout system: each list defines
//   - expandedColumns: an `xl:grid xl:grid-cols-[...]` template. On xl every
//     expanded card and the label row share it; below xl cards stack.
//   - compactLgColumns: an `lg:grid-cols-[...]` template for compact rows.
// Rows animate via named <ViewTransition>s, keyed by transition type (styles in globals.css):
//   list-density (density toggle) -> each card morphs to its new layout
//   list-filter  (filter tabs)    -> remaining rows slide into place, others fade in/out
// Anything else (search, filter panel, class dropdown) updates instantly.

/** Column labels aligned with the card grid (shown on wide screens only). */
export function ColumnLabels({
  id,
  density,
  expandedColumns,
  compactLgColumns,
  labels,
}: {
  id: string;
  density: Density;
  expandedColumns: string;
  compactLgColumns: string;
  labels: string[];
}) {
  return (
    <ViewTransition name={`${id}-labels`} update={{ "list-density": "row-labels-morph", default: "none" }} default="none">
      <div
        aria-hidden
        className={cn(
          "hidden text-xs font-medium text-muted-foreground",
          density === "expanded"
            ? cn("px-4", expandedColumns)
            : cn("px-3 lg:grid lg:items-center lg:gap-4", compactLgColumns),
        )}
      >
        {labels.map((label, i) => (
          <span key={label} className={i === labels.length - 1 ? "text-right" : undefined}>
            {label}
          </span>
        ))}
      </div>
    </ViewTransition>
  );
}

/** Number of stagger-N classes defined in globals.css (rows beyond share the last). */
const STAGGER_STEPS = 10;

/** List whose rows morph when the density changes. Rows must set `data-morph-row`. */
export function MorphList<T extends { id: string }>({
  id,
  items,
  density,
  children,
}: {
  id: string;
  items: T[];
  density: Density;
  children: (item: T) => React.ReactNode;
}) {
  return (
    <ul className={cn("flex flex-col", density === "expanded" ? "gap-3" : "gap-2")}>
      {items.map((item, i) => (
        // The ViewTransition is the keyed element itself (not nested in the <li>),
        // so adding/removing a row is seen as its enter/exit.
        <ViewTransition
          key={item.id}
          name={`${id}-${item.id}`}
          update={{ "list-density": "row-morph", "list-filter": "row-move", default: "none" }}
          // stagger-N delays each arriving row by its position, so they appear one by one.
          enter={{ "list-filter": `row-enter stagger-${Math.min(i, STAGGER_STEPS - 1)}`, default: "none" }}
          exit={{ "list-filter": "row-exit", default: "none" }}
          default="none"
        >
          <li>{children(item)}</li>
        </ViewTransition>
      ))}
    </ul>
  );
}

/** A labeled value inside a stacked card; the label hides on xl where column labels show. */
export function DetailCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs text-muted-foreground xl:hidden">{label}</p>
      {children}
    </div>
  );
}

/** The grid of DetailCells in an expanded card; flattens into the row's columns on xl. */
export function DetailGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 sm:grid-cols-4 xl:contents", className)}>
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <Card className="h-32 items-center justify-center text-muted-foreground">{children}</Card>;
}
