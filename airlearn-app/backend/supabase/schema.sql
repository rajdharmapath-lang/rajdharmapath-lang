create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  dial_code text not null,
  phone text not null,
  name text,
  email text,
  occupation text,
  language text check (language in ('tamil', 'english') or language is null),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_phone_identity_unique unique (dial_code, phone)
);

alter table public.users enable row level security;
revoke all on table public.users from anon, authenticated;
grant all on table public.users to service_role;

create table if not exists public.user_deletion_audit (
  id uuid primary key default gen_random_uuid(),
  original_user_id uuid not null,
  dial_code text,
  phone text,
  name text,
  email text,
  occupation text,
  language text,
  created_at timestamptz,
  updated_at timestamptz,
  user_snapshot jsonb not null,
  deleted_at timestamptz not null default now()
);

alter table public.user_deletion_audit add column if not exists dial_code text;
alter table public.user_deletion_audit add column if not exists phone text;
alter table public.user_deletion_audit add column if not exists name text;
alter table public.user_deletion_audit add column if not exists email text;
alter table public.user_deletion_audit add column if not exists occupation text;
alter table public.user_deletion_audit add column if not exists language text;
alter table public.user_deletion_audit add column if not exists created_at timestamptz;
alter table public.user_deletion_audit add column if not exists updated_at timestamptz;

update public.user_deletion_audit
set dial_code = coalesce(dial_code, user_snapshot ->> 'dial_code'),
    phone = coalesce(phone, user_snapshot ->> 'phone'),
    name = coalesce(name, user_snapshot ->> 'name'),
    email = coalesce(email, user_snapshot ->> 'email'),
    occupation = coalesce(occupation, user_snapshot ->> 'occupation'),
    language = coalesce(language, user_snapshot ->> 'language'),
    created_at = coalesce(created_at, nullif(user_snapshot ->> 'created_at', '')::timestamptz),
    updated_at = coalesce(updated_at, nullif(user_snapshot ->> 'updated_at', '')::timestamptz)
where dial_code is null
   or phone is null
   or created_at is null
   or updated_at is null;

alter table public.user_deletion_audit enable row level security;
revoke all on table public.user_deletion_audit from anon, authenticated;
grant all on table public.user_deletion_audit to service_role;

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  razorpay_order_id text not null unique,
  user_id uuid not null,
  plan_id text not null,
  batch_id text not null,
  tier text not null,
  amount bigint not null check (amount > 0),
  currency text not null,
  coupon_code text,
  original_amount bigint not null,
  discount_amount bigint not null default 0,
  status text not null default 'created' check (status in ('created', 'captured')),
  razorpay_payment_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_order_id uuid not null references public.payment_orders(id),
  user_id uuid not null,
  razorpay_payment_id text not null unique,
  amount bigint not null check (amount > 0),
  currency text not null,
  status text not null check (status = 'captured'),
  method text,
  razorpay_created_at timestamptz,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.user_entitlements (
  user_id uuid not null,
  batch_id text not null,
  plan_id text not null,
  tier text not null,
  payment_order_id uuid not null references public.payment_orders(id),
  payment_transaction_id uuid not null references public.payment_transactions(id),
  purchased_at timestamptz not null default now(),
  valid_until timestamptz not null,
  primary key (user_id, batch_id)
);

create table if not exists public.user_practice_previews (
  user_id uuid not null,
  module text not null,
  preview_count integer not null default 1 check (preview_count between 1 and 3),
  used_at timestamptz not null default now(),
  primary key (user_id, module)
);

alter table public.user_practice_previews
  add column if not exists preview_count integer not null default 1
  check (preview_count between 1 and 3);

alter table public.user_practice_previews enable row level security;
revoke all on table public.user_practice_previews from anon, authenticated;
grant all on table public.user_practice_previews to service_role;

alter table public.user_entitlements add column if not exists valid_until timestamptz;
update public.user_entitlements
set valid_until = purchased_at + interval '3 months'
where valid_until is null;
alter table public.user_entitlements alter column valid_until set not null;

create index if not exists payment_orders_user_created_idx
  on public.payment_orders (user_id, created_at desc);
create index if not exists payment_transactions_user_created_idx
  on public.payment_transactions (user_id, created_at desc);
create index if not exists user_entitlements_user_idx
  on public.user_entitlements (user_id);

alter table public.payment_orders enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.user_entitlements enable row level security;
revoke all on table public.payment_orders, public.payment_transactions, public.user_entitlements from anon, authenticated;
grant all on table public.payment_orders, public.payment_transactions, public.user_entitlements to service_role;
