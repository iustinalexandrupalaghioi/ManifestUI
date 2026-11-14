-- ManifestUI: keep public."user" in sync with Supabase Auth (auth.users).
--
-- A trigger on auth.users mirrors every insert/update/delete into the app's own
-- "user" table, inside the database. It does the same as the
-- /api/webhooks/auth-users route, but needs no public URL, so it also works for
-- local development. `pnpm manifest auth-sync` runs this file; you can also
-- paste it into the Supabase SQL editor. Safe to run more than once.
--
-- Plain SQL, not Drizzle: a Drizzle schema can't define functions or triggers,
-- and `pnpm db:push` doesn't run custom SQL.

create or replace function public.manifestui_sync_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    -- user_group references "user" with ON DELETE RESTRICT; drop the deleted
    -- user's memberships first so deleting them in Supabase doesn't fail.
    delete from public.user_group where user_id = old.id;
    delete from public."user" where id = old.id;
    return old;
  end if;

  insert into public."user" (id, email, phone, full_name, avatar_url, banned_until, last_sign_in_at, updated_at)
  values (
    new.id,
    new.email,
    new.phone,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    new.banned_until,
    new.last_sign_in_at,
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    phone = excluded.phone,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    banned_until = excluded.banned_until,
    last_sign_in_at = excluded.last_sign_in_at,
    updated_at = excluded.updated_at;
  return new;
end;
$$;

drop trigger if exists manifestui_sync_auth_user on auth.users;
create trigger manifestui_sync_auth_user
  after insert or update or delete on auth.users
  for each row execute function public.manifestui_sync_auth_user();

-- Backfill users that signed up before the trigger existed.
insert into public."user" (id, email, phone, full_name, avatar_url, banned_until, last_sign_in_at, updated_at)
select
  u.id,
  u.email,
  u.phone,
  u.raw_user_meta_data ->> 'full_name',
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
  u.banned_until,
  u.last_sign_in_at,
  now()
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  phone = excluded.phone,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  banned_until = excluded.banned_until,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = excluded.updated_at;
