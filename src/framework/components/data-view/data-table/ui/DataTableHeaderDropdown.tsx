import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowDownIcon,
  ArrowDownZaIcon,
  ArrowUpAzIcon,
  ArrowUpIcon,
  EyeOffIcon,
  FilterIcon,
  PinIcon,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"
import type { Enum } from "@/framework/types/global/Enum"
import type { ColumnType } from "../../features/filtering/filters"
import type { SortRule } from "@/framework/components/data-view/core/tanstack-augmentations"

interface DataTableHeaderDropdownProps {
  columnId: string
  columnLabel: string | null
  columnType: ColumnType | null
  canSort: boolean
  sorting: SortRule[]
  sortRule: SortRule | null
  sortIndex: number
  isMultiSort: boolean
  onPrimarySort: (columnId: string, desc: boolean) => void
  onAlsoSort: (columnId: string, desc: boolean) => void
  onClearSort: (columnId: string) => void
  origin?: string
  handleOpenFilterDrawer: (
    columnId: string,
    columnType: ColumnType | null,
    selectOptions?: Enum[],
    columnLabel?: string | null,
    origin?: string
  ) => void
  selectOptions?: Enum[]
  canFilter?: boolean
  locked?: boolean
  onHide?: () => void
  onTogglePin?: () => void
  isPinned?: boolean
  canHide?: boolean
}

export function DataTableHeaderDropdown({
  columnId,
  columnType,
  columnLabel,
  canSort,
  sorting,
  sortRule,
  sortIndex,
  isMultiSort,
  onPrimarySort,
  onAlsoSort,
  onClearSort,
  handleOpenFilterDrawer,
  selectOptions,
  canFilter = true,
  locked = false,
  origin,
  canHide,
  isPinned,
  onTogglePin,
  onHide,
}: DataTableHeaderDropdownProps) {
  const t = useTranslations("DataTable")
  const SortIcon = sortRule
    ? sortRule.desc
      ? ArrowDownIcon
      : ArrowUpIcon
    : null
  if (!canSort && (!canFilter || locked)) {
    return <span className="px-0.5">{columnLabel}</span>
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="flex min-w-0 cursor-pointer items-center gap-0.5 overflow-hidden rounded focus:outline-none">
          <span className="truncate">{columnLabel}</span>
          {SortIcon && <SortIcon className="h-3 w-3 shrink-0" />}
          {isMultiSort && sortRule && (
            <span className="shrink-0 text-[10px] leading-none">
              {sortIndex + 1}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-44">
        {canSort && (
          <>
            {sortRule?.desc !== false ? (
              <DropdownMenuItem onClick={() => onPrimarySort(columnId, false)}>
                <ArrowUpAzIcon className="mr-2 h-3.5 w-3.5" />
                {t("sortAscending")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onClearSort(columnId)}>
                <X className="mr-2 h-3.5 w-3.5" />
                {t("removeSort")}
              </DropdownMenuItem>
            )}

            {sortRule?.desc !== true ? (
              <DropdownMenuItem onClick={() => onPrimarySort(columnId, true)}>
                <ArrowDownZaIcon className="mr-2 h-3.5 w-3.5" />
                {t("sortDescending")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onClearSort(columnId)}>
                <X className="mr-2 h-3.5 w-3.5" />
                {t("removeSort")}
              </DropdownMenuItem>
            )}

            {sorting.length > 0 && (
              <>
                <DropdownMenuItem
                  onClick={() => onAlsoSort(columnId, false)}
                  disabled={sortRule?.desc === false && !isMultiSort}
                >
                  <ArrowUpAzIcon className="mr-2 h-3.5 w-3.5" />
                  {t("alsoSortAscending")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onAlsoSort(columnId, true)}
                  disabled={sortRule?.desc === true && !isMultiSort}
                >
                  <ArrowDownZaIcon className="mr-2 h-3.5 w-3.5" />
                  {t("alsoSortDescending")}
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
        {canFilter && !locked && (
          <DropdownMenuItem
            onSelect={() =>
              handleOpenFilterDrawer(
                columnId,
                columnType,
                selectOptions,
                columnLabel ?? columnId,
                origin
              )
            }
          >
            <FilterIcon className="mr-2 h-3.5 w-3.5" />
            {t("addFilter")}
          </DropdownMenuItem>
        )}
        {(canHide || onTogglePin) && <DropdownMenuSeparator />}
        {onTogglePin && (
          <DropdownMenuItem onClick={onTogglePin}>
            <PinIcon className="mr-2 h-3.5 w-3.5" />
            {isPinned ? t("unpinColumn") : t("pinColumn")}
          </DropdownMenuItem>
        )}
        {canHide && onHide && (
          <DropdownMenuItem onClick={onHide}>
            <EyeOffIcon className="mr-2 h-3.5 w-3.5" />
            {t("hideColumn")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
