import { getBlockExtension } from "@/framework/extensions/registry";
import type {
  FieldConfig,
  FormConfig,
  FormRegions,
  LayoutNode,
  PickupConfig,
  SectionConfig,
} from "../types/types";

/** `type` values that are layout/content nodes rather than form fields. */
export const NON_FIELD_TYPES = new Set([
  "grid",
  "row",
  "column",
  "card",
  "heading",
  "divider",
  "text",
  "spacer",
  "slot",
  "tabs",
  "list",
  "pickupvalue",
  "button",
  "buttons",
]);

export function isFieldNode<T>(node: LayoutNode<T>): node is FieldConfig<T> {
  return !NON_FIELD_TYPES.has(node.type) && !getBlockExtension(node.type);
}

function childrenOf<T>(node: LayoutNode<T>): LayoutNode<T>[] {
  switch (node.type) {
    case "grid":
    case "row":
    case "column":
    case "card":
    case "buttons":
      return node.children as LayoutNode<T>[];
    case "tabs":
      return node.tabs.flatMap((t) => t.children) as LayoutNode<T>[];
    default:
      return [];
  }
}

/** Depth-first walk. `parent` is the container the node sits in. */
export function walkLayout<T>(
  node: LayoutNode<T>,
  visit: (node: LayoutNode<T>, parent?: LayoutNode<T>) => void,
  parent?: LayoutNode<T>,
): void {
  visit(node, parent);
  if (node.type === "card" && node.actions) {
    node.actions.forEach((a) => walkLayout(a as LayoutNode<T>, visit, node));
  }
  childrenOf(node).forEach((child) => walkLayout(child, visit, node));
}

function regionNodes<T>(regions?: FormRegions<T>): LayoutNode<T>[] {
  if (!regions) return [];
  return [
    ...(regions.header?.left ?? []),
    ...(regions.header?.center ?? []),
    ...(regions.header?.right ?? []),
    ...(regions.footer?.children ?? []),
    ...(regions.floating?.children ?? []),
  ];
}

function fieldsOfSections<T>(sections: SectionConfig<T>[]): FieldConfig<T>[] {
  return sections.flatMap((s) => {
    if (s.type === "slot") return [];
    return s.fields ?? [];
  });
}

/** `name` → pickup config, for every field with a `pickup` in a free layout. */
export function collectPickups<T>(
  root: LayoutNode<T>,
  regions?: FormRegions<T>,
): Record<string, PickupConfig<T>> {
  const out: Record<string, PickupConfig<T>> = {};
  const visit = (node: LayoutNode<T>) => {
    if (isFieldNode(node) && node.type !== "custom" && node.type !== "file") {
      const pickup = (node as { pickup?: PickupConfig<T> }).pickup;
      if (pickup) out[pickup.targetField] = pickup;
    }
  };
  walkLayout(root, visit);
  regionNodes(regions).forEach((n) => walkLayout(n, visit));
  return out;
}

/** Every field declared anywhere in a form config, whatever the layout mode. */
export function collectFormFields<T>(
  formConfig: FormConfig<T> | undefined,
): FieldConfig<T>[] {
  if (!formConfig) return [];
  const { layout } = formConfig;
  const out: FieldConfig<T>[] = [];

  if (layout.mode === "stack") {
    out.push(...fieldsOfSections(layout.sections));
  } else if (layout.mode === "grid") {
    layout.columns.forEach((c) => out.push(...fieldsOfSections(c.sections)));
  } else {
    const visit = (node: LayoutNode<T>) => {
      if (isFieldNode(node)) {
        out.push(node);
        if (node.type === "custom" && node.fields) out.push(...node.fields);
      } else {
        out.push(...((node as { fields?: FieldConfig<T>[] }).fields ?? []));
      }
    };
    walkLayout(layout.root, visit);
  }

  regionNodes(formConfig.regions).forEach((n) =>
    walkLayout(n, (node) => {
      if (isFieldNode(node)) out.push(node);
    }),
  );
  return out;
}

// ─────────────────────────────────────────────
// Dev-time validation
// ─────────────────────────────────────────────

/** Extracts the row/column names out of a `grid-template-areas` string. */
export function parseAreas(areas: string): string[][] {
  const rows = areas.match(/"[^"]*"|'[^']*'/g);
  const source = rows ? rows.map((r) => r.slice(1, -1)) : [areas];
  return source.map((r) => r.trim().split(/\s+/).filter(Boolean));
}

/**
 * Returns human-readable problems with a free layout. Called once in
 * development; never throws.
 */
export function validateFreeLayout<T>(
  root: LayoutNode<T>,
  regions?: FormRegions<T>,
): string[] {
  const problems: string[] = [];
  const buttonKeys = new Set<string>();
  const nodeKeys = new Set<string>();
  const fieldNames = new Set<string>();
  const pickupTargets = new Set(Object.keys(collectPickups(root, regions)));

  const check = (node: LayoutNode<T>, parent?: LayoutNode<T>) => {
    if (node.key) {
      if (nodeKeys.has(node.key))
        problems.push(`Duplicate node key "${node.key}".`);
      nodeKeys.add(node.key);
    }

    if (node.type === "button") {
      if (buttonKeys.has(node.key))
        problems.push(`Duplicate button key "${node.key}".`);
      buttonKeys.add(node.key);
    }

    if (isFieldNode(node) && node.type !== "readonly" && node.type !== "custom") {
      const name = (node as { name?: string }).name;
      if (name) {
        if (fieldNames.has(name))
          problems.push(
            `Field "${name}" appears more than once; both would edit the same value.`,
          );
        fieldNames.add(name);
      }
    }

    if (node.type === "pickupvalue" && !pickupTargets.has(node.target)) {
      problems.push(
        `pickupvalue "${node.from}" targets "${node.target}", but no field with a pickup on "${node.target}" exists.`,
      );
    }
    if (node.type === "tabs") {
      const seen = new Set<string>();
      node.tabs.forEach((t) => {
        if (seen.has(t.key)) problems.push(`Duplicate tab key "${t.key}".`);
        seen.add(t.key);
      });
    }

    if (node.area) {
      if (parent?.type !== "grid") {
        problems.push(
          `Node "${node.key ?? node.type}" uses area "${node.area}" but its parent is not a grid.`,
        );
      } else if (typeof parent.areas === "string") {
        const known = new Set(parseAreas(parent.areas).flat());
        if (!known.has(node.area))
          problems.push(
            `Area "${node.area}" is not defined in the parent grid's areas.`,
          );
      }
    }

    if (
      (node.span !== undefined || node.col !== undefined || node.row !== undefined) &&
      parent &&
      parent.type !== "grid"
    ) {
      problems.push(
        `Node "${node.key ?? node.type}" sets span/col/row but its parent is a ${parent.type}, not a grid; they are ignored.`,
      );
    }
  };

  walkLayout(root, check);
  regionNodes(regions).forEach((n) => walkLayout(n, check));

  // save/reset belong to the page toolbar; don't float them over the form.
  const warnToolbarButtons = (nodes: LayoutNode<T>[], where: string) =>
    nodes.forEach((n) =>
      walkLayout(n, (node) => {
        if (node.type === "button" && (node.action === "save" || node.action === "reset"))
          problems.push(
            `Button "${node.key}" (${node.action}) is in the ${where}; save and reset already live in the page toolbar.`,
          );
      }),
    );
  if (regions?.floating) warnToolbarButtons(regions.floating.children, "floating region");
  if (regions?.footer?.sticky) warnToolbarButtons(regions.footer.children, "sticky footer");
  return problems;
}
