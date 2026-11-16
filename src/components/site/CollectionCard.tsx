import Image from "next/image";
import { ArrowRightIcon, PencilIcon } from "lucide-react";
import { EditOnly, type CollectionCard } from "@/modules/site";
import { SiteLink } from "./SiteLink";

/**
 * One collection item as a card (image, title, text, link). Its texts come
 * from the record, so they aren't edited on the page: in the editor the card
 * shows an "Edit in CMS" link to the record instead.
 */
export function CollectionCardView({ card, tag: Tag = "li" }: { card: CollectionCard; tag?: "li" | "article" }) {
  return (
    <Tag className="relative flex h-full flex-col gap-3 rounded-2xl border bg-card p-6">
      {card.image.src && (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
          <Image src={card.image.src} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
        </div>
      )}
      <h3 className="m-0 font-display text-xl font-semibold">{card.title}</h3>
      {card.text && <p className="m-0 flex-1 text-base leading-relaxed text-muted-foreground">{card.text}</p>}
      {card.href && (
        <SiteLink href={card.href} className="inline-flex min-h-11 items-center gap-1.5 self-start text-base font-semibold text-primary no-underline hover:underline">
          {card.title}
          <ArrowRightIcon className="size-4" aria-hidden />
        </SiteLink>
      )}
      <EditOnly>
        <a
          href={card.editHref}
          target="_blank"
          rel="noopener"
          data-editor-link=""
          className="inline-flex items-center gap-1.5 self-start rounded-md border border-dashed border-[#22A6C4]/70 px-2 py-1 text-xs font-semibold text-[#22A6C4] no-underline hover:bg-[#22A6C4]/10"
        >
          <PencilIcon className="size-3.5" aria-hidden />
          Edit in CMS
        </a>
      </EditOnly>
    </Tag>
  );
}
