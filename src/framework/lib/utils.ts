import type { Enum } from "@/framework/types/global/Enum";
import { clsx, type ClassValue } from "clsx";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { twMerge } from "tailwind-merge";
import type { ColumnType } from "../components/data-view/features/filtering";

const TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "Europe/Bucharest";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const formatByType = (
  value: unknown,
  type: ColumnType,
  options?: Enum[],
): string => {
  if (value == null || value === "") return "";
  if (type === "boolean") return value ? "Yes" : "No";
  if (type === "select")
    return options?.find((o) => o.value === value)?.label ?? String(value);
  if (type === "date") return format(new Date(value as string), "dd-MM-yyyy");
  if (type === "datetime")
    return formatInTimeZone(
      parseISO(value as string),
      TZ,
      "dd-MM-yyyy HH:mm:ss",
    );
  if (type === "time") return (value as string).slice(0, 8);
  if (type === "json") {
    const parsed = typeof value === "string" ? safeJsonParse(value) : value;
    if (parsed == null) return String(value);
    return JSON.stringify(parsed);
  }
  return String(value);
};

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function createEnum<T extends string>(config: Record<T, string>) {
  const values = Object.keys(config) as T[];
  return {
    values,
    labels: config as Record<T, string>,
    options: values.map((v) => ({ value: v, label: config[v] })),
  };
}
