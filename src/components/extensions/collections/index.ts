import { defineCollection, registerCollections } from "@/framework/site";

/**
 * Collections: CMS resources the website shows (services, projects, posts…).
 * Sections such as "Collection cards" let editors pick one by name. Each has
 * a server source in ./data.ts (which table, how a row becomes a card).
 */
export const servicesCollection = defineCollection({
  name: "services",
  label: { en: "Services", ro: "Servicii" },
});

export const collections = registerCollections([servicesCollection]);
