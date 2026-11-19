/** How an option reads when shown as a badge (list cells, cards, filter chips). */
export type EnumTone = "neutral" | "info" | "success" | "warning" | "danger";

/** A custom badge colour, as a hex value (`#7c3aed`). */
export type CustomTone = `#${string}`;

/** A base tone, or a custom colour. */
export type BadgeTone = EnumTone | CustomTone;

/** Whether a tone is a custom colour (`#rrggbb`). */
export const isCustomTone = (tone: unknown): tone is CustomTone =>
  typeof tone === "string" && /^#[0-9a-fA-F]{6}$/.test(tone);

export type Enum = {
  value: string;
  label: string;
  group?: string;
  /** Shown as a coloured badge wherever the value is listed; plain text without one. */
  tone?: BadgeTone;
};
