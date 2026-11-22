/**
 * Grid columns for content statuses: one select column per locale, read from
 * the `status_<locale>` field the list action adds (withContentStatuses).
 */
import type { Enum } from "@/framework/types/global/Enum";
import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { ContentStatus } from "./status";

const LABELS: Record<ContentStatus, { en: string; ro: string }> = {
  published: { en: "Published", ro: "Publicată" },
  "draft-changes": { en: "Draft changes", ro: "Modificări în ciornă" },
  "never-published": { en: "Never published", ro: "Nepublicată niciodată" },
  unpublished: { en: "Unpublished", ro: "Retrasă" },
  "not-translated": { en: "Not translated", ro: "Netradusă" },
};

const TONES: Record<ContentStatus, Enum["tone"]> = {
  published: "success",
  "draft-changes": "warning",
  "never-published": "neutral",
  unpublished: "neutral",
  "not-translated": "info",
};

/** The status pills' options (labels and tones) for a select column. */
export const contentStatusOptions = (locale: string): Enum[] =>
  (Object.keys(LABELS) as ContentStatus[]).map((status) => ({ value: status, label: resolveLabel(LABELS[status], locale), tone: TONES[status] }));

/** The key the list action stores a locale's status under. */
export const statusField = (locale: string) => `status_${locale}`;

/** One status column per locale ("EN", "RO"), for a content resource's grid and cards. */
export function contentStatusColumns(locales: readonly string[], options: { size?: number } = {}): ColumnConfig[] {
  return locales.map((locale) => ({
    field: statusField(locale),
    label: locale.toUpperCase(),
    type: "select",
    selectOptions: contentStatusOptions,
    size: options.size ?? 130,
  })) as ColumnConfig[];
}
