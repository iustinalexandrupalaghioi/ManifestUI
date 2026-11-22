/**
 * The project's content types: CMS resources that are also content (drafts,
 * publishing, locales), read by frontends through the content layer
 * (@/framework/content/server/content.server).
 *
 * Content definitions and blocks (./blocks) must stay free of React and of
 * anything under the website (src/components/site, src/app): renderers live
 * with the frontend. `pnpm check:boundaries` enforces it.
 */
import { registerContentTypes } from "@/framework/content";
import { navigationType } from "./types/navigation";
import { pageType } from "./types/page";
import { serviceType } from "./types/service";
import { siteInfoType } from "./types/siteInfo";

export const contentTypes = registerContentTypes([pageType, serviceType, navigationType, siteInfoType]);
