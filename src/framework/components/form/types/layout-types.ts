import type { CSSProperties, ReactElement, ReactNode } from "react";
import type { TranslatableText } from "@/framework/types/i18n-types";
import type { EnumOptions } from "@/framework/lib/resolveLabel";
import type { FieldCondition, FieldConfig } from "./types";
import type { BlockExtensionRef } from "@/framework/extensions/registry";

/**
 * Free-form layout model (`layout: { mode: "free", root }`).
 *
 * Everything on the form — fields, buttons, headings, containers — is a
 * `LayoutNode`. Every node accepts the same placement props (`Placement`),
 * and containers nest to any depth. See `docs/form-layout.md` for the full
 * guide with examples.
 */

// ─────────────────────────────────────────────
// Responsive values
// ─────────────────────────────────────────────

/** Container-width breakpoints. `base` applies at every width. */
export type Breakpoint = "base" | "sm" | "md" | "lg" | "xl";

export type ResponsiveObject<T> = Partial<Record<Breakpoint, T>>;

/**
 * A value that can change with the width of the *parent container*
 * (not the viewport). Either a plain value, or an object keyed by
 * breakpoint: `{ base: 1, md: 2, lg: 4 }` — "mobile-first": a value applies
 * from its breakpoint upward until a larger breakpoint overrides it.
 */
export type Resp<T> = T | ResponsiveObject<T>;

// ─────────────────────────────────────────────
// Placement (shared by EVERY node)
// ─────────────────────────────────────────────

export type Align = "start" | "center" | "end" | "stretch";

export interface Placement {
  /** Optional stable id. Used for React keys and duplicate detection in dev. */
  key?: string;

  // ── Grid parent ──
  /** Columns to span in a `grid` parent. */
  span?: Resp<number>;
  /** Rows to span in a `grid` parent. */
  rowSpan?: Resp<number>;
  /** 1-based start column in a `grid` parent; `"auto"` = normal flow (unpins a smaller size's value). */
  col?: Resp<number | "auto">;
  /** 1-based start row in a `grid` parent; `"auto"` = normal flow. */
  row?: Resp<number | "auto">;
  /** Named area in the parent grid's `areas` template. Overrides span/col/row. */
  area?: string;

  // ── Any parent ──
  /** Hide on these sizes, e.g. `{ base: true, md: false }`; stays mounted so form state is kept. */
  hideOn?: Resp<boolean>;
  /** Visual order within the parent (CSS `order`). */
  order?: Resp<number>;
  /** Stacking order for overlapping grid items (CSS `z-index`). */
  zIndex?: Resp<number>;
  /** Cross-axis alignment of this node inside its parent. */
  alignSelf?: Resp<Align>;
  /** Inline-axis alignment (grid parents only). */
  justifySelf?: Resp<Align>;

  // ── Flex parent (`row` / `column`) ──
  /** Flex-grow factor. */
  grow?: Resp<number>;
  /** Flex-basis (number = px, string = any CSS size). */
  basis?: Resp<number | string>;

  /** Hide the node. A function receives `{ ...item, ...liveFormValues }`. */
  hidden?: boolean | FieldCondition;
  className?: string;
  style?: CSSProperties;
}

// ─────────────────────────────────────────────
// Containers
// ─────────────────────────────────────────────

export interface GridContainerNode<TFormValues = any> extends Placement {
  type: "grid";
  /**
   * Number of equal columns, or a CSS `grid-template-columns` string
   * (`"2fr 1fr"`, `"200px 1fr"`). Defaults to the number of columns found in
   * `areas`, or 1.
   */
  cols?: Resp<number | string>;
  /** CSS `grid-template-rows`. */
  rows?: Resp<string>;
  /** CSS `grid-template-areas`, e.g. `'"a a b" "c d b"'`. Can change per breakpoint. */
  areas?: Resp<string>;
  /** Gap in spacing units (1 = 0.25rem). Default 4. */
  gap?: Resp<number>;
  rowGap?: Resp<number>;
  colGap?: Resp<number>;
  children: LayoutNode<TFormValues>[];
}

export type FlexAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type FlexJustify = "start" | "center" | "end" | "between" | "around";

export interface StackContainerNode<TFormValues = any> extends Placement {
  /** `row` lays children out horizontally, `column` vertically. */
  type: "row" | "column";
  /** Gap in spacing units (1 = 0.25rem). Default 4. */
  gap?: Resp<number>;
  wrap?: boolean;
  align?: Resp<FlexAlign>;
  justify?: Resp<FlexJustify>;
  /** `row` only: switch to a vertical stack when the container is narrower than this. */
  stackBelow?: Exclude<Breakpoint, "base">;
  children: LayoutNode<TFormValues>[];
}

export interface CardNode<TFormValues = any> extends Placement {
  type: "card";
  title?: TranslatableText;
  description?: TranslatableText;
  /** Buttons rendered in the card header, right-aligned. */
  actions?: ButtonNode<TFormValues>[];
  /** Show a chevron that collapses the body. Content stays mounted. */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Draw the border and padding. Default true. */
  bordered?: boolean;
  /** Gap between children, in spacing units. Default 4. */
  gap?: Resp<number>;
  children: LayoutNode<TFormValues>[];
}

export type ContainerNode<TFormValues = any> =
  | GridContainerNode<TFormValues>
  | StackContainerNode<TFormValues>
  | CardNode<TFormValues>;

// ─────────────────────────────────────────────
// Content nodes
// ─────────────────────────────────────────────

export interface HeadingNode extends Placement {
  type: "heading";
  text: TranslatableText;
  description?: TranslatableText;
  /** 1 (largest) to 4 (smallest). Default 2. */
  level?: 1 | 2 | 3 | 4;
}

export interface DividerNode extends Placement {
  type: "divider";
  label?: TranslatableText;
}

export type TextTone =
  | "default"
  | "muted"
  | "info"
  | "success"
  | "warning"
  | "destructive";

export interface TextNode extends Placement {
  type: "text";
  /** Static text, or a function of `{ ...item, ...liveFormValues }` for dynamic content. */
  text: TranslatableText | ((ctx: Record<string, unknown>) => ReactNode);
  /** `default`/`muted` render plain text; the others render a tinted callout box. */
  tone?: TextTone;
  size?: "xs" | "sm" | "md";
}

/** An empty cell — pushes neighbours around without drawing anything. */
export interface SpacerNode extends Placement {
  type: "spacer";
}

/** Renders `slots[name]` passed to `<ResourceForm slots={...}>`. */
export interface SlotNode extends Placement {
  type: "slot";
  name: string;
}

// ─────────────────────────────────────────────
// Buttons
// ─────────────────────────────────────────────

export type ButtonIconName =
  | "save"
  | "reset"
  | "back"
  | "plus"
  | "trash"
  | "check"
  | "x"
  | "print"
  | "download"
  | "upload"
  | "send"
  | "edit"
  | "copy"
  | "external"
  | "refresh"
  | "search"
  | "view"
  | "settings"
  | "more";

/** Built-in actions wired to the surrounding `<FormPage>`. */
export type ButtonBuiltinAction = "save" | "reset" | "back";

/** What a button's callbacks receive. */
export interface ButtonContext<TFormValues = any> {
  /** Live form values. */
  values: Partial<TFormValues>;
  /** The record the form was opened with (undefined on add screens). */
  item?: Record<string, unknown>;
  isDirty: boolean;
  isSaving: boolean;
  /** True when the form is inside a `<FormPage>` (so save/reset exist). */
  hasFormPage: boolean;
  setValue: (
    name: keyof TFormValues & string,
    value: unknown,
    options?: { shouldDirty?: boolean; shouldValidate?: boolean },
  ) => void;
  getValues: () => Partial<TFormValues>;
  /** Triggers the page's save. No-op outside a `<FormPage>`. */
  save: () => void;
  /** Resets the form through the page's reset handler (dirty-guarded). */
  reset: () => void;
  navigate: (path: string) => void;
  back: () => void;
  /**
   * Opens one of the resource's `actions.forms` dialogs by key. Only works on
   * a detail page whose resource declares that action form (and when the
   * record is eligible for it); otherwise a no-op.
   */
  openActionForm: (key: string) => void;
}

export interface ButtonNode<TFormValues = any> extends Placement {
  type: "button";
  /** Required, unique within the form. */
  key: string;
  label?: TranslatableText;
  /** A built-in icon name, or your own element (e.g. `<MyIcon className="size-4" />`). */
  icon?: ButtonIconName | ReactElement;
  /** Render the icon after the label. */
  iconPosition?: "start" | "end";
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  /** Stretch to fill its cell. */
  fullWidth?: boolean;
  /** Native tooltip. */
  tooltip?: TranslatableText;
  /** ORed with the built-in disabled rule of `save`/`reset`. */
  disabled?: boolean | ((ctx: ButtonContext<TFormValues>) => boolean);
  loading?: boolean | ((ctx: ButtonContext<TFormValues>) => boolean);
  /** Ask for confirmation before running the action. */
  confirm?: {
    title: TranslatableText;
    message?: TranslatableText;
    confirmLabel?: TranslatableText;
  };
  action:
    | ButtonBuiltinAction
    | { navigate: string | ((ctx: ButtonContext<TFormValues>) => string) }
    /** Opens a resource action form (`actions.forms[].key`) in its dialog. */
    | { actionForm: string }
    | { run: (ctx: ButtonContext<TFormValues>) => void | Promise<void> };
}

export interface ButtonGroupNode<TFormValues = any> extends Placement {
  type: "buttons";
  align?: "start" | "center" | "end" | "between";
  /** Gap in spacing units. Default 2. */
  gap?: number;
  wrap?: boolean;
  children: ButtonNode<TFormValues>[];
}

/** One pane of a `tabs` container. */
export interface TabPane<TFormValues = any> {
  key: string;
  label: TranslatableText;
  children: LayoutNode<TFormValues>[];
}

/**
 * Tabbed container. Every pane stays mounted (inactive ones are hidden), so
 * fields in other tabs keep their values and validation state.
 */
export interface TabsNode<TFormValues = any> extends Placement {
  type: "tabs";
  tabs: TabPane<TFormValues>[];
  /** Key of the pane open first. Defaults to the first pane. */
  defaultTab?: string;
  /** Gap between children inside a pane, in spacing units. Default 4. */
  gap?: Resp<number>;
}

/**
 * Renders a related-records list (a `ResourceConfig.relations` entry) inside
 * the form. Detail pages only: it needs the record to filter by.
 */
export interface ListNode extends Placement {
  type: "list";
  /** `RelationConfig.key`, e.g. `"attachments"`. */
  relation: string;
  /** Height in px. */
  height?: number;
}

/**
 * A read-only value taken from the record chosen with a `pickup` field, placed
 * anywhere in the layout (not only under the pickup field). `target` is the
 * pickup field's `name` (its `pickup.targetField`).
 */
export interface PickupValueNode extends Placement {
  type: "pickupvalue";
  /** `name` of the field that has the `pickup` config. */
  target: string;
  /** Property of the picked record to show. */
  from: string;
  label: TranslatableText;
  /** How to render the value. Default: plain text input. */
  displayType?:
    | "input"
    | "switch"
    | "combobox"
    | "select"
    | "textarea"
    | "date"
    | "time"
    | "datetime"
    | "json";
  options?: EnumOptions;
  maxRows?: number;
}

// ─────────────────────────────────────────────
// Node union
// ─────────────────────────────────────────────

/** A registered block component (`defineBlockComponent`). */
export type ExtensionBlockNode<TFormValues = any> = Placement &
  BlockExtensionRef & {
    /** Fields the block edits, so grid inline-editing and pickups can find them. */
    fields?: FieldConfig<TFormValues>[];
  };

export type LayoutNode<TFormValues = any> =
  | ExtensionBlockNode<TFormValues>
  | FieldConfig<TFormValues>
  | ContainerNode<TFormValues>
  | HeadingNode
  | DividerNode
  | TextNode
  | SpacerNode
  | SlotNode
  | TabsNode<TFormValues>
  | ListNode
  | PickupValueNode
  | ButtonNode<TFormValues>
  | ButtonGroupNode<TFormValues>;

// ─────────────────────────────────────────────
// Regions (outside the main layout tree)
// ─────────────────────────────────────────────

export interface HeaderRegion<TFormValues = any> {
  left?: LayoutNode<TFormValues>[];
  center?: LayoutNode<TFormValues>[];
  right?: LayoutNode<TFormValues>[];
  className?: string;
}

export interface FooterRegion<TFormValues = any> {
  children: LayoutNode<TFormValues>[];
  align?: "start" | "center" | "end" | "between";
  /** Stick to the bottom of the scroll area. */
  sticky?: boolean;
  /** Draw a top border. Default true when sticky. */
  bordered?: boolean;
  className?: string;
}

export interface FloatingRegion<TFormValues = any> {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  children: LayoutNode<TFormValues>[];
  className?: string;
}

/**
 * Areas around the layout tree. Work with every layout mode
 * (`stack`, `grid` and `free`).
 */
export interface FormRegions<TFormValues = any> {
  header?: HeaderRegion<TFormValues>;
  footer?: FooterRegion<TFormValues>;
  floating?: FloatingRegion<TFormValues>;
}
