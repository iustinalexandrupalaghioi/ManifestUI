"use client";

/**
 * Editing primitives for section components. They read the section's content
 * and the current path from a scope (context), so a section is written once:
 * on the public site they render plain markup, in the CMS editor they render
 * the canvas controls (inline text, ×, + Add, Replace).
 *
 * These are client components because Server Components can't read context;
 * the section component itself stays a Server Component on the public site
 * and renders them as children (see ./render.tsx and ./List.tsx).
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { TranslatableText } from "@/framework/types/i18n-types";
import type { MediaKind } from "../media";
import { EditableNote, EditableText, ItemRemove, ListAdd, MediaReplaceButton } from "../editor";

interface Scope {
  sectionId: string;
  content: unknown;
  edit: boolean;
  /** Path of the current item inside the content ([] at the section root). */
  base: string[];
  /** Set inside a <List> item. */
  item?: { listPath: string; index: number };
  /** Validation messages by content path (editor only). */
  errors?: Record<string, string>;
}

const ScopeContext = createContext<Scope | null>(null);

function useScope(component: string): Scope {
  const scope = useContext(ScopeContext);
  if (!scope) throw new Error(`<${component}> must be rendered inside a section (defineSection component).`);
  return scope;
}

const resolvePath = (scope: Scope, path: string) => [...scope.base, ...path.split(".").filter(Boolean)];

function getAt(value: unknown, path: string[]): unknown {
  return path.reduce<unknown>((current, key) => (current == null ? undefined : (current as Record<string, unknown>)[key]), value);
}

/** Root scope of one section; rendered by the framework around a section component. */
export function SectionScope({
  sectionId,
  content,
  edit,
  errors,
  children,
}: {
  sectionId: string;
  content: unknown;
  edit: boolean;
  errors?: Record<string, string>;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ sectionId, content, edit, errors, base: [] }), [sectionId, content, edit, errors]);
  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

/** Scope of one list item; rendered by <List>. Paths inside are relative to the item. */
export function ItemScope({ path, index, children }: { path: string; index: number; children: ReactNode }) {
  const parent = useScope("List");
  const value = useMemo(() => {
    const listPath = resolvePath(parent, path);
    return { ...parent, base: [...listPath, String(index)], item: { listPath: listPath.join("."), index } };
  }, [parent, path, index]);
  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

type TextTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "strong" | "em" | "small" | "li" | "div" | "figcaption" | "label";

/**
 * A text field, editable in place in the editor. With `as`, it renders that
 * element around the text; `optional` drops the element on the public site
 * when the text is empty (it stays visible in the editor, so it can be filled).
 * Omit `path` inside a list of plain strings: the item itself is the text.
 * `vars` fills `{name}` placeholders on the site; the editor keeps them as typed.
 */
export function Text({
  path = "",
  as: Tag,
  id,
  className,
  multiline = false,
  optional = false,
  placeholder,
  vars,
}: {
  path?: string;
  as?: TextTag;
  id?: string;
  className?: string;
  multiline?: boolean;
  optional?: boolean;
  placeholder?: string;
  vars?: Record<string, string>;
}) {
  const scope = useScope("Text");
  const full = resolvePath(scope, path);
  const raw = getAt(scope.content, full);
  const value = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
  if (optional && !value && !scope.edit) return null;
  const inner = scope.edit ? (
    <EditableText
      sectionId={scope.sectionId}
      path={full.join(".")}
      value={value}
      multiline={multiline}
      placeholder={placeholder}
      error={scope.errors?.[full.join(".")]}
    />
  ) : vars ? (
    Object.entries(vars).reduce((text, [name, replacement]) => text.replaceAll(`{${name}}`, replacement), value)
  ) : (
    value
  );
  return Tag ? (
    <Tag id={id} className={className}>
      {inner}
    </Tag>
  ) : (
    <>{inner}</>
  );
}

/** A text that isn't visible on the page (image descriptions, labels for screen readers): a labelled note in the editor only. */
export function EditNote({ path, label, className }: { path: string; label: TranslatableText; className?: string }) {
  const scope = useScope("EditNote");
  const locale = useLocale();
  if (!scope.edit) return null;
  const full = resolvePath(scope, path);
  const raw = getAt(scope.content, full);
  return (
    <EditableNote
      sectionId={scope.sectionId}
      path={full.join(".")}
      value={typeof raw === "string" ? raw : ""}
      label={resolveLabel(label, locale)}
      className={className}
    />
  );
}

/** "×" that removes the current list item (editor only). */
export function RemoveItem({ label = "Remove item", className }: { label?: TranslatableText; className?: string }) {
  const scope = useScope("RemoveItem");
  const locale = useLocale();
  if (!scope.edit || !scope.item) return null;
  return (
    <ItemRemove
      sectionId={scope.sectionId}
      path={scope.item.listPath}
      index={scope.item.index}
      label={resolveLabel(label, locale)}
      className={className}
    />
  );
}

/** "+ Add …" that appends a blank item to the list at `path` (editor only). */
export function AddItem({ path, label, className }: { path: string; label: TranslatableText; className?: string }) {
  const scope = useScope("AddItem");
  const locale = useLocale();
  if (!scope.edit) return null;
  return <ListAdd sectionId={scope.sectionId} path={resolvePath(scope, path).join(".")} label={resolveLabel(label, locale)} className={className} />;
}

/** Replace (and optionally remove) the media at `path`, in place (editor only). Place it inside a `relative` box. */
export function MediaEdit({
  path,
  label,
  accept = "image",
  removable = false,
  className,
}: {
  path: string;
  label: TranslatableText;
  accept?: MediaKind;
  removable?: boolean;
  className?: string;
}) {
  const scope = useScope("MediaEdit");
  const locale = useLocale();
  if (!scope.edit) return null;
  return (
    <MediaReplaceButton
      sectionId={scope.sectionId}
      path={resolvePath(scope, path).join(".")}
      accept={accept}
      label={resolveLabel(label, locale)}
      removable={removable}
      className={className}
    />
  );
}

/** Renders its children only in the editor (wrappers around edit controls, hints). */
export function EditOnly({ children }: { children: ReactNode }) {
  return useScope("EditOnly").edit ? <>{children}</> : null;
}
