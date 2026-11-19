"use client";

import { useId } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/framework/lib/utils";
import { useDataViewCore } from "../../../core/stores/DataViewProvider";
import { useCoreStore } from "../../../core/stores/DataViewStore";

/** The quick search as an always-visible field, for the page toolbar. */
export function QuickSearchField({ className }: { className?: string }) {
  const t = useTranslations("DataView");
  const id = useId();
  const { tableId } = useDataViewCore();
  const globalFilter = useCoreStore(tableId, (s) => s.globalFilter);
  const setGlobalFilter = useCoreStore(tableId, (s) => s.setGlobalFilter);

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {t("search")}
      </label>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id={id}
        type="search"
        placeholder={t("searchPlaceholder")}
        value={globalFilter}
        onChange={(event) => setGlobalFilter(event.target.value)}
        className="h-10 bg-background pr-8 pl-8 sm:h-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {globalFilter && (
        <button
          type="button"
          aria-label={t("clearSearch")}
          onClick={() => setGlobalFilter("")}
          className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  );
}
