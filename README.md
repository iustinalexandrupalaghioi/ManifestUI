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
- [Database & migrations](#database--migrations)
- [Adding a new resource](#adding-a-new-resource)
- [Data views](#data-views)
- [Forms](#forms)
- [Relations & detail pages](#relations--detail-pages)
- [File uploads](#file-uploads)
- [Server actions & `ActionResult`](#server-actions--actionresult)
- [Custom actions: action forms and bulk actions](#custom-actions-action-forms-and-bulk-actions)
- [Extensions: custom components](#extensions-custom-components)
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
   `src/app/[locale]/cms/layout.tsx` (currently "ManifestUI" / "ManifestUI Admin"), and the
   hardcoded "ManifestUI" text in `src/components/site/Navbar.tsx`.
3. **Decide what to do with the demo resources.** `todos`, `relations`, and `attachments`
   (`src/components/features/main/`) are a worked example of the resource pattern, not
   meant to ship as-is. Keep them around while you learn the framework (see
   [Adding a new resource](#adding-a-new-resource) — they're the reference every step there
   points at), then delete them once you're comfortable: remove the three folders, drop
   their entries from `resourceDescriptors.ts`/`registerResourceComponents.ts`, remove their tables
   from `src/db/schema/` (`todo`, `todo_attachment`, `relation`), and delete their menu/i18n
   entries. Leave `groups`/`group-permissions`/`user-groups`/`users`
   (`src/components/features/administration/`) alone — that's the RBAC system itself, not
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
│   │   ├── (site)/               public site route group (no URL segment) — home page,
│   │   │                         its own layout/Navbar, and auth/ (login/signup/
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
│   ├── site/                     (site)-only UI: Navbar, UserMenu
│   ├── cms/                      cms-only UI: AppNavbar, MenuItems, BASE_ROUTE ("/cms")
│   ├── features/
│   │   ├── main/                 todo/, relation/, todo-attachment/
│   │   └── administration/       user/, group/, group-permission/, user-group/
│   │                             (the RBAC resources themselves — see Authorization)
│   └── ui/                       app-level UI, distinct from framework/components/ui
├── framework/                    the reusable CRUD framework (defineResource, forms,
│   │                             data-view, dialogs, files) — not covered in depth by
│   │                             this doc
│   ├── authorization/            RBAC: permissions.ts, ResourceGuard, usePermissions,
│   │                             AccessDeniedDialog — see Authorization
│   └── extensions/               the extension API — see Extensions
├── extensions/                   your registered extensions (index.ts)
├── lib/storage/                  the default (Supabase Storage) file upload handler
├── db/
│   ├── index.ts                  Drizzle client (see the RLS caveat in Authorization)
│   └── schema/                   Drizzle table definitions — the source of truth for
│                                 the DB shape
└── i18n/                        next-intl config; locale lives in the URL
                                  (localePrefix: "always") — strings live in messages/en,
                                  messages/ro
```

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

Every resource under `src/components/features/**` follows the same shape. Walking through
`todos` (`src/components/features/main/todo/`) as the template:

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
    - `registerResourceComponents.ts` — add `import "@/components/features/main/projects";`
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

`resource.tsx` → `dataView` places them:

- **`overview`** — the resource's list page. `dataTableColumns` for the grid and
  `dataListColumns` for the card list (keep column IDs aligned between the two; they're merged
  by ID). `features` switches tools on or off (sorting, filtering, quickSearch, grouping,
  aggregates, saved views, the grid/cards toggle, card list, resizing, pinning, the column
  manager, selection, inline editing). `slots` adds components around the grid.
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
example of each (`src/components/features/main/todo/config/actions/`):

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

`src/extensions/RatingField.tsx`, a star rating bound to a numeric form value:

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

Add it to `src/extensions/index.ts`. The module augmentation makes every `type` and `props` you
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

`src/extensions/index.ts` is imported once on the client by the CMS providers
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

The template ships three examples: `ratingField` and `recordInfoBlock` in `src/extensions/`, and
`todoAttachmentsPanel` (a detail component) in
`src/components/features/main/todo/config/attachmentsPanel.tsx`.

## Authorization: RBAC

Access control is **role-based**: every route and every server action requires a signed-in
user to hold a specific `"<resourceId>:<action>"` permission string (e.g. `"todos:read"`,
`"group-permissions:update"`, or a custom verb like `"todos:complete-with-note"`). This all
lives in `src/framework/authorization/` (framework-level) plus the project's own `groups`,
`group-permissions`, and `user-groups` resources (`src/components/features/administration/`),
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
