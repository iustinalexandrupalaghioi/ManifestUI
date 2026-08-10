import type { ResourceRoutes } from "./resource-hook-types";
import type { TranslatableText } from "./i18n-types";

export interface ResourceDescriptor {
  id: string;
  table: string;
  singular: TranslatableText;
  singularDefinite?: TranslatableText;
  plural: TranslatableText;
  new: TranslatableText;
  gender?: "masculine" | "feminine" | "neuter";
  noun: string;
  queryKey: readonly string[];
  routes: ResourceRoutes;
  overviewKey: string;
  defaultViewName: TranslatableText;
}
