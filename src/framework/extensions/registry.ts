import type { ComponentType } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import type { TranslatableText } from "@/framework/types/i18n-types";

/** Augment with `{ extensions: typeof extensions }` so config `type`/`props` are type-checked. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Register {}

export type ExtensionKind = "field" | "block" | "detail" | "overview";

type PropsSchema = z.ZodType<Record<string, unknown>>;
type EmptyProps = Record<string, never>;
type IsAny<T> = 0 extends 1 & T ? true : false;
export type PropsOf<S> = IsAny<S> extends true ? Record<string, any> : S extends PropsSchema ? z.output<S> : EmptyProps;
export type PropsInput<S> = IsAny<S> extends true ? Record<string, any> : S extends PropsSchema ? z.input<S> : EmptyProps;

interface ExtensionMeta<TKind extends ExtensionKind, TType extends string, S> {
  kind: TKind;
  /** Unique across all extensions and built-in node types. */
  type: TType;
  label: TranslatableText;
  description?: TranslatableText;
  icon?: ComponentType<{ className?: string }>;
  /** Validates `props` and describes its editor controls. */
  props?: S;
}

/** `{ type, props }` reference to a registered component. */
export interface ExtensionRef<TType extends string = string, TProps = unknown> {
  type: TType;
  props?: TProps;
}

interface Referable<TType extends string, S> {
  /** Typed `{ type, props }` reference, for use without string types. */
  with: (props?: PropsInput<S>) => ExtensionRef<TType, PropsInput<S>>;
}

// ── Field: bound to one form value ─────────────────────────────────────────

export interface FieldComponentProps<TValue = unknown, TProps = Record<string, unknown>> {
  id: string;
  name: string;
  label: string;
  value: TValue;
  onChange: (value: TValue) => void;
  onBlur: () => void;
  error?: string;
  disabled: boolean;
  readOnly: boolean;
  props: TProps;
  /** The record the form was opened with (undefined on add). */
  item?: Record<string, unknown>;
}

export interface FieldComponentDef<TType extends string = string, S = any, TValue = any>
  extends ExtensionMeta<"field", TType, S> {
  /** Skip the standard label/error frame and draw your own. */
  bare?: boolean;
  component: ComponentType<FieldComponentProps<TValue, PropsOf<S>>>;
}

// ── Block: a form section with access to the whole form ────────────────────

export interface BlockComponentProps<TProps = Record<string, unknown>> {
  props: TProps;
  /** Live form values merged over the record. */
  values: Record<string, unknown>;
  form: UseFormReturn<FieldValues>;
  item?: Record<string, unknown>;
  disabled: boolean;
  readOnly: boolean;
}

export interface BlockComponentDef<TType extends string = string, S = any>
  extends ExtensionMeta<"block", TType, S>, Referable<TType, S> {
  component: ComponentType<BlockComponentProps<PropsOf<S>>>;
}

// ── Page regions ────────────────────────────────────────────────────────────

export interface DetailComponentProps<TItem = any, TProps = Record<string, unknown>> {
  item: TItem;
  props: TProps;
  /** Set when rendered as a detail tab. */
  tab?: { formOpen: boolean; basePath: string };
}

export interface DetailComponentDef<TType extends string = string, S = any, TItem = any>
  extends ExtensionMeta<"detail", TType, S>, Referable<TType, S> {
  component: ComponentType<DetailComponentProps<TItem, PropsOf<S>>>;
}

export interface OverviewComponentProps<TItem = any, TProps = Record<string, unknown>> {
  items: TItem[];
  total: number;
  selectedRows: TItem[];
  props: TProps;
}

export interface OverviewComponentDef<TType extends string = string, S = any, TItem = any>
  extends ExtensionMeta<"overview", TType, S>, Referable<TType, S> {
  component: ComponentType<OverviewComponentProps<TItem, PropsOf<S>>>;
}

export type AnyExtension =
  | FieldComponentDef<string, any, any>
  | BlockComponentDef<string, any>
  | DetailComponentDef<string, any, any>
  | OverviewComponentDef<string, any, any>;

// ── Type-level registry ─────────────────────────────────────────────────────

type Registered = Register extends { extensions: infer E extends readonly AnyExtension[] }
  ? E[number]
  : never;

type RefOf<D> = D extends { type: infer T extends string; props?: infer S }
  ? { type: T; props?: PropsInput<S> }
  : never;

export type RegisteredFieldDef = Extract<Registered, { kind: "field" }>;
export type RegisteredBlockDef = Extract<Registered, { kind: "block" }>;
/** `{ type, props }` of any registered field component. */
export type FieldExtensionRef = RefOf<RegisteredFieldDef>;
export type BlockExtensionRef = RefOf<RegisteredBlockDef>;
export type DetailExtensionRef = RefOf<Extract<Registered, { kind: "detail" }>>;
export type OverviewExtensionRef = RefOf<Extract<Registered, { kind: "overview" }>>;

// ── Runtime registry ────────────────────────────────────────────────────────

const registry: Record<ExtensionKind, Map<string, AnyExtension>> = {
  field: new Map(),
  block: new Map(),
  detail: new Map(),
  overview: new Map(),
};

/** Built-in layout node types an extension must not shadow. */
const RESERVED_TYPES = new Set([
  "input", "textarea", "switch", "select", "combobox", "date", "time", "datetime",
  "readonly", "json", "file", "custom", "fields", "grid", "row", "column", "card",
  "heading", "divider", "text", "spacer", "slot", "tabs", "list", "pickupvalue",
  "button", "buttons", "relation", "extension",
]);

export function registerExtensions<const T extends readonly AnyExtension[]>(defs: T): T {
  for (const def of defs) {
    if (process.env.NODE_ENV !== "production") {
      if (RESERVED_TYPES.has(def.type))
        console.warn(`[extensions] "${def.type}" is a built-in type and cannot be registered.`);
      const owner = (Object.keys(registry) as ExtensionKind[]).find(
        (kind) => registry[kind].get(def.type) && registry[kind].get(def.type) !== def,
      );
      if (owner) console.warn(`[extensions] "${def.type}" is already registered as a ${owner}.`);
    }
    if (!RESERVED_TYPES.has(def.type)) registry[def.kind].set(def.type, def);
  }
  return defs;
}

export const getFieldExtension = (type: string) =>
  registry.field.get(type) as FieldComponentDef | undefined;
export const getBlockExtension = (type: string) =>
  registry.block.get(type) as BlockComponentDef | undefined;
export const getDetailExtension = (type: string) =>
  registry.detail.get(type) as DetailComponentDef | undefined;
export const getOverviewExtension = (type: string) =>
  registry.overview.get(type) as OverviewComponentDef | undefined;
export const getExtension = (type: string) =>
  getFieldExtension(type) ?? getBlockExtension(type) ?? getDetailExtension(type) ?? getOverviewExtension(type);

export function listExtensions<K extends ExtensionKind>(kind: K) {
  return [...registry[kind].values()] as Extract<AnyExtension, { kind: K }>[];
}

/** Parses `props` against the schema so components get defaults applied. */
export function parseExtensionProps(
  def: Pick<AnyExtension, "type" | "props">,
  props: unknown,
): { ok: true; props: Record<string, unknown> } | { ok: false; error: string } {
  if (!def.props) return { ok: true, props: (props as Record<string, unknown>) ?? {} };
  const result = (def.props as PropsSchema).safeParse(props ?? {});
  if (result.success) return { ok: true, props: result.data };
  return {
    ok: false,
    error: `"${def.type}" props: ${result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`)
      .join("; ")}`,
  };
}
