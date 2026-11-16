import { registerSections } from "@/modules/site";

/**
 * Section types for CMS-managed site pages, in "Add section" order. Sections
 * that need server data have their loader in ./data.ts. Add one with
 * `pnpm manifest section <name>` (guide: README › Building the website).
 */
export const sections = registerSections([]);
