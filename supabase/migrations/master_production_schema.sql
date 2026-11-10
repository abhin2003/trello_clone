-- ============================================================================
-- STRATCREST FLOW: MASTER PRODUCTION SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Single unified SQL script for setting up or updating Supabase.
-- Compatible with multi-tenant SaaS, cross-device real-time sync,
-- joining codes, and real-time chat without auth foreign-key blocks.
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Enumerations (Safe Creation)
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
    storage_allowance_bytes BIGINT NOT NULL DEFAULT 5368709120,
    max_automations_per_month INT NOT NULL DEFAULT 1000,
    allow_guest_access BOOLEAN NOT NULL DEFAULT true,
    allow_custom_branding BOOLEAN NOT NULL DEFAULT true,
    allow_data_export BOOLEAN NOT NULL DEFAULT true,
    allow_advanced_audit_logs BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Seed Subscription Plans
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
    slug VARCHAR(100) NOT NULL,
    join_code VARCHAR(50),
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

-- Ensure join_code column & index exists
ALTER TABLE public.organisations ADD COLUMN IF NOT EXISTS join_code VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_organisations_join_code ON public.organisations(UPPER(join_code));

-- 5. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    initials VARCHAR(10) NOT NULL,
    avatar_color VARCHAR(30) NOT NULL DEFAULT '#3b82f6',
    is_platform_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Organisation Memberships Table (Multi-tenant cross-device without auth locks)
CREATE TABLE IF NOT EXISTS public.organisation_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role user_role_type NOT NULL DEFAULT 'member',
    job_title VARCHAR(150) DEFAULT 'Team Member',
    is_active BOOLEAN NOT NULL DEFAULT true,
    invited_by UUID,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    user_name VARCHAR(150),
    user_email VARCHAR(255),
    user_initials VARCHAR(10),
    user_avatar_color VARCHAR(30)
);

-- Ensure all cross-device rendering columns exist and foreign key locks are removed
ALTER TABLE public.organisation_members DROP CONSTRAINT IF EXISTS organisation_members_user_id_fkey;
ALTER TABLE public.organisation_members ADD COLUMN IF NOT EXISTS user_name VARCHAR(150);
ALTER TABLE public.organisation_members ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE public.organisation_members ADD COLUMN IF NOT EXISTS user_initials VARCHAR(10);
ALTER TABLE public.organisation_members ADD COLUMN IF NOT EXISTS user_avatar_color VARCHAR(30);

-- 7. Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    visibility VARCHAR(30) NOT NULL DEFAULT 'organisation',
    allowed_member_ids JSONB DEFAULT '[]',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS allowed_member_ids JSONB DEFAULT '[]';

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
    created_by UUID,
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

-- 11. Real-Time Chat Messages Table (Cross-device, email matching, no auth lock)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    conversation_key VARCHAR(255) NOT NULL,
    sender_id UUID NOT NULL,
    sender_name VARCHAR(150),
    sender_email VARCHAR(255),
    recipient_id UUID,
    recipient_email VARCHAR(255),
    text TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'sent',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_recipient_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_organisation_id_fkey;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_key ON public.chat_messages(conversation_key);

-- 12. Invitations Table
CREATE TABLE IF NOT EXISTS public.organisation_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role user_role_type NOT NULL DEFAULT 'member',
    token VARCHAR(100) NOT NULL UNIQUE,
    status invite_status_type NOT NULL DEFAULT 'pending',
    invited_by UUID,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    accepted_at TIMESTAMPTZ
);

-- ============================================================================
-- 13. Enable Row-Level Security (RLS) with Multi-Tenant Access Policies
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

-- Permissive policies for client multi-tenant SaaS operation
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Organisations access by all" ON public.organisations;
CREATE POLICY "Organisations access by all" ON public.organisations FOR ALL USING (true);

DROP POLICY IF EXISTS "Profiles access by all" ON public.profiles;
CREATE POLICY "Profiles access by all" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Members access by all" ON public.organisation_members;
CREATE POLICY "Members access by all" ON public.organisation_members FOR ALL USING (true);

DROP POLICY IF EXISTS "Workspaces access by all" ON public.workspaces;
CREATE POLICY "Workspaces access by all" ON public.workspaces FOR ALL USING (true);

DROP POLICY IF EXISTS "Boards access by all" ON public.boards;
CREATE POLICY "Boards access by all" ON public.boards FOR ALL USING (true);

DROP POLICY IF EXISTS "Lists access by all" ON public.lists;
CREATE POLICY "Lists access by all" ON public.lists FOR ALL USING (true);

DROP POLICY IF EXISTS "Cards access by all" ON public.cards;
CREATE POLICY "Cards access by all" ON public.cards FOR ALL USING (true);

DROP POLICY IF EXISTS "Chat message access by all" ON public.chat_messages;
CREATE POLICY "Chat message access by all" ON public.chat_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Invitations access by all" ON public.organisation_invitations;
CREATE POLICY "Invitations access by all" ON public.organisation_invitations FOR ALL USING (true);

-- ============================================================================
-- 14. Enable Supabase Realtime Publication
-- ============================================================================
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organisations;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organisation_members;
EXCEPTION WHEN others THEN null;
END $$;

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
