"use client";

import { createContext, use, type ReactNode } from "react";
import type { ActionResult } from "@/framework/lib/actionResult";
import type { TranslatableText } from "@/framework/types/i18n-types";
import type { MediaKind } from "../media";
import type { MediaValue } from "../fields";
import type { ContentStatus } from "../status";
import type { EntryState } from "../server/service";
import type { EntryData } from "../server/store";

/** Uploads a file for a media field and returns where it is stored. */
export type MediaUploader = (file: File, kind: MediaKind) => Promise<MediaValue>;

/** One choice in a reference or link picker. */
export interface ContentOption {
  entryId: string;
  rowId: string;
  locale: string;
  title: string;
  slug: string | null;
  status: ContentStatus;
}

/**
 * The content server actions, as the CMS's client components call them. The
 * app passes its own (src/app/[locale]/cms/contentActions.ts), so the
 * framework never imports app code.
 */
export interface ContentClientActions {
  state(type: string, rowId: string): Promise<ActionResult<EntryState>>;
  publish(type: string, rowId: string): Promise<ActionResult<unknown>>;
  unpublish(type: string, rowId: string): Promise<ActionResult<unknown>>;
  discard(type: string, rowId: string): Promise<ActionResult<unknown>>;
  restore(type: string, revisionId: string): Promise<ActionResult<unknown>>;
  translate(type: string, rowId: string, locale: string): Promise<ActionResult<{ rowId: string }>>;
  revision(type: string, revisionId: string): Promise<ActionResult<{ data: EntryData; publishedAt: string }>>;
  /** The preview frame's address (with its secret), built on the server. */
  previewUrl(type: string, rowId: string): Promise<ActionResult<{ url: string }>>;
  options(type: string, query: { locale?: string; search?: string; entryIds?: string[]; limit?: number }): Promise<ActionResult<ContentOption[]>>;
}

interface ContentEditorValue {
  actions: ContentClientActions;
  /** Uploads for media fields; without it they only take a path or URL. */
  upload?: MediaUploader;
  /** The site's locales, in switch order. */
  locales: readonly string[];
  /** Content types a link can point to (the ones with an address), for the link field's entry picker. */
  linkTypes: readonly { name: string; label: TranslatableText }[];
}

const ContentEditorContext = createContext<ContentEditorValue | null>(null);

/** Gives the CMS's content editors their server actions and uploader (set once, around the CMS). */
export function ContentEditorProvider({ children, ...value }: ContentEditorValue & { children: ReactNode }) {
  return <ContentEditorContext value={value}>{children}</ContentEditorContext>;
}

export function useContentEditor() {
  const value = use(ContentEditorContext);
  if (!value) throw new Error("Content editors need a <ContentEditorProvider> (the CMS providers set it).");
  return value;
}

/** The locale of the entry being edited, for new blocks' defaults and pickers (set by the content form). */
export const EntryLocaleContext = createContext<string | null>(null);
