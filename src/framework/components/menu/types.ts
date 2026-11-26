import type { LucideIcon, LucideProps } from "lucide-react"
import type { ForwardRefExoticComponent, RefAttributes } from "react"

export interface BaseTileProps {
  name: string
  path: string
  title: string
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >
  className?: string
}

export interface LiveTileProps extends BaseTileProps {
  /** The number on the tile; no badge while it's unknown (loading, no permission). */
  liveNumber?: number
}

export type MenuLink =
  | {
      type: "link"
      name: string
      path: string
      title: string
      icon: LucideIcon
    }
  | {
      /**
       * A link with a live number: shown as a badge on its tile in the CMS home
       * menu and beside it in the ☰ menu. `useLiveNumber` is a React hook (it may
       * query), e.g. `() => useResourceCount("users")`.
       */
      type: "live"
      name: string
      path: string
      title: string
      icon: LucideIcon
      useLiveNumber: () => number | undefined
    }

/**
 * A named group of links inside a section (e.g. Content › Blog): shown under its own heading
 * in the CMS home menu and the ☰ menu, and named in the breadcrumb.
 */
export interface MenuGroup {
  name: string
  links: MenuLink[]
}

export interface MenuSection {
  module: string
  /**
   * Shows the section as one folder tile in the CMS home instead of all its tiles; the tile
   * opens the folder's own page (the app decides its address, e.g. `/cms?folder=content`),
   * where the section's links and groups are shown. The ☰ menu still lists every link.
   */
  folder?: string
  /** Links shown directly under the section (before any groups). */
  links: MenuLink[]
  /** Optional groups of links, each under its own heading, after `links`. */
  groups?: MenuGroup[]
}

/**
 * A folder's page: each of the section's groups as a section of its own (Blog, Services,
 * Portfolio, Website…), the way the main menu shows sections. A section without groups is
 * shown as itself.
 */
export function folderSections(section: MenuSection): MenuSection[] {
  if (!section.groups?.length) return [{ module: section.module, links: section.links }]
  return section.groups.map((group) => ({ module: group.name, links: group.links }))
}

/** Every link in a section, in display order, with the group it belongs to (if any). */
export function sectionLinks(section: MenuSection): { link: MenuLink; group?: string }[] {
  return [
    ...section.links.map((link) => ({ link })),
    ...(section.groups ?? []).flatMap((group) => group.links.map((link) => ({ link, group: group.name }))),
  ]
}
