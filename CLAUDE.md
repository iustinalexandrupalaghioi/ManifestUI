@AGENTS.md

# Working on a ManifestUI project

`AGENTS.md` (above) holds the rules and recipes. This file adds what you need to set a project up, and how the website connects to the CMS. For building features or a whole project, use the **manifestui-builder** agent (`.claude/agents/manifestui-builder.md`): it follows these rules and verifies its work the same way.

## Setting up a new project

Do these in order. Steps that touch a database, the Supabase dashboard or a hosting account are the developer's: say what to run and why, and run them only when asked.

1. **Create the repository** from this template (GitHub "Use this template", or clone and `rm -rf .git && git init`), then `pnpm install`.
2. **Create a Supabase project.** Collect: project URL, anon key, service role key (Project Settings › API), the **Transaction pooler** connection string (port 6543) for `DATABASE_URL` and the **direct/session** one (port 5432) for `DIRECT_DATABASE_URL` (Project Settings › Database).
3. **Run `pnpm manifest setup`.** It writes `.env` (keeps existing values, generates `AUTH_WEBHOOK_SECRET`, defaults `NEXT_PUBLIC_BASE_URL` to `http://localhost:3000`), pushes the schema (`pnpm manifest db`, which also restores the website's read policies), installs the trigger that mirrors Supabase Auth users into the app's `user` table (`pnpm manifest auth-sync`), and creates the first administrator (`pnpm manifest admin you@example.com`, which prints a temporary password once). Each step is its own `pnpm manifest <step>` command; the whole command is safe to run again.
4. **Add `PREVIEW_SECRET`** to `.env` by hand: any long random string. Without it the CMS preview pane is off.
5. **Set up the website: `pnpm manifest site`.** It creates the content tables, seeds what isn't in the database yet from `src/db/seed/` (the home page, the services, the navigation), loads every block and renderer, and checks each language has a navigation entry and a published home page. `pnpm manifest doctor` re-runs every check (env, both connections, tables, sync trigger, an administrator, policies).
6. **Run it: `pnpm dev`.** The site is `/en` and `/ro`, the admin is `/en/cms` (sign in at `/en/auth/login` as the administrator), and `/en/services/<slug>` is a service page.
7. **Make it the client's project:**
   - `package.json` `name`, and the `title`/`description` in `src/app/[locale]/layout.tsx` and `src/app/[locale]/cms/layout.tsx`.
   - The site's name, logo, header links, call to action, footer and default description are **content**: edit them in the CMS (Single entries › Navigation, Single entries › Site info), or change `src/db/seed/site-settings/*.json` and the `siteInfo` defaults before seeding.
   - Restyle the site in `src/app/[locale]/(site)/globals.css` (colour tokens, fonts) and `src/components/site/` (header, footer, cards, `sections/blocks.tsx`). The CMS keeps its own `src/app/[locale]/cms/globals.css`.
   - Replace the example blocks and the `service` content type with the client's own, or keep them as references until the real ones exist.
   - The demo resources (`src/components/cms/main/`: todos, attachments, relations, with the `todo`, `todo_attachment` and `relation` tables) are references for the resource pattern. Delete them once the project has its own: the three folders, their routes under `src/app/[locale]/cms/(main)/`, their entries in `resourceDescriptors.ts` and `registerResourceComponents.ts`, their tables and relations in `src/db/schema/`, the `todoAttachmentsPanel` registration in `src/components/extensions/index.ts`, and their menu entries and messages. Never delete `src/components/cms/administration/` (the RBAC resources).
8. **Languages** (when not `en`/`ro`): `src/i18n/routing.ts` (`locales`, `defaultLocale`), one `messages/<locale>/` folder per language with every file, the `locale` check constraints in the content tables (`src/db/schema/site-page.ts`, `site-settings.ts`, `site-info.ts`, `service.ts`), the `z.enum(["en", "ro"])` in the content resources' `config/schema.ts`, and a seed file per language. Blocks' and fields' `L(en, ro)` labels are the CMS's interface languages, separate from the site's content languages.
9. **Access:** in the CMS, Administration › Groups: create the editors' group, grant it the resources (read, add, update, delete) and `<resource>:publish` for the content types they publish, then add users to it (User groups). Administrators bypass every check.
10. **Deploy** (Vercel or any Node host that runs Next.js):
    - Set the same environment variables as `.env`, with `NEXT_PUBLIC_BASE_URL` = the production URL and a new `PREVIEW_SECRET`.
    - In Supabase › Authentication › URL configuration: Site URL = the production URL; add `<production URL>/auth/callback` (and `http://localhost:3000/auth/callback` for development) to the redirect URLs. Google or GitHub sign-in also needs the provider enabled in Supabase with the same callback.
    - Schema changes reach production through `pnpm db:generate` + `pnpm db:migrate` against the production `DIRECT_DATABASE_URL`, run by the developer. After a push, run `pnpm manifest db` so the read policies keep their condition.
    - Media uploaded in the CMS goes to the public `site-media` Storage bucket, created on the first upload; `next.config.ts` lets `next/image` load it.

## How the website is linked

```
src/db/schema/service.ts              the table: one row per entry and language (entry_id, locale, slug, …, published_at)
        │
src/components/cms/content/service/   the CMS resource; its descriptor's `content` makes it a content type:
  config/descriptor.ts                  { type: "service", kind: "collection", localized, slugField, titleField,
                                          url: "/{locale}/services/{slug}", previewable }
        │
src/content/types/service.ts          defineContentType({ name: "service", descriptor, table, fields })
src/content/index.ts                  registerContentTypes([...]) → passed to the framework in src/manifest.config.ts
        │
src/content/blocks/*.ts               defineBlock({ type, label, fields, defaults }): what editors fill in, React-free
src/content/fields/page.ts            the page's `sections` field = blocks(allBlocks): the Add block menu
        │
src/components/site/blocks/index.ts   blockComponents: block type → React renderer
src/components/site/blocks/data.ts    block loaders: server data a block needs (e.g. every published service)
        │
src/components/site/internal/         reads through the content layer (getEntry, listEntries, getSingleton, listSlugs)
src/app/[locale]/(site)/              routes: page.tsx (the page "home"), [slug]/ (other pages), services/[slug]/ (entries)
src/components/site/SiteHeader*.tsx   the header and footer from the "navigation" single entry; metadata from "siteInfo"
```

- **Editing and publishing.** Editors work in the CMS. **Save draft** writes `content_draft` (or the row itself while it has never been published), so nothing changes on the site. **Publish** copies the draft into the row, sets `published_at`, stores a version in `content_revision` (the History tab, with Restore to draft) and refreshes the cache tags `ct:<type>` and `ct:<type>:<entryId>`. Static pages that read those entries are rebuilt on the next visit. Unpublish takes the row off the site. Every write goes through the content actions, which check `update`, `publish` or `add` on the resource.
- **Live preview.** The record's preview pane opens the entry's `url` through `/api/preview` (signed with `PREVIEW_SECRET`, and only for users who may read the resource). That turns on Next.js draft mode, and the content layer's reads (`draft: true`) return the draft. Elements a renderer marks with `field("path")` are clickable in the preview and open that field in the form.
- **Pages.** A `page` entry is either a blocks page (`kind: "sections"`, its blocks in `site_page.sections`) or a Markdown page (`kind: "text"`, in `body`). The page with the address `home` is served at `/<locale>`, and every other one at `/<locale>/<slug>`.
- **Entries on their own pages** (services here): a route under `(site)/` that reads with `getEntry(type, { locale, slug })`, lists its addresses with `listSlugs(type)` in `generateStaticParams`, and sets `dynamicParams = true` for entries published later. The descriptor's `content.url` must point at the same address, since links, references and the preview use it.
- **Showing entries on a page.** Either let editors pick them with a `reference("<type>", { many: true })` field, resolved to `{ entryId, title, url, data }` before the renderer gets them, or load them in a block loader (`defineBlockLoader(block, ({ locale }) => …)`), received by the renderer as `data`. The services block does both: the chosen services, or all of them in order.
- **Links.** `link()` fields store a URL or an entry, and the content layer resolves an entry to its current `url`. Render them with `cmsHref(value, locale)` and `SiteLink`, which picks between the locale-aware `Link` and a plain anchor.
- **Header, footer and site info** are single entries (`kind: "singleton"`): one row per language. Until they're published, the content layer serves their `defaults` from the seed files.
- **Static by design.** Site layouts and pages never read cookies, headers or the signed-in user. Signed-in UI (the account menu, "Edit this page") loads in the browser through `useSiteSession()`. After changing routes, layouts or blocks, `next build` must still show the site routes as ● or ○.
