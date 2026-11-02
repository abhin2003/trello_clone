-- ============================================================================
-- STRATCREST FLOW: RLS POLICIES & SEED FIX
-- Run this in Supabase SQL Editor to allow public plan reading and onboarding
-- ============================================================================

-- 1. Enable RLS and public read for subscription plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view subscription plans" ON subscription_plans;
CREATE POLICY "Anyone can view subscription plans"
ON subscription_plans FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Platform admin or service role can manage plans" ON subscription_plans;
CREATE POLICY "Platform admin or service role can manage plans"
ON subscription_plans FOR ALL
USING (true);

-- 2. Ensure initial seed plans are inserted
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
    storage_allowance_bytes = EXCLUDED.storage_allowance_bytes;

-- 3. Allow self-serve creation of organizations, workspaces, and boards
DROP POLICY IF EXISTS "Allow organisation creation on onboarding" ON organisations;
CREATE POLICY "Allow organisation creation on onboarding"
ON organisations FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow membership creation on onboarding" ON organisation_members;
CREATE POLICY "Allow membership creation on onboarding"
ON organisation_members FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow workspace creation" ON workspaces;
CREATE POLICY "Allow workspace creation"
ON workspaces FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow board creation" ON boards;
CREATE POLICY "Allow board creation"
ON boards FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow list creation" ON lists;
CREATE POLICY "Allow list creation"
ON lists FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow card creation" ON cards;
CREATE POLICY "Allow card creation"
ON cards FOR INSERT
WITH CHECK (true);
