/**
 * The content actions the CMS calls, by content type name: each checks its
 * permission on the type's resource, runs the service, then reports the
 * change (cache refreshes) once the transaction has committed.
 *
 *   save draft, discard, restore → `<resource>:update`
 *   publish, unpublish          → `<resource>:publish` (a grantable action)
 *   add translation              → `<resource>:add`
 *   state, history, statuses     → `<resource>:read`
 *
 * Dependencies are injected (./index.server.ts wires the real ones), so the
 * permission rules are tested without a session.
 */
import type { AnyContentType } from "../define";
import { ContentConflictError, ContentNotFoundError, type ContentChange, type ContentService } from "./service";

export type ContentAction = "read" | "update" | "publish" | "add";

export interface ContentActionDeps {
  service: ContentService;
  getType: (name: string) => AnyContentType | undefined;
  /** Throws when the signed-in user may not do `action` on the resource; returns their id. */
  authorize: (resourceId: string, action: ContentAction) => Promise<string>;
  /** After a change commits: refresh caches. Errors here never undo the change. */
  onChange?: (change: ContentChange, def: AnyContentType) => void | Promise<void>;
  /** The preview secret (server-side env PREVIEW_SECRET); previews are off without it. */
  previewSecret?: () => string | undefined;
}

export function createContentActions({ service, getType, authorize, onChange, previewSecret }: ContentActionDeps) {
  const typeOrThrow = (name: string) => {
    const def = getType(name);
    if (!def) throw new ContentNotFoundError(`No content type "${name}"`);
    return def;
  };
  const guard = async (name: string, action: ContentAction) => {
    const def = typeOrThrow(name);
    return { def, userId: await authorize(def.descriptor.id, action) };
  };
  const report = async (def: AnyContentType, change: ContentChange) => {
    try {
      await onChange?.(change, def);
    } catch (error) {
      console.error(`[content] after ${change.kind} of ${change.type} ${change.rowId}:`, error);
    }
  };

  return {
    async saveDraft(type: string, rowId: string, data: unknown) {
      const { def, userId } = await guard(type, "update");
      const result = await service.saveDraft(def, rowId, data, userId);
      await report(def, result.change);
      return { savedTo: result.savedTo };
    },
    async publish(type: string, rowId: string) {
      const { def, userId } = await guard(type, "publish");
      const result = await service.publish(def, rowId, userId);
      await report(def, result.change);
      return { ok: true as const };
    },
    async unpublish(type: string, rowId: string) {
      const { def } = await guard(type, "publish");
      const result = await service.unpublish(def, rowId);
      await report(def, result.change);
      return { ok: true as const };
    },
    async discardDraft(type: string, rowId: string) {
      const { def } = await guard(type, "update");
      const result = await service.discardDraft(def, rowId);
      await report(def, result.change);
      return { ok: true as const };
    },
    async restoreRevision(type: string, revisionId: string) {
      const { def, userId } = await guard(type, "update");
      const result = await service.restoreRevision(def, revisionId, userId);
      await report(def, result.change);
      return { savedTo: result.savedTo, rowId: result.rowId };
    },
    /** Several revisions at once: `update` checked on every type first, then all restored in one transaction or none. */
    async restoreRevisions(items: readonly { type: string; revisionId: string }[]) {
      const authorized = new Map<string, { def: AnyContentType; userId: string }>();
      for (const name of new Set(items.map((item) => item.type))) authorized.set(name, await guard(name, "update"));
      const userId = authorized.values().next().value?.userId ?? null;
      const results = await service.restoreRevisions(
        items.map((item) => ({ def: authorized.get(item.type)!.def, revisionId: item.revisionId })),
        userId,
      );
      for (const result of results) await report(result.def, result.change);
      return { count: results.length };
    },
    async addTranslation(type: string, rowId: string, locale: string) {
      const { def } = await guard(type, "add");
      const result = await service.addTranslation(def, rowId, locale);
      await report(def, result.change);
      return { rowId: result.rowId };
    },
    async state(type: string, rowId: string) {
      const { def } = await guard(type, "read");
      return service.state(def, rowId);
    },
    async revision(type: string, revisionId: string) {
      const { def } = await guard(type, "read");
      return service.revision(def, revisionId);
    },
    /**
     * The preview frame's address for a row: /api/preview with the secret, built on the
     * server so the secret never ships in the CMS bundle. For previewable types with a url.
     */
    async previewUrl(type: string, rowId: string) {
      const { def } = await guard(type, "read");
      const options = def.descriptor.content;
      if (!options.previewable || !options.url) throw new ContentConflictError("not-previewable", `${def.name} has no preview`);
      const secret = previewSecret?.();
      if (!secret) throw new ContentConflictError("preview-not-configured", "PREVIEW_SECRET is not set");
      const { row } = await service.state(def, rowId);
      const query = new URLSearchParams({ type: def.name, entryId: row.entryId, locale: row.locale, secret });
      return { url: `/api/preview?${query}` };
    },
    async options(type: string, query: { locale?: string; search?: string; entryIds?: readonly string[]; limit?: number }) {
      const { def } = await guard(type, "read");
      return service.options(def, query);
    },
    async statuses(type: string, entryIds?: readonly string[]) {
      const { def } = await guard(type, "read");
      return service.statuses(def, entryIds);
    },
  };
}

export type ContentActions = ReturnType<typeof createContentActions>;
