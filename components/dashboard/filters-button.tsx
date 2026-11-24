"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  countActiveFilters,
  describeActiveFilters,
  resolveOptions,
  type FilterDef,
  type FilterValues,
} from "@/lib/filters";

interface FiltersProps<Row> {
  defs: FilterDef<Row>[];
  /** Used to derive options such as "every subject in the list". */
  rows: Row[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
}

/** "Filters" button with a count badge; opens a panel rendering `defs`. */
export function FiltersButton<Row>({ defs, rows, values, onChange }: FiltersProps<Row>) {
  const active = countActiveFilters(defs, values);
  const set = (id: string, value: FilterValues[string]) => onChange({ ...values, [id]: value });

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" aria-label={active ? `Filters, ${active} active` : "Filters"} />
        }
      >
        <SlidersHorizontal />
        Filters
        {active > 0 && (
          <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-2xs font-medium text-primary-foreground tabular-nums">
            {active}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <p className="font-medium">Filters</p>
          <Button
            variant="ghost"
            size="sm"
            disabled={active === 0}
            onClick={() => onChange({})}
            className="h-7 px-2 text-muted-foreground"
          >
            Clear all
          </Button>
        </div>

        {defs.map((def) => (
          <div key={def.id}>
            <Separator />
            <div className="flex flex-col gap-2 px-3 py-3">
              {def.kind !== "switch" && (
                <p className="text-xs font-medium text-muted-foreground">{def.label}</p>
              )}

              {def.kind === "checkboxes" && (
                <div className="flex flex-col gap-2">
                  {resolveOptions(def, rows).map((opt) => {
                    const selected = (values[def.id] as string[] | undefined) ?? [];
                    const checked = selected.includes(opt.value);
                    return (
                      <Label key={opt.value} className="cursor-pointer font-normal">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(on) =>
                            set(def.id, on ? [...selected, opt.value] : selected.filter((v) => v !== opt.value))
                          }
                        />
                        {opt.label}
                      </Label>
                    );
                  })}
                </div>
              )}

              {(def.kind === "chips" || def.kind === "choice") && (
                <ToggleGroup
                  multiple={def.kind === "chips"}
                  variant="outline"
                  size="sm"
                  aria-label={def.label}
                  className="flex-wrap"
                  value={
                    def.kind === "chips"
                      ? ((values[def.id] as string[] | undefined) ?? [])
                      : values[def.id]
                        ? [values[def.id] as string]
                        : []
                  }
                  // choice: picking the active chip again clears it (back to "any")
                  onValueChange={(next) => set(def.id, def.kind === "chips" ? next : (next[0] ?? undefined))}
                >
                  {resolveOptions(def, rows).map((opt) => (
                    <ToggleGroupItem key={opt.value} value={opt.value} className="px-2.5">
                      {opt.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}

              {def.kind === "switch" && (
                <Label className="cursor-pointer items-start justify-between gap-3 font-normal">
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium">{def.label}</span>
                    {def.description && (
                      <span className="text-xs text-muted-foreground">{def.description}</span>
                    )}
                  </span>
                  <Switch checked={values[def.id] === true} onCheckedChange={(on) => set(def.id, on || undefined)} />
                </Label>
              )}
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** Removable chips summarizing the active filters, plus "Clear all". */
export function ActiveFilterChips<Row>({ defs, rows, values, onChange }: FiltersProps<Row>) {
  const chips = describeActiveFilters(defs, values, rows);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex h-7 items-center gap-1 rounded-full border bg-background pr-1 pl-3 text-xs"
        >
          {chip.text}
          <button
            type="button"
            aria-label={`Remove filter ${chip.text}`}
            onClick={() => onChange({ ...values, [chip.id]: undefined })}
            className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" onClick={() => onChange({})}>
        Clear all
      </Button>
    </div>
  );
}
