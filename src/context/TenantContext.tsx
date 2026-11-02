import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Organisation,
  OrganisationMember,
  OrganisationInvitation,
  Workspace,
  SubscriptionPlan,
  SubscriptionPlanId,
  TenantUsageStats,
  UserProfile,
  UserRole,
  AuditLog,
} from '../types/saas';
import { tenantService } from '../services/tenantService';
import { isSupabaseConfigured } from '../lib/supabase';

interface TenantContextType {
  currentUser: UserProfile;
  activeOrg: Organisation;
  userOrgs: (Organisation & { userRole: UserRole })[];
  userRole: UserRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isGuest: boolean;
  isPlatformAdmin: boolean;
  isSuspended: boolean;
  
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | null;
  setActiveWorkspaceId: (id: string | null) => void;

  members: OrganisationMember[];
  invitations: OrganisationInvitation[];
  plans: SubscriptionPlan[];
  usageStats: TenantUsageStats;
  auditLogs: AuditLog[];

  // Tenant Operations
  switchOrganisation: (orgId: string) => void;
  updateOrg: (updates: Partial<Organisation>) => void;
  inviteMember: (email: string, role: UserRole, jobTitle?: string) => void;
  revokeInvite: (inviteId: string) => void;
  acceptInvite: (token: string) => void;
  updateMemberRole: (memberId: string, newRole: UserRole) => void;
  removeMember: (memberId: string) => void;
  createWorkspace: (name: string, description: string, visibility?: 'private' | 'team' | 'organisation') => Workspace;
  upgradePlan: (planId: SubscriptionPlanId) => void;
  exportOrgData: () => void;
  refreshTenantState: () => void;

  // Modals
  isOrgAdminOpen: boolean;
  setIsOrgAdminOpen: (open: boolean) => void;
  isPlatformAdminOpen: boolean;
  setIsPlatformAdminOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;
  // Supabase Integration
  isSupabaseModalOpen: boolean;
  setIsSupabaseModalOpen: (open: boolean) => void;
  isSupabaseActive: boolean;
  allOrganisations: Organisation[];
  quotaWarning: string | null;
  setQuotaWarning: (msg: string | null) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Trigger state refresh
  const [refreshIndex, setRefreshIndex] = useState(0);
  const refreshTenantState = useCallback(() => {
    setRefreshIndex(prev => prev + 1);
  }, []);

  const currentUser = useMemo(() => tenantService.getCurrentUser(), [refreshIndex]);
  const [activeOrgId, setActiveOrgId] = useState<string>(() => tenantService.getActiveOrgId());
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // Modals state
  const [isOrgAdminOpen, setIsOrgAdminOpen] = useState(false);
  const [isPlatformAdminOpen, setIsPlatformAdminOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);

  const activeOrg = useMemo(() => {
    return tenantService.getActiveOrganisation();
  }, [activeOrgId, refreshIndex]);

  const allOrganisations = useMemo(() => {
    return tenantService.getAllOrganisations();
  }, [refreshIndex]);

  const isSupabaseActive = isSupabaseConfigured();

  const userOrgs = useMemo(() => {
    return tenantService.getUserOrganisations(currentUser.id);
  }, [currentUser.id, refreshIndex]);

  const userRole = useMemo(() => {
    return tenantService.getCurrentUserRole(activeOrg.id);
  }, [activeOrg.id, refreshIndex]);

  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'owner' || userRole === 'admin';
  const isMember = userRole === 'member';
  const isGuest = userRole === 'guest';
  const isPlatformAdmin = Boolean(currentUser.isPlatformAdmin);
  const isSuspended = activeOrg.status === 'suspended';

  const workspaces = useMemo(() => {
    return tenantService.getWorkspaces(activeOrg.id);
  }, [activeOrg.id, refreshIndex]);

  // Set default workspace if none selected
  useEffect(() => {
    if (!activeWorkspaceId && workspaces.length > 0) {
      setActiveWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId]);

  const activeWorkspace = useMemo(() => {
    return workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || null;
  }, [workspaces, activeWorkspaceId]);

  const members = useMemo(() => {
    return tenantService.getMembers(activeOrg.id);
  }, [activeOrg.id, refreshIndex]);

  const invitations = useMemo(() => {
    return tenantService.getInvitations(activeOrg.id);
  }, [activeOrg.id, refreshIndex]);

  const plans = useMemo(() => {
    return tenantService.getSubscriptionPlans();
  }, [refreshIndex]);

  const usageStats = useMemo(() => {
    return tenantService.getUsageStats(activeOrg.id);
  }, [activeOrg.id, refreshIndex]);

  const auditLogs = useMemo(() => {
    return tenantService.getAuditLogs(activeOrg.id);
  }, [activeOrg.id, refreshIndex]);

  // Tenant Actions
  const switchOrganisation = (orgId: string) => {
    tenantService.setActiveOrgId(orgId);
    setActiveOrgId(orgId);
    setActiveWorkspaceId(null);
    refreshTenantState();
  };

  const updateOrg = (updates: Partial<Organisation>) => {
    tenantService.updateOrganisation(activeOrg.id, updates);
    refreshTenantState();
  };

  const inviteMember = (email: string, role: UserRole, jobTitle?: string) => {
    try {
      tenantService.inviteMember(activeOrg.id, email, role, jobTitle);
      refreshTenantState();
    } catch (err: any) {
      setQuotaWarning(err.message);
      setIsUpgradeModalOpen(true);
      throw err;
    }
  };

  const revokeInvite = (inviteId: string) => {
    tenantService.revokeInvitation(inviteId);
    refreshTenantState();
  };

  const acceptInvite = (token: string) => {
    const res = tenantService.acceptInvitation(token);
    setActiveOrgId(res.organisationId);
    refreshTenantState();
  };

  const updateMemberRole = (memberId: string, newRole: UserRole) => {
    tenantService.updateMemberRole(activeOrg.id, memberId, newRole);
    refreshTenantState();
  };

  const removeMember = (memberId: string) => {
    tenantService.removeMember(activeOrg.id, memberId);
    refreshTenantState();
  };

  const createWorkspace = (
    name: string,
    description: string,
    visibility: 'private' | 'team' | 'organisation' = 'organisation'
  ): Workspace => {
    try {
      const ws = tenantService.createWorkspace(activeOrg.id, name, description, visibility);
      setActiveWorkspaceId(ws.id);
      refreshTenantState();
      return ws;
    } catch (err: any) {
      setQuotaWarning(err.message);
      setIsUpgradeModalOpen(true);
      throw err;
    }
  };

  const upgradePlan = (planId: SubscriptionPlanId) => {
    tenantService.upgradeOrganisationPlan(activeOrg.id, planId);
    setIsUpgradeModalOpen(false);
    setQuotaWarning(null);
    refreshTenantState();
  };

  const exportOrgData = () => {
    const json = tenantService.exportOrganisationDataJSON(activeOrg.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeOrg.slug}-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TenantContext.Provider
      value={{
        currentUser,
        activeOrg,
        userOrgs,
        userRole,
        isOwner,
        isAdmin,
        isMember,
        isGuest,
        isPlatformAdmin,
        isSuspended,
        workspaces,
        activeWorkspaceId,
        activeWorkspace,
        setActiveWorkspaceId,
        members,
        invitations,
        plans,
        usageStats,
        auditLogs,
        switchOrganisation,
        updateOrg,
        inviteMember,
        revokeInvite,
        acceptInvite,
        updateMemberRole,
        removeMember,
        createWorkspace,
        upgradePlan,
        exportOrgData,
        refreshTenantState,
        isOrgAdminOpen,
        setIsOrgAdminOpen,
        isPlatformAdminOpen,
        setIsPlatformAdminOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        isSupabaseModalOpen,
        setIsSupabaseModalOpen,
        isSupabaseActive,
        allOrganisations,
        quotaWarning,
        setQuotaWarning,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
