# Site plumbing

What the public site runs on, kept apart from the UI you restyle in `src/components/site/`:

- `pages/`, `settings/` — cached reads of site pages and the header and footer
- `cache.ts` — cache tags and the refresh helpers CMS saves call
- `media/` — uploads to the public `site-media` bucket (permission-checked on the server)
- `session/` — the signed-in user in the browser (`useSiteSession`), so pages stay static
- `sections/` — the registered section types (`model.ts`) and the CMS editor's preview frame

You don't normally edit these. Sections, the header and footer, and collections are configured in `src/extensions/`; the engine is `src/framework/site/`.
