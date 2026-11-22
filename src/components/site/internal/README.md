# Site plumbing

What the public site runs on, kept apart from the UI you restyle in `src/components/site/`:

- `pages/`, `settings/`, `learn/`, `siteInfo/`: the site's reads of pages, navigation, lessons and site info, on top of the content layer (`@/framework/content/server/content.server`)
- `cache.ts`: cache tags and the refresh helpers CMS saves call
- `media/`: uploads to the public `site-media` bucket (permission-checked on the server)
- `session/`: the signed-in user in the browser (`useSiteSession`), so pages stay static

You don't normally edit these. Content types and blocks are in `src/content/`, block renderers in `src/components/site/blocks/`, and the engine is in `src/framework/content/`.
