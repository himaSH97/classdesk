// Generic, config-driven list filters. A page describes its filters as an array
// of FilterDefs (see config/filters/*); the FiltersButton renders them and
// applyFilters() runs them. Adding a filter = adding one entry to the config.

export interface FilterOption {
  value: string;
  label: string;
}

/** Static options, or options derived from the rows (e.g. every subject present). */
type Options<Row> = FilterOption[] | ((rows: Row[]) => FilterOption[]);

interface BaseDef {
  id: string;
  label: string;
}

export type FilterDef<Row> = BaseDef &
  (
    | {
        /** Pick any number. "checkboxes" renders a list, "chips" a row of toggles. */
        kind: "checkboxes" | "chips";
        options: Options<Row>;
        match: (row: Row, selected: string[]) => boolean;
      }
    | {
        /** Pick at most one (chips); picking the active one again clears it. */
        kind: "choice";
        options: Options<Row>;
        match: (row: Row, value: string) => boolean;
      }
    | {
        /** On/off. */
        kind: "switch";
        description?: string;
        match: (row: Row) => boolean;
      }
  );

/** Current selections, keyed by FilterDef id. Missing = not filtering. */
export type FilterValues = Record<string, string[] | string | boolean | undefined>;

export function resolveOptions<Row>(def: FilterDef<Row>, rows: Row[]): FilterOption[] {
  if (def.kind === "switch") return [];
  return typeof def.options === "function" ? def.options(rows) : def.options;
}

export function isFilterActive<Row>(def: FilterDef<Row>, value: FilterValues[string]): boolean {
  switch (def.kind) {
    case "checkboxes":
    case "chips":
      return Array.isArray(value) && value.length > 0;
    case "choice":
      return typeof value === "string" && value !== "";
    case "switch":
      return value === true;
  }
}

export function countActiveFilters<Row>(defs: FilterDef<Row>[], values: FilterValues) {
  return defs.filter((d) => isFilterActive(d, values[d.id])).length;
}

/** Rows that pass every active filter. */
export function applyFilters<Row>(rows: Row[], defs: FilterDef<Row>[], values: FilterValues): Row[] {
  const active = defs.filter((d) => isFilterActive(d, values[d.id]));
  if (active.length === 0) return rows;
  return rows.filter((row) =>
    active.every((def) => {
      const value = values[def.id];
      switch (def.kind) {
        case "checkboxes":
        case "chips":
          return def.match(row, value as string[]);
        case "choice":
          return def.match(row, value as string);
        case "switch":
          return def.match(row);
      }
    }),
  );
}

/** One human-readable summary per active filter, e.g. "Subject: Science, History". */
export function describeActiveFilters<Row>(defs: FilterDef<Row>[], values: FilterValues, rows: Row[]) {
  return defs
    .filter((d) => isFilterActive(d, values[d.id]))
    .map((def) => {
      if (def.kind === "switch") return { id: def.id, text: def.label };
      const options = resolveOptions(def, rows);
      const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
      const value = values[def.id];
      const text = Array.isArray(value) ? value.map(labelOf).join(", ") : labelOf(value as string);
      return { id: def.id, text: `${def.label}: ${text}` };
    });
}
