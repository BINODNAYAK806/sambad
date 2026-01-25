-- ========================================================
-- SAMBAD HYBRID SAAS: SUPABASE SETUP SCRIPT (AGGRESSIVE REFRESH)
-- ========================================================

-- 1. Ensure Schema Usage (Mandatory for API visibility)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;

-- 2. Drop and Recreate Licenses Table (Ensures fresh start)
-- WARNING: This will delete existing license data. 
-- Comment out the DROP line if you want to keep existing data.
DROP TABLE IF EXISTS licenses; 

CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key TEXT UNIQUE NOT NULL,
  mobile TEXT NOT NULL,
  device_id TEXT, 
  status TEXT DEFAULT 'INACTIVE', 
  expiry_date TIMESTAMPTZ, 
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Supporting Tables
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- 5. Grant Permissions (The "PGRST205" Fixer)
GRANT ALL ON TABLE licenses TO anon;
GRANT ALL ON TABLE licenses TO authenticated;
GRANT ALL ON TABLE licenses TO service_role;
GRANT ALL ON TABLE companies TO anon;
GRANT ALL ON TABLE companies TO authenticated;
GRANT ALL ON TABLE companies TO service_role;

-- 6. Create Access Policies
DROP POLICY IF EXISTS "Allow anon select" ON licenses;
CREATE POLICY "Allow anon select" ON licenses FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert" ON licenses;
CREATE POLICY "Allow anon insert" ON licenses FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update" ON licenses;
CREATE POLICY "Allow anon update" ON licenses FOR UPDATE TO anon USING (true);

-- 7. FORCE API RELOAD
NOTIFY pgrst, 'reload schema';

-- 8. DIAGNOSTIC CHECK (Run this and check Results tab)
-- Row 1: Should be 'licenses'
-- Row 2: Should be 'companies'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('licenses', 'companies')
ORDER BY table_name;
