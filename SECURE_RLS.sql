-- Enable RLS on tables to prevent direct client access
alter table licenses enable row level security;
alter table companies enable row level security;

-- Create "Deny All" policies for public anon access
-- (By default, enabling RLS without policies denies access, but explicit policies are clearer)

-- Policy: No direct SELECT for anon
create policy "No direct select on licenses"
on licenses for select
to anon
using (false);

-- Policy: No direct INSERT for anon
create policy "No direct insert on licenses"
on licenses for insert
to anon
with check (false);

-- Policy: No direct UPDATE for anon
create policy "No direct update on licenses"
on licenses for update
to anon
using (false);

-- Policy: No direct DELETE for anon
create policy "No direct delete on licenses"
on licenses for delete
to anon
using (false);

-- Repeat for companies if strictly server-managed
create policy "No direct access on companies"
on companies for all
to anon
using (false);

-- NOTE: RPC functions (register_device, validate_license) 
-- are defined with 'SECURITY DEFINER', so they bypass these RLS policies
-- and run with the privileges of the function creator (admin).
