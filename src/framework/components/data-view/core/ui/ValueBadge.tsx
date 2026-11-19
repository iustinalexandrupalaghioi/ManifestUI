import { cn } from "@/framework/lib/utils";
import type { Enum, EnumTone } from "@/framework/types/global/Enum";

/** Tinted background, text that keeps 4.5:1 on it in both themes. */
const TONES: Record<EnumTone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-sky-500/15 text-sky-800 border-sky-500/30 dark:text-sky-300",
  success: "bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-900 border-amber-500/30 dark:text-amber-300",
  danger: "bg-red-500/15 text-red-800 border-red-500/30 dark:text-red-300",
};

/** The dot shown for a toned value in a filter chip. */
const DOTS: Record<EnumTone, string> = {
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

/** An option with a `tone`, as a small coloured badge. */
export function ValueBadge({ option, className }: { option: Enum & { tone: EnumTone }; className?: string }) {
  return (
    <span
      title={option.label}
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-full border px-2 py-0.5 text-xs font-medium leading-none",
        TONES[option.tone],
        className,
      )}
    >
      {option.label}
    </span>
  );
}

export function ToneDot({ tone }: { tone: EnumTone }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOTS[tone])} />;
}
