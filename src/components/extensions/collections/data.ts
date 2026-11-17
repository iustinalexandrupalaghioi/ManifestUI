import "server-only";

import { createCollectionLoader, defineCollectionSource } from "@/framework/site/server";
import { service } from "@/db/schema";
import { BASE_ROUTE } from "@/components/cms/constants";
import { servicesCollection } from ".";

const EMPTY_IMAGE = { src: "", width: 0, height: 0 };

/** Where each collection's items come from. Saving a record of `resource` in the CMS refreshes its pages. */
export const collectionSources = [
  defineCollectionSource(servicesCollection, {
    table: service,
    resource: "services",
    published: service.published,
    locale: service.locale,
    order: service.position,
    card: (row) => ({
      id: String(row.id),
      title: row.title,
      text: row.summary,
      image: (row.image as typeof EMPTY_IMAGE | null) ?? EMPTY_IMAGE,
      // Detail pages come with collection routes; until then cards don't link.
      href: "",
      editHref: `${BASE_ROUTE}/services/${row.id}`,
    }),
  }),
];

/** Every collection's published cards for a locale, by name. */
export const loadCollections = createCollectionLoader(collectionSources);
