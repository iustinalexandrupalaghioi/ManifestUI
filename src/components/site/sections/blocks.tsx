/**
 * Layout building blocks shared by the site's section components: page
 * container, section band, eyebrow, title and button styles. No "use client":
 * used on the server (public site) and in the editor frame.
 */
import type { ReactNode } from "react";
import { Text } from "@/modules/site";
import { cn } from "@/lib/utils";
import { Reveal } from "../landing/motion";

export const ctaBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold no-underline transition-colors";
export const ctaPrimary = cn(ctaBase, "bg-primary text-primary-foreground hover:bg-primary/90");
export const ctaSecondary = cn(ctaBase, "border bg-card text-foreground hover:bg-muted");
export const textLink =
  "inline-flex min-h-11 items-center gap-1.5 rounded-sm text-base font-semibold text-primary no-underline underline-offset-4 hover:underline";

export const eyebrowClass = "m-0 text-[13px] font-semibold tracking-[0.08em] text-primary uppercase";
export const sectionTitleClass =
  "m-0 font-display text-[clamp(30px,3.6vw,44px)] leading-[1.1] font-semibold tracking-[-0.02em] text-balance";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-300 px-4 sm:px-6", className)}>{children}</div>;
}

/** Section wrapper: 64px vertical rhythm on phones, 112px on desktop. */
export function Band({
  id,
  labelledBy,
  className,
  containerClassName,
  children,
}: {
  id?: string;
  labelledBy: string;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={className}>
      <Container className={cn("flex flex-col gap-10 py-16 lg:gap-14 lg:py-28", containerClassName)}>
        {children}
      </Container>
    </section>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  if (!children) return null;
  return <p className={cn(eyebrowClass, className)}>{children}</p>;
}

export function SectionTitle({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2 id={id} className={cn(sectionTitleClass, className)}>
      {children}
    </h2>
  );
}

/**
 * Eyebrow, title and optional intro of a section, from the `eyebrow`, `title`
 * and `introPath` fields; for sections built with defineSection.
 */
export function SectionHeading({ titleId, introPath }: { titleId: string; introPath?: string }) {
  return (
    <Reveal className="flex flex-col gap-4">
      <Text path="eyebrow" as="p" optional className={eyebrowClass} />
      <Text path="title" as="h2" id={titleId} className={sectionTitleClass} />
      {introPath && (
        <Text path={introPath} as="p" optional multiline className="m-0 max-w-160 text-lg leading-relaxed text-muted-foreground" />
      )}
    </Reveal>
  );
}

