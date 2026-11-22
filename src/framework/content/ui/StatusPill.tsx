"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/framework/lib/utils";
import type { ContentStatus } from "../status";

const TONES: Record<ContentStatus, string> = {
  published: "border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
  "draft-changes": "border-warning/40 bg-warning/10 text-warning",
  "never-published": "border-border bg-muted text-muted-foreground",
  unpublished: "border-border bg-muted text-muted-foreground",
  "not-translated": "border-dashed border-border text-muted-foreground",
};

/** A content row's status as a coloured pill (§4.3). */
export function StatusPill({ status, suffix, className }: { status: ContentStatus; suffix?: string; className?: string }) {
  const t = useTranslations("Content.status");
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", TONES[status], className)}
    >
      {t(status)}
      {suffix && <span className="font-normal opacity-80">· {suffix}</span>}
    </span>
  );
}
