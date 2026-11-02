-- ============================================================================
-- STRATCREST FLOW: AUTHENTICATION & MULTI-TENANT PROFILES MIGRATION
-- Compatible with Supabase Auth (auth.users) and PostgreSQL 15+
-- ============================================================================

-- 1. Create Profiles Table (Linked to auth.users)
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 2. Trigger on auth.users to automatically insert into profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_name TEXT;
    v_initials TEXT;
BEGIN
    v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
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

-- 3. Update Organisation Members RLS
DROP POLICY IF EXISTS "Users can view memberships of their organisations" ON organisation_members;
CREATE POLICY "Users can view memberships of their organisations"
ON organisation_members FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_org_member(organisation_id) OR is_platform_admin());

DROP POLICY IF EXISTS "Admins can manage organisation members" ON organisation_members;
CREATE POLICY "Admins can manage organisation members"
ON organisation_members FOR ALL
TO authenticated
USING (is_org_admin(organisation_id) OR is_platform_admin());

-- 4. Update Organisations RLS
DROP POLICY IF EXISTS "Members or platform admins can view organisations" ON organisations;
CREATE POLICY "Members or platform admins can view organisations"
ON organisations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM organisation_members om 
        WHERE om.organisation_id = organisations.id 
          AND om.user_id = auth.uid() 
          AND om.is_active = true
    ) 
    OR is_platform_admin()
);

-- 5. Helper Function: Create Organisation with Owner
CREATE OR REPLACE FUNCTION create_organisation_with_owner(
    org_name TEXT,
    org_slug TEXT,
    plan_id TEXT DEFAULT 'free_trial'
)
RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO organisations (name, slug, plan_id, status)
    VALUES (org_name, org_slug, plan_id, 'active')
    RETURNING id INTO new_org_id;

    INSERT INTO organisation_members (organisation_id, user_id, role, job_title, is_active)
    VALUES (new_org_id, v_user_id, 'owner', 'Founder & Owner', true);

    -- Create default workspace
    INSERT INTO workspaces (organisation_id, name, slug, description, visibility, created_by)
    VALUES (new_org_id, 'General Workspace', 'general', 'Default workspace', 'organisation', v_user_id);

    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Helper Function: Claim Invitation Token
CREATE OR REPLACE FUNCTION accept_invitation_token(invite_token TEXT)
RETURNS JSONB AS $$
DECLARE
    v_invite RECORD;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_invite
    FROM organisation_invitations
    WHERE token = invite_token AND status = 'pending' AND expires_at > timezone('utc', now());

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation token');
    END IF;

    -- Add user as member
    INSERT INTO organisation_members (organisation_id, user_id, role, is_active)
    VALUES (v_invite.organisation_id, v_user_id, v_invite.role, true)
    ON CONFLICT (organisation_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_active = true;

    -- Mark invitation as accepted
    UPDATE organisation_invitations
    SET status = 'accepted', accepted_at = timezone('utc', now())
    WHERE id = v_invite.id;

    RETURN jsonb_build_object('success', true, 'organisation_id', v_invite.organisation_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
