import type { ResourceRoutes } from "./resource-hook-types";
import type { TranslatableText } from "./i18n-types";
import type { ContentOptions } from "../content/options";

export interface ResourceDescriptor {
  id: string;
  table: string;
  description?: TranslatableText;
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
  /** Makes the resource a content type: drafts, publishing, locales, the content layer. */
  content?: ContentOptions;
  /**
   * Custom actions (toolbar buttons beyond add, save and delete). Each is a permission,
   * `<id>:<key>`, that groups can be granted; the button and its server action are the
   * resource's own (`actions.bulk`).
   */
  actions?: readonly ResourceCustomAction[];
}

export interface ResourceCustomAction {
  key: string;
  label: TranslatableText;
  /** Shown in red. */
  destructive?: boolean;
  /** Asked before it runs. */
  confirm?: TranslatableText;
}
