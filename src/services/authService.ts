import { getSupabaseClient, isSupabaseConfigured, isSupabaseAuthEnabled } from '../lib/supabase';
import { tenantService } from './tenantService';
import type { UserProfile, Organisation, UserRole } from '../types/saas';
import type { Session, User } from '@supabase/supabase-js';

export interface UserOrgMembership {
  organisation: Organisation;
  role: UserRole;
  jobTitle?: string;
}

const MOCK_SESSION_STORAGE_KEY = 'stratcrest_mock_user_session_v1';

export const getMockSession = (): Session | null => {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(MOCK_SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveMockSession = (session: Session | null): void => {
  if (typeof localStorage === 'undefined') return;
  if (session) {
    localStorage.setItem(MOCK_SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
  }
};

export class AuthService {
  /**
   * Helper to retrieve mock session from localStorage in bypass mode
   */
  getMockSession(): Session | null {
    return getMockSession();
  }

  /**
   * Helper to persist or clear mock session in localStorage
   */
  saveMockSession(session: Session | null): void {
    saveMockSession(session);
  }

  /**
   * Get active Supabase session (or mock session when auth is disabled)
   */
  async getSession(): Promise<Session | null> {
    if (!isSupabaseAuthEnabled()) {
      return this.getMockSession();
    }

    if (!isSupabaseConfigured()) return null;
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getSession();
    if (error) {
      console.warn('[AuthService] Error fetching session:', error.message);
      return null;
    }
    return data.session;
  }

  /**
   * Log in with Email and Password
   */
  async signIn(email: string, password: string): Promise<{ session: Session | null; user: User | null; error?: string }> {
    if (!isSupabaseAuthEnabled()) {
      const cleanEmail = email.trim().toLowerCase();
      const defaultName = cleanEmail === 'abhinskrishna3@gmail.com'
        ? 'Abhin Krishna'
        : cleanEmail.split('@')[0].charAt(0).toUpperCase() + cleanEmail.split('@')[0].slice(1);

      const userId = `user-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`;
      const isPlatformAdmin = cleanEmail === 'admin@stratcrest.io' || cleanEmail.includes('platform-admin');

      const mockUser: User = {
        id: userId,
        app_metadata: {},
        user_metadata: {
          full_name: defaultName,
          is_platform_admin: isPlatformAdmin,
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: cleanEmail,
      } as any;

      const mockSession: Session = {
        access_token: 'mock-test-token-' + Date.now(),
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      } as any;

      this.saveMockSession(mockSession);

      tenantService.setCurrentUser({
        id: userId,
        email: cleanEmail,
        name: defaultName,
        initials: defaultName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U',
        avatarColor: '#3b82f6',
        isPlatformAdmin,
      });

      return { session: mockSession, user: mockUser };
    }

    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { session: null, user: null, error: error.message };
    }

    return { session: data.session, user: data.user };
  }

  /**
   * Register with Full Name, Email, and Password
   */
  async signUp(
    fullName: string,
    email: string,
    password: string
  ): Promise<{ user: User | null; session: Session | null; requiresVerification: boolean; error?: string }> {
    if (!isSupabaseAuthEnabled()) {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim() || cleanEmail.split('@')[0];
      const userId = `user-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`;
      const isPlatformAdmin = cleanEmail.includes('admin');

      const mockUser: User = {
        id: userId,
        app_metadata: {},
        user_metadata: {
          full_name: cleanName,
          is_platform_admin: isPlatformAdmin,
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: cleanEmail,
      } as any;

      const mockSession: Session = {
        access_token: 'mock-test-token-' + Date.now(),
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      } as any;

      this.saveMockSession(mockSession);

      tenantService.setCurrentUser({
        id: userId,
        email: cleanEmail,
        name: cleanName,
        initials: cleanName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U',
        avatarColor: '#10b981',
        isPlatformAdmin,
      });

      return { user: mockUser, session: mockSession, requiresVerification: false };
    }

    const client = getSupabaseClient();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
        },
      },
    });

    if (error) {
      return { user: null, session: null, requiresVerification: false, error: error.message };
    }

    // Also attempt upsert into profiles directly in case trigger is delayed or not yet configured
    if (data.user) {
      const initials = cleanName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || cleanName.slice(0, 2).toUpperCase() || 'U';

      try {
        await client.from('profiles').upsert(
          {
            id: data.user.id,
            email: cleanEmail,
            name: cleanName,
            initials,
            avatar_color: '#3b82f6',
            is_platform_admin: false,
          },
          { onConflict: 'id' }
        );
      } catch (err) {
        console.warn('[AuthService] Direct profile upsert notice:', err);
      }
    }

    // If session is null but user is present, email confirmation is enabled in Supabase
    const requiresVerification = Boolean(data.user && !data.session);

    return {
      user: data.user,
      session: data.session,
      requiresVerification,
    };
  }

  /**
   * Send Password Recovery Email
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseAuthEnabled()) {
      return { success: true };
    }

    const client = getSupabaseClient();
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}#type=recovery` : undefined;

    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Update Password (for Password Reset flow)
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseAuthEnabled()) {
      return { success: true };
    }

    const client = getSupabaseClient();
    const { error } = await client.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Sign Out
   */
  async signOut(): Promise<void> {
    if (!isSupabaseAuthEnabled()) {
      this.saveMockSession(null);
      return;
    }

    const client = getSupabaseClient();
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('[AuthService] SignOut error:', e);
    }
  }

  /**
   * Fetch user profile
   */
  async fetchUserProfile(user: User): Promise<UserProfile> {
    const defaultName = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'User';
    const initials = defaultName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || defaultName.slice(0, 2).toUpperCase() || 'U';

    const fallbackProfile: UserProfile = {
      id: user.id,
      email: user.email || '',
      name: defaultName,
      initials,
      avatarColor: '#3b82f6',
      isPlatformAdmin: Boolean(user.user_metadata?.is_platform_admin),
    };

    if (!isSupabaseAuthEnabled()) {
      return fallbackProfile;
    }

    const client = getSupabaseClient();
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email || user.email || '',
          name: data.name || defaultName,
          initials: data.initials || initials,
          avatarColor: data.avatar_color || '#3b82f6',
          isPlatformAdmin: data.is_platform_admin || fallbackProfile.isPlatformAdmin || false,
        };
      }
    } catch (err) {
      console.warn('[AuthService] Profile query fallback:', err);
    }

    return fallbackProfile;
  }

  /**
   * Fetch all organisations the user belongs to
   */
  async fetchUserOrganisations(userId: string): Promise<UserOrgMembership[]> {
    if (!isSupabaseAuthEnabled()) {
      const orgs = tenantService.getUserOrganisations(userId);
      return orgs.map((o) => ({
        organisation: o,
        role: o.userRole,
        jobTitle: o.userRole === 'owner' ? 'Founder & Owner' : 'Team Member',
      }));
    }

    const client = getSupabaseClient();
    const results: UserOrgMembership[] = [];

    try {
      // Query organisation_members table joined with organisations
      const { data, error } = await client
        .from('organisation_members')
        .select(`
          id,
          role,
          job_title,
          is_active,
          organisation_id,
          organisations (
            id,
            name,
            slug,
            logo_url,
            primary_color,
            status,
            status_reason,
            plan_id,
            used_storage_bytes,
            allowed_email_domain,
            enforce_admin_invites_only,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.warn('[AuthService] Memberships query notice:', error.message);
        return [];
      }

      if (data && Array.isArray(data)) {
        for (const item of data) {
          const org = item.organisations as any;
          if (org) {
            results.push({
              organisation: {
                id: org.id,
                name: org.name,
                slug: org.slug,
                logoUrl: org.logo_url || '',
                primaryColor: org.primary_color || '#3b82f6',
                status: org.status || 'active',
                statusReason: org.status_reason || undefined,
                planId: org.plan_id || 'free_trial',
                usedStorageBytes: org.used_storage_bytes || 0,
                allowedEmailDomain: org.allowed_email_domain || undefined,
                enforceAdminInvitesOnly: org.enforce_admin_invites_only ?? true,
                createdAt: org.created_at,
                updatedAt: org.updated_at,
              },
              role: (item.role as UserRole) || 'member',
              jobTitle: item.job_title || undefined,
            });
          }
        }
      }
    } catch (err) {
      console.error('[AuthService] Failed to fetch user organisations:', err);
    }

    return results;
  }

  /**
   * Create a new organization and assign the user as owner
   */
  async createOrganisation(
    orgName: string,
    planId: string = 'free_trial'
  ): Promise<{ success: boolean; organisationId?: string; organisation?: Organisation; error?: string }> {
    if (!isSupabaseAuthEnabled()) {
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const newOrg = tenantService.createOrganisationSelfServe({
        name: orgName.trim(),
        slug: slug || 'my-org',
        planId: planId as any,
        firstWorkspaceName: 'General Workspace',
      });
      return { success: true, organisationId: newOrg.id, organisation: newOrg };
    }

    const client = getSupabaseClient();
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // Try RPC first
    try {
      const { data, error: rpcErr } = await client.rpc('create_organisation_with_owner', {
        org_name: orgName.trim(),
        org_slug: slug,
        plan_id: planId,
      });

      if (!rpcErr && data) {
        return { success: true, organisationId: data };
      }
    } catch {
      // Fallback to table inserts
    }

    // Direct table insert fallback
    try {
      const { data: userRes } = await client.auth.getUser();
      if (!userRes.user) return { success: false, error: 'User is not authenticated' };

      const rawPrefix = orgName.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'ORG';
      const joinCode = `${rawPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: orgData, error: orgErr } = await client
        .from('organisations')
        .insert({
          name: orgName.trim(),
          slug,
          join_code: joinCode,
          plan_id: planId,
          status: 'active',
        })
        .select('id')
        .single();

      if (orgErr) return { success: false, error: orgErr.message };

      const orgId = orgData.id;

      // Add user as owner
      const { error: memErr } = await client.from('organisation_members').insert({
        organisation_id: orgId,
        user_id: userRes.user.id,
        role: 'owner',
        job_title: 'Founder & Owner',
        is_active: true,
      });

      if (memErr) return { success: false, error: memErr.message };

      // Create default workspace
      await client.from('workspaces').insert({
        organisation_id: orgId,
        name: 'General Workspace',
        slug: 'general',
        description: 'Default team workspace',
        visibility: 'organisation',
        created_by: userRes.user.id,
      });

      return { success: true, organisationId: orgId };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to create organisation' };
    }
  }

  /**
   * Claim an invitation token
   */
  async claimInvitationToken(token: string): Promise<{ success: boolean; organisationId?: string; organisation?: Organisation; error?: string }> {
    if (!isSupabaseAuthEnabled()) {
      try {
        const res = tenantService.acceptInvitation(token.trim());
        return { success: true, organisationId: res.organisationId, organisation: res.organisation };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to claim invitation token' };
      }
    }

    const client = getSupabaseClient();
    const cleanToken = token.trim();

    try {
      const { data, error } = await client.rpc('accept_invitation_token', {
        invite_token: cleanToken,
      });

      if (!error && data) {
        if (data.success) {
          return { success: true, organisationId: data.organisation_id };
        } else {
          return { success: false, error: data.error || 'Failed to claim invitation.' };
        }
      }
    } catch {
      // Fallback
    }

    return { success: false, error: 'Could not validate invitation token with server.' };
  }

  /**
   * Claim an organisation joining code (e.g. ACME-2026)
   */
  async claimJoinCode(code: string): Promise<{ success: boolean; organisationId?: string; organisation?: Organisation; error?: string }> {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: 'Please enter a valid organisation joining code.' };
    }

    try {
      const org = tenantService.findOrgByJoinCode(cleanCode);
      if (!org) {
        return { success: false, error: `Invalid organisation joining code "${cleanCode}". Please verify with your owner.` };
      }
      const res = tenantService.joinWithCode(cleanCode);
      return { success: true, organisationId: res.organisation.id, organisation: res.organisation };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to join organisation with code.' };
    }
  }

  /**
   * Directly join an organisation (e.g. Acme Corp Demo)
   */
  async joinOrganisation(
    orgId: string,
    role: UserRole = 'member'
  ): Promise<{ success: boolean; organisation?: Organisation; error?: string }> {
    if (!isSupabaseAuthEnabled()) {
      try {
        const res = tenantService.joinOrganisation(orgId, role);
        return { success: true, organisation: res.organisation };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to join organisation' };
      }
    }
    return { success: false, error: 'Direct joining without invite is not supported with Supabase.' };
  }
}

export const authService = new AuthService();
