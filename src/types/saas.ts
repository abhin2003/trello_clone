export type UserRole = 'owner' | 'admin' | 'member' | 'guest';

export type OrgStatus = 'active' | 'trial' | 'past_due' | 'suspended' | 'archived';

export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export type WorkspaceVisibility = 'private' | 'team' | 'organisation';

export type SubscriptionPlanId = 'free_trial' | 'starter' | 'professional' | 'enterprise';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  description: string;
  isActive: boolean;
  trialDays: number;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  maxMembers: number;
  maxWorkspaces: number;
  maxBoards: number;
  storageAllowanceBytes: number;
  maxAutomationsPerMonth: number;
  allowGuestAccess: boolean;
  allowCustomBranding: boolean;
  allowDataExport: boolean;
  allowAdvancedAuditLogs: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatarColor: string;
  isPlatformAdmin?: boolean;
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  joinCode?: string;
  logoUrl?: string;
  primaryColor: string;
  status: OrgStatus;
  statusReason?: string;
  planId: SubscriptionPlanId;
  trialEndsAt?: string;
  billingEmail?: string;
  billingCustomerId?: string;
  usedStorageBytes: number;
  allowedEmailDomain?: string;
  enforceAdminInvitesOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganisationMember {
  id: string;
  organisationId: string;
  userId: string;
  role: UserRole;
  jobTitle?: string;
  isActive: boolean;
  invitedBy?: string;
  joinedAt: string;
  user: UserProfile;
}

export interface OrganisationInvitation {
  id: string;
  organisationId: string;
  orgName?: string;
  email: string;
  role: UserRole;
  token: string;
  status: InviteStatus;
  invitedBy: string;
  invitedByName?: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
}

export interface Workspace {
  id: string;
  organisationId: string;
  name: string;
  slug: string;
  description?: string;
  visibility: WorkspaceVisibility;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  boardCount?: number;
  allowedMemberIds?: string[];
}

export interface Team {
  id: string;
  organisationId: string;
  name: string;
  description?: string;
  memberCount?: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organisationId: string;
  actorId?: string;
  actorName?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface PlatformAdminUser {
  userId: string;
  email: string;
  fullName: string;
  canManageBilling: boolean;
  canSuspendTenants: boolean;
  createdAt: string;
}

export interface SupportAccessSession {
  id: string;
  organisationId: string;
  orgName?: string;
  platformAdminId: string;
  authorizedByOrgUser?: string;
  reason: string;
  ticketReference: string;
  status: 'pending' | 'active' | 'expired' | 'revoked';
  expiresAt: string;
  createdAt: string;
}

export interface TenantUsageStats {
  totalMembers: number;
  maxMembers: number;
  totalWorkspaces: number;
  maxWorkspaces: number;
  totalBoards: number;
  maxBoards: number;
  usedStorageBytes: number;
  maxStorageBytes: number;
  plan: SubscriptionPlan;
  isBoardLimitReached: boolean;
  isMemberLimitReached: boolean;
  isWorkspaceLimitReached: boolean;
}
