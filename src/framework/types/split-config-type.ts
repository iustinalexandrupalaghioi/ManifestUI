export interface SplitConfig {
  side?: "left" | "right";
  /** Percent (0-100) of the split container's width. */
  defaultWidth?: number;
  /** Percent (0-100) of the split container's width. */
  minWidth?: number;
  /** Percent (0-100) of the split container's width. */
  maxWidth?: number;
  collapsible?: boolean;
  onOpen?: "selectFirst" | "selectAll" | "none";
}

export const DEFAULT_SPLIT_CONFIG: Required<SplitConfig> = {
  side: "right",
  defaultWidth: 50,
  minWidth: 25,
  maxWidth: 75,
  collapsible: true,
  onOpen: "none",
};
