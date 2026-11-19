/** How an option reads when shown as a badge (list cells, cards, filter chips). */
export type EnumTone = "neutral" | "info" | "success" | "warning" | "danger";

export type Enum = {
  value: string;
  label: string;
  group?: string;
  /** Shown as a coloured badge wherever the value is listed; plain text without one. */
  tone?: EnumTone;
};
