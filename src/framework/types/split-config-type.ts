export interface SplitConfig {
  side?: "left" | "right" | "top" | "bottom";
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  collapsible?: boolean;
  onOpen?: "open-first" | "open-all" | "none";
}

export const DEFAULT_SPLIT_CONFIG: Required<SplitConfig> = {
  side: "right",
  defaultWidth: 50,
  minWidth: 25,
  maxWidth: 75,
  collapsible: true,
  onOpen: "none",
};
