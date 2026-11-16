import { choice, EditOnly, listCollections, type CollectionCard } from "@/modules/site";
import { collections } from "@/extensions/collections";
import { L } from "./fields";

void collections; // registered before the options are read

/** Section settings shared by the collection sections: which collection, how many items. */
export const collectionField = () =>
  choice(() => listCollections().map((collection) => ({ value: collection.name, label: collection.label })), {
    label: L("Collection", "Colecție"),
  });

export const limitField = () =>
  choice(
    [
      { value: "3", label: "3" },
      { value: "6", label: "6" },
      { value: "9", label: "9" },
      { value: "all", label: L("All", "Toate") },
    ],
    { label: L("How many", "Câte"), default: "6" },
  );

/** The items to show: the chosen collection's published cards, up to the limit. */
export function pickCards(data: Record<string, CollectionCard[]> | undefined, collection: string, limit: string) {
  const cards = data?.[collection] ?? [];
  return limit === "all" ? cards : cards.slice(0, Number(limit) || 6);
}

/** Editor-only hint when there's nothing to show yet. */
export function EmptyCollectionHint({ collection, count }: { collection: string; count: number }) {
  if (count > 0) return null;
  const label = listCollections().find((item) => item.name === collection)?.label;
  const name = typeof label === "string" ? label : (label?.en ?? collection);
  return (
    <EditOnly>
      <p className="m-0 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {collection
          ? `No published items in ${name} yet. Add them in the CMS, then they appear here.`
          : "Choose a collection in this section's Settings."}
      </p>
    </EditOnly>
  );
}
