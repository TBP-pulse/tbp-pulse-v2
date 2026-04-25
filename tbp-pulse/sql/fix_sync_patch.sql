-- PATCH: Fix Sync Discrepancies between Code and Database
-- Run this in your Supabase SQL Editor to match the current application code requirements.

-- 1. Upgrade 'tasks' table to support multiple attachments
DO $$ 
BEGIN 
    -- If 'attachment' (singular) exists, we might want to keep it or migrate it
    -- But the code specifically looks for 'attachments' (plural, array)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='attachment') THEN
        -- Option: rename it or just add the new one
        -- We will add the new one as it's an array
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='attachments') THEN
            ALTER TABLE tasks ADD COLUMN attachments TEXT[] DEFAULT '{}';
            -- Migrate existing single attachment to the array
            UPDATE tasks SET attachments = ARRAY[attachment] WHERE attachment IS NOT NULL AND attachments = '{}';
        END IF;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='attachments') THEN
            ALTER TABLE tasks ADD COLUMN attachments TEXT[] DEFAULT '{}';
        END IF;
    END IF;

    -- Ensure 'client' column exists in tasks (some parts of the code use it for quick access)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='client') THEN
        ALTER TABLE tasks ADD COLUMN client TEXT;
    END IF;
END $$;

-- 2. Ensure 'tbp_alerts' table exists with plural/new schema
CREATE TABLE IF NOT EXISTS public.tbp_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    client TEXT,
    assignee TEXT,
    assignee_initials TEXT,
    assignee_color TEXT,
    error_code TEXT,
    severity TEXT DEFAULT 'info',
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- 3. Ensure 'projects' has both 'name' and 'client'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='name') THEN
        ALTER TABLE projects ADD COLUMN name TEXT;
        UPDATE projects SET name = client WHERE name IS NULL;
        ALTER TABLE projects ALTER COLUMN name SET NOT NULL;
    END IF;
END $$;

-- 4. Enable RLS and Real-time if not set
ALTER TABLE tbp_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE projects REPLICA IDENTITY FULL;

-- 5. Fix permissions for Alerts
DROP POLICY IF EXISTS "Owner Full Access Alerts" ON tbp_alerts;
CREATE POLICY "Owner Full Access Alerts" ON tbp_alerts FOR ALL USING (auth.jwt()->>'email' = 'rozaliamarinescu33@gmail.com');
DROP POLICY IF EXISTS "Acces Universal Alerte" ON tbp_alerts;
CREATE POLICY "Acces Universal Alerte" ON tbp_alerts FOR ALL USING (auth.role() = 'authenticated');
