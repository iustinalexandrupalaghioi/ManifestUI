# ManifestUI

A full-stack Next.js **admin app**: a resource-driven CRUD framework (`src/framework/`)
built on React Query, React Hook Form, Zod, and Drizzle, with **role-based access control**
(groups, per-resource/per-verb permissions) gating every route and every server action. Auth
and storage are Supabase; the framework itself is storage/DB-agnostic behind small
interfaces.

This doc is the practical "how do I build something here" guide: setup, migrations, adding
a resource, and how server actions/permissions/RBAC work. It intentionally does **not**
re-explain the framework's internals (the `defineResource` pipeline, the data-view/form/
dialog sub-systems, etc.) — treat this as "how to use the framework," not "how the framework
works."

> **Not the Next.js you know.** This app pins a Next.js build with local, non-standard
> changes — see [AGENTS.md](./AGENTS.md). Check `node_modules/next/dist/docs/` before relying
> on anything from your training data about Next.js APIs/conventions.

## Contents

- [Stack](#stack)
- [Prerequisites](#prerequisites)
- [Starting a new project from this template](#starting-a-new-project-from-this-template)
- [First-time setup](#first-time-setup)
- [Running the app](#running-the-app)
- [Project structure](#project-structure)
- [Architecture: layers](#architecture-layers)
- [Database & migrations](#database--migrations)
- [Adding a new resource](#adding-a-new-resource)
- [Data views](#data-views)
- [Forms](#forms)
- [Relations & detail pages](#relations--detail-pages)
- [File uploads](#file-uploads)
- [Server actions & `ActionResult`](#server-actions--actionresult)
- [Custom actions: action forms and bulk actions](#custom-actions-action-forms-and-bulk-actions)
- [Extensions: custom components](#extensions-custom-components)
- [Building the website](#building-the-website)
- [Authorization: RBAC](#authorization-rbac)
- [Auth flows](#auth-flows)
- [i18n](#i18n)
- [Known issues to be aware of](#known-issues-to-be-aware-of)

## Stack

- **Next.js 16** (App Router, `src/app/`) + **React 19**
- **Supabase** — auth (email/password + Google OAuth) and file storage
- **Drizzle ORM** over Postgres (Supabase's Postgres)
- **next-intl** — `en`/`ro` locales, prefixed in the URL (`/ro/...`, `/en/...`, including
  the default locale — see [i18n](#i18n))
- **TanStack Query + Table**, **React Hook Form + Zod**, **shadcn/ui** primitives
- Package manager: **pnpm**

## Prerequisites

- Node.js + pnpm
- A Supabase project (free tier is fine for local dev) — you need its project URL, anon
  key, service role key, and Postgres connection strings

## Starting a new project from this template

1. **Create your repo** — use GitHub's "Use this template" button, or clone this repo and
   start a clean history (`rm -rf .git && git init`).
2. **Rename the project** — update `package.json`'s `name` field, the `title`/`description`
   in `src/app/[locale]/layout.tsx`, `src/app/[locale]/(site)/layout.tsx`, and
   `src/app/[locale]/cms/layout.tsx` (currently "ManifestUI" / "ManifestUI Admin"). The site's name in the header and footer
   is content: edit it in **Website › Site settings** (seeded from `src/db/seed/site-settings/`).
3. **Decide what to do with the demo resources.** `todos`, `relations`, and `attachments`
   (`src/components/cms/main/`) are a worked example of the resource pattern, not
   meant to ship as-is. Keep them around while you learn the framework (see
   [Adding a new resource](#adding-a-new-resource) — they're the reference every step there
   points at), then delete them once you're comfortable: remove the three folders, drop
   their entries from `resourceDescriptors.ts`/`registerResourceComponents.ts`, remove their tables
   from `src/db/schema/` (`todo`, `todo_attachment`, `relation`), and delete their menu/i18n
   entries. Leave `groups`/`group-permissions`/`user-groups`/`users`
   (`src/components/cms/administration/`) alone — that's the RBAC system itself, not
   demo data.
4. **Point it at your own Supabase project and apply the schema** — run `pnpm manifest setup`
   (see [First-time setup](#first-time-setup)): it writes `.env`, pushes the schema, installs the
   auth user sync and creates your first administrator.
5. **Configure locales**, if you don't need `en`/`ro` — edit `src/i18n/routing.ts` and add
   or remove the matching `messages/<locale>/` folders (see [i18n](#i18n)).
6. **Start building** — once you're signed in as an administrator, follow
   [Adding a new resource](#adding-a-new-resource) for your first real resource, and grant
   yourself/your team access via the `groups`/`group-permissions` screens (see
   [Authorization](#authorization-rbac)).

## First-time setup

You need Node.js, pnpm and a Supabase project (the free tier is fine).

```bash
pnpm install
pnpm manifest setup
```

`pnpm manifest setup` walks through every step below and is safe to run again. Each step is
also its own command:

| Command | What it does |
| --- | --- |
| `pnpm manifest env` | Creates or completes `.env`: asks for the Supabase values, generates `AUTH_WEBHOOK_SECRET`, defaults `NEXT_PUBLIC_BASE_URL` to `http://localhost:3000`. Existing values are kept. |
| `pnpm manifest db` | Runs `pnpm db:push` to create the tables from `src/db/schema/*.ts`. |
| `pnpm manifest auth-sync` | Installs a trigger that keeps the app's `user` table in sync with Supabase Auth, and backfills existing accounts. |
| `pnpm manifest admin [email]` | Makes a user administrator. If the account doesn't exist, it creates it and prints a temporary password once. |
| `pnpm manifest site` | Sets up the website: website tables, the seed content in `src/db/seed/`, section and database checks. See [Building the website](#building-the-website). |
| `pnpm manifest section <name>` | Scaffolds a page section in `src/components/extensions/sections/` and registers it. |
| `pnpm manifest doctor` | Checks env vars, both database connections, the app tables, the sync trigger, that an administrator exists, and that Supabase Auth answers. |

(It's `pnpm manifest setup` rather than `pnpm setup` because `pnpm setup` is a built-in pnpm
command.) The CLI lives in `scripts/manifest.mjs` and uses only the project's own dependencies.

### Environment variables

`.env.example` lists every variable the code reads:

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page. Server only; never expose it to the browser. |
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string, **Transaction pooler** (port 6543). Used by the app at runtime (`src/db/index.ts`). |
| `DIRECT_DATABASE_URL` | Same page, the **direct/session** connection (port 5432). Required by `drizzle-kit` (`drizzle.config.ts`) and by `pnpm manifest`. |
| `NEXT_PUBLIC_BASE_URL` | The app's URL, e.g. `http://localhost:3000` in development. |
| `AUTH_WEBHOOK_SECRET` | Any string. Only needed if you use the webhook instead of the sync trigger (below). |
| `NEXT_PUBLIC_APP_TIMEZONE` | Optional. Time zone used to show and enter dates and times (default `Europe/Bucharest`). |
| `NEXT_PUBLIC_DEFAULT_VIEW_MODE` | Optional. Initial overview mode, `list` (cards, default) or `table` (grid). |
| `NEXT_PUBLIC_ENABLE_NUMBERED_TABS` | Optional. `true` shows a number before each detail tab label. |

### Keeping users in sync

The app's own `user` table (holding `administrator`, `full_name`, etc.) is _not_ Supabase's
`auth.users`. `pnpm manifest auth-sync` runs `src/db/sql/auth-user-sync.sql`, which adds a
trigger on `auth.users` that mirrors every insert, update and delete into `user` inside the
database. It works for local development and production alike, with no public URL. You can also
paste the file into the Supabase SQL editor. It is plain SQL rather than part of the Drizzle
schema because Drizzle can't define functions or triggers, and `db:push` doesn't run custom SQL. Deleting an auth user also removes their group
memberships, since `user_group` references `user` with `ON DELETE RESTRICT`.

**Alternative: webhook.** `/api/webhooks/auth-users` does the same sync over HTTP. To use it
instead, add a Supabase **Database Webhook** on `auth.users` for `INSERT`/`UPDATE`/`DELETE`,
pointed at `${NEXT_PUBLIC_BASE_URL}/api/webhooks/auth-users`, with an `x-webhook-secret` header
equal to `AUTH_WEBHOOK_SECRET`. Supabase must be able to reach that URL, so this doesn't work
against `localhost`.

### Your first administrator

`pnpm manifest admin you@example.com` sets `administrator = true` on that user (creating the
account first if needed). By hand, sign up through `/auth/signup`, then run:

```sql
update "user" set administrator = true where email = 'you@example.com';
```

`administrator = true` is a full bypass of the groups/permissions system (see
[Authorization](#authorization-rbac)): every route and every server action requires
authentication plus the matching permission, and an administrator is granted all of them
automatically, with no group assignment needed.

## Running the app

```bash
pnpm dev          # dev server, http://localhost:3000
pnpm build        # production build
pnpm start         # run the production build
pnpm typecheck     # tsc --noEmit
```

## Project structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx            outer shell (html/body, generateStaticParams) — no CSS
│   │   │                         import, so (site) and cms below can each ship their own
│   │   ├── (site)/               public site route group (no URL segment) — the CMS-built
│   │   │                         home page and [slug] pages, site-preview/ (the page
│   │   │                         editor's frame), its own layout, and auth/ (login/signup/
│   │   │                         forgot-password/update-password/signup-success pages)
│   │   └── cms/                  the admin app, gated by ResourceGuard on every route
│   │       ├── <resource>/       one folder per resource route: todos/, relations/,
│   │       │                     attachments/, users/, groups/, group-permissions/,
│   │       │                     user-groups/ — each just page.tsx / add/page.tsx /
│   │       │                     [id]/page.tsx wiring a ResourceGuard around the
│   │       │                     resource's generated components
│   │       ├── resourceDescriptors.ts   whole-app resource registry (id/table/labels/routes)
│   │       ├── registerResourceComponents.ts   side-effect imports that run defineResource()
│   │       │                     for every feature, populating the resource registry
│   │       ├── createResourceActions.ts   project-level wrapper pre-binding the framework's
│   │       │                     generic createResourceActions to resourceDescriptors
│   │       └── grantablePermissions.ts   resources + custom actions offered by the
│   │                             group-permissions picker
│   └── api/webhooks/             route handlers, e.g. the auth-users sync webhook — outside
│                                 [locale] since API routes aren't locale-scoped
├── components/
│   ├── site/                     the site's shared UI (header/footer slots, menus, toggles,
│   │   │                         carousel, cards) — see Building the website
│   │   └── internal/             site plumbing: reads, cache tags, media, session, editor preview
│   ├── cms/                      the CMS: AppNavbar, MenuItems, BASE_ROUTE ("/cms") and one
│   │   │                         folder per module with its resources:
│   │   ├── main/                 todo/, relation/, todo-attachment/
│   │   ├── content/              service/, site-page/, site-settings/
│   │   └── administration/       user/, group/, group-permission/, user-group/
│   │                             (the RBAC resources themselves — see Authorization)
│   ├── extensions/               your registered extensions (index.ts), page sections
│   │                             (sections/), collections and the header and footer (site/)
│   └── ui/                       app-level UI, distinct from framework/components/ui
├── framework/                    the reusable CRUD framework (defineResource, forms,
│   │                             data-view, dialogs, files) — not covered in depth by
│   │                             this doc
│   ├── authorization/            RBAC: permissions.ts, ResourceGuard, usePermissions,
│   │                             AccessDeniedDialog — see Authorization
│   ├── extensions/               the extension API — see Extensions
│   └── site/                     the website builder: defineSection, primitives, rendering
├── lib/storage/                  the default (Supabase Storage) file upload handler
├── db/
│   ├── index.ts                  Drizzle client (see the RLS caveat in Authorization)
│   └── schema/                   Drizzle table definitions — the source of truth for
│                                 the DB shape
└── i18n/                        next-intl config; locale lives in the URL
                                  (localePrefix: "always") — strings live in messages/en,
                                  messages/ro
```

## Architecture: layers

The code is split into layers. Each layer only imports from the layers below it, so the framework
stays reusable, and the project plugs into it instead of the other way round
(dependency inversion).

| Layer | Where | What it is | May import |
| --- | --- | --- | --- |
| **platform** | `src/components/ui`, `src/lib`, `src/hooks`, `src/i18n`, `src/contexts` | Shared infrastructure: shadcn/ui, Supabase clients, utilities | platform |
| **framework** | `src/framework/` | The CRUD engine (resources, forms, data views, auth, RBAC, the extension API) and the website builder (`src/framework/site`) | framework, platform |
| **app** | everything else in `src/`: routes, `components/`, `extensions/`, `db/`, `lib/storage/` | This project: its resources, sections, tables and adapters | app, framework, platform |

**How the framework reaches the project.** It never imports project code. Everything it needs comes
from one file, `src/manifest.config.ts`, the composition root:

```ts
export default defineManifestConfig({
  db,                                // the Drizzle client the framework reads and writes with
  resources: resourceDescriptors,    // every CMS resource: labels, routes, permission messages
  authTables,                        // the user and access tables authentication and RBAC query
  auth: { beforeOAuthSignIn },       // optional hooks
});
```

The framework reads it through `src/framework/runtime.ts`, the only framework file allowed to import
from the project. The tables it queries (`user`, `group`, `group_permission`, `user_group`) stay in
`src/db/schema/` with the rest of the schema; the config hands them over, and
`declare module "@/framework/config" { interface Register { authTables: … } }` gives the framework
their exact column types (the same pattern as the extensions registry). The framework only states
which columns it needs (`AuthTablesShape` in `src/framework/config.ts`). Other ports work the same way: the file storage handler
(`src/lib/storage`, registered with the framework), extensions (`src/components/extensions/index.ts`), and the
website builder's media uploads (`<SiteEditorProvider upload>` in the editor's preview frame).

`pnpm check:boundaries` checks every import against these rules, and CI runs it. When it fails, the
fix is almost never an exception. Pass what the lower layer needs through the config, a
registration or a prop, or move the code to the layer that owns it.

## Database & migrations

Schema source of truth is `src/db/schema/*.ts` (Drizzle, `casing: "snake_case"` per
`drizzle.config.ts`). Two ways to apply changes:

All `drizzle-kit` commands connect through `DIRECT_DATABASE_URL` (see `drizzle.config.ts`).

- **`pnpm db:push`** — pushes the current schema files straight to the DB, no migration
  file generated. Fast for local iteration; don't use it against a shared/prod DB since
  there's no history to review or roll back.
- **`pnpm db:generate`** then **`pnpm db:migrate`** — `generate` diffs your schema files
  against the last-known state (recorded in `drizzle/meta/`) and writes a new SQL file under
  `drizzle/`; `migrate` applies pending migration files. This is the reviewable,
  shared-DB-safe path. **Always review the generated SQL before running `db:migrate`** —
  drizzle-kit's diff heuristics can mistake a rename for a drop+create, which silently loses
  data. Note that `drizzle` is listed in `.gitignore`: remove that line if you want migration
  history committed.
- **`pnpm db:studio`** — opens Drizzle Studio against your DB.

To change the schema:

1. Edit/add a file in `src/db/schema/` (a `pgTable(...)` definition; see `todo.ts` for a
   simple example, `relation-table.ts` for one with `pgPolicy`/`check` constraints — note
   the RLS caveat in [Authorization](#authorization-rbac) before relying on `pgPolicy`).
2. Add cross-table relations in `src/db/schema/relations.ts` if needed (Drizzle's
   `relations()` helper — used for typed joins, not enforced at the DB level).
3. Re-export it from `src/db/schema/index.ts`.
4. `pnpm db:generate` (review the SQL it writes under `drizzle/`) then `pnpm db:migrate`,
   or `pnpm db:push` in local dev.

## Adding a new resource

Every resource under `src/components/cms/**` follows the same shape. Walking through
`todos` (`src/components/cms/main/todo/`) as the template:

```
todo/
├── resource.tsx              defineResource(...) call — the entry point
├── index.ts                   re-exports resource.tsx's public surface
├── config/
│   ├── descriptor.ts           id, table name, i18n labels, routes, query key
│   ├── schema.ts                Zod schema for the form + inferred TFormValues type
│   ├── api.ts                   server actions: fetchList/fetchDetail/add/update/delete
│   ├── columns.ts                table/card column definitions
│   ├── form.ts                   the add/edit form layout
│   ├── relations.ts              (optional) related resources shown as detail tabs
│   ├── tabs.ts / detailSlots.tsx (optional) detail-page layout extras
│   └── actions/                 (optional) custom actionForms/bulkActions — see below
└── hooks/                      (optional) resource-specific hooks
```

Steps to add a new one, say `projects`:

1. **DB table** — add `src/db/schema/projects.ts`, export it from `schema/index.ts`, run
   `db:push` (or `db:generate` + `db:migrate`).
2. **Type** — don't write one: infer the row type from the table (`typeof projects.$inferSelect`).
   Only when a query returns joined or computed fields, export a type next to that query in
   `config/api.ts` that extends the inferred row (see `Todo` or `UserGroup`).
3. **`config/descriptor.ts`** — `id`, `table`, i18n `singular`/`plural`/`new` labels (plus
   `singularDefinite` and `gender` if you want grammatically correct Romanian error/toast
   messages — see the existing descriptors for the pattern), `routes` (list/add/detail),
   `queryKey`, `overviewKey`.
4. **`config/schema.ts`** — a Zod object for the editable fields; export the inferred
   `ProjectFormValues` type.
5. **`config/api.ts`** — `"use server"`; export every action from one
   `defineResourceActions(descriptor.id, { ... })` call
   (`@/framework/authorization/lib/defineResourceActions`). Reads are `[verb, fn]` pairs
   (`fetchTodoList: ["read", async (...) => ...]`); writes come from
   `createResourceActions(descriptor.id)` (`@/app/[locale]/cms/createResourceActions`, a
   project-level wrapper that threads the app's whole `resourceDescriptors` list through so
   failure messages can resolve any resource's label): `.add(fn)`, `.update(fn)`,
   `.delete(fn)` and `.action(verb, fn)` for custom verbs, each run in a transaction. Every
   action is permission-gated per verb — see
   [Server actions & ActionResult](#server-actions--actionresult) and
   [Authorization](#authorization-rbac). `todo/config/api.ts` shows the full pattern, including
   keyset pagination, grouping and totals.
6. **`config/columns.ts`** — a `ColumnConfig[]` for the table/card views.
7. **`config/form.ts`** — a `FormConfig` (stack, grid or free layout, see [Forms](#forms)) for add/edit.
8. **`resource.tsx`** — call `defineResource({...})` wiring all of the above together, then
   re-export the generated `hooks`/`components` you need (`Overview`, `AddPage`,
   `DetailPage`, `PickupDialog`, the query hooks). Copy `todo/resource.tsx` as a template.
9. **`index.ts`** — re-export resource.tsx's public names.
10. **Register it in three places** (all under `src/app/[locale]/cms/`):
    - `resourceDescriptors.ts` — add `projectsDescriptor` to the array (this is what backs
      `createResourceActions`, `grantablePermissions.ts`'s resource picker, and any central
      resource listing).
    - `registerResourceComponents.ts` — add `import "@/components/cms/main/projects";`
      (side-effect import; this is what actually runs `defineResource()` and populates the
      `ResourceRegistry` that lookup/relation fields resolve other resources through).
    - `grantablePermissions.ts` needs no edit for plain CRUD — it derives the resource's
      read/add/update/delete permission strings automatically from `resourceDescriptors`.
      Only add an entry to its `grantableActions` array if the resource exposes a **custom**
      action (see [Custom actions](#custom-actions-actionforms-vs-bulkactions)).
11. **Routes** — add `src/app/[locale]/cms/projects/page.tsx` (renders `ProjectOverview`
    wrapped in `<ResourceGuard resourceId="projects" action="read">`), `projects/add/page.tsx`
    (`ProjectAddPage`, `action="add"`), `projects/[id]/page.tsx` (`ProjectDetailPage`,
    `action="read"`, since the update permission is checked per-field/per-save inside the
    detail page itself) — three small files, same pattern as `src/app/[locale]/cms/todos/*`.
12. **i18n strings** — add whatever `t("...")` keys you introduced to `messages/en/*` and
    `messages/ro/*`.
13. **Grant access** — a fresh resource is invisible to everyone but administrators until
    some group is given permissions on it: sign in as an admin and add rows via the
    `group-permissions` resource (or assign an existing group that already grants `"*"`-style
    broad access, if you have one).

## Data views

`config/columns.ts` defines the resource's columns as `ColumnConfig[]`. Each column has a
`field`, a `label` (`{ en, ro }`), a `type` (`text`, `number`, `boolean`, `date`, `time`,
`datetime`, `select`, `file`, `json`) and optional behaviour: `sortable`, `filterable`,
`groupable`, `aggregatable` (with `defaultAggregate`), `selectOptions` for enums, `size`,
`prefix`/`suffix`, and visibility flags `hidden`, `navigationHidden`, `pickupHidden`.

An enum option can take a `tone` (`neutral`, `info`, `success`, `warning`, `danger`): the value
then shows as a coloured badge in grid cells, cards and filter chips. A `boolean` column can name its
values with `selectOptions` keyed `"true"` / `"false"` (site pages show a green "Published" or a grey
"Draft"). Options without a tone stay plain text.

Card columns also lay out the card: `cardTitle: true` makes a column the card's heading (shown
large at the top), the other columns form a two-column label/value grid, and `cardWide: true`
lets a field span both columns. Columns sharing a `group` show as one field under `groupLabel`.
A card has no delete button of its own: select cards and use the toolbar's **Delete** (or the
context menu).

`resource.tsx` → `dataView` places them:

- **`overview`** — the resource's list page. `dataTableColumns` for the grid and
  `dataListColumns` for the card list (keep column IDs aligned between the two; they're merged
  by ID). `features` switches tools on or off (sorting, filtering, quickSearch, grouping,
  aggregates, saved views, the grid/cards toggle, card list, resizing, pinning, the column
  manager, selection, inline editing). `slots` adds components around the grid.

  A list page has one toolbar in the page, under the view row (view name, save view, reset view):
  Back · **Add**, Open, Edit (inline editing), Delete, Actions ▾, ⋯ · search, Filters, Sort ·
  "N selected · M total" and the Cards | Table toggle. A record page's toolbar has Back · **Save**
  (also Ctrl/⌘+S), Reload, Add, Delete, Actions ▾, ⋯ and "Unsaved changes". Each button shows only
  when its feature and permission allow it. The navbar holds only the menu, the breadcrumb,
  language, theme and the account menu. It's neutral by default; `NAVBAR_TONE = "teal"` in
  `src/components/cms/constants.ts` makes it a dark teal bar with white text.
  A link in `src/components/cms/MenuItems.tsx` can be live: `type: "live"` with
  `useLiveNumber: () => useResourceCount("users")` shows the resource's row count on its tile in
  the CMS home and beside it in the ☰ menu. It's counted by the resource's own aggregates action,
  so only users who can read the resource see it, and it refreshes when rows change.
- **`pickup`** — the dialog that opens from a relationship field to pick a record; its own
  columns, features and default view.
- **Default views** are config, not code: `overview.defaultView`, `overview.navigationView`
  (when the overview is embedded as a filtered list, e.g. in a relation tab or split view) and
  `pickup.defaultView` set the initial sorting, filters, column order, widths and pinning, per
  mode:

  ```ts
  defaultView: {
    table: { sorting: [{ column: "created_at", desc: true }], pinned: ["title"] },
    list: { sorting: [{ column: "created_at", desc: true }] },
  },
  ```

  Views users save keep their own state.

Grouping and totals need server support: `data.fetchGroupAggregates` / `data.fetchAggregates`
(see `todo/config/api.ts`).

## Forms

`config/form.ts` exports a `FormConfig` with one of three layouts:

- **`stack`** — sections one under another; each section has `cols` and `fields`.
- **`grid`** — named `areas` with sections placed into columns.
- **`free`** — a tree of nodes under `root`: containers (`grid`, `row`, `column`, `card`,
  `tabs`), fields, `list` (related records), `heading`, `text`, `divider`, `spacer`, `slot`,
  `button`/`buttons` and `pickupvalue`. ManifestUI Studio's Form Designer produces this layout.

Field types: `input` (`inputType` text/number/email/tel/password), `textarea`, `switch`,
`select`, `combobox`, `date`, `time`, `datetime`, `readonly`, `json`, `file`, `custom`, plus
registered [extension](#extensions-custom-components) fields. Every field takes `name`, `label`,
`disabled`/`readonly` (a boolean or a function of the form values), and placement props.

In `free` layouts placement is responsive to the width of the **parent container**: `span`,
`col`, `row`, `hideOn`, `order` and a grid's `cols` accept a plain value or
`{ base, sm, md, lg, xl }`, mobile-first. `hidden` hides a node (also by condition); `hideOn`
hides it at chosen sizes while keeping it mounted.

**Relationship fields** use `pickup`: `resource` (the related resource), `mapField` (the
column taken from the picked record), `targetField` (the form value it fills), optional
`embeddedField` (the related record already loaded on detail forms), `fillFields` (show or copy
other related values; `pickupvalue` nodes place them anywhere in a `free` layout) and
`preFilters`. See the user field in `todo/config/form.ts`.

Validation is the Zod schema in `config/schema.ts`; errors show as soon as a field is invalid.
`FormInput` turns non-empty number inputs into numbers and cleared ones into empty strings, so
normalise empty numeric input in the schema before number validation (avoid
`z.coerce.number()` where empty must not become zero). Money fields that are Postgres
`numeric` should parse to strings.

## Relations & detail pages

- **Relations** (`config/relations.ts`) list child resources whose rows point at this one:
  `key`, `childResource`, and `filter(item)` returning the filter that scopes the child list
  (see `todo/config/relations.ts`). `invalidateOn: ["add" | "update" | "delete"]` refetches the
  child lists after those mutations of the parent.
- **Detail tabs** (`detail.tabs`): `type: "relation"` shows a relation's list,
  `type: "fields"` a group of form fields, `type: "extension"` a registered detail component,
  and the default `type: "list"` your own `render(item)`. `detail.defaultTab` picks the
  tab that opens first; `detail.defaultFormOpen` (default `true`) decides whether the detail
  form starts expanded.
- **Detail slots** (`detail.slots`): `beforeForm`, `afterForm`, `afterTabs`, `left`,
  `right` — a render function or an extension reference.
- **Presentation** (`presentation`): `open` as `page`, `dialog` or `split` (the detail beside
  the overview, configured by `split`), and `add` as `page` or `dialog`.
- **Toolbar actions**: the top-level `add`, `open` and `delete` accept `true`/`false` or
  `{ toolbar, row }` to choose where each action appears.

## File uploads

`file` fields upload through a storage handler: `setStorageHandler()` from
`@/framework/components/files`. The app registers a Supabase Storage handler in
`src/lib/storage/registerDefaultStorageHandler.ts` (imported by the CMS providers and the
profile form); swap it to store files elsewhere. The upload components show progress and
previews.

## Server actions & `ActionResult`

Next.js Server Actions strip thrown errors down to an opaque digest in production, so
nothing in a resource's `config/api.ts` throws across that boundary. Every data function —
`fetchList`, `fetchDetail`, `add`/`update`/`delete` — returns:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };
```

You get this for free by wrapping each function with `defineResourceActions(resourceId, {
...})` (via this project's `createResourceActions(descriptor.id)` helper — see step 5
above), which:

1. Calls `requirePermission(resourceId, action)` first — throws `ForbiddenError` unless the
   caller is signed in **and** holds the `"<resourceId>:<action>"` permission (directly via
   a group, or implicitly because they're an administrator — see
   [Authorization](#authorization-rbac)).
2. Runs your function, catching `ForbiddenError`, Zod errors, and anything else (Postgres
   constraint violations get mapped to a friendly, locale-aware message), and returns it as
   `{ ok: false, error }` instead of letting it throw.

On the client, `unwrapAction(result)` (`@/framework/lib/actionResult`) returns `.data` or
throws an `ActionResultError` — React Query then surfaces that as a normal query/mutation
error, so components mostly don't deal with `ActionResult` directly.

The `add`/`update`/`delete` helpers from `createResourceActions(...).add/update/delete`
each run inside a DB transaction; `delete` runs **per id**, so a bulk delete can partially
succeed (`{ succeededIds, failures }`, surfaced in the UI by `ResultDialog`).

## Custom actions: action forms and bulk actions

Beyond plain add/edit/delete, a resource can expose custom actions. `todos` has one
example of each (`src/components/cms/main/todo/config/actions/`):

- **Action forms** (`complete-with-notes.tsx`) — an `ActionFormConfig`: a labeled action
  that opens a small dialog with its own form (its own Zod schema, its own submit), usable
  from the table toolbar or a detail page. Wire it into `resource.tsx` via
  `actions: { forms: [...] }`.
- **Bulk actions** (`complete.tsx`) — a hook (`() => BulkActionsHookResult`) contributing
  extra row/bulk actions to the table/detail toolbar that _don't_ need their own form (here,
  "mark complete" just calls the mutation directly on the selected rows). Wire it into
  `resource.tsx` via `actions: { bulk: useYourBulkActionsHook }`.

`actions` also takes `isDeleteEligible(item)` (hide delete for rows that can't be deleted) and
`getRowUrl(item)`.

Both ultimately call a server action defined the same way as `add`/`update`/`delete` — see
`completeTodos` in `todos/config/api.ts` for the `createResourceActions(...).action(verb, ...)`
helper that backs a custom action's transactional per-id write. `verb` becomes the second
half of the permission string it's gated on (`"todos:complete"`), same as `"read"`/`"add"`/
`"update"`/`"delete"` for the built-ins.

Because a custom verb isn't part of the automatic read/add/update/delete expansion, **you
also have to add it to `grantableActions` in `src/app/[locale]/cms/grantablePermissions.ts`** so it shows
up as something a group can be granted — see the `"todos:complete"` /
`"todos:complete-with-note"` entries there for the pattern. The `id` you give it there must
match the `verb` string exactly, since that's what `hasPermission(`${resourceId}:${verb}`)`
checks against on the client and `requirePermission` checks server-side.

## Extensions: custom components

When a resource needs something the built-in fields and layouts don't offer, add your own React
component as an **extension**. The API lives in `@/framework/extensions` and has four kinds, one
per place a component can render:

| Helper                    | Renders                                                                                       | Component receives                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `defineFieldComponent`    | As a form field bound to **one form value**, like a built-in field type                      | `id`, `name`, `label`, `value`, `onChange`, `onBlur`, `error`, `disabled`, `readOnly`, `props`, `item` |
| `defineBlockComponent`    | As a form **section**, with access to the whole form                                          | `props`, `values` (live form values merged over the record), `form` (React Hook Form), `item`, `disabled`, `readOnly` |
| `defineDetailComponent`   | In a detail page/dialog slot (`beforeForm`, `afterForm`, `afterTabs`, `left`, `right`) or as a detail tab | `item`, `props`, `tab` (set when rendered as a tab)                                    |
| `defineOverviewComponent` | In an overview slot (`beforeToolbar`, `afterToolbar`, `toolbarExtra`, `afterTable`)           | `items`, `total`, `selectedRows`, `props`                                              |

Every definition takes:

- **`type`**: a unique id. It can't reuse a built-in node type (`input`, `select`, `grid`, `card`,
  `tabs`, `list`, `button`, `relation`, `extension`, …); those registrations are ignored with a
  dev-mode warning, as are duplicates.
- **`label`** (`{ en, ro }`), and optionally **`description`** and **`icon`**.
- **`props`** (optional): a Zod object. It validates the props each config passes, applies
  `.default()` values before the component renders, and describes the controls a visual editor
  shows (string, number, boolean and enum fields; `.describe()` becomes the hint). Invalid props
  render an inline error instead of the component.
- **`component`**: the React component.
- Field components only: **`bare: true`** skips the standard label/error frame so the component
  draws its own.

### 1. Define the component

`src/components/extensions/RatingField.tsx`, a star rating bound to a numeric form value:

```tsx
"use client";

import { StarIcon } from "lucide-react";
import { z } from "zod";
import { defineFieldComponent } from "@/framework/extensions";

export const ratingField = defineFieldComponent({
  type: "rating",
  label: { en: "Rating", ro: "Evaluare" },
  icon: StarIcon,
  props: z.object({
    max: z.number().int().min(1).max(10).default(5).describe("Number of stars"),
  }),
  component: ({ id, value, onChange, onBlur, disabled, readOnly, props }) => (
    <div id={id} role="radiogroup" onBlur={onBlur}>
      {Array.from({ length: props.max }, (_, index) => (
        <button
          key={index}
          type="button"
          disabled={disabled || readOnly}
          onClick={() => onChange(index + 1)}
        >
          <StarIcon className={index < (value ?? 0) ? "fill-amber-400" : undefined} />
        </button>
      ))}
    </div>
  ),
});
```

### 2. Register it

Add it to `src/components/extensions/index.ts`. The module augmentation makes every `type` and `props` you
write in config type-checked against the registered components:

```ts
import { registerExtensions } from "@/framework/extensions";
import { ratingField } from "./RatingField";
import { recordInfoBlock } from "./RecordInfoBlock";

export const extensions = registerExtensions([ratingField, recordInfoBlock]);

declare module "@/framework/extensions/registry" {
  interface Register {
    extensions: typeof extensions;
  }
}
```

`src/components/extensions/index.ts` is imported once on the client by the CMS providers
(`src/app/[locale]/cms/providers.tsx`), so registered components are available on every CMS
page.

### 3. Reference it from config

Configs refer to an extension as `{ type, props }`. Block, detail and overview components also
get a typed `.with(props)` helper that builds the same reference.

```ts
// A field, inside a FormConfig: name/label/span like any other field.
{ type: "rating", name: "score", label: { en: "Score", ro: "Scor" }, props: { max: 5 } }

// A block, as a form section.
{ type: "recordInfo", props: { title: "Record", fields: "id,created_at" } }

// A detail component in a detail slot (resource.tsx → detail.slots).
detail: { slots: { afterForm: todoAttachmentsPanel.with({ height: 300 }) } }

// A detail component as a detail tab (config/tabs.ts).
{ type: "extension", value: "attachments", label: { en: "Attachments", ro: "Atașamente" },
  component: todoAttachmentsPanel.with({ height: 300 }) }

// An overview component in an overview slot (resource.tsx → dataView.overview.slots).
dataView: { overview: { slots: { afterTable: myTotals.with() } } }
```

Slots also accept a plain render function (for example `afterForm: (item) => <MyPanel item={item} />`)
when a component only makes sense for one resource and doesn't need to be reusable or configurable.

The template ships three examples: `ratingField` and `recordInfoBlock` in `src/components/extensions/`, and
`todoAttachmentsPanel` (a detail component) in
`src/components/cms/main/todo/config/attachmentsPanel.tsx`.

## Building the website

The public site is built from **sections**. You define each section type in code: what content
it holds, and how it looks. Editors then build pages from those sections in the CMS
(**Website › Site pages**) by editing directly on the page. They can add, move, hide and remove
sections, edit texts in place, replace images, and add or remove list items. The header and
footer are edited the same way in **Website › Site settings**, one record per language.

A section is one file. You never write editor code: the editing comes from the schema and the
primitives you render with. The markup inside a section is yours, so blocks from shadcn/ui or any
other component library work (see [Bringing blocks from a component library](#bringing-blocks-from-a-component-library)).

There is no starter site: the template has an empty section list and no pages. You add section types
in code, create the tables, and then create pages, either in the CMS or with a seed.

### How the parts link

```
site_page                       one row per page and language
  slug "home", locale "en", kind "sections", published true
  sections: [ { "id": "hero-1", "type": "hero", "content": { "title": "…" } }, … ]
                    │
                    │  "type" picks the section definition
                    ▼
src/components/extensions/sections/index.ts         registerSections([heroSection, …])
                    │
                    ▼
src/components/extensions/sections/HeroSection.tsx  defineSection({ type: "hero", schema, defaults, component })
   schema     reads "content": missing or broken fields become empty, unknown keys are ignored
   component  renders it with <Text path="title" />, <List>, <MediaEdit>…
                    │
        ┌───────────┴─────────────────────────┐
        ▼                                     ▼
public site: plain HTML, static        CMS editor: the same component in the
/[locale] shows slug "home",           /[locale]/site-preview frame, where the
/[locale]/[slug] the other pages       primitives become editing controls
```

The header and footer take the same path from `site_settings`: one row per language, with
`content` shaped as `{ "header": {…}, "footer": {…} }`, rendered by `siteHeader` and `siteFooter` in
`src/components/extensions/site/`.

| Part | Where | What it does |
| --- | --- | --- |
| Page content | `site_page.sections` (jsonb) | What editors saved: an ordered list of `{ id, type, hidden?, content }`. `content` follows the section's schema. |
| Section definition | `src/components/extensions/sections/<Name>Section.tsx` | The schema (what content the section holds) and the component (how it looks). |
| Registry | `src/components/extensions/sections/index.ts` | Which types exist, in "Add section" order. A stored type that isn't registered is skipped on the site and refused on save. |
| Server data | `src/components/extensions/sections/data.ts` | Data a section needs beyond its own content, such as database records. |
| Primitives and field helpers | `@/framework/site` | Plain output on the site, editing controls in the editor. |
| Layout helpers (optional) | `src/components/site/sections/blocks.tsx` | `Band`, `Container`, `SectionHeading`, button and title classes. |
| Header and footer | `src/components/extensions/site/` | Defined like sections, stored in `site_settings`. |
| Site UI | `src/components/site/` | The shared pieces the site renders: header and footer slots (`SiteHeaderSlot`, `SiteFooterSlot`, which load the content and render `src/components/extensions/site/`), mobile menu, language and theme toggles, links, carousel, collection card, account menu, page view. Restyle them freely. |
| Site plumbing | `src/components/site/internal/` | Page and settings reads, cache tags (refreshed on CMS saves), media upload, the browser session, and the editor's preview frame. You don't normally edit it. |
| The website builder | `src/framework/site/` | `defineSection`, registry, validation, rendering. You don't normally edit it. |

### Setting up the tables

```bash
pnpm manifest site
```

It creates the website tables if they're missing, from the Drizzle schemas
`src/db/schema/site-page.ts` and `site-settings.ts`. It does this through `pnpm manifest db`, which
pushes the schema and then restores the read policies that `drizzle-kit push` leaves without their
condition. It then seeds the files in `src/db/seed/` that aren't in the database yet, loads every
registered section (which proves they compile), and checks that each language has a header and
footer. `pnpm manifest doctor` runs the same checks.

To create the tables yourself, for example in the Supabase SQL editor, this is the same schema:

```sql
create table if not exists site_page (
  id bigint generated by default as identity primary key,
  slug text not null,
  locale text not null,
  title text not null,
  description text not null default '',
  kind text not null default 'text',          -- 'sections' (built from sections) or 'text' (Markdown body)
  body text not null default '',
  sections jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint site_page_slug_locale_key unique (slug, locale),
  constraint site_page_locale_check check (locale = any (array['en', 'ro'])),
  constraint site_page_kind_check check (kind = any (array['text', 'sections'])),
  constraint site_page_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
alter table site_page enable row level security;
create policy "Published site pages are readable by everyone" on site_page
  for select to anon, authenticated using (published);

create table if not exists site_settings (
  id bigint generated by default as identity primary key,
  locale text not null,
  content jsonb not null default '{}'::jsonb,  -- { "header": {…}, "footer": {…} }
  updated_at timestamptz not null default now(),
  constraint site_settings_locale_key unique (locale),
  constraint site_settings_locale_check check (locale = any (array['en', 'ro']))
);
alter table site_settings enable row level security;
create policy "Site settings are readable by everyone" on site_settings
  for select to anon, authenticated using (locale is not null);
```

- **Languages.** The locale checks list the languages in `src/i18n/routing.ts`. Change them in the
  SQL and in the schema files together.
- **The schema files are the source of truth.** If you change a table in SQL, make the same change
  in `src/db/schema/`. Otherwise the next `drizzle-kit push` undoes it.
- **Policies.** The app reads through its server connection. The policies only govern Supabase's
  public API, where published pages and the header and footer are public anyway.


### Seeding content with SQL

Section content is JSON, so a seed is an ordinary insert. Each `type` must be a registered section,
and the keys inside `content` are the field names of that section's schema:

```sql
insert into site_settings (locale, content) values
  ('en', '{
    "header": { "brand": "Acme", "links": [{ "label": "Services", "href": "/#services" }],
                "cta": { "label": "Contact us", "href": "/contact" }, "ctaShort": "Contact" },
    "footer": { "brand": "Acme", "tagline": "", "columns": [], "copyright": "© {year} Acme" }
  }')
on conflict (locale) do nothing;

insert into site_page (slug, locale, title, description, kind, sections, published) values
  ('home', 'en', 'Home', 'What Acme does, in one sentence.', 'sections', '[
    { "id": "hero-1", "type": "hero", "content": { "title": "We build things", "body": "…" } },
    { "id": "features-1", "type": "features", "content": { "title": "Why us", "items": [
      { "title": "Fast", "text": "…" }, { "title": "Secure", "text": "…" } ] } }
  ]', true)
on conflict (slug, locale) do nothing;
```

- `id` is any string that's unique on the page. The editor uses it to keep track of sections.
  `"hidden": true` keeps a section off the public page.
- The home page is the page with the address `home`. Other pages are served at `/<locale>/<slug>`.
- A text page, such as a legal page, uses `kind = 'text'` and Markdown in `body` instead of
  `sections`.
- **SQL skips the checks the CMS runs on save.** Reading is lenient: a key with a typo is ignored and
  the field reads as empty, so a mistake shows up as a blank text, not an error. Open the page in
  **Website › Site pages** and save it once; the save lists anything that doesn't match the schemas.
- **To get the exact shape**, add the section to a page in the CMS, save, and copy the JSON:
  `select sections from site_page where slug = 'home' and locale = 'en';`.
- **Public pages are cached.** Rows written outside the CMS appear within an hour, or right away
  after the next save in the CMS or a new deployment.

If you'd rather have the seed checked before it's written, put the same content in JSON files and
run `pnpm db:seed:content`. Use `src/db/seed/site-pages/<locale>/<slug>.json` with
`{ "title", "description", "sections" }` for pages, `<slug>.md` for text pages, and
`src/db/seed/site-settings/<locale>.json` for the header and footer. It validates everything against
the section schemas, exactly like a CMS save, and writes nothing if any of it is invalid. It inserts
only what's missing; `--force` overwrites existing rows, which loses CMS edits.

To push only what you changed, select it with `--only` (comma-separated `<kind>`, `<kind>/<slug>`
for every language, or `<kind>/<locale>/<slug>`; kinds are `site-pages`, `learn-lessons`,
`services` and `site-settings`, the last selected by locale), and check first with `--dry-run`,
which lists the rows without touching the database:

```bash
pnpm db:seed:content --force --only site-settings/en --dry-run
pnpm db:seed:content --force --only site-settings/en
```

An unknown argument, or a selector that matches no seed file, stops the script before anything
is written.


### Adding a section

```bash
pnpm manifest section testimonials
```

This creates `src/components/extensions/sections/TestimonialsSection.tsx`, a heading plus a list of cards,
and registers it. Run `pnpm dev`, open a sections page in **Website › Site pages**, and pick
**Add section › Testimonials**. Then reshape the schema and the markup; the editor follows. Doing
it by hand is the same two steps: write the file, then add it to the list in
`src/components/extensions/sections/index.ts`.

A section file looks like this:

```tsx
export const testimonialsSection = defineSection({
  type: "testimonials",                          // stored in site_page.sections[].type; never rename it
  label: L("Testimonials", "Testimoniale"),      // shown in "Add section"
  schema: z.object({
    eyebrow: eyebrowField(),
    title: titleField(),
    quotes: list(
      z.object({
        quote: text({ label: L("Quote", "Citat"), multiline: true, required: true }),
        name: text({ label: L("Name", "Nume") }),
        photo: media({ label: L("Photo", "Fotografie"), accept: "image" }),
      }),
      { label: L("Quotes", "Citate"), itemLabel: L("Quote", "Citat") },
    ),
  }),
  defaults: { en: { title: "What people say" }, ro: { title: "Ce spun oamenii" } },
  component: ({ id, content, edit }) => (
    <Band labelledBy={`${id}-title`}>
      <SectionHeading titleId={`${id}-title`} />
      <ul className="grid gap-6 md:grid-cols-3">
        <List path="quotes" items={content.quotes}>
          {(item) => (
            <li className="relative rounded-2xl border p-6">
              {item.photo.src && <img src={item.photo.src} alt="" className="size-12 rounded-full" />}
              <MediaEdit path="photo" label={L("Replace photo", "Înlocuiește fotografia")} removable />
              <Text path="quote" as="p" multiline />
              <Text path="name" as="strong" />
              <RemoveItem />
            </li>
          )}
        </List>
      </ul>
      <AddItem path="quotes" label={L("Add quote", "Adaugă un citat")} />
    </Band>
  ),
});
```

### Bringing blocks from a component library

A block from shadcn/ui (`pnpm dlx shadcn@latest add <block>`), or from any other library, becomes a
section in four moves. Take this pasted features block:

```tsx
export function Features() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold">Everything you need</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[{ title: "Fast", text: "…" }, { title: "Secure", text: "…" }].map((feature) => (
            <Card key={feature.title}>
              <CardHeader><CardTitle>{feature.title}</CardTitle></CardHeader>
              <CardContent>{feature.text}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

1. **Each hard-coded text becomes a field.** Add a `text()` to the schema and replace the literal with
   `<Text path="…" />`.
2. **Each repeated array becomes a `list()`.** Render it with `<List path items>`, and paths inside are
   relative to the item. Add `<RemoveItem />` inside the item, which needs `relative` positioning, and
   `<AddItem>` after the list.
3. **Each image becomes a `media()`.** Render `content.image.src` with `<img>` or `next/image`, and put
   `<MediaEdit path="image" />` in a `relative` box around it. For a link, make the label a `<Text>`
   and the address a `text()` that editors change with `<EditNote>`.
4. **Wrap it in `defineSection`** and add it to `registerSections` in `src/components/extensions/sections/index.ts`.

```tsx
import { z } from "zod";
import { AddItem, defineSection, list, List, RemoveItem, Text, text } from "@/framework/site";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { L } from "./fields";

export const featuresSection = defineSection({
  type: "features", // stored in site_page.sections[].type; never rename it
  label: L("Features", "Avantaje"),
  schema: z.object({
    title: text({ label: L("Title", "Titlu"), required: true }),
    items: list(
      z.object({
        title: text({ label: L("Title", "Titlu") }),
        text: text({ label: L("Text", "Text"), multiline: true }),
      }),
      { label: L("Features", "Avantaje"), itemLabel: L("Feature", "Avantaj") },
    ),
  }),
  // What a new section starts with when an editor adds it.
  defaults: {
    en: { title: "Everything you need", items: [{ title: "Fast", text: "…" }, { title: "Secure", text: "…" }] },
    ro: { title: "Tot ce ai nevoie", items: [{ title: "Rapid", text: "…" }, { title: "Sigur", text: "…" }] },
  },
  component: ({ id, content }) => (
    <section aria-labelledby={`${id}-title`} className="py-24">
      <div className="container mx-auto px-4">
        <Text path="title" as="h2" id={`${id}-title`} className="text-3xl font-bold" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <List path="items" items={content.items}>
            {() => (
              <Card className="relative">
                <CardHeader><CardTitle><Text path="title" /></CardTitle></CardHeader>
                <CardContent><Text path="text" as="p" multiline /></CardContent>
                <RemoveItem />
              </Card>
            )}
          </List>
        </div>
        <AddItem path="items" label={L("Add feature", "Adaugă un avantaj")} />
      </div>
    </section>
  ),
});
```

The stored content is then exactly what the SQL seed above inserts for `features`:
`{ "title": "…", "items": [{ "title": "…", "text": "…" }] }`.

- **Interactive blocks** (accordion, carousel, tabs) work as they are. A section may render client
  components, and the primitives can be their children. Only the section file itself must stay
  importable on the server: no `"use client"`, no hooks. If a block keeps content collapsed, use the
  component's `edit` prop to open it while editing, for example by making every accordion item open
  by default.
- **Styling.** shadcn blocks use the theme tokens (`bg-background`, `text-muted-foreground`…) that
  the site stylesheet defines, so they follow the site's theme and dark mode.

### The schema: field helpers

Build schemas from the helpers in `@/framework/site`. They read stored content leniently: a missing
or broken field becomes empty, so old pages never crash. They also check saves strictly, and they
tell the editor how to behave.

| Helper | Stores | Options |
| --- | --- | --- |
| `text()` | A string | `label`, `multiline`, `required`, `maxLength` (the last two are checked on save) |
| `list(item)` | An array of `item` | `label`, `itemLabel` (used in error paths: "Quote 2"), `fixed` (no adding or removing) |
| `group({...})` | A nested object (a card, a button) | `label` |
| `media()` | `{ src, width, height }`, uploaded to the `site-media` bucket | `label`, `accept`: `"image"`, `"video"` or `"captions"` |
| `choice(options)` | One of the option values (a string) | `label`, `default`. Options are `{ value, label }`, or a function that returns them. Shown under the section's **Settings** button. |

Plain zod values work too, but they don't get editor behaviour. Link addresses are a `text` for
now, shown in the editor with `<EditNote>`. There's no `link()` field with a page picker yet.

**Section settings.** A `choice()` at the top level of the schema becomes a setting. Editors change
it from the **Settings** button on the section's toolbar, and the component renders accordingly:

```tsx
schema: z.object({
  cardStyle: choice(
    [
      { value: "image", label: L("With image", "Cu imagine") },
      { value: "icon", label: L("With icon", "Cu pictogramă") },
      { value: "text", label: L("Text only", "Doar text") },
    ],
    { label: L("Cards show", "Cardurile arată"), default: "image" },
  ),
  items: list(/* … */),
}),
component: ({ content }) => (
  // …
  {content.cardStyle === "image" && <img src={item.image.src} alt="" />}
),
```

Use it for variants such as columns, a layout, or showing the images. For an on/off option, use a
`choice()` with two values. The collection sections use it to pick the collection and how many items
to show (`src/components/extensions/sections/collectionFields.tsx`).

### What editors can and can't change

Editors can:

- edit every text rendered with `<Text>`, in place;
- hide a text by leaving it empty, when it's rendered with `<Text optional>`;
- replace or remove images (`<MediaEdit>`);
- add, remove and reorder list items, such as cards, and add, move, hide and remove whole sections;
- change section settings (`choice()` fields).

Editors can't, yet:

- **change settings on a single card.** A `choice()` inside a list item is stored, but the editor
  only shows settings for the whole section. Use one setting for all the cards, or a separate
  section type.
- **add elements a card doesn't define**, such as a button on one card and a badge on another. A
  card shows exactly what its schema holds, so add the field to the schema and leave it empty where
  it's not needed.
- **edit text printed directly** (`{content.title}`): it shows on the page but can't be edited there.
- **edit collection records on the page.** They're edited in their CMS form (see below).

### The markup: primitives

Render content through the primitives. On the public site they output plain HTML. In the editor
they become the editing controls.

| Primitive | On the site | In the editor |
| --- | --- | --- |
| `<Text path as id className multiline optional vars>` | The text, in the `as` element | Editable in place. `optional` hides it on the site when empty; `vars={{ hours }}` fills `{hours}` on the site only. |
| `<List path items>{(item, i) => …}</List>` | Each item | Same, with paths inside relative to the item (`path="quote"`) |
| `<RemoveItem label />` | Nothing | × that removes the current list item |
| `<AddItem path label />` | Nothing | "+ Add …" that appends a blank item |
| `<MediaEdit path label accept removable />` | Nothing | Replace and Remove buttons; place it inside a `relative` box |
| `<EditNote path label />` | Nothing | An editable note for text that isn't shown on the page (image alt text, link addresses) |
| `<EditOnly>` | Nothing | Its children |

`<List>` takes `items` because it runs on the server, where it can't read the section's content
the way the other primitives do. Anything printed directly, like `{content.title}`, shows on the
page but isn't editable. Use the component's `edit` prop only for layout tweaks, such as keeping a
`<details>` open while editing.

### Data from the database

When a section needs more than its own content, such as "latest posts", declare the data type on
the section and add a server loader:

```ts
// In the section file
data: sectionData<Post[]>(),
component: ({ content, data }) => …,

// src/components/extensions/sections/data.ts
defineSectionLoader(latestPostsSection, ({ locale }) => getLatestPosts(locale)),
```

The section file also runs in the editor's browser frame, so database code must stay in the
loader. Public pages load data only for the sections they show.

### Showing a CMS table on the website (collections)

A **collection** turns a resource's records (services, projects, team members…) into website
content. Editors manage the records in the CMS as usual. The generic **Collection cards** and
**Collection carousel** sections show them on any page. In the editor, each section's **Settings**
button (on the section toolbar) picks which collection to show and how many items.

This project includes a working example, **Services**: the `service` table
(`src/db/schema/service.ts`), its CMS resource (**Website › Services**), three starter services per
language in `src/db/seed/services/`, and the collection in `src/components/extensions/collections`.
`pnpm manifest site` creates the table and adds the starter services. Then give editors permission
for Services, add a **Collection carousel** to a page, and pick **Services** in its Settings. To
drop the example, delete the Services resource, its CMS routes, the table and its seed, remove
`servicesDescriptor`, the menu link and the `service` schema export, and remove the services
collection from `src/components/extensions/collections/index.ts` and `data.ts`. Keep the two collection
sections for your own collections.

Adding another collection takes two steps:

1. **Name it** in `src/components/extensions/collections/index.ts`:
   ```ts
   export const projectsCollection = defineCollection({ name: "projects", label: L("Projects", "Proiecte") });
   export const collections = registerCollections([servicesCollection, projectsCollection]);
   ```
2. **Say where its items come from** in `src/components/extensions/collections/data.ts`:
   ```ts
   defineCollectionSource(projectsCollection, {
     table: project,
     resource: "projects",          // CMS resource id: its saves refresh the pages showing the collection
     published: project.published,  // only published rows reach the site
     locale: project.locale,        // optional: without it, every row shows in every language
     order: project.position,
     card: (row) => ({ id: String(row.id), title: row.title, text: row.summary, image: row.image, href: "", editHref: `/cms/projects/${row.id}` }),
   }),
   ```
   Pages update within seconds of a save: the CMS refreshes `resource` whenever its add, update or
   delete commits (`src/app/[locale]/cms/createResourceActions.ts`). For rows changed some other way
   (a script, your own action), call `refreshCollection("projects")` from `@/framework/site/server`.

For pictures, give the table a `jsonb` image column (`{ src, width, height }`) and use the
`siteImage` form field with `props: { resource: "<resource id>" }`. Uploads go to the public
`site-media` bucket, so static pages can show them, and that resource's editors may upload.

Collection items aren't edited on the page: they're records, not page content. In the editor each
card has an **Edit in CMS** link instead. A section of your own can read collections too, with
`data: sectionData<Record<string, CollectionCard[]>>()` and a loader that returns
`loadCollections` (see `src/components/extensions/sections/data.ts`).

**Item pages.** When cards link to `/projects/{slug}` (`` href: `/projects/${row.slug}` ``), add the page
at that address, `src/app/[locale]/(site)/projects/[slug]/page.tsx`, and read the item with
`findCollectionItem` from `@/framework/site/server`. It applies the collection's own filters
(published, language) and cache tags, so a CMS save refreshes the item page too:

```tsx
type Props = { params: Promise<{ locale: string; slug: string }> };

// Rendered on its first visit, then cached until the record is saved.
export function generateStaticParams() {
  return [];
}

export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  const item = await findCollectionItem<typeof project.$inferSelect>(collectionSources, "projects", { locale }, "slug", slug);
  if (!item) notFound();
  return <h1>{item.card.title}</h1>; // item.row has every column (dates arrive as ISO strings)
}
```

### Header and footer

`src/components/extensions/site/SiteHeader.tsx` and `SiteFooter.tsx` work like sections, but they're
registered apart from page sections: they aren't offered in "Add section", and page saves refuse
them. Their content is stored in `site_settings`, one row per language. `src/db/seed/site-settings/`
holds the seed, which the site also shows until a row exists. Replace the header and footer with
your own markup freely; keep their content keys in step with the seed. Labels that belong to the interface, such as Log in, Menu and
Language, stay in `messages/`.

### Rules that keep the site fast and safe

- **Never rename a section's `type`, and keep stored shapes compatible.** Adding a field is safe
  (old content reads it as empty). Renaming or removing one leaves the old data unread. Content
  migrations come in Phase 3.
- **Section files stay importable on the server.** No `"use client"`, no state or effects. Put
  interactive pieces in their own client components and render them from the section.
- **Public pages are static.** Don't read cookies, headers or the signed-in user in site layouts
  or pages. The locale comes from the `[locale]` segment through `next/root-params` (see i18n),
  so pages don't set it. Signed-in UI, like the
  account menu and "Edit this page", comes from `useSiteSession()`. After changing site routes,
  check that `pnpm build` still marks them ● or ○.
- **Read site content through the tagged reads** (`getSitePage`, `getLessons`,
  `getSiteSettings`), and refresh tags after commits with `afterCommit` + the helpers in
  `src/components/site/internal/cache.ts`. Changes made outside the CMS appear within an hour.

### Checklist for a new section

1. `pnpm manifest section <name>`, or write the file and register it.
2. Every visible text uses `<Text>`, lists use `<List>` with `<RemoveItem>`/`<AddItem>`, and
   images have `<MediaEdit>`.
3. Labels and defaults exist in every language.
4. `pnpm typecheck`, then add the section to a page in the CMS and edit it on the canvas.
5. Optionally add it to a seed page in `src/db/seed/site-pages/`. `db:seed:content` validates it.

## Authorization: RBAC

Access control is **role-based**: every route and every server action requires a signed-in
user to hold a specific `"<resourceId>:<action>"` permission string (e.g. `"todos:read"`,
`"group-permissions:update"`, or a custom verb like `"todos:complete-with-note"`). This all
lives in `src/framework/authorization/` (framework-level) plus the project's own `groups`,
`group-permissions`, and `user-groups` resources (`src/components/cms/administration/`),
which manage the data through the exact same generic CRUD framework as everything else —
RBAC configuration is just another set of resources you edit in the app itself, once
signed in as an administrator.

**Data model** (`src/db/schema/`):

- **`group`** — a named group (e.g. "Editor").
- **`group_permission`** — one row per (group, resource) grant. `resource_id` is a
  code-level id, not a DB foreign key: either a plain `resourceDescriptors` id ("todos"),
  expanded via four boolean flags (`can_read`/`can_add`/`can_update`/`can_delete`) into up to
  four permission strings, or an already-full custom-action permission string like
  `"todos:complete-with-note"` (recognizable by containing `":"`), gated by a single
  `allowed` flag instead.
- **`user_group`** — many-to-many between `user` and `group`.
- **`user.administrator`** — a full bypass, independent of groups: an administrator is
  granted every permission (see `ALL_PERMISSIONS` below), including on resources nobody has
  written a `group_permission` row for yet.

**Server-side enforcement** (`src/framework/authorization/lib/`):

- `getUserPermissions(userId)` — resolves a user's full permission-string list: `["*"]`
  (the `ALL_PERMISSIONS` sentinel) if they're an administrator, otherwise the union of
  every permission granted by their assigned groups.
- `requirePermission(resourceId, action)` — throws `ForbiddenError` unless the caller is
  signed in and `getUserPermissions` includes `"*"` or the exact `"<resourceId>:<action>"`
  string.
- `withPermission(resourceId, action, fn)` / `defineResourceActions(resourceId, {...})` —
  wrap a server action with the `requirePermission` check plus the try/catch that turns
  `ForbiddenError`/`ZodError`/Postgres errors into a well-formed `ActionResult` instead of
  letting them throw across the Server Action boundary (see
  [Server actions & ActionResult](#server-actions--actionresult)). This is what
  `createResourceActions(...)` uses under the hood for every resource's `add`/`update`/
  `delete`/custom actions.
- `ResourceGuard` (`src/framework/authorization/ui/ResourceGuard.tsx`) — the server component
  that gates a whole route the same way: redirects to `/auth/login` if not signed in,
  renders `AccessDeniedDialog` if signed in but missing the permission. Every route under
  `src/app/[locale]/cms/` wraps its page in one, e.g.
  `<ResourceGuard resourceId="todos" action="read">`.
- `assertHasAllPermissions(userId, permissions, context)` — a **confused-deputy guard** for
  permission-granting endpoints (assigning a group to a user, editing a group's resource
  grants): a caller may only hand out permissions they themselves hold. Without this, a group
  scoped to "manage user-group assignments" or "manage group permissions" would be
  root-equivalent, since it could otherwise assign a more privileged group to anyone, or grant
  a group permissions its own creator doesn't have.

**Client-side** (`src/framework/authorization/hooks/usePermissions.ts`,
`src/framework/authorization/cache/permissions.ts`):

- `usePermissions()` — a React Query hook caching the signed-in user's permission set
  (fetched via the `getMyPermissions` server action, seeded from the layout's initial
  server-side fetch).
- `hasPermission(name)` — a plain, synchronous read of that cached set (`data.has("*") ||
  data.has(name)`), used to hide/disable buttons and bulk actions the user can't invoke.
  **This is UX only, not a security boundary** — the real enforcement is the server-side
  `requirePermission` check on every action and `ResourceGuard` on every route; the client
  check just avoids showing controls that would fail anyway.

There is deliberately no global "bypass RBAC" escape hatch — the only way to get every
permission is the `administrator` flag on a specific user, which is auditable per-row and
never toggled by an env var.

**The `pgPolicy(...)` RLS policies in `src/db/schema/*.ts` are not a real security
boundary.** `src/db/index.ts` connects as the Postgres role behind Supabase's pooler, which
has `BYPASSRLS` — every RLS policy in the schema files is dead code on that connection, for
both reads and writes. The RBAC layer described above is the *only* thing actually gating
access to data reached through `db`. Keep this in mind if you're tempted to lean on RLS for
a new table — it won't do anything unless you route that access through a different,
non-bypassing Postgres role with the caller's JWT claims set per request.

## Auth flows

`src/framework/authentication/` wraps Supabase Auth (email/password + Google OAuth) behind
server actions (`login`, `signup`, `forgotPassword`, `updatePassword`, `logout`, plus the
Google sign-in action) and
matching form components, already wired into `/auth/*` routes. `updatePassword` is
additionally gated on a short-lived recovery cookie so a hijacked ordinary session can't
silently change the account password — see the code comments in
`src/framework/authentication/lib/recoveryCookie.ts` if you're touching that flow.

Note that authentication and authorization are separate layers here: signing in only
proves *who* you are, not *what* you can do — every route/action still runs the RBAC checks
described above on top.

## i18n

Locale lives in the URL, not a cookie: `src/i18n/routing.ts` declares the supported
locales (`en`/`ro`, default `ro`) via next-intl's `defineRouting`, with
`localePrefix: "always"` so every locale gets an explicit prefix (`/ro/...`, `/en/...`) —
including the default, for a single unambiguous canonical URL per locale. `src/proxy.ts`
runs next-intl's locale-detection middleware first, then its own Supabase auth-refresh and
`/cms` auth gate. `LocaleSwitcher` (`src/framework/components/partials/LocaleSwitcher.tsx`)
switches locale via `router.replace(pathname, { locale: nextLocale })` from
`@/i18n/navigation`, staying on the same page. Translation strings live under `messages/en/`
and `messages/ro/`, split into per-namespace JSON files (`framework/Common.json`,
`features/Todos.json`, etc.) that `src/i18n/request.ts` loads by name — add a new namespace
there if you introduce one.

`src/i18n/request.ts` reads the locale from the `[locale]` segment with `next/root-params`
(`experimental.rootParams` in `next.config.ts`), not from next-intl's `requestLocale`, which
would read the request headers and make every page dynamic. So layouts and pages don't call
`setRequestLocale`. The site (`(site)`) and the CMS (`cms`) each have their own root
layout (sharing `src/app/[locale]/_root/RootDocument.tsx`) and their own `globals.css`: moving
between them is a full page load, so one area's theme never leaks into another.

`config/descriptor.ts`/`columns.ts`/`form.ts` labels use `{ en, ro }` objects
(`TranslatableText`, resolved via `resolveLabel()`) directly rather than `t()` keys (see the
`todos` config files) — follow that pattern for anything that's resource-config data rather
than UI copy. The same `{ en, ro }` pattern is how error/toast messages pick the
grammatically correct Romanian noun form and gender (see `ResourceDescriptor.gender` /
`singularDefinite` and `src/framework/lib/mapPgError.ts` / `describeActionFailure.ts`).

## Known issues to be aware of

- **No UI for the `administrator` flag** — set it with `pnpm manifest admin` or SQL (see
  [Your first administrator](#your-first-administrator)). There's also no UI for un-setting it
  on yourself, so be careful who you grant it to.
- **`grantableActions` is a small, hand-maintained list** (`src/app/[locale]/cms/grantablePermissions.ts`)
  of custom, non-CRUD permission strings — it is *not* derived from resources'
  `actions.forms`/`actions.bulk` automatically. Adding a new custom action and forgetting to add
  its entry there means it'll work for administrators but can never be granted to a
  group-based user.
- **Migrations aren't committed** — `drizzle` is in `.gitignore`, so generated migration files
  stay local unless you remove that line. Always review generated SQL closely before running
  `db:migrate`; drizzle-kit's diff can turn a rename into a destructive drop+create.
- **RLS policies in `src/db/schema/*.ts` don't do anything** through the app's own DB
  client — see the callout in [Authorization](#authorization-rbac). Don't add a new
  `pgPolicy` expecting it to enforce anything by itself.
