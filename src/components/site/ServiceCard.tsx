import Image from "next/image";
import { ArrowRightIcon } from "lucide-react";
import { SiteLink } from "./SiteLink";

export interface ServiceCardContent {
  title: string;
  summary: string;
  image: { src: string; width: number; height: number };
  /** The service's page; none while a preview draft still holds an unresolved reference. */
  href: string | null;
}

/** One service as a card: image, title, summary and a link to its page. */
export function ServiceCard({ card, tag: Tag = "li" }: { card: ServiceCardContent; tag?: "li" | "article" | "div" }) {
  return (
    <Tag className="relative flex h-full flex-col gap-3 rounded-2xl border bg-card p-6">
      {card.image.src && (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
          <Image src={card.image.src} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
        </div>
      )}
      <h3 className="m-0 font-display text-xl font-semibold">{card.title}</h3>
      {card.summary && <p className="m-0 flex-1 text-base leading-relaxed text-muted-foreground">{card.summary}</p>}
      {card.href && (
        <SiteLink href={card.href} className="inline-flex min-h-11 items-center gap-1.5 self-start text-base font-semibold text-primary no-underline hover:underline">
          {card.title}
          <ArrowRightIcon className="size-4" aria-hidden />
        </SiteLink>
      )}
    </Tag>
  );
}
