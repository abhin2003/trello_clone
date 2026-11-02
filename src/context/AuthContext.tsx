import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { UserProfile, Organisation, UserRole } from '../types/saas';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { authService, type UserOrgMembership } from '../services/authService';
import { tenantService } from '../services/tenantService';

export type AuthScreen =
  | 'login'
  | 'register'
  | 'forgot_password'
  | 'reset_password'
  | 'select_org'
  | 'no_org'
  | 'authenticated';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authScreen: AuthScreen;
  memberships: UserOrgMembership[];
  activeOrg: Organisation | null;
  activeRole: UserRole | null;
  authError: string | null;

  setAuthScreen: (screen: AuthScreen) => void;
  setAuthError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; requiresVerification?: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  selectOrganisation: (orgId: string) => void;
  createOrganisation: (orgName: string, planId?: string) => Promise<{ success: boolean; error?: string }>;
  claimInvitation: (token: string) => Promise<{ success: boolean; error?: string }>;
  refreshMemberships: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_ORG_STORAGE_KEY = 'stratcrest_active_org_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [memberships, setMemberships] = useState<UserOrgMembership[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organisation | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check URL hash/params for password recovery token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('access_token=')) {
        setAuthScreen('reset_password');
      }
    }
  }, []);

  const evaluateOrgNavigation = useCallback(
    (userMemberships: UserOrgMembership[]) => {
      if (userMemberships.length === 0) {
        // User is authenticated but has no organisation
        setAuthScreen('no_org');
        setActiveOrg(null);
        setActiveRole(null);
        return;
      }

      if (userMemberships.length === 1) {
        // Single organisation: automatically enter
        const single = userMemberships[0];
        setActiveOrg(single.organisation);
        setActiveRole(single.role);
        tenantService.setActiveOrgId(single.organisation.id);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, single.organisation.id);
        }
        setAuthScreen('authenticated');
        return;
      }

      // Multiple organisations: check if user previously chose one during this session
      const savedOrgId = typeof localStorage !== 'undefined' ? localStorage.getItem(ACTIVE_ORG_STORAGE_KEY) : null;
      const matched = userMemberships.find((m) => m.organisation.id === savedOrgId);

      if (matched) {
        setActiveOrg(matched.organisation);
        setActiveRole(matched.role);
        tenantService.setActiveOrgId(matched.organisation.id);
        setAuthScreen('authenticated');
      } else {
        // Display organisation selection screen
        setAuthScreen('select_org');
      }
    },
    []
  );

  const syncUserSession = useCallback(
    async (currentSession: Session | null) => {
      setLoading(true);
      if (!currentSession || !currentSession.user) {
        setSession(null);
        setUser(null);
        setUserProfile(null);
        setMemberships([]);
        setActiveOrg(null);
        setActiveRole(null);
        setAuthScreen((prev) => (prev === 'reset_password' ? 'reset_password' : 'login'));
        setLoading(false);
        return;
      }

      const currentUser = currentSession.user;
      setSession(currentSession);
      setUser(currentUser);

      // Fetch Profile
      const profile = await authService.fetchUserProfile(currentUser);
      setUserProfile(profile);
      tenantService.setCurrentUser(profile);

      // Fetch Memberships from database
      const userMemberships = await authService.fetchUserOrganisations(currentUser.id);
      setMemberships(userMemberships);

      // Evaluate whether to go to single org, multi-org select, or no-org
      evaluateOrgNavigation(userMemberships);
      setLoading(false);
    },
    [evaluateOrgNavigation]
  );

  // Initialize Auth state listener
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const client = getSupabaseClient();

    // 1. Get initial session
    client.auth.getSession().then(({ data }) => {
      syncUserSession(data.session);
    });

    // 2. Listen for auth state changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthScreen('reset_password');
        setSession(newSession);
        setUser(newSession?.user || null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setUserProfile(null);
        setMemberships([]);
        setActiveOrg(null);
        setActiveRole(null);
        setAuthScreen('login');
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
        }
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        await syncUserSession(newSession);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncUserSession]);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    const res = await authService.signIn(email, password);
    if (res.error) {
      setAuthError(res.error);
      return { success: false, error: res.error };
    }
    await syncUserSession(res.session);
    return { success: true };
  };

  const register = async (fullName: string, email: string, password: string) => {
    setAuthError(null);
    const res = await authService.signUp(fullName, email, password);
    if (res.error) {
      setAuthError(res.error);
      return { success: false, error: res.error };
    }
    if (res.session) {
      await syncUserSession(res.session);
    }
    return { success: true, requiresVerification: res.requiresVerification };
  };

  const sendPasswordReset = async (email: string) => {
    setAuthError(null);
    const res = await authService.sendPasswordResetEmail(email);
    if (res.error) {
      setAuthError(res.error);
      return { success: false, error: res.error };
    }
    return { success: true };
  };

  const resetPassword = async (newPassword: string) => {
    setAuthError(null);
    const res = await authService.updatePassword(newPassword);
    if (res.error) {
      setAuthError(res.error);
      return { success: false, error: res.error };
    }
    // After password reset, fetch current session and redirect to organization check
    const client = getSupabaseClient();
    const { data } = await client.auth.getSession();
    await syncUserSession(data.session);
    return { success: true };
  };

  const logout = async () => {
    setLoading(true);
    await authService.signOut();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
    }
    setSession(null);
    setUser(null);
    setUserProfile(null);
    setMemberships([]);
    setActiveOrg(null);
    setActiveRole(null);
    setAuthScreen('login');
    setLoading(false);
  };

  const selectOrganisation = (orgId: string) => {
    const chosen = memberships.find((m) => m.organisation.id === orgId);
    if (!chosen) {
      console.error('[AuthContext] Attempted to select unauthorized organisation:', orgId);
      return;
    }
    setActiveOrg(chosen.organisation);
    setActiveRole(chosen.role);
    tenantService.setActiveOrgId(chosen.organisation.id);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, chosen.organisation.id);
    }
    setAuthScreen('authenticated');
  };

  const refreshMemberships = async () => {
    if (!user) return;
    const updated = await authService.fetchUserOrganisations(user.id);
    setMemberships(updated);
    evaluateOrgNavigation(updated);
  };

  const createOrganisation = async (orgName: string, planId: string = 'free_trial') => {
    const res = await authService.createOrganisation(orgName, planId);
    if (res.success && res.organisationId) {
      await refreshMemberships();
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to create organisation' };
  };

  const claimInvitation = async (token: string) => {
    const res = await authService.claimInvitationToken(token);
    if (res.success && res.organisationId) {
      await refreshMemberships();
      return { success: true };
    }
    return { success: false, error: res.error || 'Invalid invitation code' };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userProfile,
        loading,
        authScreen,
        memberships,
        activeOrg,
        activeRole,
        authError,
        setAuthScreen,
        setAuthError,
        login,
        register,
        sendPasswordReset,
        resetPassword,
        logout,
        selectOrganisation,
        createOrganisation,
        claimInvitation,
        refreshMemberships,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
