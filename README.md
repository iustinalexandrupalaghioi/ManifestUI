# ManifestUI

A full-stack Next.js **admin app**: a resource-driven CRUD framework (`src/framework/`)
built on React Query, React Hook Form, Zod, and Drizzle, with **role-based access control**
(roles, per-resource/per-verb permissions) gating every route and every server action. Auth
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
- [First-time setup](#first-time-setup)
- [Running the app](#running-the-app)
- [Project structure](#project-structure)
- [Database & migrations](#database--migrations)
- [Adding a new resource](#adding-a-new-resource)
- [Server actions & `ActionResult`](#server-actions--actionresult)
- [Custom actions: `actionForms` vs `bulkActions`](#custom-actions-actionforms-vs-bulkactions)
- [Authorization: RBAC](#authorization-rbac)
- [Auth flows](#auth-flows)
- [i18n](#i18n)
- [Known issues to be aware of](#known-issues-to-be-aware-of)

## Stack

- **Next.js 16** (App Router, `src/app/`) + **React 19**
- **Supabase** — auth (email/password + Google OAuth) and file storage
- **Drizzle ORM** over Postgres (Supabase's Postgres)
- **next-intl** — `en`/`ro` locales, picked from a cookie (no locale-prefixed routes — see
  [i18n](#i18n))
- **TanStack Query + Table**, **React Hook Form + Zod**, **shadcn/ui** primitives
- Package manager: **pnpm**

## Prerequisites

- Node.js + pnpm
- A Supabase project (free tier is fine for local dev) — you need its project URL, anon
  key, service role key, and Postgres connection strings

## First-time setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Create your env file.** There's no committed `.env.example` in this repo today —
   create a `.env` (or `.env.local`) in the project root yourself with:

   | Variable                                                                                                                           | Where it comes from                                                                                                                                                                  |
   | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | `NEXT_PUBLIC_SUPABASE_URL`                                                                                                         | Supabase → Project Settings → API                                                                                                                                                    |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                                                                                    | Supabase → Project Settings → API                                                                                                                                                    |
   | `SUPABASE_SERVICE_ROLE_KEY`                                                                                                        | Supabase → Project Settings → API (server-only, never expose client-side)                                                                                                            |
   | `DATABASE_URL`                                                                                                                     | Supabase → Project Settings → Database → Connection string, **Transaction pooler** (port 6543) — used both at runtime (`src/db/index.ts`) and by `drizzle-kit` (`drizzle.config.ts`) |
   | `DIRECT_DATABASE_URL`                                                                                                              | Same page, the **direct/session** connection (port 5432) — kept for reference but not currently read by any code                                                                     |
   | `AUTH_WEBHOOK_SECRET`                                                                                                              | Any string you choose — shared secret for the auth webhook, see step 4                                                                                                               |
   | `NEXT_PUBLIC_BASE_URL`                                                                                                             | e.g. `http://localhost:3000` in dev                                                                                                                                                  |
   | `ENABLE_RBAC`                                                                                                                      | `true`/unset = roles & permissions enforced normally; `false` = every signed-in user gets every permission (dev/testing escape hatch — see [Authorization](#authorization-rbac))     |
   | `NEXT_PUBLIC_APP_TIMEZONE`, `NEXT_PUBLIC_ENABLE_NUMBERED_TABS`, `NEXT_PUBLIC_NUMBER_LIST_COLUMNS`, `NEXT_PUBLIC_DEFAULT_VIEW_MODE` | App/display config                                                                                                                                                                    |

3. **Create the schema in your Supabase Postgres**

   ```bash
   pnpm db:push
   ```

   This pushes `src/db/schema/*.ts` straight to the DB (no migration files) — good for a
   fresh project. See [Database & migrations](#database--migrations) for the
   migration-file-based alternative.

4. **Wire up the auth → users sync webhook.** This app's own `users` table (holding
   `administrator`, `full_name`, etc.) is _not_ Supabase's `auth.users` — it's kept in sync
   by a webhook. In the Supabase dashboard, add a **Database Webhook** on `auth.users` for
   `INSERT`/`UPDATE`/`DELETE`, pointed at `${NEXT_PUBLIC_BASE_URL}/api/webhooks/auth-users`,
   with a custom header `x-webhook-secret` set to the same value as `AUTH_WEBHOOK_SECRET`.
   Without this, signing up won't create a row in `users`, and nothing in the app will know
   who you are.

5. **Sign up and grant yourself admin.** Run the app (next section), sign up through
   `/auth/signup`, then in your DB flip your row:

   ```sql
   update users set administrator = true where email = 'you@example.com';
   ```

   There's no seed script or bootstrap admin today — this manual flip is the only way in.
   `administrator = true` is a full bypass of the roles/permissions system (see
   [Authorization](#authorization-rbac)): every route and every server action requires
   authentication plus the matching permission, and an administrator is granted all of them
   automatically, with no role assignment needed.

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
│   ├── <resource>/              one folder per resource route: todos/, relations/,
│   │                             attachments/, users/, roles/, role-permissions/,
│   │                             user-roles/ — each just page.tsx / add/page.tsx /
│   │                             [id]/page.tsx wiring a ResourceGuard around the
│   │                             resource's generated components
│   ├── auth/                    login/signup/forgot-password/update-password pages
│   ├── api/webhooks/            route handlers, e.g. the auth-users sync webhook
│   ├── resourceDescriptors.ts    whole-app resource registry (id/table/labels/routes)
│   ├── register-resources.ts     side-effect imports that run defineResource() for
│   │                             every feature, populating the resource registry
│   ├── createResourceActions.ts  project-level wrapper pre-binding the framework's
│   │                             generic createResourceActions to resourceDescriptors
│   └── grantablePermissions.ts   resources + custom actions offered by the
│                                 role-permissions picker
├── components/
│   ├── features/
│   │   ├── main/                 todos/, relations/, todo-attachments/
│   │   └── administration/       users/, roles/, role-permissions/, user-roles/
│   │                             (the RBAC resources themselves — see Authorization)
│   └── ui/                       app-level UI, distinct from framework/components/ui
├── framework/                    the reusable CRUD framework (defineResource, forms,
│   │                             data-view, dialogs, files) — not covered in depth by
│   │                             this doc
│   └── authorization/            RBAC: rbac.ts, ResourceGuard, usePermissions,
│                                 AccessDeniedDialog — see Authorization
├── db/
│   ├── index.ts                  Drizzle client (see the RLS caveat in Authorization)
│   └── schema/                   Drizzle table definitions — the source of truth for
│                                 the DB shape
└── i18n/                        next-intl config; locale is read from a cookie, not
                                  the URL — strings live in messages/en, messages/ro
```

There's no `[locale]` route segment and no separate public-site/admin split — this app is
a single admin surface, gated by sign-in + permissions on every route.

## Database & migrations

Schema source of truth is `src/db/schema/*.ts` (Drizzle, `casing: "snake_case"` per
`drizzle.config.ts`). Two ways to apply changes:

- **`pnpm db:push`** — pushes the current schema files straight to the DB, no migration
  file generated. Fast for local iteration; don't use it against a shared/prod DB since
  there's no history to review or roll back. This project has so far only ever used
  `db:push` — there's no `drizzle/` migrations folder yet.
- **`pnpm db:generate`** then **`pnpm db:migrate`** — `generate` diffs your schema files
  against the last-known DB state and writes a new SQL file under `drizzle/`; `migrate`
  applies pending migration files. This is the reviewable, shared-DB-safe path. Since no
  migration has ever been generated for this DB, review the very first generated SQL
  carefully before running it — drizzle-kit's diff is only as accurate as the DB state it's
  comparing against, and a DB that's only ever seen `db:push` has no recorded history to
  diff from.
- **`pnpm db:studio`** — opens Drizzle Studio against your DB.

To change the schema:

1. Edit/add a file in `src/db/schema/` (a `pgTable(...)` definition; see `todos.ts` for a
   simple example, `relations-table.ts` for one with `pgPolicy`/`check` constraints — note
   the RLS caveat in [Authorization](#authorization-rbac) before relying on `pgPolicy`).
2. Add cross-table relations in `src/db/schema/relations.ts` if needed (Drizzle's
   `relations()` helper — used for typed joins, not enforced at the DB level).
3. Re-export it from `src/db/schema/index.ts`.
4. `pnpm db:generate` (review the SQL it writes under `drizzle/`) then `pnpm db:migrate`,
   or `pnpm db:push` in local dev.

## Adding a new resource

Every resource under `src/components/features/**` follows the same shape. Walking through
`todos` (`src/components/features/main/todos/`) as the template:

```
todos/
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
2. **Type** — add the row type under `src/app/types/main/` (mirrors the DB row shape; see
   `Todo.ts` for the pattern). Use `src/app/types/administration/` instead if the resource
   is an RBAC-management resource like the existing `roles`/`role-permissions`/`user-roles`.
3. **`config/descriptor.ts`** — `id`, `table`, i18n `singular`/`plural`/`new` labels (plus
   `singularDefinite` and `gender` if you want grammatically correct Romanian error/toast
   messages — see the existing descriptors for the pattern), `routes` (list/add/detail),
   `queryKey`, `overviewKey`.
4. **`config/schema.ts`** — a Zod object for the editable fields; export the inferred
   `ProjectFormValues` type.
5. **`config/api.ts`** — `"use server"`; build server actions via
   `createResourceActions(descriptor.id)` (from `@/app/createResourceActions`, a
   project-level wrapper — don't import `defineResourceActions`/the base
   `createResourceActions` from `@/framework/...` directly, that wrapper is what threads
   this app's whole `resourceDescriptors` list through so failure messages can resolve any
   resource's label). Every action this produces is permission-gated per verb — see
   [Server actions & ActionResult](#server-actions--actionresult) and
   [Authorization](#authorization-rbac).
6. **`config/columns.ts`** — a `ColumnConfig[]` for the table/card views.
7. **`config/form.ts`** — a `FormConfig` (stack or grid layout) for add/edit.
8. **`resource.tsx`** — call `defineResource({...})` wiring all of the above together, then
   re-export the generated `hooks`/`components` you need (`Overview`, `AddPage`,
   `DetailPage`, `LookupDialog`, the query hooks). Copy `todos/resource.tsx` as a template.
9. **`index.ts`** — re-export resource.tsx's public names.
10. **Register it in three places** (all under `src/app/`):
    - `resourceDescriptors.ts` — add `projectsDescriptor` to the array (this is what backs
      `createResourceActions`, `grantablePermissions.ts`'s resource picker, and any central
      resource listing).
    - `register-resources.ts` — add `import "@/components/features/main/projects";`
      (side-effect import; this is what actually runs `defineResource()` and populates the
      `ResourceRegistry` that lookup/relation fields resolve other resources through).
    - `grantablePermissions.ts` needs no edit for plain CRUD — it derives the resource's
      read/add/update/delete permission strings automatically from `resourceDescriptors`.
      Only add an entry to its `grantableActions` array if the resource exposes a **custom**
      action (see [Custom actions](#custom-actions-actionforms-vs-bulkactions)).
11. **Routes** — add `src/app/projects/page.tsx` (renders `ProjectOverview` wrapped in
    `<ResourceGuard resourceId="projects" action="read">`), `projects/add/page.tsx`
    (`ProjectAddPage`, `action="add"`), `projects/[id]/page.tsx` (`ProjectDetailPage`,
    `action="read"`, since the update permission is checked per-field/per-save inside the
    detail page itself) — three small files, same pattern as `src/app/todos/*`.
12. **i18n strings** — add whatever `t("...")` keys you introduced to `messages/en/*` and
    `messages/ro/*`.
13. **Grant access** — a fresh resource is invisible to everyone but administrators until
    some role is given permissions on it: sign in as an admin and add rows via the
    `role-permissions` resource (or assign an existing role that already grants `"*"`-style
    broad access, if you have one).

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
   a role, or implicitly because they're an administrator or `ENABLE_RBAC=false` — see
   [Authorization](#authorization-rbac)).
2. Runs your function, catching `ForbiddenError`, Zod errors, and anything else (Postgres
   constraint violations get mapped to a friendly, locale-aware message), and returns it as
   `{ ok: false, error }` instead of letting it throw.

On the client, `unwrapAction(result)` (`@/framework/lib/actionResult`) returns `.data` or
throws an `ActionResultError` — React Query then surfaces that as a normal query/mutation
error, so components mostly don't deal with `ActionResult` directly.

The `add`/`update`/`delete` helpers from `createResourceActions(...).add/update/delete`
each run inside a DB transaction; `delete` runs **per id**, so a bulk delete can partially
succeed (`{ succeededIds, failures }`, surfaced in the UI as a `BulkResultDialog`).

## Custom actions: `actionForms` vs `bulkActions`

Beyond plain add/edit/delete, a resource can expose custom actions. `todos` has one
example of each (`src/components/features/main/todos/config/actions/`):

- **`actionForms`** (`complete-with-notes.tsx`) — an `ActionFormConfig`: a labeled action
  that opens a small dialog with its own form (its own Zod schema, its own submit), usable
  from the table toolbar or a detail page. Wire it into `resource.tsx` via `actionForms: [...]`.
- **`bulkActions`** (`complete.tsx`) — a hook (`() => BulkActionsHookResult`) contributing
  extra row/bulk actions to the table/detail toolbar that _don't_ need their own form (here,
  "mark complete" just calls the mutation directly on the selected rows). Wire it into
  `resource.tsx` via `bulkActions: useYourBulkActionsHook`.

Both ultimately call a server action defined the same way as `add`/`update`/`delete` — see
`completeTodos` in `todos/config/api.ts` for the `createResourceActions(...).action(verb, ...)`
helper that backs a custom action's transactional per-id write. `verb` becomes the second
half of the permission string it's gated on (`"todos:complete"`), same as `"read"`/`"add"`/
`"update"`/`"delete"` for the built-ins.

Because a custom verb isn't part of the automatic read/add/update/delete expansion, **you
also have to add it to `grantableActions` in `src/app/grantablePermissions.ts`** so it shows
up as something a role can be granted — see the `"todos:complete"` /
`"todos:complete-with-note"` entries there for the pattern. The `id` you give it there must
match the `verb` string exactly, since that's what `hasPermission(`${resourceId}:${verb}`)`
checks against on the client and `requirePermission` checks server-side.

## Authorization: RBAC

Access control is **role-based**: every route and every server action requires a signed-in
user to hold a specific `"<resourceId>:<action>"` permission string (e.g. `"todos:read"`,
`"role-permissions:update"`, or a custom verb like `"todos:complete-with-note"`). This all
lives in `src/framework/authorization/` (framework-level) plus the project's own `roles`,
`role-permissions`, and `user-roles` resources (`src/components/features/administration/`),
which manage the data through the exact same generic CRUD framework as everything else —
RBAC configuration is just another set of resources you edit in the app itself, once
signed in as an administrator.

**Data model** (`src/db/schema/`):

- **`roles`** — a named role (e.g. "Editor").
- **`role_resource_permissions`** — one row per (role, resource) grant. `resource_id` is a
  code-level id, not a DB foreign key: either a plain `resourceDescriptors` id ("todos"),
  expanded via four boolean flags (`can_read`/`can_add`/`can_update`/`can_delete`) into up to
  four permission strings, or an already-full custom-action permission string like
  `"todos:complete-with-note"` (recognizable by containing `":"`), gated by a single
  `allowed` flag instead.
- **`user_roles`** — many-to-many between `users` and `roles`.
- **`users.administrator`** — a full bypass, independent of roles: an administrator is
  granted every permission (see `ALL_PERMISSIONS` below), including on resources nobody has
  written a `role_resource_permissions` row for yet.

**Server-side enforcement** (`src/framework/authorization/lib/`):

- `getUserPermissions(userId)` — resolves a user's full permission-string list: `["*"]`
  (the `ALL_PERMISSIONS` sentinel) if they're an administrator or `ENABLE_RBAC=false`,
  otherwise the union of every permission granted by their assigned roles.
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
  `src/app/<resource>/` wraps its page in one, e.g.
  `<ResourceGuard resourceId="todos" action="read">`.
- `assertHasAllPermissions(userId, permissions, context)` — a **confused-deputy guard** for
  permission-granting endpoints (assigning a role to a user, editing a role's resource
  grants): a caller may only hand out permissions they themselves hold. Without this, a role
  scoped to "manage user-role assignments" or "manage role permissions" would be
  root-equivalent, since it could otherwise assign a more privileged role to anyone, or grant
  a role permissions its own creator doesn't have.

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

**`ENABLE_RBAC=false`** is a global escape hatch (see `isRbacEnabled()` in `rbac.ts`) that
makes every signed-in user behave as if they held every permission, without touching the
`administrator` flag or any role data — useful for local development, not for anything
resembling production.

**The `pgPolicy(...)` RLS policies in `src/db/schema/*.ts` are not a real security
boundary.** `src/db/index.ts` connects as the Postgres role behind Supabase's pooler, which
has `BYPASSRLS` — every RLS policy in the schema files is dead code on that connection, for
both reads and writes. The RBAC layer described above is the *only* thing actually gating
access to data reached through `db`. Keep this in mind if you're tempted to lean on RLS for
a new table — it won't do anything unless you route that access through a different,
non-bypassing Postgres role with the caller's JWT claims set per request.

## Auth flows

`src/framework/authentication/` wraps Supabase Auth (email/password + Google OAuth) behind
server actions (`login`, `signup`, `forgotPassword`, `updatePassword`, `logout`) and
matching form components, already wired into `/auth/*` routes. `updatePassword` is
additionally gated on a short-lived recovery cookie so a hijacked ordinary session can't
silently change the account password — see the code comments in
`src/framework/authentication/lib/recoveryCookie.ts` if you're touching that flow.

Note that authentication and authorization are separate layers here: signing in only
proves *who* you are, not *what* you can do — every route/action still runs the RBAC checks
described above on top.

## i18n

There's no locale-prefixed routing or middleware — `en`/`ro` is picked from a `NEXT_LOCALE`
cookie (`src/i18n/locales.ts`/`request.ts`), defaulting to `ro` when unset. `LocaleSwitcher`
(`src/framework/components/partials/LocaleSwitcher.tsx`) just writes that cookie and calls
`router.refresh()`. Translation strings live under `messages/en/` and `messages/ro/`, split
into per-namespace JSON files (`framework/Common.json`, `features/Todos.json`, etc.) that
`src/i18n/request.ts` loads by name — add a new namespace there if you introduce one.

`config/descriptor.ts`/`columns.ts`/`form.ts` labels use `{ en, ro }` objects
(`TranslatableText`, resolved via `resolveLabel()`) directly rather than `t()` keys (see the
`todos` config files) — follow that pattern for anything that's resource-config data rather
than UI copy. The same `{ en, ro }` pattern is how error/toast messages pick the
grammatically correct Romanian noun form and gender (see `ResourceDescriptor.gender` /
`singularDefinite` and `src/framework/lib/mapPgError.ts` / `describeActionFailure.ts`).

## Known issues to be aware of

- **`DIRECT_DATABASE_URL`** is documented and expected in `.env`, but nothing in `src/`
  currently reads it — `DATABASE_URL` (the pooled connection) is used everywhere, including
  by `drizzle-kit`.
- **No bootstrap/seed script** for the first administrator — the only way in is the manual
  `update users set administrator = true` flip described in setup step 5. There's also no
  UI for un-setting `administrator` on yourself, so be careful who you grant it to.
- **`grantableActions` is a small, hand-maintained list** (`src/app/grantablePermissions.ts`)
  of custom, non-CRUD permission strings — it is *not* derived from resources'
  `actionForms`/`bulkActions` automatically. Adding a new custom action and forgetting to add
  its entry there means it'll work for administrators but can never be granted to a
  role-based user.
- **No migration files exist yet** (`drizzle/` is empty/absent) — this project has only ever
  used `pnpm db:push`. The first time someone runs `db:generate` against a DB that's only
  seen pushes, review the generated SQL closely before migrating.
- **RLS policies in `src/db/schema/*.ts` don't do anything** through the app's own DB
  client — see the callout in [Authorization](#authorization-rbac). Don't add a new
  `pgPolicy` expecting it to enforce anything by itself.
