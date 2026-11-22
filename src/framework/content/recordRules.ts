/**
 * What a content type's record page offers, as pure rules (tested directly;
 * the detail page and the toolbar's language switch use them).
 */
import type { ContentOptions } from "./options";
import type { ContentStatus } from "./status";

/** A singleton ("single entry") has one row per locale: no list, no Add, no Delete. */
export function recordActions(options: Pick<ContentOptions, "kind"> | undefined) {
  const single = options?.kind === "singleton";
  return { hasList: !single, allowAdd: !single, allowDelete: !single };
}

export interface LocaleChoice {
  locale: string;
  /** The entry's row in this locale, or null when it isn't translated. */
  rowId: string | null;
  status: ContentStatus;
  current: boolean;
}

/**
 * The language switch: one choice per configured locale, the current row
 * marked, missing translations with `rowId: null` (they offer Add translation).
 */
export function localeChoices(
  state: { row: { locale: string; rowId: string }; locales: Record<string, { rowId: string | null; status: ContentStatus }> },
  locales: readonly string[],
): LocaleChoice[] {
  return locales.map((locale) => {
    const known = state.locales[locale];
    const current = locale === state.row.locale;
    return {
      locale,
      rowId: current ? state.row.rowId : (known?.rowId ?? null),
      status: known?.status ?? "not-translated",
      current,
    };
  });
}

interface TabLike {
  type?: string;
  value: string;
  sections?: readonly unknown[];
  formTab?: string;
}

/** A free layout's nodes (and their children, panes, columns) hold a field named `field`. */
const nodeHas = (nodes: readonly unknown[], field: string): boolean =>
  nodes.some((node) => {
    const value = node as { name?: string; children?: unknown[]; tabs?: { children: unknown[] }[]; props?: { name?: unknown } };
    if (value.name === field || (typeof value.props?.name === "string" && value.props.name.split(".")[0] === field)) return true;
    return nodeHas(value.children ?? [], field) || (value.tabs ?? []).some((pane) => nodeHas(pane.children, field));
  });

const sectionHas = (section: unknown, field: string): boolean => {
  const value = section as { fields?: { name?: string }[]; props?: { name?: unknown } };
  if (value.fields?.some((item) => item.name === field)) return true;
  return typeof value.props?.name === "string" && value.props.name.split(".")[0] === field;
};

/** The fields tab that holds a form field ("sections.3.content.title" → the tab with `sections`), for the preview's click-to-edit. */
export function tabForField(tabs: readonly TabLike[], formName: string, formLayout?: unknown): string | undefined {
  const field = formName.split(".")[0];
  const fieldTabs = tabs.filter((tab) => tab.type === "fields");
  // Tabs that are panes of the form's top-level tabs: the pane whose fields include it.
  const layout = formLayout as { mode?: string; root?: { type?: string; tabs?: { key: string; children: unknown[] }[] } } | undefined;
  const panes = layout?.mode === "free" && layout.root?.type === "tabs" ? (layout.root.tabs ?? []) : [];
  const paneTab = fieldTabs.find((tab) => tab.formTab && nodeHas(panes.find((item) => item.key === tab.formTab)?.children ?? [], field));
  if (paneTab) return paneTab.value;
  // A tab without sections shows the whole form, so it holds any field another tab doesn't.
  return (fieldTabs.find((tab) => tab.sections?.some((section) => sectionHas(section, field))) ?? fieldTabs.find((tab) => !tab.sections))?.value;
}
