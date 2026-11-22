import { contentFieldBlock } from "@/framework/content/ui/contentFieldBlock";
import { revisionCompareDetail } from "@/framework/content/ui/revisionCompareDetail";
import { languageField } from "./LanguageField";
import { markdownField } from "./MarkdownField";
import { ownRecordLockedSwitch } from "./OwnRecordLockedSwitch";
import { pageAddressField } from "./PageAddressField";
import { rowValueColumn } from "./RowValueColumn";
import { userAvatarBlock } from "./UserAvatarBlock";

export { setMarkdownRenderer, type MarkdownRenderer } from "./markdownPreview";

/**
 * The components the framework ships. A project registers them with its own:
 * `registerExtensions([...frameworkExtensions, ...])` in src/components/extensions/index.ts.
 */
export const frameworkExtensions = [
  markdownField,
  pageAddressField,
  languageField,
  ownRecordLockedSwitch,
  contentFieldBlock,
  userAvatarBlock,
  rowValueColumn,
  revisionCompareDetail,
] as const;

/** The group permissions screens' components; they need the project's resource descriptors. */
export { grantExtensions } from "./GrantExtensions";
