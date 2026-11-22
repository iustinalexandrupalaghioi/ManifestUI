---
name: manifestui-builder
description: Builds features and whole projects on the ManifestUI framework (Next.js + Drizzle + Supabase) - tables, CMS resources, content types, blocks, website pages, permissions, translations, project setup. Use it for any "add a <thing> to the admin / the website", "make this a content type", "a new block that shows …", "set up a new project for <client>" request in a ManifestUI repository.
---

You build on the ManifestUI framework. You write the same TypeScript a careful developer writes by hand, in the shapes the framework and ManifestUI Studio expect, and you prove it compiles, respects the layers and keeps the site static.

## Before writing anything

1. Read `CLAUDE.md` and `AGENTS.md` at the repository root. They are the rules; this file is how to apply them. If they disagree with the code, the code is right.
2. Read the README section for the task (AGENTS.md › "Where to read before changing something"), then the closest existing example in the repo, then the framework source it relies on. Next.js here differs from your training data: check `node_modules/next/dist/docs/` before using a Next API.
3. Decide what the request needs, using the questions below, before creating files. Say the plan in a few lines when it spans several of these.

| The request | What to build |
| --- | --- |
| Records people manage in the admin (orders, customers, bookings) | A **table** + a **CMS resource** |
| Content that goes live on the website, with drafts and Publish (articles, team members, services, FAQs) | A table with `entry_id`/`published_at`/`published_by` + a resource with `content` on its descriptor + a **content type** |
| A section editors place on pages | A **block** (`pnpm manifest block <name>`), plus a block loader when it shows database records |
| A page per entry (`/blog/<slug>`) | A route under `src/app/[locale]/(site)/` reading with `getEntry` and `listSlugs` |
| Header, footer, site name | Content: the `navigation` and `siteInfo` single entries; change their fields only if the shape must grow |
| A custom field, form section, detail panel or computed column | An extension (`define*Component`) registered in `src/components/extensions/index.ts` |
| Who may do what | Permissions in the CMS (data, not code); a custom action declared in the descriptor's `actions` when it must be grantable |
| A new project | CLAUDE.md › Setting up a new project, step by step |

## How to build each part

Follow AGENTS.md › Recipes exactly. The points people get wrong:

**Tables** (`src/db/schema/<name>.ts`, exported from `index.ts`)
- camelCase properties, no explicit column names (the `snake_case` casing names them). `bigint` identity ids like the other tables. Enable RLS (`.enableRLS()`); the app reads through its server connection.
- Content tables add `entryId: uuid().notNull().defaultRandom()`, `publishedAt`, `publishedBy`, `unique(entryId, locale)` when localized, a `locale` check constraint listing the routing locales, and a read policy `using published_at IS NOT NULL` (copy `src/db/schema/service.ts`).
- You don't apply schema changes. Tell the developer which command to run (`pnpm db:generate` + `pnpm db:migrate`, or `pnpm db:push` then `pnpm manifest db` on a development database), and never one that needs a data-loss confirmation.

**CMS resources** (`src/components/cms/<module>/<feature>/`)
- Files: `config/descriptor.ts`, `config/schema.ts` (Zod, the form values' type), `config/columns.ts` (grid, cards and pickup columns, aligned by `field`), `config/form.ts` (`FormConfig`), `config/api.ts` (`defineResourceActions`, every action checking a permission), optional `config/relations.ts`, `config/hooks.ts` (server rules), `config/actions/<key>.ts` (button actions), and `resource.tsx` (`defineResource<Row, FormValues, Id>`). Copy the closest example: `src/components/cms/main/todo/` for a plain resource, `src/components/cms/content/service/` for a content type.
- Routes: `src/app/[locale]/cms/(<module>)/<route>/page.tsx`, `add/page.tsx`, `[id]/page.tsx`, each in `ResourceGuard`. Register the descriptor in `resourceDescriptors.ts` and `import "…/resource"` in `registerResourceComponents.ts`. Add a menu link in `src/components/cms/MenuItems.tsx`, with labels in both `messages/{en,ro}/features/Menu.json`.
- Row types come from Drizzle (`typeof table.$inferSelect`), form values from the Zod schema. Empty numeric inputs arrive as `""`: normalize them before number validation, and don't use `z.coerce.number()` where empty must not become 0.
- Content-type resources: `withContentDraft` in fetch detail, `saveContentFromForm` in update, `withContentStatuses` in the list, `forgetContentRow` inside the delete wrapped in `afterContentDelete`, the History tab (`contentHistoryRelation`, `contentHistoryTab`) and `detail.formInTabs: true`. Then `defineContentType` in `src/content/types/` and add it to `registerContentTypes` in `src/content/index.ts`.

**Blocks** (`src/content/blocks/<type>.ts` + `src/components/site/blocks/<Name>.tsx`)
- Start with `pnpm manifest block <name>`. Fields come from `@/framework/content` (`text`, `richText`, `media`, `link`, `reference`, `choice`, `list`, `group`); labels use `L(en, ro)`, and `defaults` cover `en` and `ro`, with links as `{ label, href: { kind: "url", href } }`.
- The definition file imports no React and nothing from the site. The renderer is plain React over `content`; spread `field("path", …)` on what editors click in the preview; interactive parts go in a `"use client"` child component.
- Database data comes from `defineBlockLoader` in `src/components/site/blocks/data.ts`, received as `data`. Never query tables from a renderer.
- Never rename a block `type` or a content type `name`, and keep stored shapes compatible: add fields, don't rename them.

**Website pages**
- Read only through the content layer (`getEntry`, `listEntries`, `getSingleton`, `listSlugs`) or the wrappers in `src/components/site/internal/`; pass `draft: true` so the preview shows drafts.
- No cookies, headers, signed-in user or `setRequestLocale` in site layouts and pages. Signed-in UI comes from `useSiteSession()`.
- Entry pages: `generateStaticParams` from `listSlugs`, `dynamicParams = true`, metadata from the entry and `getSiteInfo`, and an `EditPageButton` when editors should jump to the record. Keep the descriptor's `content.url` pointing at the route.

**Copy and translations**
- Every interface string goes in `messages/en/**` and `messages/ro/**`, both at once. Content (texts editors change) never goes in messages: it belongs in fields, defaults and the seed files.

**Starter content**
- Seed files live in `src/db/seed/` (pages as JSON blocks or Markdown, services, site settings). Validate with `pnpm db:seed:content --only <selector> --dry-run`. Writing to a database (`--force`) is the developer's call: it overwrites what editors changed.

## Finishing

Run these and fix what they report before saying you're done:

1. `pnpm typecheck`
2. `pnpm check:boundaries`
3. `next build` (`pnpm build`) when routes, layouts, blocks or content types changed: every site route must be ● or ○ in the route table.
4. `pnpm db:seed:content --only … --dry-run` when seed files changed.

Then report:
- what you built and where (the files, grouped by part),
- what the developer must still do, as commands and CMS steps: apply the schema, `pnpm content:migrate --apply` for existing content rows, grant permissions, publish the new page,
- anything you chose that they might want differently.

## Never

- Import project code into `src/framework/`, or React and site code into `src/content/` or the React-free parts of `src/framework/content/`.
- Write `published_at`, drafts or revisions yourself: use the content actions.
- Store configuration in the database: tables, resources, forms, content types and blocks are code.
- Run migrations, pushes or seeds with `--force`, change permissions, or deploy, unless the developer asked for that specific action.
- Commit or push unless asked.
