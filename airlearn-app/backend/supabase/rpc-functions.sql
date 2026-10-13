-- Run this SQL in the Supabase SQL Editor before deploying the HTTPS API backend.

create or replace function public.claim_stroke_preview(p_user_id uuid)
returns table (
  has_prime_access boolean,
  preview_claimed boolean,
  preview_count integer
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_has_prime_access boolean;
  v_preview_count integer;
  v_preview_claimed boolean;
begin
  select exists (
    select 1
    from public.user_entitlements
    where user_id = p_user_id
      and valid_until > pg_catalog.now()
  )
  into v_has_prime_access;

  if v_has_prime_access then
    return query select true, false, null::integer;
    return;
  end if;

  insert into public.user_practice_previews as existing_preview (
    user_id,
    module,
    preview_count
  )
  values (p_user_id, 'stroke', 1)
  on conflict (user_id, module) do update
  set preview_count = existing_preview.preview_count + 1,
      used_at = pg_catalog.now()
  where existing_preview.preview_count < 3
  returning existing_preview.preview_count into v_preview_count;

  v_preview_claimed := found;
  return query select false, v_preview_claimed, v_preview_count;
end;
$$;

create or replace function public.archive_and_delete_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user public.users%rowtype;
begin
  select *
  into v_user
  from public.users
  where id = p_user_id
  for update;

  if not found then
    return null;
  end if;

  insert into public.user_deletion_audit (
    original_user_id,
    dial_code,
    phone,
    name,
    email,
    occupation,
    language,
    created_at,
    updated_at,
    user_snapshot
  ) values (
    v_user.id,
    v_user.dial_code,
    v_user.phone,
    v_user.name,
    v_user.email,
    v_user.occupation,
    v_user.language,
    v_user.created_at,
    v_user.updated_at,
    pg_catalog.to_jsonb(v_user)
  );

  delete from public.users where id = p_user_id;
  return pg_catalog.to_jsonb(v_user);
end;
$$;

create or replace function public.record_captured_payment(
  p_razorpay_order_id text,
  p_user_id uuid,
  p_razorpay_payment_id text,
  p_amount bigint,
  p_currency text,
  p_method text,
  p_razorpay_created_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.payment_orders%rowtype;
  v_payment_transaction public.payment_transactions%rowtype;
  v_entitlement public.user_entitlements%rowtype;
begin
  select *
  into v_order
  from public.payment_orders
  where razorpay_order_id = p_razorpay_order_id
    and user_id = p_user_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object('outcome', 'not_found');
  end if;

  if v_order.status = 'captured' then
    if v_order.razorpay_payment_id is distinct from p_razorpay_payment_id then
      return pg_catalog.jsonb_build_object('outcome', 'conflict');
    end if;

    select *
    into v_entitlement
    from public.user_entitlements
    where user_id = p_user_id
      and batch_id = v_order.batch_id;

    return pg_catalog.jsonb_build_object(
      'outcome', 'captured',
      'entitlement', pg_catalog.to_jsonb(v_entitlement)
    );
  end if;

  insert into public.payment_transactions (
    payment_order_id,
    user_id,
    razorpay_payment_id,
    amount,
    currency,
    status,
    method,
    razorpay_created_at
  ) values (
    v_order.id,
    p_user_id,
    p_razorpay_payment_id,
    p_amount,
    p_currency,
    'captured',
    p_method,
    p_razorpay_created_at
  )
  returning * into v_payment_transaction;

  update public.payment_orders
  set status = 'captured',
      razorpay_payment_id = p_razorpay_payment_id,
      updated_at = pg_catalog.now()
  where id = v_order.id;

  insert into public.user_entitlements (
    user_id,
    batch_id,
    plan_id,
    tier,
    payment_order_id,
    payment_transaction_id,
    purchased_at,
    valid_until
  ) values (
    p_user_id,
    v_order.batch_id,
    v_order.plan_id,
    v_order.tier,
    v_order.id,
    v_payment_transaction.id,
    pg_catalog.now(),
    pg_catalog.now() + interval '3 months'
  )
  on conflict (user_id, batch_id) do update
  set plan_id = excluded.plan_id,
      tier = excluded.tier,
      payment_order_id = excluded.payment_order_id,
      payment_transaction_id = excluded.payment_transaction_id,
      purchased_at = excluded.purchased_at,
      valid_until = excluded.valid_until
  returning * into v_entitlement;

  return pg_catalog.jsonb_build_object(
    'outcome', 'captured',
    'entitlement', pg_catalog.to_jsonb(v_entitlement)
  );
end;
$$;

revoke all on function public.claim_stroke_preview(uuid) from public, anon, authenticated;
revoke all on function public.archive_and_delete_user(uuid) from public, anon, authenticated;
revoke all on function public.record_captured_payment(text, uuid, text, bigint, text, text, timestamptz)
  from public, anon, authenticated;

grant execute on function public.claim_stroke_preview(uuid) to service_role;
grant execute on function public.archive_and_delete_user(uuid) to service_role;
grant execute on function public.record_captured_payment(text, uuid, text, bigint, text, text, timestamptz)
  to service_role;
