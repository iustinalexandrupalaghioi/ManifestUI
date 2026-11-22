import { useLocale } from "next-intl";
import type { BlockProps } from "@/framework/content/ui/RenderBlocks";
import type { callToActionBlock } from "@/content/blocks/callToAction";
import { CallsToAction, Container, sectionTitleClass } from "@/components/site/sections/blocks";
import { cn } from "@/lib/utils";

/** A closing band: title, a sentence and one button, centred. */
export function CallToAction({ id, content: c, field }: BlockProps<typeof callToActionBlock>) {
  const locale = useLocale();
  return (
    <section id="contact" aria-labelledby={`${id}-title`} className="border-t bg-surface">
      <Container className="flex flex-col items-center gap-6 py-20 text-center lg:py-24">
        <h2 id={`${id}-title`} className={cn(sectionTitleClass, "max-w-200")} {...field("title")}>
          {c.title}
        </h2>
        {c.text && (
          <p className="m-0 max-w-160 text-lg leading-relaxed text-muted-foreground" {...field("text")}>
            {c.text}
          </p>
        )}
        <CallsToAction primary={c.button} locale={locale} field={(...path) => field(...(path[0] === "primary" ? ["button", ...path.slice(1)] : path))} />
      </Container>
    </section>
  );
}
