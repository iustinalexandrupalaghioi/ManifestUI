import Image from "next/image";
import { useLocale } from "next-intl";
import type { BlockProps } from "@/framework/content/ui/RenderBlocks";
import type { heroBlock } from "@/content/blocks/hero";
import { CallsToAction, Container, eyebrowClass } from "@/components/site/sections/blocks";
import { cn } from "@/lib/utils";

/** The opening band: title, text and buttons, with the image beside them on wide screens. */
export function Hero({ id, content: c, field }: BlockProps<typeof heroBlock>) {
  const locale = useLocale();
  return (
    <section aria-labelledby={`${id}-title`} className="border-b bg-surface">
      <Container className={cn("grid items-center gap-10 py-16 lg:py-24", c.image.src && "lg:grid-cols-2")}>
        <div className="flex flex-col gap-6">
          {c.eyebrow && (
            <p className={eyebrowClass} {...field("eyebrow")}>
              {c.eyebrow}
            </p>
          )}
          <h1
            id={`${id}-title`}
            className="m-0 font-display text-[clamp(36px,5vw,60px)] leading-[1.05] font-semibold tracking-[-0.02em] text-balance"
            {...field("title")}
          >
            {c.title}
          </h1>
          {c.text && (
            <p className="m-0 max-w-160 text-lg leading-relaxed text-muted-foreground" {...field("text")}>
              {c.text}
            </p>
          )}
          <CallsToAction primary={c.primary} secondary={c.secondary} locale={locale} field={field} />
        </div>
        {c.image.src && (
          <Image
            src={c.image.src}
            alt={c.imageAlt}
            width={c.image.width || 1200}
            height={c.image.height || 800}
            sizes="(min-width: 1024px) 600px, 100vw"
            priority
            className="h-auto w-full rounded-2xl border"
            {...field("image")}
          />
        )}
      </Container>
    </section>
  );
}
