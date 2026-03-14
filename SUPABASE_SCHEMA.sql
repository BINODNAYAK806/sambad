-- supabase_schema.sql
-- Paste this entire file into the Supabase SQL Editor and click RUN.

-- 1. Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    license_key TEXT NOT NULL,
    local_id INTEGER NOT NULL,
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    vars_json JSONB,
    is_deleted BOOLEAN DEFAULT false,
    last_updated_at TIMESTAMP WITH TIME ZONE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(license_key, local_id)
);

-- 2. Groups
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    license_key TEXT NOT NULL,
    local_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    last_updated_at TIMESTAMP WITH TIME ZONE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(license_key, local_id)
);

-- 3. Group Contacts (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.group_contacts (
    license_key TEXT NOT NULL,
    group_local_id INTEGER NOT NULL,
    contact_local_id INTEGER NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    last_updated_at TIMESTAMP WITH TIME ZONE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY(license_key, group_local_id, contact_local_id)
);

-- 4. Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    license_key TEXT NOT NULL,
    local_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    message_template TEXT,
    group_local_id INTEGER,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    sending_strategy TEXT,
    is_poll BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    last_updated_at TIMESTAMP WITH TIME ZONE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(license_key, local_id)
);

-- 5. Campaign Messages
CREATE TABLE IF NOT EXISTS public.campaign_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    license_key TEXT NOT NULL,
    local_message_id TEXT NOT NULL,
    campaign_local_id INTEGER NOT NULL,
    contact_local_id INTEGER,
    recipient_number TEXT NOT NULL,
    recipient_name TEXT,
    status TEXT NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT false,
    last_updated_at TIMESTAMP WITH TIME ZONE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(license_key, local_message_id)
);

-- Enable RLS (Row Level Security) - simple pass-through for service role
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for service role" ON public.contacts FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON public.groups FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON public.group_contacts FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON public.campaigns FOR ALL USING (true);
CREATE POLICY "Enable all access for service role" ON public.campaign_messages FOR ALL USING (true);

-- Create Indexes for fast querying by license_key
CREATE INDEX idx_contacts_license ON public.contacts(license_key);
CREATE INDEX idx_groups_license ON public.groups(license_key);
CREATE INDEX idx_campaigns_license ON public.campaigns(license_key);
CREATE INDEX idx_messages_license ON public.campaign_messages(license_key);
