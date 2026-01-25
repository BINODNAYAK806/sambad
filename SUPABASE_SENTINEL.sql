-- Sentinel Licensing Schema

-- 1. Create Licenses Table
create table if not exists licenses (
  id uuid default gen_random_uuid() primary key,
  mobile text not null unique,
  device_id text not null, -- Hardware fingerprint
  license_key text not null unique, -- 12 digit numeric key
  status text not null default 'active', -- active, expired, suspended
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  last_validated_at timestamptz
);

-- Index for fast lookups
create index if not exists licenses_license_key_idx on licenses(license_key);
create index if not exists licenses_mobile_idx on licenses(mobile);

-- 2. RPC: register_device
-- Logic: Checks if mobile exists. If not, generates key & creates record. Returns key.
create or replace function register_device(
  p_mobile text,
  p_device_id text
)
returns json
language plpgsql
security definer
as $$
declare
  v_license_key text;
  v_existing_record licenses%rowtype;
  v_expiry timestamptz;
begin
  -- Check existing mobile
  select * into v_existing_record from licenses where mobile = p_mobile;

  if found then
    -- If mobile exists, return success but DO NOT update device_id here (strict binding)
    -- Unless we want to allow re-binding logic (not in MVP)
    -- We return the license key so the user can use it (or masked version)
    return json_build_object(
      'success', true,
      'is_new', false,
      'license_key', v_existing_record.license_key,
      'expires_at', v_existing_record.expires_at,
      'message', 'Account already exists. Use your license key.'
    );
  else
    -- Generate 12-digit random numeric key
    -- Loop to ensure uniqueness (though with 12 digits collision is rare)
    loop
      v_license_key := floor(random() * (999999999999 - 100000000000 + 1) + 100000000000)::text;
      if not exists (select 1 from licenses where license_key = v_license_key) then
        exit;
      end if;
    end loop;

    -- Set expiry 1 day from now (Trial)
    v_expiry := now() + interval '1 day';

    insert into licenses (mobile, device_id, license_key, expires_at)
    values (p_mobile, p_device_id, v_license_key, v_expiry);

    return json_build_object(
      'success', true,
      'is_new', true,
      'license_key', v_license_key,
      'expires_at', v_expiry,
      'message', 'Trial activated successfully.'
    );
  end if;
end;
$$;

-- 3. RPC: validate_license
-- Logic: Strict check of Key + Device ID + Expiry
create or replace function validate_license(
  p_license_key text,
  p_device_id text
)
returns json
language plpgsql
security definer
as $$
declare
  v_record licenses%rowtype;
begin
  select * into v_record from licenses where license_key = p_license_key;

  if not found then
    return json_build_object('valid', false, 'reason', 'invalid_key');
  end if;

  if v_record.device_id <> p_device_id then
    return json_build_object('valid', false, 'reason', 'device_mismatch');
  end if;

  if v_record.expires_at < now() then
    return json_build_object('valid', false, 'reason', 'expired', 'expires_at', v_record.expires_at);
  end if;

  if v_record.status <> 'active' then
    return json_build_object('valid', false, 'reason', 'suspended');
  end if;

  -- Success - Update validation timestamp
  update licenses set last_validated_at = now() where id = v_record.id;

  return json_build_object(
    'valid', true,
    'expires_at', v_record.expires_at
  );
end;
$$;
