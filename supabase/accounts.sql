-- ─────────────────────────────────────────────────────────────────────────────
-- The Nomad — customer accounts
--
-- Design notes:
--  * Sign-in is magic link + social, so the email on the JWT is always one the
--    customer has proved they control. That lets us join a signed-in person to
--    their past GUEST orders by email alone — no "claim your order" step, and
--    order history works retroactively from the first sign-in.
--  * Guest checkout is untouched. Nothing here makes an account mandatory.
--  * Admin is a separate concept (admin_users + is_admin()). A customer account
--    gets no admin rights; AdminApp already shows "Not an admin account".
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  mobile     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists profiles_own_select on profiles;
create policy profiles_own_select on profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists profiles_own_upsert on profiles;
create policy profiles_own_upsert on profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_own_update on profiles;
create policy profiles_own_update on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- A row for every new sign-up, so the account page never has to special-case
-- "profile does not exist yet".
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Saved addresses ─────────────────────────────────────────────────────────
create table if not exists addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  label      text,
  full_name  text not null,
  mobile     text,
  address    text not null,
  city       text,
  state      text,
  pin        text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists addresses_user_idx on addresses(user_id);

alter table addresses enable row level security;

drop policy if exists addresses_own_all on addresses;
create policy addresses_own_all on addresses
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Exactly one default per customer, enforced in the database rather than hoped
-- for in the UI.
create unique index if not exists addresses_one_default
  on addresses(user_id) where is_default;

-- Clearing the old default and setting the new one is two statements. Done from
-- the browser there is a window where a second tab trips the unique index, so
-- promote in one transaction instead.
create or replace function set_default_address(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  -- Scoped to the caller, so passing somebody else's id changes nothing.
  if not exists (select 1 from addresses where id = p_id and user_id = auth.uid()) then
    raise exception 'no such address';
  end if;
  update addresses set is_default = false where user_id = auth.uid() and is_default;
  update addresses set is_default = true  where id = p_id and user_id = auth.uid();
end $$;

grant execute on function set_default_address(uuid) to authenticated;

-- ── Saved objects (wishlist) ────────────────────────────────────────────────
create table if not exists saved_objects (
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table saved_objects enable row level security;

drop policy if exists saved_own_all on saved_objects;
create policy saved_own_all on saved_objects
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Merge whatever the browser had in localStorage into the account on first
-- sign-in, without clobbering what is already saved server-side.
-- Returns jsonb rather than setof bigint: PostgREST's shape for a set-returning
-- scalar function is ambiguous enough that the client would have to guess.
-- A jsonb array of ids is unambiguous.
create or replace function merge_saved_objects(p_ids bigint[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  insert into saved_objects (user_id, product_id)
  select auth.uid(), unnest(coalesce(p_ids, '{}'))
  on conflict do nothing;
  return coalesce(
    (select jsonb_agg(product_id order by created_at desc)
     from saved_objects where user_id = auth.uid()),
    '[]'::jsonb
  );
end $$;

grant execute on function merge_saved_objects(bigint[]) to authenticated;

-- ── Orders: let a signed-in customer read their own ─────────────────────────
-- Guest orders carry no user_id, so we match on the verified email too. This
-- is what makes history work for orders placed before the account existed.
alter table orders add column if not exists user_id uuid references auth.users(id);
create index if not exists orders_user_idx on orders(user_id);
create index if not exists orders_email_idx on orders(lower(email));

drop policy if exists orders_own_select on orders;
create policy orders_own_select on orders
  for select to authenticated
  using (
    user_id = auth.uid()
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists order_items_own_select on order_items;
create policy order_items_own_select on order_items
  for select to authenticated
  using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and (
          o.user_id = auth.uid()
          or lower(o.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

-- Stamp the customer's id onto any order of theirs that does not have one --
-- orders placed as a guest, and orders placed through the API, which runs with
-- the anon key and so has no auth.uid() of its own. Called after sign-in and
-- after checkout. Matching stays on the verified email, so this can only ever
-- claim orders the customer could already read.
create or replace function claim_my_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_n     integer;
begin
  if v_email = '' or auth.uid() is null then
    raise exception 'not signed in';
  end if;
  update orders set user_id = auth.uid()
   where user_id is null and lower(email) = v_email;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

grant execute on function claim_my_orders() to authenticated;

-- ── Email preferences ───────────────────────────────────────────────────────
-- subscribers/unsubscribes are keyed by email, not by user. These two wrap
-- them so the account page can read and write preferences for the signed-in
-- address only, and never for anybody else's.
create or replace function my_email_prefs()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_off   boolean;
begin
  if v_email = '' then
    raise exception 'not signed in';
  end if;
  select exists (select 1 from unsubscribes where lower(email) = v_email) into v_off;
  return jsonb_build_object(
    'email', v_email,
    'unsubscribed', v_off,
    'newsletter', (not v_off) and exists (
      select 1 from subscribers where lower(email) = v_email and source <> 'drops'),
    'drops', (not v_off) and exists (
      select 1 from subscribers where lower(email) = v_email and source = 'drops')
  );
end $$;

create or replace function set_email_prefs(p_newsletter boolean, p_drops boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if v_email = '' then
    raise exception 'not signed in';
  end if;

  -- Turning either list on means the address is no longer suppressed.
  if p_newsletter or p_drops then
    delete from unsubscribes where lower(email) = v_email;
  end if;

  if p_newsletter then
    insert into subscribers (email, source)
    select v_email, 'newsletter'
    where not exists (
      select 1 from subscribers where lower(email) = v_email and source <> 'drops');
  else
    delete from subscribers where lower(email) = v_email and source <> 'drops';
  end if;

  if p_drops then
    insert into subscribers (email, source)
    select v_email, 'drops'
    where not exists (
      select 1 from subscribers where lower(email) = v_email and source = 'drops');
  else
    delete from subscribers where lower(email) = v_email and source = 'drops';
  end if;

  -- Both off is a deliberate opt-out, so record it as one. sendMail already
  -- refuses to send to anything in this table.
  if not p_newsletter and not p_drops then
    insert into unsubscribes (email, source)
    select v_email, 'account'
    where not exists (select 1 from unsubscribes where lower(email) = v_email);
  end if;

  return my_email_prefs();
end $$;

grant execute on function my_email_prefs() to authenticated;
grant execute on function set_email_prefs(boolean, boolean) to authenticated;

-- ── Collection summary (the map) ────────────────────────────────────────────
-- Everything the customer actually owns, with coordinates, for their own copy
-- of the world map. Security definer so it can read orders/products directly,
-- but it only ever answers for the caller's own verified email.
create or replace function my_collection()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if v_email = '' then
    raise exception 'not signed in';
  end if;
  return coalesce((
    select jsonb_agg(x order by x ->> 'name')
    from (
      select jsonb_build_object(
        'product_id', p.id,
        'name', p.name,
        'slug', p.slug,
        'city', p.city,
        'country', p.country,
        'lat', p.lat,
        'lon', p.lon,
        'object_no', p.object_no,
        'photo_id', p.photo_id,
        'image_public_id', p.image_public_id,
        'tone', p.tone,
        -- Included so the passport line needs no second round trip.
        'material', p.material,
        'category', p.category,
        'qty', sum(oi.qty),
        'first_ordered', min(o.created_at)
      ) as x
      from order_items oi
      join orders o   on o.id = oi.order_id
      join products p on p.id = oi.product_id
      where (o.user_id = auth.uid() or lower(o.email) = v_email)
        -- An order that was called off is not a thing you own. Harmless today,
        -- since nothing sets this status yet, but the collection should not
        -- start lying the day cancellations exist.
        and coalesce(o.status, '') not in ('cancelled', 'refunded')
      group by p.id
    ) s
  ), '[]'::jsonb);
end $$;

grant execute on function my_collection() to authenticated;

-- ── Make sure signed-in visitors can still read the catalogue ───────────────
-- The public tables were opened up before authenticated users existed, so some
-- policies may name `anon` alone. A signed-in customer must be able to read
-- products just as a guest can, or the saved and collection grids come up empty
-- for exactly the people who are logged in.
do $$
declare t text;
begin
  foreach t in array array['products', 'journal_articles', 'drops', 'coming_soon', 'countries'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists %I_read_authenticated on public.%I', t, t);
      execute format(
        'create policy %I_read_authenticated on public.%I for select to authenticated using (true)',
        t, t);
    end if;
  end loop;
end $$;
