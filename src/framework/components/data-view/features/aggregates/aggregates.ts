import { formatByType } from "@/framework/lib/utils";
import type { ColumnType } from "../filtering/filters";

export type AggregateFunction =
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "count"
  | "count_distinct";

export interface AggregateRule {
  columnId: string;
  columnName: string;
  columnLabel: string;
  columnType: ColumnType;
  fn: AggregateFunction;
  origin?: string;
}

export interface AggregatableColumn {
  id: string;
  name: string;
  dbName: string;
  type: ColumnType;
  origin?: string;
}

export const AGGREGATES_BY_TYPE: Record<ColumnType, AggregateFunction[]> = {
  number: ["sum", "avg", "min", "max", "count"],
  date: ["min", "max", "count"],
  datetime: ["min", "max", "count"],
  time: ["min", "max", "count"],
  text: ["count", "count_distinct"],
  select: ["count", "count_distinct"],
  boolean: ["count"],
  file: ["count"],
  json: ["count"],
};

export function getAggregateLabel(fn: AggregateFunction): string {
  switch (fn) {
    case "sum":
      return "Sum";
    case "avg":
      return "Average";
    case "min":
      return "Min";
    case "max":
      return "Max";
    case "count":
      return "Count";
    case "count_distinct":
      return "Count (distinct)";
  }
}

const COUNT_LIKE: AggregateFunction[] = ["count", "count_distinct"];

// SQL avg() comes back with far more decimals than useful for display.
function roundAvg(value: unknown): unknown {
  const num = Number(value);
  return Number.isNaN(num) ? value : Math.round(num * 100) / 100;
}

export function formatAggregateLabel(
  rule: AggregateRule,
  value: unknown,
): string {
  const fnLabel = getAggregateLabel(rule.fn);
  if (value === null || value === undefined) return `${fnLabel}: —`;
  const type: ColumnType = COUNT_LIKE.includes(rule.fn)
    ? "number"
    : rule.columnType;
  const displayValue = rule.fn === "avg" ? roundAvg(value) : value;
  return `${fnLabel}: ${formatByType(displayValue, type)}`;
}

export type AggregateResult = Record<string, number | null>;

export function aggregateResultKey(
  rule: Pick<AggregateRule, "columnId" | "fn">,
): string {
  return `${rule.columnId}__${rule.fn}`;
}
