"use client";

import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import { ContentEditorProvider, type ContentClientActions } from "@/framework/content/ui/context";
import { uploadSiteMedia } from "@/components/site/internal/media/upload";
import { resourceDescriptors } from "./resourceDescriptors";
import {
  addContentTranslation,
  discardContentDraft,
  fetchContentOptions,
  fetchContentPreviewUrl,
  fetchContentRevision,
  fetchContentState,
  publishContent,
  restoreContentRevision,
  unpublishContent,
} from "./contentActions";

const actions: ContentClientActions = {
  state: fetchContentState,
  publish: publishContent,
  unpublish: unpublishContent,
  discard: discardContentDraft,
  restore: restoreContentRevision,
  translate: addContentTranslation,
  revision: fetchContentRevision,
  options: fetchContentOptions,
  previewUrl: fetchContentPreviewUrl,
};

/** Content types with an address: what a link field's entry picker offers. */
const linkTypes = resourceDescriptors.flatMap((descriptor) =>
  descriptor.content?.url ? [{ name: descriptor.content.type, label: descriptor.singular }] : [],
);

/** The CMS's content editors: their server actions, uploads to the site's media storage, the locales. */
export function ContentEditor({ children }: { children: ReactNode }) {
  return (
    <ContentEditorProvider actions={actions} upload={uploadSiteMedia} locales={routing.locales} linkTypes={linkTypes}>
      {children}
    </ContentEditorProvider>
  );
}
