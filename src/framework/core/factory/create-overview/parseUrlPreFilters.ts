import type {
  FilterInput,
  FilterOperator,
} from "@/framework/components/data-view/features/filtering";

const NO_VALUE_OPERATORS = [
  "is_true",
  "is_false",
  "is_empty",
  "is_not_empty",
] as const;

const KNOWN_VALUE_OPERATORS = [
  "contains",
  "not_contains",
  "equals",
  "not_equals",
  "gt",
  "gte",
  "lt",
  "lte",
  "is_any_of",
];

export function parseUrlPreFilters(
  searchParams: URLSearchParams,
): FilterInput[] {
  const entries = [...searchParams.entries()];
  if (entries.length === 0) return [];

  return entries.reduce<FilterInput[]>((acc, [key, raw]) => {
    const dotIndex = key.indexOf(".");
    const columnName = dotIndex > -1 ? key.slice(dotIndex + 1) : key;
    const origin = dotIndex > -1 ? key.slice(0, dotIndex) : undefined;

    if (NO_VALUE_OPERATORS.includes(raw as any)) {
      acc.push({
        columnName,
        origin,
        operator: raw as FilterOperator,
        value: null,
      });
      return acc;
    }

    const pipeIndex = raw.indexOf("|");
    if (pipeIndex === -1) {
      acc.push({ columnName, origin, operator: "equals", value: raw });
      return acc;
    }

    const operator = raw.slice(0, pipeIndex) as FilterOperator;
    const rawValue = raw.slice(pipeIndex + 1);

    const isKnownOperator = KNOWN_VALUE_OPERATORS.includes(operator);

    if (!isKnownOperator) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[createOverview] urlPreFilters: unknown operator "${operator}" in param "${key}=${raw}" — dropping it.`,
        );
      }
      return acc;
    }

    if (rawValue === "") {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[createOverview] urlPreFilters: missing value in param "${key}=${raw}" — dropping it.`,
        );
      }
      return acc;
    }

    const value: FilterInput["value"] =
      operator === "is_any_of" ? rawValue.split(",") : rawValue;

    acc.push({ columnName, origin, operator, value });
    return acc;
  }, []);
}
