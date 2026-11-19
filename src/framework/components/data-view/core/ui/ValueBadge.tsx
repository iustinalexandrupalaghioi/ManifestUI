import { cn } from "@/framework/lib/utils";
import type { CSSProperties } from "react";
import { isCustomTone, type BadgeTone, type Enum, type EnumTone } from "@/framework/types/global/Enum";

/** The tones, in the order a picker shows them. */
export const ENUM_TONES: EnumTone[] = ["neutral", "info", "success", "warning", "danger"];

/** Tinted background, text that keeps 4.5:1 on it in both themes. */
export const TONES: Record<EnumTone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-sky-500/15 text-sky-800 border-sky-500/30 dark:text-sky-300",
  success: "bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-900 border-amber-500/30 dark:text-amber-300",
  danger: "bg-red-500/15 text-red-800 border-red-500/30 dark:text-red-300",
};

/** The dot shown for a toned value in a filter chip. */
export const DOTS: Record<EnumTone, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-sky-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

/** The option a stored value stands for (booleans by "true"/"false"). */
export function findOption(value: unknown, options?: Enum[]): Enum | undefined {
  if (!options?.length || value == null || value === "") return undefined;
  return options.find((option) => option.value === String(value));
}

/**
 * A custom colour as a badge: a soft tint of it with a matching border, and text mixed
 * toward the theme's text colour so it stays readable whatever colour was picked.
 */
export function customToneStyle(tone: string): CSSProperties {
  return {
    backgroundColor: `color-mix(in oklch, ${tone} 16%, transparent)`,
    borderColor: `color-mix(in oklch, ${tone} 45%, transparent)`,
    color: `color-mix(in oklch, ${tone} 55%, var(--foreground))`,
  };
}

/** An option with a `tone` (a base tone or a custom colour), as a small coloured badge. */
export function ValueBadge({ option, className }: { option: Enum & { tone: BadgeTone }; className?: string }) {
  const custom = isCustomTone(option.tone);
  return (
    <span
      title={option.label}
      style={custom ? customToneStyle(option.tone) : undefined}
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 text-xs font-medium leading-none",
        !custom && TONES[option.tone as EnumTone],
        className,
      )}
    >
      {option.label}
    </span>
  );
}

export function ToneDot({ tone }: { tone: BadgeTone }) {
  return isCustomTone(tone) ? (
    <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: tone }} />
  ) : (
    <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOTS[tone as EnumTone])} />
  );
}

/**
 * A badge rule for any column: when the row matches, the cell shows as a badge in `tone`
 * (with `label` instead of the cell's text, when given). The first matching rule wins;
 * no match leaves the cell as it is. Rules are plain data, so Studio writes and reads them.
 */
export interface BadgeRule<TLabel = string> {
  /** Field of the row to test; omitted: the column's own value. */
  field?: string;
  op: BadgeOperator;
  /** Compared value (eq, neq, gt, gte, lt, lte, contains). */
  value?: string | number | boolean;
  tone: BadgeTone;
  label?: TLabel;
}

export type BadgeOperator = "empty" | "set" | "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains";

export const BADGE_OPERATORS: BadgeOperator[] = ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "set", "empty"];

const isEmpty = (value: unknown) => value === null || value === undefined || value === "";

function compare(left: unknown, right: unknown): number | null {
  const a = typeof left === "number" ? left : Number(left);
  const b = typeof right === "number" ? right : Number(right);
  if (!Number.isNaN(a) && !Number.isNaN(b) && !isEmpty(left)) return a - b;
  if (isEmpty(left) || isEmpty(right)) return null;
  return String(left).localeCompare(String(right));
}

/** Whether a row matches a rule (`own` is the column's own value). */
export function matchesBadgeRule(rule: BadgeRule<unknown>, row: Record<string, unknown>, own: unknown): boolean {
  const value = rule.field ? row[rule.field] : own;
  switch (rule.op) {
    case "empty":
      return isEmpty(value);
    case "set":
      return !isEmpty(value);
    case "eq":
      return String(value ?? "") === String(rule.value ?? "");
    case "neq":
      return String(value ?? "") !== String(rule.value ?? "");
    case "contains":
      return !isEmpty(value) && String(value).toLowerCase().includes(String(rule.value ?? "").toLowerCase());
    default: {
      const order = compare(value, rule.value);
      if (order === null) return false;
      return rule.op === "gt" ? order > 0 : rule.op === "gte" ? order >= 0 : rule.op === "lt" ? order < 0 : order <= 0;
    }
  }
}

/** The first rule the row matches, if any. */
export function matchBadge<TLabel>(rules: BadgeRule<TLabel>[] | undefined, row: Record<string, unknown>, own: unknown) {
  return rules?.find((rule) => matchesBadgeRule(rule, row, own));
}
