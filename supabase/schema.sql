-- ============================================================
-- Ecommerce schema + RLS policies
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

-- ---------- ENUMS ----------
create type user_role as enum ('customer', 'vendor', 'admin');
create type vendor_status as enum ('pending', 'approved', 'rejected');
create type product_status as enum ('draft', 'active', 'archived');
create type order_status as enum ('pending', 'paid', 'shipped', 'delivered', 'cancelled');

-- ---------- TABLES ----------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'customer',
  vendor_status vendor_status,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references categories(id) on delete set null
);

create table products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references profiles(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  status product_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb, -- AI hook: tags, attributes, embedding refs, etc.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  status order_status not null default 'pending',
  total_amount numeric(10,2) not null check (total_amount >= 0),
  shipping_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  vendor_id uuid not null references profiles(id) on delete restrict, -- denormalized for fast vendor RLS
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0)
);

-- ---------- INDEXES ----------
create index idx_products_vendor on products(vendor_id);
create index idx_products_category on products(category_id);
create index idx_products_status on products(status);
create index idx_orders_customer on orders(customer_id);
create index idx_order_items_order on order_items(order_id);
create index idx_order_items_vendor on order_items(vendor_id);

-- ---------- updated_at trigger for products ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_updated_at
before update on products
for each row execute function set_updated_at();

-- ---------- Auto-create profile row on signup ----------
-- Mirrors what src/api/auth.ts does client-side; having both the trigger
-- AND the client upsert is redundant but harmless (upsert is idempotent).
-- Prefer relying on this trigger and removing the client-side upsert once confirmed.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ---------- Helper: is_admin() ----------
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- ---------- profiles ----------
create policy "profiles_select_own_or_admin"
  on profiles for select
  using (auth.uid() = id or is_admin());

create policy "profiles_update_own_or_admin"
  on profiles for update
  using (auth.uid() = id or is_admin());

create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

-- Admin needs to update vendor_status on other users' rows — covered by
-- profiles_update_own_or_admin above via is_admin().

-- ---------- categories ----------
create policy "categories_select_all"
  on categories for select
  using (true);

create policy "categories_admin_write"
  on categories for all
  using (is_admin())
  with check (is_admin());

-- ---------- products ----------
create policy "products_select_active_or_own_or_admin"
  on products for select
  using (
    status = 'active'
    or vendor_id = auth.uid()
    or is_admin()
  );

create policy "products_vendor_insert_own"
  on products for insert
  with check (
    vendor_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'vendor' and vendor_status = 'approved'
    )
  );

create policy "products_vendor_update_own_or_admin"
  on products for update
  using (vendor_id = auth.uid() or is_admin());

create policy "products_vendor_delete_own_or_admin"
  on products for delete
  using (vendor_id = auth.uid() or is_admin());

-- ---------- orders ----------
create policy "orders_select_own_or_admin"
  on orders for select
  using (customer_id = auth.uid() or is_admin());

-- Vendors can see orders that contain at least one of their items
create policy "orders_select_vendor_related"
  on orders for select
  using (
    exists (
      select 1 from order_items
      where order_items.order_id = orders.id
        and order_items.vendor_id = auth.uid()
    )
  );

create policy "orders_insert_own"
  on orders for insert
  with check (customer_id = auth.uid());

create policy "orders_update_admin_or_vendor_status"
  on orders for update
  using (is_admin());

-- ---------- order_items ----------
create policy "order_items_select_related"
  on order_items for select
  using (
    vendor_id = auth.uid()
    or is_admin()
    or exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.customer_id = auth.uid()
    )
  );

create policy "order_items_insert_via_own_order"
  on order_items for insert
  with check (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.customer_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE (product images)
-- ============================================================
-- Run once: create a public bucket named "product-images" in the
-- Supabase dashboard, then apply these policies:
--
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);
--
-- create policy "product_images_public_read"
--   on storage.objects for select using (bucket_id = 'product-images');
--
-- create policy "product_images_vendor_upload"
--   on storage.objects for insert
--   with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
