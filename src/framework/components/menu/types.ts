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

export interface MenuSection {
  module: string
  links: MenuLink[]
}
