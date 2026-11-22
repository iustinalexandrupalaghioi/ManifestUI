"use server";

import { getContentActions, runContentAction } from "@/framework/content/server/index.server";

/**
 * The CMS's content actions (drafts, publishing, history, translations) for
 * every content type. Each checks its permission on the type's resource; see
 * src/framework/content/server/actions.ts.
 */

export async function saveContentDraft(type: string, rowId: string, data: unknown) {
  return runContentAction("save", () => getContentActions().saveDraft(type, rowId, data));
}

export async function publishContent(type: string, rowId: string) {
  return runContentAction("publish", () => getContentActions().publish(type, rowId));
}

export async function unpublishContent(type: string, rowId: string) {
  return runContentAction("unpublish", () => getContentActions().unpublish(type, rowId));
}

export async function discardContentDraft(type: string, rowId: string) {
  return runContentAction("discard", () => getContentActions().discardDraft(type, rowId));
}

export async function restoreContentRevision(type: string, revisionId: string) {
  return runContentAction("restore", () => getContentActions().restoreRevision(type, revisionId));
}

export async function addContentTranslation(type: string, rowId: string, locale: string) {
  return runContentAction("translate", () => getContentActions().addTranslation(type, rowId, locale));
}

export async function fetchContentState(type: string, rowId: string) {
  return runContentAction("state", () => getContentActions().state(type, rowId));
}

export async function fetchContentRevision(type: string, revisionId: string) {
  return runContentAction("revision", () => getContentActions().revision(type, revisionId));
}

export async function fetchContentStatuses(type: string, entryIds?: string[]) {
  return runContentAction("statuses", () => getContentActions().statuses(type, entryIds));
}

export async function fetchContentOptions(type: string, query: { locale?: string; search?: string; entryIds?: string[]; limit?: number }) {
  return runContentAction("options", () => getContentActions().options(type, query));
}

export async function fetchContentPreviewUrl(type: string, rowId: string) {
  return runContentAction("preview", () => getContentActions().previewUrl(type, rowId));
}
