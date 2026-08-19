"use client";

import { Button } from "@/components/ui/button";
import { FileSearch } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/framework/lib/utils";

export function ToolbarOpenButton<TData>({
  onOpen,
  selectedRows,
  selectedCount,
  canOpen,
  openUrl,
  styles,
}: {
  onOpen: (rows: TData[]) => void;
  selectedRows: TData[];
  selectedCount: number;
  canOpen: boolean;
  openUrl?: string;
  styles: { button?: string; icon: string; labeled: boolean };
}) {
  const t = useTranslations("Toolbar");
  const isMulti = selectedCount > 1;

  const handleClick = (e: React.MouseEvent) => {
    const isModified =
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
    if (openUrl && isModified) return;
    e.preventDefault();
    onOpen(selectedRows);
  };

  const button = (
    <Button
      title={
        isMulti ? t("openSelectedCount", { count: selectedCount }) : t("open")
      }
      variant="outline"
      type="button"
      size={isMulti || styles.labeled ? "sm" : "icon"}
      className={isMulti ? undefined : styles.button}
      disabled={!canOpen}
      onClick={handleClick}
    >
      <FileSearch className={cn(styles.icon, "shrink-0")} />
      {styles.labeled && t("open")}
      {isMulti && (
        <span className="ml-1 text-xs text-muted-foreground tabular-nums">
          {selectedCount}
        </span>
      )}
    </Button>
  );

  return openUrl ? <Link href={openUrl}>{button}</Link> : button;
}
