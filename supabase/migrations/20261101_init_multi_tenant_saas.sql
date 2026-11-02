-- ============================================================================
-- STRATCREST FLOW: MULTI-TENANT SAAS DATABASE MIGRATION
-- Compatible with PostgreSQL 15+ and Supabase
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Enumerations
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('owner', 'admin', 'member', 'guest');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE org_status_type AS ENUM ('active', 'trial', 'past_due', 'suspended', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invite_status_type AS ENUM ('pending', 'accepted', 'revoked', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE workspace_visibility_type AS ENUM ('private', 'team', 'organisation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE support_session_status_type AS ENUM ('pending', 'active', 'expired', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. Platform & Subscription Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY, -- 'free_trial', 'starter', 'professional', 'enterprise'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    trial_days INT NOT NULL DEFAULT 14,
    monthly_price_cents INT NOT NULL DEFAULT 0,
    yearly_price_cents INT NOT NULL DEFAULT 0,
    
    -- Configurable Quotas & Limits
    max_members INT NOT NULL DEFAULT 5,
    max_workspaces INT NOT NULL DEFAULT 2,
    max_boards INT NOT NULL DEFAULT 5,
    storage_allowance_bytes BIGINT NOT NULL DEFAULT 524288000, -- 500 MB default
    max_automations_per_month INT NOT NULL DEFAULT 100,
    allow_guest_access BOOLEAN NOT NULL DEFAULT false,
    allow_custom_branding BOOLEAN NOT NULL DEFAULT false,
    allow_data_export BOOLEAN NOT NULL DEFAULT true,
    allow_advanced_audit_logs BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS platform_admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    can_manage_billing BOOLEAN NOT NULL DEFAULT true,
    can_suspend_tenants BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================================
-- 4. Multi-Tenant Core Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(20) DEFAULT '#3b82f6',
    status org_status_type NOT NULL DEFAULT 'trial',
    status_reason TEXT,
    
    plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id) DEFAULT 'free_trial',
    trial_ends_at TIMESTAMPTZ DEFAULT (timezone('utc', now()) + INTERVAL '14 days'),
    billing_email VARCHAR(255),
    billing_customer_id VARCHAR(255),
    
    used_storage_bytes BIGINT NOT NULL DEFAULT 0,
    allowed_email_domain VARCHAR(100),
    enforce_admin_invites_only BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS organisation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_type NOT NULL DEFAULT 'member',
    job_title VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(organisation_id, user_id)
);

CREATE TABLE IF NOT EXISTS organisation_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role user_role_type NOT NULL DEFAULT 'member',
    token VARCHAR(128) NOT NULL UNIQUE,
    status invite_status_type NOT NULL DEFAULT 'pending',
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc', now()) + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    accepted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    description TEXT,
    visibility workspace_visibility_type NOT NULL DEFAULT 'organisation',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(organisation_id, slug)
);

CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, user_id)
);

-- ============================================================================
-- 5. Kanban Domain Tables (All Tenant Isolated)
-- ============================================================================

CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    is_starred BOOLEAN NOT NULL DEFAULT false,
    background JSONB NOT NULL DEFAULT '{"type": "gradient", "value": "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", "preview": "#3b82f6"}'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    position NUMERIC(10, 4) NOT NULL DEFAULT 1000.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position NUMERIC(10, 4) NOT NULL DEFAULT 1000.0,
    cover_color VARCHAR(50),
    cover_gradient VARCHAR(255),
    due_date TIMESTAMPTZ,
    due_complete BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS board_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
    name VARCHAR(60) NOT NULL,
    color VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS card_label_assignments (
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES board_labels(id) ON DELETE CASCADE,
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    PRIMARY KEY(card_id, label_id)
);

CREATE TABLE IF NOT EXISTS card_member_assignments (
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    PRIMARY KEY(card_id, user_id)
);

CREATE TABLE IF NOT EXISTS card_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS card_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    checklist_id UUID NOT NULL REFERENCES card_checklists(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS card_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS card_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES auth.users(id),
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS organisation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    target_org_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS support_access_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    platform_admin_id UUID NOT NULL REFERENCES auth.users(id),
    authorized_by_org_user UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    ticket_reference VARCHAR(50) NOT NULL,
    status support_session_status_type NOT NULL DEFAULT 'active',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================================
-- 6. Helper Security Functions (Security Definer)
-- ============================================================================

CREATE OR REPLACE FUNCTION is_org_member(lookup_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM organisation_members om
        JOIN organisations o ON o.id = om.organisation_id
        WHERE om.organisation_id = lookup_org_id
          AND om.user_id = auth.uid()
          AND om.is_active = true
          AND o.status NOT IN ('suspended', 'archived')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_org_admin(lookup_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM organisation_members om
        JOIN organisations o ON o.id = om.organisation_id
        WHERE om.organisation_id = lookup_org_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin')
          AND om.is_active = true
          AND o.status NOT IN ('suspended', 'archived')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM platform_admin_users
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_active_support_access(lookup_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM support_access_sessions
        WHERE organisation_id = lookup_org_id
          AND platform_admin_id = auth.uid()
          AND status = 'active'
          AND expires_at > timezone('utc', now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 7. Row Level Security Policies
-- ============================================================================

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_label_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_member_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_access_sessions ENABLE ROW LEVEL SECURITY;

-- Organisations
CREATE POLICY "Members or platform admins can view organisations"
ON organisations FOR SELECT
USING (is_org_member(id) OR is_platform_admin());

CREATE POLICY "Org Admins or platform admins can update organisation"
ON organisations FOR UPDATE
USING (is_org_admin(id) OR is_platform_admin());

-- Members
CREATE POLICY "Members can view other members in org"
ON organisation_members FOR SELECT
USING (is_org_member(organisation_id) OR is_platform_admin());

CREATE POLICY "Admins can manage organisation members"
ON organisation_members FOR ALL
USING (is_org_admin(organisation_id) OR is_platform_admin());

-- Workspaces
CREATE POLICY "Members can view workspaces"
ON workspaces FOR SELECT
USING (is_org_member(organisation_id));

CREATE POLICY "Admins can manage workspaces"
ON workspaces FOR ALL
USING (is_org_admin(organisation_id));

-- Boards (PLATFORM ADMINS CANNOT VIEW CONTENT WITHOUT ACTIVE SUPPORT SESSION)
CREATE POLICY "Members or authorized support can view boards"
ON boards FOR SELECT
USING (is_org_member(organisation_id) OR has_active_support_access(organisation_id));

CREATE POLICY "Members can create and manage boards"
ON boards FOR ALL
USING (is_org_member(organisation_id));

-- Lists & Cards
CREATE POLICY "Members or authorized support can view lists"
ON lists FOR SELECT
USING (is_org_member(organisation_id) OR has_active_support_access(organisation_id));

CREATE POLICY "Members can manage lists"
ON lists FOR ALL
USING (is_org_member(organisation_id));

CREATE POLICY "Members or authorized support can view cards"
ON cards FOR SELECT
USING (is_org_member(organisation_id) OR has_active_support_access(organisation_id));

CREATE POLICY "Members can manage cards"
ON cards FOR ALL
USING (is_org_member(organisation_id));

CREATE POLICY "Members can view and post comments"
ON card_comments FOR ALL
USING (is_org_member(organisation_id));

-- Invitations
CREATE POLICY "Admins can manage invitations"
ON organisation_invitations FOR ALL
USING (is_org_admin(organisation_id) OR is_platform_admin());

-- Audit Logs
CREATE POLICY "Members can view organisation audit logs"
ON organisation_audit_logs FOR SELECT
USING (is_org_admin(organisation_id) OR is_platform_admin());

-- Support Sessions
CREATE POLICY "Platform admins can view support sessions"
ON support_access_sessions FOR ALL
USING (is_platform_admin() OR is_org_admin(organisation_id));

-- ============================================================================
-- 8. Quota Enforcement Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION check_board_creation_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_id VARCHAR(50);
    v_max_boards INT;
    v_current_count INT;
BEGIN
    SELECT o.plan_id, sp.max_boards
    INTO v_plan_id, v_max_boards
    FROM organisations o
    JOIN subscription_plans sp ON sp.id = o.plan_id
    WHERE o.id = NEW.organisation_id;

    SELECT COUNT(*) INTO v_current_count
    FROM boards
    WHERE organisation_id = NEW.organisation_id;

    IF v_current_count >= v_max_boards THEN
        RAISE EXCEPTION 'Board limit reached: Your current plan "%" allows at most % boards. Please upgrade your subscription to create more boards.',
            v_plan_id, v_max_boards;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_board_quota ON boards;
CREATE TRIGGER trg_enforce_board_quota
BEFORE INSERT ON boards
FOR EACH ROW
EXECUTE FUNCTION check_board_creation_quota();

CREATE OR REPLACE FUNCTION check_member_invitation_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_id VARCHAR(50);
    v_max_members INT;
    v_current_count INT;
BEGIN
    SELECT o.plan_id, sp.max_members
    INTO v_plan_id, v_max_members
    FROM organisations o
    JOIN subscription_plans sp ON sp.id = o.plan_id
    WHERE o.id = NEW.organisation_id;

    SELECT (
        (SELECT COUNT(*) FROM organisation_members WHERE organisation_id = NEW.organisation_id AND is_active = true) +
        (SELECT COUNT(*) FROM organisation_invitations WHERE organisation_id = NEW.organisation_id AND status = 'pending')
    ) INTO v_current_count;

    IF v_current_count >= v_max_members THEN
        RAISE EXCEPTION 'Member limit reached: Your current plan "%" allows at most % members. Please upgrade your subscription to invite more users.',
            v_plan_id, v_max_members;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_member_quota ON organisation_invitations;
CREATE TRIGGER trg_enforce_member_quota
BEFORE INSERT ON organisation_invitations
FOR EACH ROW
EXECUTE FUNCTION check_member_invitation_quota();

-- ============================================================================
-- 9. Seed Data (Plans)
-- ============================================================================

INSERT INTO subscription_plans (id, name, description, trial_days, monthly_price_cents, yearly_price_cents, max_members, max_workspaces, max_boards, storage_allowance_bytes, allow_guest_access, allow_custom_branding, allow_data_export, allow_advanced_audit_logs)
VALUES
    ('free_trial', 'Free / Trial', 'Perfect for small exploratory teams and initial proof-of-concept projects.', 14, 0, 0, 5, 2, 3, 524288000, false, false, true, false),
    ('starter', 'Starter', 'Designed for growing teams needing structured workspaces and higher board allowances.', 14, 2900, 29000, 15, 5, 20, 10737418240, true, false, true, false),
    ('professional', 'Professional', 'For modern enterprises needing unlimited boards, custom branding, and audit logging.', 14, 7900, 79000, 100, 25, 999999, 107374182400, true, true, true, true),
    ('enterprise', 'Enterprise', 'Dedicated cloud tenancy, custom contracts, highest tier SLAs, and unlimited capacity.', 30, 24900, 249000, 999999, 999999, 999999, 1099511627776, true, true, true, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    max_members = EXCLUDED.max_members,
    max_workspaces = EXCLUDED.max_workspaces,
    max_boards = EXCLUDED.max_boards,
    storage_allowance_bytes = EXCLUDED.storage_allowance_bytes,
    allow_guest_access = EXCLUDED.allow_guest_access,
    allow_custom_branding = EXCLUDED.allow_custom_branding;
