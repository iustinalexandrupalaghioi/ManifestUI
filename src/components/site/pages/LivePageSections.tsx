"use client";

import { useEffect } from "react";
import { parseBlocks, type StoredBlock } from "@/framework/content/blocks";
import { RenderBlocks } from "@/framework/content/ui/RenderBlocks";
import { enablePreviewSelect, useLivePreview } from "@/framework/preview/client";
import { allBlocks } from "@/content/blocks";
import { blockComponents } from "@/components/site/blocks";

const isEntry = (value: unknown): value is { entryId: string } => !!value && typeof value === "object" && "entryId" in value;

/**
 * Keeps resolved references while the editor types: the draft holds entry ids,
 * the server rendered the entries. An id that was already shown keeps its entry;
 * a newly picked one appears after Save draft.
 */
function keepResolved(next: StoredBlock[], initial: StoredBlock[]): StoredBlock[] {
  const byId = new Map(initial.map((block) => [block.id, block.content as Record<string, unknown>]));
  return next.map((block) => {
    const before = byId.get(block.id);
    if (!before) return block;
    const content = { ...(block.content as Record<string, unknown>) };
    for (const [key, value] of Object.entries(content)) {
      const shown = before[key];
      if (Array.isArray(value) && Array.isArray(shown) && shown.some(isEntry))
        content[key] = value.flatMap((id) => (typeof id === "string" ? (shown.find((entry) => isEntry(entry) && entry.entryId === id) ?? []) : [id]));
    }
    return { ...block, content };
  });
}

/**
 * A page's blocks in the CMS preview (draft mode only): rendered in the browser
 * with the draft the editor is typing, texts marked so a click opens their
 * field in the CMS. Visitors get the static, server-rendered page instead.
 */
export function LivePageSections({
  sections,
  data,
  entryId,
  locale,
}: {
  sections: StoredBlock[];
  data: Record<string, unknown>;
  entryId: string;
  locale: string;
}) {
  const live = useLivePreview(sections, {
    type: "page",
    entryId,
    locale,
    map: (draft) => keepResolved(parseBlocks(draft.sections, allBlocks), sections),
  });
  useEffect(() => enablePreviewSelect(), []);
  return <RenderBlocks blocks={live} components={blockComponents} data={data} preview={{ field: "sections" }} />;
}
