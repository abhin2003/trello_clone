-- ============================================================================
-- STRATCREST FLOW: MASTER COMPLETE SUPABASE SCHEMA & MULTI-TENANT SETUP
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Enumerations (safe creation)
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('owner', 'admin', 'member', 'guest');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE org_status_type AS ENUM ('active', 'trial', 'past_due', 'suspended', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invite_status_type AS ENUM ('pending', 'accepted', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    trial_days INT NOT NULL DEFAULT 14,
    monthly_price_cents INT NOT NULL DEFAULT 0,
    yearly_price_cents INT NOT NULL DEFAULT 0,
    max_members INT NOT NULL DEFAULT 100,
    max_workspaces INT NOT NULL DEFAULT 50,
    max_boards INT NOT NULL DEFAULT 100,
    storage_allowance_bytes BIGINT NOT NULL DEFAULT 5368709120, -- 5 GB
    max_automations_per_month INT NOT NULL DEFAULT 1000,
    allow_guest_access BOOLEAN NOT NULL DEFAULT true,
    allow_custom_branding BOOLEAN NOT NULL DEFAULT true,
    allow_data_export BOOLEAN NOT NULL DEFAULT true,
    allow_advanced_audit_logs BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Seed subscription plans if empty
INSERT INTO public.subscription_plans (id, name, description, is_active, max_members, max_workspaces, max_boards)
VALUES
    ('free_trial', 'Free / Community', 'Full-access collaborative workspace', true, 100, 50, 100),
    ('starter', 'Team Starter', 'Essential team collaboration and boards', true, 100, 50, 100),
    ('professional', 'Business Pro', 'Advanced custom branding and unlimited boards', true, 500, 100, 500),
    ('enterprise', 'Enterprise Tier', 'Unlimited scale, audit compliance, and SLA support', true, 10000, 500, 10000)
ON CONFLICT (id) DO NOTHING;

-- 4. Organisations Table
CREATE TABLE IF NOT EXISTS public.organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    join_code VARCHAR(50) UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(30) NOT NULL DEFAULT '#3b82f6',
    status org_status_type NOT NULL DEFAULT 'active',
    status_reason TEXT,
    plan_id VARCHAR(50) REFERENCES public.subscription_plans(id) DEFAULT 'free_trial',
    trial_ends_at TIMESTAMPTZ,
    billing_email VARCHAR(255),
    used_storage_bytes BIGINT NOT NULL DEFAULT 0,
    allowed_email_domain VARCHAR(255),
    enforce_admin_invites_only BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Ensure join_code column exists if table was created previously
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS join_code VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS idx_organisations_join_code ON public.organisations(join_code) WHERE join_code IS NOT NULL;

-- 5. User Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    initials VARCHAR(10) NOT NULL,
    avatar_color VARCHAR(30) NOT NULL DEFAULT '#3b82f6',
    is_platform_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Automatic Profile Creation Trigger on Supabase Auth Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_name TEXT;
    v_initials TEXT;
BEGIN
    v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    IF v_name IS NULL OR length(trim(v_name)) = 0 THEN
        v_name := split_part(NEW.email, '@', 1);
    END IF;

    v_initials := UPPER(substring(v_name from 1 for 2));
    IF length(v_initials) = 0 THEN
        v_initials := 'U';
    END IF;

    INSERT INTO public.profiles (id, email, name, initials, avatar_color, is_platform_admin)
    VALUES (
        NEW.id,
        NEW.email,
        v_name,
        v_initials,
        '#3b82f6',
        COALESCE((NEW.raw_user_meta_data->>'is_platform_admin')::boolean, false)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = timezone('utc', now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Organisation Memberships Table
CREATE TABLE IF NOT EXISTS public.organisation_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_type NOT NULL DEFAULT 'member',
    job_title VARCHAR(150) DEFAULT 'Team Member',
    is_active BOOLEAN NOT NULL DEFAULT true,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(organisation_id, user_id)
);

-- 7. Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    visibility VARCHAR(30) NOT NULL DEFAULT 'organisation',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(organisation_id, slug)
);

-- 8. Kanban Boards Table
CREATE TABLE IF NOT EXISTS public.boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_starred BOOLEAN NOT NULL DEFAULT false,
    background JSONB NOT NULL DEFAULT '{"type":"color","value":"#1e293b","preview":"#1e293b"}',
    labels JSONB DEFAULT '[]',
    members JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. Lists Table
CREATE TABLE IF NOT EXISTS public.lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. Cards Table
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT DEFAULT '',
    cover_color VARCHAR(50),
    cover_gradient TEXT,
    labels JSONB DEFAULT '[]',
    members JSONB DEFAULT '[]',
    due_date TIMESTAMPTZ,
    due_complete BOOLEAN DEFAULT false,
    checklists JSONB DEFAULT '[]',
    comments JSONB DEFAULT '[]',
    activities JSONB DEFAULT '[]',
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 11. Real-Time Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    conversation_key VARCHAR(255) NOT NULL,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name VARCHAR(150),
    sender_email VARCHAR(255),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'sent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_key ON public.chat_messages(conversation_key);

-- 12. Invitations Table
CREATE TABLE IF NOT EXISTS public.organisation_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role user_role_type NOT NULL DEFAULT 'member',
    token VARCHAR(100) NOT NULL UNIQUE,
    status invite_status_type NOT NULL DEFAULT 'pending',
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    accepted_at TIMESTAMPTZ
);

-- ============================================================================
-- 13. Enable Row-Level Security (RLS) & Config Policies
-- ============================================================================
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_invitations ENABLE ROW LEVEL SECURITY;

-- Read policies for plans
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans FOR SELECT USING (true);

-- Profiles policies
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Organisations policies
DROP POLICY IF EXISTS "Organisations readable by members or with join code" ON public.organisations;
CREATE POLICY "Organisations readable by members or with join code" ON public.organisations FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.organisation_members om WHERE om.organisation_id = organisations.id AND om.user_id = auth.uid() AND om.is_active = true)
    OR join_code IS NOT NULL
);

DROP POLICY IF EXISTS "Authenticated users can create organisation" ON public.organisations;
CREATE POLICY "Authenticated users can create organisation" ON public.organisations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Owners/Admins can update organisation" ON public.organisations;
CREATE POLICY "Owners/Admins can update organisation" ON public.organisations FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.organisation_members om WHERE om.organisation_id = organisations.id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin'))
);

-- Organisation Members policies
DROP POLICY IF EXISTS "Members can view membership" ON public.organisation_members;
CREATE POLICY "Members can view membership" ON public.organisation_members FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.organisation_members om WHERE om.organisation_id = organisation_members.organisation_id AND om.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert membership" ON public.organisation_members;
CREATE POLICY "Users can insert membership" ON public.organisation_members FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update membership" ON public.organisation_members;
CREATE POLICY "Admins can update membership" ON public.organisation_members FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.organisation_members om WHERE om.organisation_id = organisation_members.organisation_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin'))
);

-- Workspaces, Boards, Lists, Cards policies (accessible by organisation members)
DROP POLICY IF EXISTS "Workspace access by org members" ON public.workspaces;
CREATE POLICY "Workspace access by org members" ON public.workspaces FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.organisation_members om WHERE om.organisation_id = workspaces.organisation_id AND om.user_id = auth.uid()));

DROP POLICY IF EXISTS "Board access by org members" ON public.boards;
CREATE POLICY "Board access by org members" ON public.boards FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.organisation_members om WHERE om.organisation_id = boards.organisation_id AND om.user_id = auth.uid()));

DROP POLICY IF EXISTS "List access via board" ON public.lists;
CREATE POLICY "List access via board" ON public.lists FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.boards b JOIN public.organisation_members om ON om.organisation_id = b.organisation_id WHERE b.id = lists.board_id AND om.user_id = auth.uid()));

DROP POLICY IF EXISTS "Card access via list" ON public.cards;
CREATE POLICY "Card access via list" ON public.cards FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.lists l JOIN public.boards b ON b.id = l.board_id JOIN public.organisation_members om ON om.organisation_id = b.organisation_id WHERE l.id = cards.list_id AND om.user_id = auth.uid()));

-- Chat Messages policies
DROP POLICY IF EXISTS "Chat message access" ON public.chat_messages;
CREATE POLICY "Chat message access" ON public.chat_messages FOR ALL TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR conversation_key LIKE '%' || auth.uid()::text || '%');

-- Invitations policies
DROP POLICY IF EXISTS "Invitations viewable by token or org members" ON public.organisation_invitations;
CREATE POLICY "Invitations viewable by token or org members" ON public.organisation_invitations FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Invitations manage by org admins" ON public.organisation_invitations;
CREATE POLICY "Invitations manage by org admins" ON public.organisation_invitations FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.organisation_members om WHERE om.organisation_id = organisation_invitations.organisation_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')));

-- ============================================================================
-- 14. Enable Supabase Realtime Publication
-- ============================================================================
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cards;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organisation_members;
EXCEPTION WHEN others THEN null;
END $$;
