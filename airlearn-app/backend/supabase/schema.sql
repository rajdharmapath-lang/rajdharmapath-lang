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