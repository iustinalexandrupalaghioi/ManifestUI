"use client";

import { useTranslations } from "next-intl";
import type { Enum } from "@/framework/types/global/Enum";
import type { ColumnType } from "../../filtering/filters";
import { CellValueDisplay } from "../../../core/ui/CellValueDisplay";

interface GroupValueDisplayProps {
  value: unknown;
  type: ColumnType;
  options?: Enum[];
  bucket?: string;
}

// Renders a group's value the same way the real table cell would (icons,
// badges, file thumbnails, ...) via the shared CellValueDisplay, instead of
// the plain-text formatting a group label used before.
export function GroupValueDisplay({
  value,
  type,
  options,
  bucket,
}: GroupValueDisplayProps) {
  const t = useTranslations("Grouping");

  if (value === null || value === undefined || value === "") {
    return (
      <span className="text-muted-foreground italic">
        {t("emptyGroupValue")}
      </span>
    );
  }

  return <CellValueDisplay value={value} type={type} options={options} bucket={bucket} />;
}
