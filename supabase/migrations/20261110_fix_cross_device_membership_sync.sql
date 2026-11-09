-- ============================================================================
-- STRATCREST FLOW - CROSS-DEVICE REAL-TIME MEMBERSHIP SYNC MIGRATION
-- ============================================================================
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- This enables full multi-device synchronization for organisation members,
-- removes foreign key blocks, and enables Supabase Realtime broadcast.
-- ============================================================================

-- 1. Remove the strict foreign key to auth.users so any member from any device can join seamlessly
ALTER TABLE public.organisation_members DROP CONSTRAINT IF EXISTS organisation_members_user_id_fkey;

-- 2. Ensure user_id column accepts text identifiers
ALTER TABLE public.organisation_members ALTER COLUMN user_id TYPE TEXT;

-- 3. Add direct profile fields to organisation_members for immediate cross-device rendering
ALTER TABLE public.organisation_members ADD COLUMN IF NOT EXISTS user_name VARCHAR(150);
ALTER TABLE public.organisation_members ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE public.organisation_members ADD COLUMN IF NOT EXISTS user_initials VARCHAR(10);
ALTER TABLE public.organisation_members ADD COLUMN IF NOT EXISTS user_avatar_color VARCHAR(30);

-- 4. Ensure join_code column is indexed on organisations for fast lookup
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS join_code VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_organisations_join_code ON public.organisations(UPPER(join_code));

-- 5. Enable Row Level Security (RLS) policies allowing public multi-tenant access
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Organisations readable by all" ON public.organisations;
CREATE POLICY "Organisations readable by all" ON public.organisations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organisations insertable by all" ON public.organisations;
CREATE POLICY "Organisations insertable by all" ON public.organisations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Organisations updatable by all" ON public.organisations;
CREATE POLICY "Organisations updatable by all" ON public.organisations FOR UPDATE USING (true);

ALTER TABLE public.organisation_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members readable by all" ON public.organisation_members;
CREATE POLICY "Members readable by all" ON public.organisation_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Members insertable by all" ON public.organisation_members;
CREATE POLICY "Members insertable by all" ON public.organisation_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Members updatable by all" ON public.organisation_members;
CREATE POLICY "Members updatable by all" ON public.organisation_members FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Members deletable by all" ON public.organisation_members;
CREATE POLICY "Members deletable by all" ON public.organisation_members FOR DELETE USING (true);

-- 6. Enable Realtime publication so changes broadcast immediately across tabs/browsers
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organisations;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organisation_members;
EXCEPTION WHEN others THEN null;
END $$;

-- 7. Seed / link Akash's crest organisation (CRES-5822) and members Akash + strivecad
INSERT INTO public.organisations (id, name, slug, join_code, status, plan_id)
VALUES (
    'c7e57001-c8e5-4d76-90b4-3a9bb7615822',
    'crest',
    'crest',
    'CRES-5822',
    'active',
    'free_trial'
)
ON CONFLICT (id) DO UPDATE SET
    join_code = 'CRES-5822',
    name = 'crest';

-- Seed Akash (Founder & Owner)
INSERT INTO public.organisation_members (id, organisation_id, user_id, role, job_title, is_active, user_name, user_email, user_initials, user_avatar_color)
VALUES (
    'c7e57001-c8e5-4d76-90b4-3a9bb7610001',
    'c7e57001-c8e5-4d76-90b4-3a9bb7615822',
    'user-akashrithurishitha-gmail-com',
    'owner',
    'Founder & Owner',
    true,
    'akash',
    'akashrithurishitha@gmail.com',
    'AK',
    '#3b82f6'
)
ON CONFLICT (id) DO UPDATE SET
    user_name = 'akash',
    user_email = 'akashrithurishitha@gmail.com',
    role = 'owner';

-- Seed strivecad (Team Member)
INSERT INTO public.organisation_members (id, organisation_id, user_id, role, job_title, is_active, user_name, user_email, user_initials, user_avatar_color)
VALUES (
    'c7e57001-c8e5-4d76-90b4-3a9bb7610002',
    'c7e57001-c8e5-4d76-90b4-3a9bb7615822',
    'user-strivecad-gmail-com',
    'member',
    'Team Member',
    true,
    'strivecad',
    'strivecad@gmail.com',
    'SC',
    '#10b981'
)
ON CONFLICT (id) DO UPDATE SET
    user_name = 'strivecad',
    user_email = 'strivecad@gmail.com',
    role = 'member';
