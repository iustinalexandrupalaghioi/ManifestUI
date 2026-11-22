"use client";

import { useTranslations } from "next-intl";
import { Loader2Icon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { diffFields } from "../diff";
import { useContentState } from "./ContentControls";

/**
 * A version's page (content revisions): its fields compared with what the
 * entry has now (its draft, else the row), one row per changed field.
 */
export function RevisionCompare({ type, rowId, data }: { type: string; rowId: string; data: Record<string, unknown> }) {
  const t = useTranslations("Content.historyPane");
  const state = useContentState(type, rowId);
  if (!state.data) return state.isLoading ? <Loader2Icon className="size-5 animate-spin text-muted-foreground" aria-hidden /> : null;
  const changes = diffFields(data, state.data.data);
  const show = (value: string | null) => (value === null || value === "" ? <em className="text-muted-foreground">{t("empty_value")}</em> : value);
  return (
    <section className="flex flex-col gap-2 py-4" aria-label={t("compareTitle")}>
      <h2 className="m-0 text-base font-medium text-primary">{t("compareTitle")}</h2>
      {changes.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">{t("noDifferences")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("field")}</TableHead>
              <TableHead>{t("thisVersion")}</TableHead>
              <TableHead>{t("editing")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {changes.map((change) => (
              <TableRow key={change.path} className="align-top">
                <TableCell className="font-mono text-xs">{change.path}</TableCell>
                <TableCell className="max-w-md text-sm break-words whitespace-pre-wrap">{show(change.before)}</TableCell>
                <TableCell className="max-w-md text-sm break-words whitespace-pre-wrap">{show(change.after)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
