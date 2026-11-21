import { languageField } from "./LanguageField";
import { markdownField } from "./MarkdownField";
import { ownRecordLockedSwitch } from "./OwnRecordLockedSwitch";
import { pageAddressField } from "./PageAddressField";
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
  userAvatarBlock,
] as const;
