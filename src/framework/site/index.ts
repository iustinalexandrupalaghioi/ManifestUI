/**
 * Website builder: CMS-managed website pages built from sections. Developers
 * define section types in code with `defineSection`; editors compose and fill
 * pages in the CMS, editing on the page. Server-only loaders are in
 * "@/framework/site/server".
 */
export { defineSection, newSectionContent, sectionData } from "./sections/define";
export type { SectionComponentProps, SectionDef, SectionSchema } from "./sections/define";
export { choice, group, list, media, settingFields, text } from "./sections/fields";
export type { Choice, MediaValue } from "./sections/fields";
export { MEDIA_TYPES, type MediaKind } from "./media";
export {
  EditableNote,
  EditableText,
  MediaReplaceButton,
  postToEditor,
  SiteEditorProvider,
  type EditMessage,
  type MediaUploader,
} from "./editor";
export { defineCollection, getCollection, listCollections, registerCollections } from "./collections";
export type { CollectionCard, CollectionDef } from "./collections";
export { getSection, listSections, registerSections } from "./sections/registry";
export type { AnySectionDef } from "./sections/registry";
export { blankListItem, newSection, parseSections, validateSections } from "./sections/content";
export type { SectionIssue, StoredSection } from "./sections/content";
export { labelPath } from "./sections/fields";
export { List } from "./sections/List";
export { AddItem, EditNote, EditOnly, MediaEdit, RemoveItem, Text } from "./sections/primitives";
export { RenderSection, RenderSections } from "./sections/render";
