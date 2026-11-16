/**
 * Scroll-reveal primitives for the landing page, without a JS animation
 * library: elements render on the server with `data-reveal`, CSS (in
 * globals.css) fades and lifts them in, and `RevealObserver` marks them
 * visible as they scroll into view. Without JavaScript, or with reduced
 * motion, everything is simply shown.
 */
import type { ReactNode } from "react";
import { RevealObserver } from "./RevealObserver";

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <RevealObserver />
    </>
  );
}

/** Fades and lifts its content into place when it scrolls into view. */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  return (
    <Tag data-reveal="" className={className}>
      {children}
    </Tag>
  );
}

/** A container whose `RevealItem` children animate in one after another. */
export function RevealGroup({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ol" | "ul";
  /** Kept for API compatibility; the stagger is set in CSS. */
  stagger?: number;
}) {
  return (
    <Tag data-reveal-group="" className={className}>
      {children}
    </Tag>
  );
}

export function RevealItem({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "a";
}) {
  return (
    <Tag data-reveal-item="" className={className}>
      {children}
    </Tag>
  );
}
