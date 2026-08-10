export type ColumnType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "file"
  | "datetime"
  | "time"
  | "json";

export type FilterOperator =
  | "contains"
  | "not_contains"
  | "equals"
  | "not_equals"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "is_empty"
  | "is_not_empty"
  | "is_true"
  | "is_false"
  | "is_any_of";

export interface FilterRule {
  columnId: string;
  columnName: string;
  columnLabel: string;
  columnType: ColumnType;
  operator: FilterOperator;
  value: string | string[] | number | number[] | boolean | null;
  origin?: string;
  selectOptions?: { value: string; label: string }[];
}

export interface FilterInput {
  columnName: string;
  operator: FilterOperator;
  value: string | string[] | number | number[] | boolean | null;
  origin?: string;
}

export interface FilterableColumn {
  id: string;
  name: string;
  dbName: string;
  type: ColumnType;
  selectOptions?: { value: string; label: string }[];
  origin?: string;
}

export const OPERATORS_BY_TYPE: Record<ColumnType, FilterOperator[]> = {
  text: [
    "contains",
    "not_contains",
    "equals",
    "not_equals",
    "is_any_of",
    "is_empty",
    "is_not_empty",
  ],
  number: [
    "equals",
    "not_equals",
    "is_any_of",
    "gt",
    "gte",
    "lt",
    "lte",
    "is_empty",
    "is_not_empty",
  ],
  date: [
    "equals",
    "not_equals",
    "is_any_of",
    "gt",
    "gte",
    "lt",
    "lte",
    "is_empty",
    "is_not_empty",
  ],
  datetime: [
    "equals",
    "not_equals",
    "is_any_of",
    "gt",
    "gte",
    "lt",
    "lte",
    "is_empty",
    "is_not_empty",
  ],
  time: [
    "equals",
    "not_equals",
    "is_any_of",
    "gt",
    "gte",
    "lt",
    "lte",
    "is_empty",
    "is_not_empty",
  ],
  boolean: ["is_true", "is_false"],
  select: ["is_any_of", "equals", "not_equals", "is_empty", "is_not_empty"],
  file: [],
  json: [],
};

export type OperatorDisplay = {
  symbol: string;
  valueWrap?: "quotes" | "brackets";
  showValue?: false;
  fixedValue?: string;
};

export function getOperatorDisplay(operator: FilterOperator): OperatorDisplay {
  switch (operator) {
    case "equals":
      return { symbol: "=" };
    case "not_equals":
      return { symbol: "≠" };
    case "contains":
      return { symbol: "~", valueWrap: "quotes" };
    case "not_contains":
      return { symbol: "!~", valueWrap: "quotes" };
    case "gt":
      return { symbol: ">" };
    case "gte":
      return { symbol: "≥" };
    case "lt":
      return { symbol: "<" };
    case "lte":
      return { symbol: "≤" };
    case "is_any_of":
      return { symbol: "∈", valueWrap: "brackets" };
    case "is_empty":
      return { symbol: "=", fixedValue: "Empty" };
    case "is_not_empty":
      return { symbol: "≠", fixedValue: "Empty" };
    case "is_true":
      return { symbol: "=", fixedValue: "Yes" };
    case "is_false":
      return { symbol: "=", fixedValue: "No" };
  }
}

export function formatFilterLabel(
  rule: FilterRule,
  formatValue: (value: unknown, type: ColumnType) => string = (v) =>
    String(v ?? ""),
): string {
  const { symbol, valueWrap, showValue } = getOperatorDisplay(rule.operator);
  const col = rule.columnLabel;

  if (showValue === false) {
    return `${col} ${symbol}`;
  }

  const raw = Array.isArray(rule.value)
    ? rule.value.map((v) => formatValue(v, rule.columnType)).join(", ")
    : formatValue(rule.value, rule.columnType);

  const val =
    valueWrap === "quotes"
      ? `"${raw}"`
      : valueWrap === "brackets"
        ? `[${raw}]`
        : raw;

  return `${col} ${symbol} ${val}`;
}

export function toFilterRuleFallback(f: FilterInput): FilterRule {
  return {
    columnId: f.columnName,
    columnName: f.columnName,
    columnLabel: f.columnName,
    columnType: "text",
    operator: f.operator,
    value: f.value,
    origin: f.origin,
  };
}
