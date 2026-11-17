import { registerSections } from "@/framework/site";
import { siteFooter } from "./SiteFooter";
import { siteHeader } from "./SiteHeader";

/**
 * The site's header and footer, edited in Website > Site settings (one
 * record per locale). Defined like sections so they render the same way and
 * edit on the canvas, but registered apart from page sections: they aren't
 * offered in "Add section" and page saves refuse them.
 */
export const siteChrome = registerSections([siteHeader, siteFooter]);
