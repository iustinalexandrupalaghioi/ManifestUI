import type { GroupableColumn, GroupByRule } from "../grouping";
import type { AggregatableColumn, AggregateFunction, AggregateRule } from "../../aggregates/aggregates";
import { AGGREGATES_BY_TYPE } from "../../aggregates/aggregates";

/** The Group by panel's editable copy of the grouping, before Apply. */
export interface DraftAggregateRule {
  _key: number;
  columnId: string;
  fn: AggregateFunction;
}

export interface DraftLevel {
  _key: number;
  columnId: string;
  showTotals: boolean;
  aggregates: DraftAggregateRule[];
}

let keyCounter = 0;
function nextKey() {
  return ++keyCounter;
}

export function makeAggregateDraft(col: AggregatableColumn): DraftAggregateRule {
  const fn = AGGREGATES_BY_TYPE[col.type]?.[0];
  return { _key: nextKey(), columnId: col.id, fn };
}

function aggregateDraftFromExisting(rule: AggregateRule): DraftAggregateRule {
  return { _key: nextKey(), columnId: rule.columnId, fn: rule.fn };
}

export function makeDraft(col: GroupableColumn): DraftLevel {
  return {
    _key: nextKey(),
    columnId: col.id,
    showTotals: false,
    aggregates: [],
  };
}

export function levelFromExisting(rule: GroupByRule): DraftLevel {
  return {
    _key: nextKey(),
    columnId: rule.columnId,
    showTotals: rule.showTotals ?? false,
    aggregates: (rule.aggregates ?? []).map(aggregateDraftFromExisting),
  };
}

/** The grouping rules the drafts describe; levels or totals whose column no longer exists are dropped. */
export function draftsToGrouping(
  drafts: DraftLevel[],
  groupableColumns: GroupableColumn[],
  aggregatableColumns: AggregatableColumn[],
): GroupByRule[] {
  return drafts
    .map((d): GroupByRule | null => {
      const col = groupableColumns.find((c) => c.id === d.columnId);
      if (!col) return null;
      const aggregates: AggregateRule[] = d.aggregates
        .map((a): AggregateRule | null => {
          const aggCol = aggregatableColumns.find((c) => c.id === a.columnId);
          if (!aggCol) return null;
          return {
            columnId: aggCol.id,
            columnName: aggCol.dbName,
            columnLabel: aggCol.name,
            columnType: aggCol.type,
            ...(aggCol.origin ? { origin: aggCol.origin } : {}),
            fn: a.fn,
          };
        })
        .filter((r): r is AggregateRule => r !== null);
      return {
        columnId: col.id,
        columnName: col.dbName,
        columnLabel: col.name,
        columnType: col.type,
        ...(col.origin ? { origin: col.origin } : {}),
        showTotals: d.showTotals,
        ...(aggregates.length > 0 ? { aggregates } : {}),
      };
    })
    .filter((r): r is GroupByRule => r !== null);
}
