import type { ResourceRoutes } from "./resource-hook-types";
import type { TranslatableText } from "./i18n-types";

// Generic shape for a project's static, non-DB resource metadata — id, its
// backing table, display labels, routes, and view config — the framework
// only defines the contract; the actual list of resources (project-specific
// data) is supplied by the app, e.g. src/app/resourceDescriptors.ts.
export interface ResourceDescriptor {
  id: string;
  table: string;
  singular: TranslatableText;
  plural: TranslatableText;
  new: TranslatableText;
  // See ResourceLabels.gender — only meaningful for languages that inflect
  // past participles for it.
  gender?: "masculine" | "feminine" | "neuter";
  noun: string;
  queryKey: readonly string[];
  routes: ResourceRoutes;
  overviewKey: string;
  defaultViewName: TranslatableText;
}
