<!-- BEGIN:nextjs-agent-rules -->
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
<!-- END:nextjs-agent-rules -->

# ManifestUI: how this project works

ManifestUI is a Next.js + Drizzle + Supabase codebase with two surfaces, each with its own root layout under `src/app/[locale]/`:

| Surface | Route | What it is | Built from |
| --- | --- | --- | --- |
| **CMS** | `/cms` | The admin: grids, cards, forms and detail pages over database tables, behind RBAC | Resources (`defineResource`) in `src/components/cms/<module>/<feature>/` |
| **Website** | `/`, `/<slug>`, `/services/<slug>`, `/auth/*`, `/profile` | Public pages from CMS content (drafts, Publish, live preview); static, refreshed by tag on publish | Content types and blocks in `src/content/`, block renderers in `src/components/site/blocks/`, read through the content layer |

Everything is code in the repo. The database holds data and content, never configuration: tables, resources, forms, content types and blocks are TypeScript. ManifestUI Studio (a separate product) writes the same code into this repo as commits; everything it writes can also be written by hand, in the same shape.

## Where to read before changing something

Read the guide for the task first, then an existing example, then the framework source. When the README and the code disagree, the code is right; fix the doc.

| Task | Read |
| --- | --- |
| Any Next.js API (routing, caching, layouts, `next/root-params`) | `node_modules/next/dist/docs/` |
| Where code may live and what it may import | README › Architecture: layers; `scripts/check-boundaries.mjs` |
| A CMS resource (table → admin screens) | README › Adding a new resource, Data views, Forms, Relations & detail pages, Custom actions; examples: `src/components/cms/main/todo/` (plain), `src/components/cms/content/service/` (content type) |
| Custom form fields, form blocks, detail or overview slots | README › Extensions: custom components; `src/framework/extensions/` |
| Permissions, guards, groups | README › Authorization: RBAC; `src/framework/authorization/` |
| Login, sign-up, profile | README › Auth flows; `src/framework/authentication/` (screens share `ui/AuthCard.tsx`) |
| Content types, blocks, publishing, preview, reading content | README › Content and the website (every subsection); engine `src/framework/content/` (`fields.ts`, `blocks.ts`, `server/service.ts`, `server/read.ts`, `server/content.server.ts`) |
| Page and service content, seeding | README › Seeding content with SQL; `scripts/seed-content.mjs` (`--help`) |
| Translations | README › i18n; `messages/en/**` and `messages/ro/**` |
| Setting up a new project, deploying | `CLAUDE.md` › Setting up a new project; README › Starting a new project, First-time setup |
| Building a feature or a whole project | `.claude/agents/manifestui-builder.md` (the agent for that work) |

## How a full app + website is laid out

```
src/
├── app/[locale]/
│   ├── (site)/            the website: page.tsx (home), [slug]/ (CMS pages), services/[slug]/, auth/, profile/;
│   │                      layout.tsx = site shell
│   └── cms/               the admin: route groups per module ((main)/, (administration)/, (content)/),
│                          one folder per resource route (page.tsx, add/, [id]/ behind ResourceGuard);
│                          resourceDescriptors.ts, registerResourceComponents.ts,
│                          contentActions.ts + contentEditor.tsx (the content editor's server actions and provider)
├── app/api/               preview/ (draft mode on/off), webhooks/ (Supabase auth sync)
├── content/               types/ (defineContentType) and blocks/ (defineBlock): React-free, what editors fill in
├── components/
│   ├── cms/               MenuItems.tsx, AppNavbar.tsx, <module>/<feature>/ resources
│   │                      (main/ = demo resources; content/ = the content types' resources, content-revision,
│   │                      content-draft; administration/ = RBAC)
│   ├── extensions/        CMS components a project registers (index.ts: field/block/detail/overview components)
│   ├── site/              site UI to restyle: blocks/ (renderers + data.ts loaders), SiteHeader/SiteFooter,
│   │                      sections/blocks.tsx (layout helpers), pages/ (page view, live preview);
│   │                      internal/ = plumbing (reads, cache tags, media upload, session)
│   └── ui/                shadcn/ui primitives
├── framework/             the engine: resources, forms, data views, auth, RBAC, extensions API,
│                          content/ (content types, publishing, content layer, preview), preview/client.ts
├── db/schema/             Drizzle tables (source of truth for the database); db/seed/ = starter content
├── manifest.config.ts     the composition root: what the framework gets from the project
└── i18n/                  next-intl; the locale is always in the URL
messages/{en,ro}/          every UI string, in both languages
```

The example site: content types `page` (blocks or Markdown pages), `service` (a collection with a page each), `navigation` (header and footer) and `siteInfo` (name, description); blocks `hero`, `features`, `services` (chosen services, or all of them through a loader), `faq`, `callToAction`.

A complete feature usually spans both surfaces: a **table** in `src/db/schema`, a **resource** so editors manage its rows in `/cms` (a **content type** when its rows are published content), and on the website a **block** that shows it (chosen entries through a `reference` field, or records through a block loader), plus item pages under `(site)/` read with `getEntry` when entries need their own URL.

## Recipes

**A CMS resource** (ManifestUI Studio's Resource Designer does steps 2–5 in one save):
1. Table in `src/db/schema/<name>.ts`, exported from `schema/index.ts`; apply it (`pnpm db:generate` + `pnpm db:migrate`, or `pnpm db:push` then `pnpm manifest db`).
2. Feature folder `src/components/cms/<module>/<feature>/`: `config/descriptor.ts`, `schema.ts`, `columns.ts`, `form.ts`, `api.ts` (`defineResourceActions`), optional `relations.ts`, and `resource.tsx` (`defineResource`).
3. Routes `src/app/[locale]/cms/(<group>)/<route>/page.tsx`, `add/page.tsx`, `[id]/page.tsx`, each wrapped in `ResourceGuard`.
4. Register: the descriptor in `resourceDescriptors.ts` (framework, permissions picker, Studio), `import "…/<feature>/resource"` in `registerResourceComponents.ts` (pickups and relation tabs elsewhere).
5. Menu link in `src/components/cms/MenuItems.tsx` with labels in `messages/{en,ro}/features/Menu.json`.
6. Grant the resource to a group in the CMS (Administration › Group permissions).

**A content type** (published content: drafts, Publish, history, preview, API):
1. Table with `entry_id uuid`, `published_at`, `published_by` (and `locale` + `unique(entry_id, locale)` when localized).
2. A CMS resource as above, with `content: { type, kind, localized, slugField?, titleField?, url?, previewable? }` on its descriptor; its api.ts uses `withContentDraft`, `saveContentFromForm`, `withContentStatuses`, `forgetContentRow` in the delete transaction, wrapped in `afterContentDelete` (reports the delete to caches and `content.onChange`) (example: `src/components/cms/content/service/config/api.ts`); add the History tab (`contentHistoryRelation`, `contentHistoryTab`) and `detail.formInTabs`.
3. `defineContentType({ name, descriptor, table, fields })` in `src/content/types/`, added to `registerContentTypes` in `src/content/index.ts`.
4. `pnpm db:push`, then `pnpm content:migrate` (dry run) and `--apply` for existing rows; grant `<resource>:publish` to the groups that publish.

**A block** (a page section):
1. `pnpm manifest block <name>` writes `src/content/blocks/<type>.ts` (`defineBlock({ type, label, fields, defaults })`) and `src/components/site/blocks/<Name>.tsx` (the renderer), and registers both (`allBlocks` order = the Add block menu; `blockComponents`).
2. Fields from the helpers in `@/framework/content`; `defaults` for `en` and `ro`.
3. The renderer is plain React over `content`; spread `field("path", …)` on what editors should click in the preview. Interactive parts go in a `"use client"` component it renders. Database data comes from a loader in `src/components/site/blocks/data.ts` (`defineBlockLoader`), received as `data`.
4. Deploy, then add it to a page in Content › Pages, Save draft, Publish.

**Entries on their own pages**: build the route under `(site)/`, read with `getEntry(type, { slug, locale })` and `listSlugs(type)` for `generateStaticParams` (cached and refreshed on publish; never query content tables from site code). Example: `src/app/[locale]/(site)/services/[slug]/page.tsx` with `src/components/site/internal/services/content.ts`.

**Page and service content**: editors change it in the CMS; the database is the source after seeding. Starter content lives in `src/db/seed/` and is pushed with `pnpm db:seed:content`. Always select what you changed and check first: `--force --only site-pages/<locale>/<slug>,services/<locale>/<slug> --dry-run`, then without `--dry-run`. A bare `--force` overwrites every page, service and the site settings, losing CMS edits.

**A custom CMS component**: define it with `defineFieldComponent`, `defineBlockComponent`, `defineDetailComponent`, `defineOverviewComponent` or `defineColumnComponent` (a computed grid/card value), register it in `src/components/extensions/index.ts`, and reference it from config as `{ type, props }`.

## Rules

### Framework and layers

- Layers (README › Architecture: layers): platform ← framework ← app. The framework never imports project code; what it needs (db client, resource descriptors, the user/access tables, auth hooks) comes from `src/manifest.config.ts`, read only by `src/framework/runtime.ts`. Tables stay in `src/db/schema` (Studio parses that folder and edits its files in place); the config passes `authTables` and registers their types through `Register` in `@/framework/config`. The content framework (`src/framework/content`) is framework code too, so it never imports app code: content types and tables come in through `content` in the config, the editor's actions through `<ContentEditorProvider>`. Run `pnpm check:boundaries` after changing imports.
- Extend the framework through `@/framework/extensions`, not ad-hoc render functions: `defineFieldComponent` (bound to one form value), `defineBlockComponent` (form section with the whole form), `defineDetailComponent` (detail slots/tabs), `defineOverviewComponent` (overview slots), `defineColumnComponent` (a column's computed value and badges, `compute: { type, props }`). Register them in `src/components/extensions/index.ts` (after `...frameworkExtensions`, the generic ones the framework ships from `src/framework/extensions/builtin/`; a component that isn't tied to this project belongs there); configs reference them as `{ type, props }` (or `def.with(props)`), with `props` validated by the zod schema that also describes their editor controls.

### CMS resources

- Build CMS resources with `defineResource<TItem, TFormValues>`. Infer persisted row types from Drizzle (`typeof table.$inferSelect`); use a separate joined type only when a query returns related/computed data. Derive form values from the Zod schema.
- Resource data views have separate `overview` and `pickup` configs. Both support `dataTableColumns` and `dataListColumns`; provide the list columns wherever cards should be available. Table and list columns are merged by column ID, so keep IDs/fields aligned and retain relationship keys even when hidden.
- Default data views are config, not code: `dataView.overview.defaultView`, `dataView.overview.navigationView` (embedded/relation lists) and `dataView.pickup.defaultView` set initial sorting, filters, pinning, column order and widths per grid/cards; column arrays (order, `size`, `hidden`, `navigationHidden`, `pickupHidden`) set the base layout.
- Forms use `FormConfig` sections with responsive `cols`, optional per-section `responsiveCols` breakpoints, and per-field `span`. `className` controls the form's width; avoid restrictive max-widths for long resource forms. Group related fields and use more columns for compact numeric fields.
- Record screens scroll content, not the screen: with `detail.formInTabs` (every field in a `type: "fields"` tab; one without `sections` shows the whole form, which Studio's Record screen › Just tabs writes) the title bar, toolbar and tab list don't move and the active tab's content is the only scroll area. The header row of whatever a tab shows (a list's toolbar, a blocks field's count and Collapse all) sticks to the top of that area: give it `STICKY_IN_RECORD` from `@/framework/lib/sticky`, and keep its outer boxes `overflow-clip`, never `overflow-hidden`, which would stop it sticking.
- Relationship pickup fields use `resource`, `mapField`, and `targetField`; `embeddedField` can provide the selected relation immediately on detail forms, and `fillFields` can display or copy related values.
- `FormInput` converts non-empty number inputs to numbers and cleared inputs to empty strings; field validation errors are shown immediately. Normalize empty numeric input in resource schemas before number validation, and avoid `z.coerce.number()` when an empty value must not become zero. Numeric money fields may accept number input but should parse to strings for Drizzle numeric columns.

### Database

- Drizzle is configured with `casing: "snake_case"`; keep TypeScript property names camelCase and database column names snake_case.
- `drizzle-kit push` creates RLS policies without their USING condition. `pnpm manifest db` restores the website's read policies (site_page, site_settings, service) afterwards and `pnpm manifest doctor` checks them; it deliberately leaves other policies alone, since restoring them could widen access.

### Content and the website

- Content types are resources with `content` options on their descriptor plus a `defineContentType` in `src/content/types/`. Blocks are `defineBlock` in `src/content/blocks/` with a renderer in `src/components/site/blocks/`. `src/content` and `src/framework/content` (outside `ui/` and `server/`) never import React or site code; `pnpm check:boundaries` checks it.
- Keep stored content shapes unchanged when editing fields, and never rename a block's `type` or a content type's `name`. Saves and publishes validate strictly (unknown blocks or keys and wrong types are refused; `text({ required, maxLength })` adds constraints), while reading stays lenient.
- Every content write goes through the content actions (`getContentActions()` / `runContentAction`), which check `update`, `publish` or `add` on the resource and refresh tags after the commit. Don't write `published_at` or drafts by hand.
- Public site pages are static. Read content only through the content layer (`getEntry`, `listEntries`, `getSingleton`, `listSlugs` from `@/framework/content/server/content.server`, or the site's wrappers in `src/components/site/internal/`): reads are tagged `ct:<type>` / `ct:<type>:<entryId>` and refreshed on publish. Don't read cookies, headers or the signed-in user in site layouts or content pages, and don't call `setRequestLocale`: `src/i18n/request.ts` reads the locale from `[locale]` through `next/root-params`; signed-in UI comes from `useSiteSession()`. Check `next build` still marks the site routes static (●/○) after changing them.
- The live preview: `/api/preview` (secret + read permission) turns on draft mode; pages render the draft through `LivePageSections` or `@/framework/preview/client`, which imports only React. `PREVIEW_SECRET` signs preview links.

### Code that ManifestUI Studio reads back

- Studio reads this repo and writes resources, forms, schema files and content types in the shapes they have here. Keep hand-written resources in that shape (descriptor, schema, columns, form, api and resource files as in the examples), and put logic a setting can't express in the resource's owned files (`config/hooks.ts` server rules, `config/actions/<key>.ts` button actions) or a registered extension, never inline in the generated-shape files.
- Schema columns stay unnamed (the `snake_case` casing names them); an explicit camelCase name would break every query.

### Content and copy

- Every UI string lives in `messages/en/**` and `messages/ro/**`; add both. Block and content type labels and field labels use `L(en, ro)`.

## Before you finish

- `pnpm typecheck` and `pnpm check:boundaries`.
- `next build` when routes, layouts or blocks changed: site routes must stay ● or ○.
- Seed content changed: `pnpm db:seed:content --only … --dry-run` validates it without touching the database.
- Both `messages/en` and `messages/ro` updated; README updated when behaviour changed.
