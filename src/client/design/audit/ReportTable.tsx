import type { ReactNode } from "react";
import { cn } from "cn";
import { Button } from "@/client/components/ui/button";
import { Input } from "@/client/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components/ui/select";
import { TONE_CLASS, type Tone } from "./auditReportFormat";

export type ReportColumn<TRow, TSort extends string> = {
  label: string;
  sort: TSort;
  cell: (row: TRow) => [value: string | number, tone?: Tone];
};

export type SortState<TSort extends string> = {
  sort: TSort;
  order: "asc" | "desc";
};

/** A row per page. The whole row opens the page; on a phone the cells stack. */
export function ReportTable<TRow, TSort extends string>({
  columns,
  rows,
  rowKey,
  path,
  sub,
  sorting,
  onSort,
  onOpen,
}: {
  columns: Array<ReportColumn<TRow, TSort>>;
  rows: TRow[];
  rowKey: (row: TRow) => string;
  path: (row: TRow) => string;
  sub: (row: TRow) => string;
  sorting: SortState<TSort>;
  onSort: (sorting: SortState<TSort>) => void;
  onOpen: (row: TRow) => void;
}) {
  const grid = {
    gridTemplateColumns: `minmax(170px,1.6fr) repeat(${columns.length},minmax(0,1fr))`,
  };
  return (
    <div>
      <div
        className="hidden min-h-9 items-center gap-3.5 text-[13px] text-muted-foreground md:grid"
        style={grid}
      >
        <span>Page</span>
        {columns.map((column) => {
          const active = sorting.sort === column.sort;
          const order = active && sorting.order === "desc" ? "asc" : "desc";
          return (
            <button
              key={column.label}
              type="button"
              aria-label={`Sort by ${column.label}`}
              className="min-h-9 cursor-pointer text-left hover:text-foreground"
              onClick={() => onSort({ sort: column.sort, order })}
            >
              {column.label}
              {active ? (sorting.order === "asc" ? " ↑" : " ↓") : ""}
            </button>
          );
        })}
      </div>
      {rows.map((row) => (
        <button
          key={rowKey(row)}
          type="button"
          style={grid}
          className="grid min-h-14 w-full cursor-pointer items-center gap-2 border-t border-border py-3.5 text-left outline-none hover:bg-accent/50 focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 max-md:grid-cols-2! md:gap-3.5 md:py-2"
          onClick={() => onOpen(row)}
        >
          <span className="wrap-anywhere max-md:col-span-2">
            {path(row)}
            <span className="block text-sm text-muted-foreground">
              {sub(row)}
            </span>
          </span>
          {columns.map((column) => {
            const [value, tone = "ok"] = column.cell(row);
            return (
              <span
                key={column.label}
                className={cn(
                  "text-sm wrap-anywhere tabular-nums",
                  TONE_CLASS[tone],
                )}
              >
                <span className="block text-[13px] text-muted-foreground md:hidden">
                  {column.label}
                </span>
                {value}
              </span>
            );
          })}
        </button>
      ))}
      {rows.length === 0 ? (
        <p className="text-muted-foreground">Nothing matches these filters.</p>
      ) : null}
    </div>
  );
}

/** A row of pressed-one-at-a-time buttons. */
export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<[value: T, label: string]>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map(([option, text]) => (
        <Button
          key={option}
          variant="outline"
          aria-pressed={option === value}
          className="aria-pressed:border-primary aria-pressed:text-primary"
          onClick={() => onChange(option)}
        >
          {text}
        </Button>
      ))}
    </div>
  );
}

/** Column choice on the left, search and filters on the right. */
export function TableControls({
  choice,
  query,
  onQuery,
  open,
  onToggle,
  activeCount,
  onReset,
  filters,
  count,
}: {
  choice: ReactNode;
  query: string;
  onQuery: (query: string) => void;
  open: boolean;
  onToggle: () => void;
  activeCount: number;
  onReset: () => void;
  filters: ReactNode;
  count: string;
}) {
  return (
    <>
      <div className="flex flex-wrap justify-between gap-2">
        {choice}
        <div className="flex flex-wrap gap-2">
          <Input
            aria-label="Find a page"
            placeholder="Find a page…"
            className="w-[220px]"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
          />
          <Button variant="outline" aria-expanded={open} onClick={onToggle}>
            Filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </Button>
        </div>
      </div>
      {open ? (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
            {filters}
          </div>
          <div>
            <Button variant="outline" onClick={onReset}>
              Reset
            </Button>
          </div>
        </>
      ) : null}
      <p className="text-sm text-muted-foreground">{count}</p>
    </>
  );
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
      <span>{label}</span>
      {children}
    </div>
  );
}

export function FilterSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<[value: T, label: string]>;
  value: T;
  onChange: (value: T) => void;
}) {
  const items = options.map(([option, text]) => ({
    value: option,
    label: text,
  }));
  return (
    <Labelled label={label}>
      <Select
        items={items}
        value={value}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
      >
        <SelectTrigger aria-label={label} className="w-full">
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
    </Labelled>
  );
}

export function FilterRange({
  label,
  min,
  max,
  onMin,
  onMax,
}: {
  label: string;
  min: string;
  max: string;
  onMin: (value: string) => void;
  onMax: (value: string) => void;
}) {
  return (
    <Labelled label={label}>
      <span className="grid grid-cols-2 gap-2">
        <Input
          inputMode="decimal"
          placeholder="Min"
          aria-label={`${label} minimum`}
          value={min}
          onChange={(event) => onMin(event.target.value)}
        />
        <Input
          inputMode="decimal"
          placeholder="Max"
          aria-label={`${label} maximum`}
          value={max}
          onChange={(event) => onMax(event.target.value)}
        />
      </span>
    </Labelled>
  );
}
