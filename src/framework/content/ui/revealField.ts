"use client";

/** The event a field editor listens to when it must show a field inside it (a collapsed block). */
export const REVEAL_FIELD_EVENT = "cms:reveal-field";

/**
 * Brings a form field into view: asks collapsed editors to open (blocks
 * fields listen for REVEAL_FIELD_EVENT), then scrolls to the field and
 * focuses its input. Waits a few frames for a tab switch or a block to open.
 */
export function revealField(formName: string) {
  window.dispatchEvent(new CustomEvent(REVEAL_FIELD_EVENT, { detail: formName }));
  let tries = 0;
  const find = () => {
    // The field itself; after a few frames (a block may still be opening), its nearest container on screen.
    const parts = formName.split(".");
    const shortest = tries < 6 ? parts.length : 1;
    for (let length = parts.length; length >= shortest; length--) {
      const element = document.querySelector<HTMLElement>(`[data-cms-field-editor="${CSS.escape(parts.slice(0, length).join("."))}"]`);
      if (element) {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
        element.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select, [contenteditable=true]")?.focus({ preventScroll: true });
        return;
      }
    }
    if (++tries < 10) requestAnimationFrame(find);
  };
  requestAnimationFrame(find);
}
