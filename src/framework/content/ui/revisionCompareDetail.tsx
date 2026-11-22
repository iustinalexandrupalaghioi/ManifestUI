"use client";

import { GitCompareIcon } from "lucide-react";
import { z } from "zod";
import { defineDetailComponent } from "@/framework/extensions";
import { RevisionCompare } from "./RevisionCompare";

/**
 * A version's page: compares the published version with what's being edited now (its content
 * type's row). For the versions resource's `afterForm` detail slot.
 */
export const revisionCompareDetail = defineDetailComponent({
  type: "revisionCompare",
  label: { en: "Version compared with the draft", ro: "Versiunea comparată cu ciorna" },
  icon: GitCompareIcon,
  props: z.object({}),
  component: function RevisionCompareDetail({ item }) {
    const row = (item ?? {}) as { type?: string; rowId?: string; data?: unknown };
    if (!row.type || !row.rowId) return null;
    return <RevisionCompare type={row.type} rowId={row.rowId} data={(row.data ?? {}) as Record<string, unknown>} />;
  },
});
