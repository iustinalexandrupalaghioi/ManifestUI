/**
 * Layout building blocks shared by the site's section components: page
 * container, section band, eyebrow, title and button styles. No "use client":
 * used on the server and in the browser (the CMS preview).
 */
import type { ReactNode } from "react";
import type { FieldMarker } from "@/framework/content/ui/RenderBlocks";
import { cn } from "@/lib/utils";
import { Reveal } from "../landing/motion";
import { ArrowRightIcon } from "lucide-react";
import { cmsHref, SiteLink } from "../SiteLink";

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

const none: FieldMarker = () => ({});

/**
 * A block's eyebrow, title and optional intro (fields `eyebrow`, `title` and
 * `introKey`, "intro" by default). Empty eyebrow and intro are left out.
 */
export function SectionHeading({
  titleId,
  eyebrow,
  title,
  intro,
  introKey = "intro",
  field = none,
}: {
  titleId: string;
  eyebrow?: string;
  title?: string;
  intro?: string;
  introKey?: string;
  field?: FieldMarker;
}) {
  return (
    <Reveal className="flex flex-col gap-4">
      {eyebrow && (
        <p className={eyebrowClass} {...field("eyebrow")}>
          {eyebrow}
        </p>
      )}
      <h2 id={titleId} className={sectionTitleClass} {...field("title")}>
        {title}
      </h2>
      {intro && (
        <p className="m-0 max-w-160 text-lg leading-relaxed text-muted-foreground" {...field(introKey)}>
          {intro}
        </p>
      )}
    </Reveal>
  );
}

/** Up to two CMS links as buttons (link fields `primary` and `secondary`); an empty one is left out. */
export function CallsToAction({
  primary,
  secondary,
  locale,
  field = none,
}: {
  primary?: { label: string; href: unknown };
  secondary?: { label: string; href: unknown };
  locale: string;
  field?: FieldMarker;
}) {
  const show = (link?: { label: string; href: unknown }) => !!link?.label && !!cmsHref(link.href, locale);
  if (!show(primary) && !show(secondary)) return null;
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {show(primary) && (
        <SiteLink href={cmsHref(primary!.href, locale)} className={cn(ctaPrimary, "w-full sm:w-auto")}>
          <span {...field("primary", "label")}>{primary!.label}</span>
          <ArrowRightIcon className="size-4.5" aria-hidden />
        </SiteLink>
      )}
      {show(secondary) && (
        <SiteLink href={cmsHref(secondary!.href, locale)} className={cn(ctaSecondary, "w-full sm:w-auto")}>
          <span {...field("secondary", "label")}>{secondary!.label}</span>
        </SiteLink>
      )}
    </div>
  );
}
