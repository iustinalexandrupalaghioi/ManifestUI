import type { LucideIcon, LucideProps } from "lucide-react"
import type {
  ComponentType,
  ForwardRefExoticComponent,
  RefAttributes,
} from "react"

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
  liveNumber: number
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
      type: "live"
      name: string
      path: string
      title: string
      icon: LucideIcon
      component: ComponentType<BaseTileProps>
    }

export interface MenuSection {
  module: string
  links: MenuLink[]
}
