import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  Organisation,
  OrganisationMember,
  OrganisationInvitation,
  Workspace,
  SubscriptionPlan,
  SubscriptionPlanId,
  AuditLog,
  SupportAccessSession,
  TenantUsageStats,
  UserProfile,
  UserRole,
} from '../types/saas';

// Storage keys
const SAAS_ORGS_KEY = 'stratcrest_saas_organisations_v1';
const SAAS_MEMBERS_KEY = 'stratcrest_saas_members_v1';
const SAAS_WORKSPACES_KEY = 'stratcrest_saas_workspaces_v1';
const SAAS_INVITES_KEY = 'stratcrest_saas_invitations_v1';
const SAAS_AUDIT_KEY = 'stratcrest_saas_audit_logs_v1';
const SAAS_PLANS_KEY = 'stratcrest_saas_plans_v1';
const SAAS_SUPPORT_KEY = 'stratcrest_saas_support_sessions_v1';
const SAAS_ACTIVE_ORG_KEY = 'stratcrest_saas_active_org_id_v1';

// Initial Plans
export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'free_trial',
    name: 'Free / Trial',
    description: 'Perfect for small exploratory teams and initial proof-of-concept projects.',
    isActive: true,
    trialDays: 14,
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    maxMembers: 5,
    maxWorkspaces: 2,
    maxBoards: 3,
    storageAllowanceBytes: 524288000, // 500 MB
    maxAutomationsPerMonth: 100,
    allowGuestAccess: false,
    allowCustomBranding: false,
    allowDataExport: true,
    allowAdvancedAuditLogs: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Designed for growing teams needing structured workspaces and higher board allowances.',
    isActive: true,
    trialDays: 14,
    monthlyPriceCents: 2900,
    yearlyPriceCents: 29000,
    maxMembers: 15,
    maxWorkspaces: 5,
    maxBoards: 20,
    storageAllowanceBytes: 10737418240, // 10 GB
    maxAutomationsPerMonth: 1000,
    allowGuestAccess: true,
    allowCustomBranding: false,
    allowDataExport: true,
    allowAdvancedAuditLogs: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For modern enterprises needing unlimited boards, custom branding, and audit logging.',
    isActive: true,
    trialDays: 14,
    monthlyPriceCents: 7900,
    yearlyPriceCents: 79000,
    maxMembers: 100,
    maxWorkspaces: 25,
    maxBoards: 999999,
    storageAllowanceBytes: 107374182400, // 100 GB
    maxAutomationsPerMonth: 10000,
    allowGuestAccess: true,
    allowCustomBranding: true,
    allowDataExport: true,
    allowAdvancedAuditLogs: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Dedicated cloud tenancy, custom contracts, highest tier SLAs, and unlimited capacity.',
    isActive: true,
    trialDays: 30,
    monthlyPriceCents: 24900,
    yearlyPriceCents: 249000,
    maxMembers: 999999,
    maxWorkspaces: 999999,
    maxBoards: 999999,
    storageAllowanceBytes: 1099511627776, // 1 TB
    maxAutomationsPerMonth: 100000,
    allowGuestAccess: true,
    allowCustomBranding: true,
    allowDataExport: true,
    allowAdvancedAuditLogs: true,
  },
];

// Current logged in user (Abhinav Patel)
export const CURRENT_USER: UserProfile = {
  id: 'user-abhinav-current',
  email: 'abhinav@stratcrest.com',
  name: 'Abhinav Patel',
  initials: 'AP',
  avatarColor: '#3b82f6',
  isPlatformAdmin: true, // Has Platform Admin privileges
};

// Seed organisations
const INITIAL_ORGS: Organisation[] = [
  {
    id: 'org-acme',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    logoUrl: '',
    primaryColor: '#3b82f6',
    status: 'active',
    planId: 'professional',
    usedStorageBytes: 345000000,
    allowedEmailDomain: 'acme.com',
    enforceAdminInvitesOnly: true,
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'org-technova',
    name: 'TechNova Solutions',
    slug: 'technova-solutions',
    logoUrl: '',
    primaryColor: '#10b981',
    status: 'active',
    planId: 'starter',
    usedStorageBytes: 120000000,
    allowedEmailDomain: '',
    enforceAdminInvitesOnly: false,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'org-stratcrest',
    name: 'Stratcrest Global Labs',
    slug: 'stratcrest-labs',
    logoUrl: '',
    primaryColor: '#8b5cf6',
    status: 'active',
    planId: 'enterprise',
    usedStorageBytes: 1450000000,
    allowedEmailDomain: 'stratcrest.com',
    enforceAdminInvitesOnly: true,
    createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'org-apex-suspended',
    name: 'Apex Legacy Corp (Suspended Demo)',
    slug: 'apex-legacy',
    logoUrl: '',
    primaryColor: '#ef4444',
    status: 'suspended',
    statusReason: 'Suspended by platform administrator due to subscription payment default past 45 days.',
    planId: 'starter',
    usedStorageBytes: 50000000,
    enforceAdminInvitesOnly: true,
    createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Seed Memberships
const INITIAL_MEMBERS: OrganisationMember[] = [
  // Acme Corp Members
  {
    id: 'om-acme-1',
    organisationId: 'org-acme',
    userId: CURRENT_USER.id,
    role: 'owner',
    jobTitle: 'VP of Product Architecture',
    isActive: true,
    joinedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    user: CURRENT_USER,
  },
  {
    id: 'om-acme-2',
    organisationId: 'org-acme',
    userId: 'mem-2',
    role: 'admin',
    jobTitle: 'Lead Product Designer',
    isActive: true,
    joinedAt: new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString(),
    user: {
      id: 'mem-2',
      email: 'elena.rostova@acme.com',
      name: 'Elena Rostova',
      initials: 'ER',
      avatarColor: '#10b981',
    },
  },
  {
    id: 'om-acme-3',
    organisationId: 'org-acme',
    userId: 'mem-3',
    role: 'member',
    jobTitle: 'DevOps & Cloud Lead',
    isActive: true,
    joinedAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
    user: {
      id: 'mem-3',
      email: 'marcus.vance@acme.com',
      name: 'Marcus Vance',
      initials: 'MV',
      avatarColor: '#8b5cf6',
    },
  },
  {
    id: 'om-acme-4',
    organisationId: 'org-acme',
    userId: 'mem-4',
    role: 'member',
    jobTitle: 'Frontend Systems Engineer',
    isActive: true,
    joinedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    user: {
      id: 'mem-4',
      email: 'priya.sharma@acme.com',
      name: 'Priya Sharma',
      initials: 'PS',
      avatarColor: '#f59e0b',
    },
  },
  {
    id: 'om-acme-5',
    organisationId: 'org-acme',
    userId: 'mem-5',
    role: 'member',
    jobTitle: 'Senior Product Manager',
    isActive: true,
    joinedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    user: {
      id: 'mem-5',
      email: 'david.chen@acme.com',
      name: 'David Chen',
      initials: 'DC',
      avatarColor: '#06b6d4',
    },
  },

  // TechNova Solutions Members
  {
    id: 'om-tech-1',
    organisationId: 'org-technova',
    userId: 'user-tech-owner',
    role: 'owner',
    jobTitle: 'Chief Technology Officer',
    isActive: true,
    joinedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    user: {
      id: 'user-tech-owner',
      email: 'sarah.jenkins@technova.io',
      name: 'Sarah Jenkins',
      initials: 'SJ',
      avatarColor: '#ec4899',
    },
  },
  {
    id: 'om-tech-2',
    organisationId: 'org-technova',
    userId: CURRENT_USER.id,
    role: 'admin',
    jobTitle: 'Technical Advisor',
    isActive: true,
    joinedAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    user: CURRENT_USER,
  },
  {
    id: 'om-tech-3',
    organisationId: 'org-technova',
    userId: 'user-tech-alex',
    role: 'member',
    jobTitle: 'Full-Stack Developer',
    isActive: true,
    joinedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    user: {
      id: 'user-tech-alex',
      email: 'alex.rivera@technova.io',
      name: 'Alex Rivera',
      initials: 'AR',
      avatarColor: '#14b8a6',
    },
  },
  {
    id: 'om-tech-4',
    organisationId: 'org-technova',
    userId: 'user-tech-liam',
    role: 'guest',
    jobTitle: 'Contract UI Designer',
    isActive: true,
    joinedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    user: {
      id: 'user-tech-liam',
      email: 'liam.tanaka@contractor.io',
      name: 'Liam Tanaka',
      initials: 'LT',
      avatarColor: '#f97316',
    },
  },

  // Stratcrest Labs Members
  {
    id: 'om-strat-1',
    organisationId: 'org-stratcrest',
    userId: 'user-strat-owner',
    role: 'owner',
    jobTitle: 'Director of AI & Systems',
    isActive: true,
    joinedAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    user: {
      id: 'user-strat-owner',
      email: 'aris.thorne@stratcrest.com',
      name: 'Dr. Aris Thorne',
      initials: 'AT',
      avatarColor: '#6366f1',
    },
  },
  {
    id: 'om-strat-2',
    organisationId: 'org-stratcrest',
    userId: CURRENT_USER.id,
    role: 'member',
    jobTitle: 'Senior Research Fellow',
    isActive: true,
    joinedAt: new Date(Date.now() - 80 * 24 * 3600 * 1000).toISOString(),
    user: CURRENT_USER,
  },

  // Apex Legacy Corp Members (Suspended)
  {
    id: 'om-apex-1',
    organisationId: 'org-apex-suspended',
    userId: CURRENT_USER.id,
    role: 'owner',
    jobTitle: 'Former IT Admin',
    isActive: true,
    joinedAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
    user: CURRENT_USER,
  },
];

// Seed Workspaces
const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-acme-eng',
    organisationId: 'org-acme',
    name: 'Engineering & Product',
    slug: 'eng-product',
    description: 'Core product development, architecture milestones, and sprint pipelines.',
    visibility: 'organisation',
    createdBy: CURRENT_USER.id,
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ws-acme-exec',
    organisationId: 'org-acme',
    name: 'Executive Strategy',
    slug: 'executive-strategy',
    description: 'Quarterly OKRs, budget approvals, and executive steering committee boards.',
    visibility: 'private',
    createdBy: CURRENT_USER.id,
    createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ws-tech-delivery',
    organisationId: 'org-technova',
    name: 'Client Delivery & Agile',
    slug: 'client-delivery',
    description: 'Sprint planning and client deliverable tracking.',
    visibility: 'organisation',
    createdBy: 'user-tech-owner',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ws-strat-ai',
    organisationId: 'org-stratcrest',
    name: 'Quantum AI Research',
    slug: 'quantum-ai',
    description: 'Deep neural network simulations and multi-agent systems research.',
    visibility: 'organisation',
    createdBy: 'user-strat-owner',
    createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Seed Invitations
const INITIAL_INVITATIONS: OrganisationInvitation[] = [
  {
    id: 'inv-1',
    organisationId: 'org-acme',
    orgName: 'Acme Corporation',
    email: 'jordan.bell@acme.com',
    role: 'member',
    token: 'tok-acme-jordan-72819',
    status: 'pending',
    invitedBy: CURRENT_USER.id,
    invitedByName: CURRENT_USER.name,
    expiresAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'inv-2',
    organisationId: 'org-technova',
    orgName: 'TechNova Solutions',
    email: 'contractor.dev@external.io',
    role: 'guest',
    token: 'tok-tech-contractor-91823',
    status: 'pending',
    invitedBy: 'user-tech-owner',
    invitedByName: 'Sarah Jenkins',
    expiresAt: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
];

// Seed Audit Logs
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    organisationId: 'org-acme',
    actorId: CURRENT_USER.id,
    actorName: CURRENT_USER.name,
    action: 'board.created',
    targetType: 'board',
    targetId: 'board-stratcrest-q4',
    metadata: { title: 'Stratcrest Q4 Roadmap', workspace: 'Engineering & Product' },
    ipAddress: '192.168.1.10',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'aud-2',
    organisationId: 'org-acme',
    actorId: CURRENT_USER.id,
    actorName: CURRENT_USER.name,
    action: 'member.invited',
    targetType: 'member',
    targetId: 'jordan.bell@acme.com',
    metadata: { role: 'member', email: 'jordan.bell@acme.com' },
    ipAddress: '192.168.1.10',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'aud-3',
    organisationId: 'org-acme',
    actorId: CURRENT_USER.id,
    actorName: CURRENT_USER.name,
    action: 'plan.upgraded',
    targetType: 'billing',
    targetId: 'professional',
    metadata: { previousPlan: 'starter', newPlan: 'professional' },
    ipAddress: '192.168.1.10',
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'aud-4',
    organisationId: 'org-technova',
    actorId: 'user-tech-owner',
    actorName: 'Sarah Jenkins',
    action: 'workspace.created',
    targetType: 'workspace',
    targetId: 'ws-tech-delivery',
    metadata: { name: 'Client Delivery & Agile' },
    ipAddress: '10.0.0.12',
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
  },
];

// Unique ID generator to prevent timestamp collisions in fast test/creation cycles
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

// Service Class
class MultiTenantService {
  private organisations: Organisation[];
  private members: OrganisationMember[];
  private workspaces: Workspace[];
  private invitations: OrganisationInvitation[];
  private auditLogs: AuditLog[];
  private plans: SubscriptionPlan[];
  private supportSessions: SupportAccessSession[];
  private activeOrgId: string;
  private currentUser: UserProfile = CURRENT_USER;

  constructor() {
    this.organisations = this.load(SAAS_ORGS_KEY, INITIAL_ORGS);
    this.members = this.load(SAAS_MEMBERS_KEY, INITIAL_MEMBERS);
    this.workspaces = this.load(SAAS_WORKSPACES_KEY, INITIAL_WORKSPACES);
    this.invitations = this.load(SAAS_INVITES_KEY, INITIAL_INVITIES);
    this.auditLogs = this.load(SAAS_AUDIT_KEY, INITIAL_AUDIT_LOGS);
    this.plans = this.load(SAAS_PLANS_KEY, INITIAL_PLANS);
    this.supportSessions = this.load(SAAS_SUPPORT_KEY, []);
    
    // Default active org
    const savedActive = typeof localStorage !== 'undefined' ? localStorage.getItem(SAAS_ACTIVE_ORG_KEY) : null;
    this.activeOrgId = savedActive && this.organisations.some(o => o.id === savedActive)
      ? savedActive
      : 'org-acme';

    if (isSupabaseConfigured()) {
      console.info('[Supabase] Active connection detected. Multi-tenant RLS client initialized:', supabase);
    }
  }

  private load<T>(key: string, fallback: T): T {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(key);
        if (data) return JSON.parse(data);
      }
    } catch (e) {
      console.warn(`Failed to parse ${key}`, e);
    }
    return fallback;
  }

  private save<T>(key: string, data: T): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch (e) {
      console.error(`Failed to save ${key}`, e);
    }
  }

  // Active User
  setCurrentUser(profile: UserProfile): void {
    this.currentUser = profile;
  }

  getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  // Active Organisation State
  getActiveOrgId(): string {
    return this.activeOrgId;
  }

  setActiveOrgId(orgId: string, orgObj?: Organisation): void {
    if (orgObj && !this.organisations.some(o => o.id === orgId)) {
      this.organisations.push(orgObj);
      this.save(SAAS_ORGS_KEY, this.organisations);
    }
    this.activeOrgId = orgId;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SAAS_ACTIVE_ORG_KEY, orgId);
    }
  }

  getActiveOrganisation(): Organisation {
    const org = this.organisations.find(o => o.id === this.activeOrgId);
    if (!org) {
      return this.organisations[0];
    }
    return org;
  }

  // List user organisations (Strict Isolation: Only orgs user is member of)
  getUserOrganisations(userId: string = this.currentUser.id): (Organisation & { userRole: UserRole })[] {
    const cleanUserId = userId;
    const cleanEmail = (this.currentUser.email || '').toLowerCase().trim();
    const userMemberOrgs = this.members.filter(m => {
      const mEmail = (m.user?.email || '').toLowerCase().trim();
      const matchId = m.userId === cleanUserId || (cleanUserId === this.currentUser.id && m.userId === this.currentUser.id);
      const matchEmail = Boolean(cleanEmail && mEmail === cleanEmail);
      return (matchId || matchEmail) && m.isActive;
    });
    return userMemberOrgs
      .map(member => {
        const org = this.organisations.find(o => o.id === member.organisationId);
        if (!org) return null;
        return {
          ...org,
          userRole: member.role,
        };
      })
      .filter((o): o is Organisation & { userRole: UserRole } => o !== null);
  }

  // Current User's Role in Active Org
  getCurrentUserRole(orgId: string = this.activeOrgId): UserRole | null {
    const m = this.members.find(
      mem => mem.organisationId === orgId && (mem.userId === this.currentUser.id || mem.user?.email === this.currentUser.email) && mem.isActive
    );
    return m ? m.role : null;
  }

  // Platform Admin: All Organisations across the entire platform
  getAllOrganisations(): (Organisation & { memberCount: number; boardCount: number })[] {
    return this.organisations.map(org => {
      const memberCount = this.members.filter(m => m.organisationId === org.id && m.isActive).length;
      // We will count boards if available or default
      return {
        ...org,
        memberCount,
        boardCount: org.id === 'org-acme' ? 3 : org.id === 'org-technova' ? 2 : 1,
      };
    });
  }

  // Organisation Lifecycle
  suspendOrganisation(orgId: string, reason: string): void {
    const org = this.organisations.find(o => o.id === orgId);
    if (!org) throw new Error('Organisation not found');
    org.status = 'suspended';
    org.statusReason = reason;
    org.updatedAt = new Date().toISOString();
    this.save(SAAS_ORGS_KEY, this.organisations);

    this.logPlatformAudit('organisation.suspended', orgId, { reason });
  }

  reactivateOrganisation(orgId: string): void {
    const org = this.organisations.find(o => o.id === orgId);
    if (!org) throw new Error('Organisation not found');
    org.status = 'active';
    org.statusReason = undefined;
    org.updatedAt = new Date().toISOString();
    this.save(SAAS_ORGS_KEY, this.organisations);

    this.logPlatformAudit('organisation.reactivated', orgId, {});
  }

  // Provisioning (Option A: Platform Admin)
  provisionOrganisation(payload: {
    name: string;
    slug: string;
    planId: SubscriptionPlanId;
    ownerEmail: string;
    ownerName: string;
    primaryColor?: string;
  }): { organisation: Organisation; inviteToken: string } {
    const newOrg: Organisation = {
      id: uid('org'),
      name: payload.name,
      slug: payload.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      logoUrl: '',
      primaryColor: payload.primaryColor || '#3b82f6',
      status: 'active',
      planId: payload.planId,
      usedStorageBytes: 0,
      enforceAdminInvitesOnly: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.organisations.push(newOrg);
    this.save(SAAS_ORGS_KEY, this.organisations);

    // Create default workspace
    const newWs: Workspace = {
      id: uid('ws'),
      organisationId: newOrg.id,
      name: 'General Workspace',
      slug: 'general',
      description: 'Default team workspace',
      visibility: 'organisation',
      createdBy: CURRENT_USER.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.workspaces.push(newWs);
    this.save(SAAS_WORKSPACES_KEY, this.workspaces);

    // Create Owner Invitation
    const token = `inv-tok-${Math.random().toString(36).substring(2, 12)}-${Date.now()}`;
    const newInvite: OrganisationInvitation = {
      id: uid('inv'),
      organisationId: newOrg.id,
      orgName: newOrg.name,
      email: payload.ownerEmail,
      role: 'owner',
      token,
      status: 'pending',
      invitedBy: CURRENT_USER.id,
      invitedByName: CURRENT_USER.name,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.invitations.push(newInvite);
    this.save(SAAS_INVITES_KEY, this.invitations);

    this.logPlatformAudit('organisation.provisioned', newOrg.id, {
      name: newOrg.name,
      ownerEmail: payload.ownerEmail,
      planId: payload.planId,
    });

    return { organisation: newOrg, inviteToken: token };
  }

  // Self-Serve Signup (Option B)
  createOrganisationSelfServe(payload: {
    name: string;
    slug: string;
    planId: SubscriptionPlanId;
    firstWorkspaceName: string;
    primaryColor?: string;
  }): Organisation {
    const newOrg: Organisation = {
      id: uid('org'),
      name: payload.name,
      slug: payload.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      logoUrl: '',
      primaryColor: payload.primaryColor || '#3b82f6',
      status: 'trial',
      planId: payload.planId,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      usedStorageBytes: 0,
      enforceAdminInvitesOnly: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.organisations.push(newOrg);
    this.save(SAAS_ORGS_KEY, this.organisations);

    // Register current user as Owner
    const activeUser = this.currentUser || CURRENT_USER;
    const newMember: OrganisationMember = {
      id: uid('om'),
      organisationId: newOrg.id,
      userId: activeUser.id,
      role: 'owner',
      jobTitle: 'Founder & Owner',
      isActive: true,
      joinedAt: new Date().toISOString(),
      user: activeUser,
    };
    this.members.push(newMember);
    this.save(SAAS_MEMBERS_KEY, this.members);

    // Create First Workspace
    const newWs: Workspace = {
      id: uid('ws'),
      organisationId: newOrg.id,
      name: payload.firstWorkspaceName || 'Primary Workspace',
      slug: (payload.firstWorkspaceName || 'primary').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: 'Main collaborative workspace',
      visibility: 'organisation',
      createdBy: activeUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.workspaces.push(newWs);
    this.save(SAAS_WORKSPACES_KEY, this.workspaces);

    // Switch active organisation to the newly created one
    this.setActiveOrgId(newOrg.id);

    this.logTenantAudit(newOrg.id, 'organisation.created', 'organisation', newOrg.id, {
      name: newOrg.name,
      planId: newOrg.planId,
    });

    return newOrg;
  }

  // Update Organisation Settings & Branding
  updateOrganisation(orgId: string, updates: Partial<Organisation>): Organisation {
    const orgIndex = this.organisations.findIndex(o => o.id === orgId);
    if (orgIndex === -1) throw new Error('Organisation not found');

    const updated = {
      ...this.organisations[orgIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.organisations[orgIndex] = updated;
    this.save(SAAS_ORGS_KEY, this.organisations);

    this.logTenantAudit(orgId, 'organisation.updated', 'organisation', orgId, updates);
    return updated;
  }

  // Members Management
  getMembers(orgId: string = this.activeOrgId): OrganisationMember[] {
    return this.members.filter(m => m.organisationId === orgId && m.isActive);
  }

  inviteMember(
    orgId: string,
    email: string,
    role: UserRole,
    jobTitle?: string
  ): OrganisationInvitation {
    const stats = this.getUsageStats(orgId);
    if (stats.isMemberLimitReached) {
      throw new Error(
        `Member limit reached: Your current plan "${stats.plan.name}" allows up to ${stats.maxMembers} members. Please upgrade your subscription to invite more users.`
      );
    }

    const token = `inv-tok-${Math.random().toString(36).substring(2, 12)}-${Date.now()}`;
    const newInvite: OrganisationInvitation = {
      id: uid('inv'),
      organisationId: orgId,
      orgName: this.organisations.find(o => o.id === orgId)?.name || 'Organisation',
      email: email.trim().toLowerCase(),
      role,
      token,
      status: 'pending',
      invitedBy: CURRENT_USER.id,
      invitedByName: CURRENT_USER.name,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.invitations.push(newInvite);
    this.save(SAAS_INVITES_KEY, this.invitations);

    this.logTenantAudit(orgId, 'member.invited', 'invitation', newInvite.id, {
      email,
      role,
      jobTitle,
    });

    return newInvite;
  }

  getOrganisationMembers(orgId: string = this.activeOrgId): OrganisationMember[] {
    return this.getMembers(orgId);
  }

  getInvitations(orgId: string = this.activeOrgId): OrganisationInvitation[] {
    return this.invitations.filter(i => i.organisationId === orgId && i.status === 'pending');
  }

  getAllInvitations(): OrganisationInvitation[] {
    return this.invitations;
  }

  revokeInvitation(inviteId: string): void {
    const inv = this.invitations.find(i => i.id === inviteId);
    if (inv) {
      inv.status = 'revoked';
      this.save(SAAS_INVITES_KEY, this.invitations);
      this.logTenantAudit(inv.organisationId, 'invitation.revoked', 'invitation', inviteId, { email: inv.email });
    }
  }

  acceptInvitation(token: string): { organisationId: string; organisation?: Organisation } {
    const inv = this.invitations.find(i => i.token === token);
    if (!inv) throw new Error('Invalid or expired invitation token');
    if (inv.status !== 'pending') throw new Error(`Invitation is already ${inv.status}`);
    if (new Date(inv.expiresAt).getTime() < Date.now()) {
      inv.status = 'expired';
      this.save(SAAS_INVITES_KEY, this.invitations);
      throw new Error('This invitation has expired.');
    }

    inv.status = 'accepted';
    inv.acceptedAt = new Date().toISOString();
    this.save(SAAS_INVITES_KEY, this.invitations);

    // Add user as member
    const activeUser = this.currentUser || CURRENT_USER;
    const newMember: OrganisationMember = {
      id: uid('om'),
      organisationId: inv.organisationId,
      userId: activeUser.id,
      role: inv.role,
      jobTitle: 'Team Member',
      isActive: true,
      joinedAt: new Date().toISOString(),
      user: activeUser,
    };
    this.members.push(newMember);
    this.save(SAAS_MEMBERS_KEY, this.members);

    this.setActiveOrgId(inv.organisationId);

    this.logTenantAudit(inv.organisationId, 'member.joined', 'member', newMember.id, {
      email: inv.email,
      role: inv.role,
    });

    const org = this.organisations.find(o => o.id === inv.organisationId);
    return { organisationId: inv.organisationId, organisation: org };
  }

  joinOrganisation(orgId: string, role: UserRole = 'member'): { organisation: Organisation; member: OrganisationMember } {
    const org = this.organisations.find(o => o.id === orgId);
    if (!org) throw new Error('Organisation not found');

    const user = this.currentUser || CURRENT_USER;
    const existing = this.members.find(
      m => m.organisationId === orgId && (m.userId === user.id || (m.user?.email && m.user.email.toLowerCase() === (user.email || '').toLowerCase()))
    );

    if (existing) {
      existing.isActive = true;
      existing.role = role;
      this.save(SAAS_MEMBERS_KEY, this.members);
      this.setActiveOrgId(org.id);
      return { organisation: org, member: existing };
    }

    const newMember: OrganisationMember = {
      id: uid('om'),
      organisationId: orgId,
      userId: user.id,
      role: role,
      jobTitle: role === 'owner' ? 'Founder & Owner' : 'Team Member',
      isActive: true,
      joinedAt: new Date().toISOString(),
      user: user,
    };
    this.members.push(newMember);
    this.save(SAAS_MEMBERS_KEY, this.members);
    this.setActiveOrgId(org.id);
    return { organisation: org, member: newMember };
  }

  updateMemberRole(orgId: string, memberId: string, newRole: UserRole): void {
    const m = this.members.find(mem => mem.id === memberId && mem.organisationId === orgId);
    if (!m) throw new Error('Member not found');
    const oldRole = m.role;
    m.role = newRole;
    this.save(SAAS_MEMBERS_KEY, this.members);

    this.logTenantAudit(orgId, 'member.role_changed', 'member', memberId, {
      memberName: m.user.name,
      oldRole,
      newRole,
    });
  }

  removeMember(orgId: string, memberId: string): void {
    const m = this.members.find(mem => mem.id === memberId && mem.organisationId === orgId);
    if (!m) throw new Error('Member not found');
    if (m.role === 'owner') throw new Error('Cannot remove the organisation owner');

    m.isActive = false;
    this.save(SAAS_MEMBERS_KEY, this.members);

    this.logTenantAudit(orgId, 'member.removed', 'member', memberId, {
      memberName: m.user.name,
      email: m.user.email,
    });
  }

  // Workspaces Management
  getWorkspaces(orgId: string = this.activeOrgId): Workspace[] {
    return this.workspaces.filter(ws => ws.organisationId === orgId);
  }

  createWorkspace(
    orgId: string,
    name: string,
    description: string,
    visibility: 'private' | 'team' | 'organisation' = 'organisation'
  ): Workspace {
    const stats = this.getUsageStats(orgId);
    if (stats.isWorkspaceLimitReached) {
      throw new Error(
        `Workspace limit reached: Plan "${stats.plan.name}" allows up to ${stats.maxWorkspaces} workspaces. Please upgrade your plan.`
      );
    }

    const newWs: Workspace = {
      id: uid('ws'),
      organisationId: orgId,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description,
      visibility,
      createdBy: CURRENT_USER.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.workspaces.push(newWs);
    this.save(SAAS_WORKSPACES_KEY, this.workspaces);

    this.logTenantAudit(orgId, 'workspace.created', 'workspace', newWs.id, { name, visibility });
    return newWs;
  }

  // Subscription Plans & Quotas
  getSubscriptionPlans(): SubscriptionPlan[] {
    return this.plans;
  }

  updateSubscriptionPlan(planId: SubscriptionPlanId, updates: Partial<SubscriptionPlan>): void {
    const idx = this.plans.findIndex(p => p.id === planId);
    if (idx !== -1) {
      this.plans[idx] = { ...this.plans[idx], ...updates };
      this.save(SAAS_PLANS_KEY, this.plans);
      this.logPlatformAudit('plan.updated', undefined, { planId, updates });
    }
  }

  upgradeOrganisationPlan(orgId: string, newPlanId: SubscriptionPlanId): void {
    const org = this.organisations.find(o => o.id === orgId);
    if (!org) throw new Error('Organisation not found');
    const oldPlan = org.planId;
    org.planId = newPlanId;
    org.updatedAt = new Date().toISOString();
    this.save(SAAS_ORGS_KEY, this.organisations);

    this.logTenantAudit(orgId, 'plan.upgraded', 'billing', newPlanId, { oldPlan, newPlan: newPlanId });
    this.logPlatformAudit('plan.upgraded', orgId, { oldPlan, newPlan: newPlanId });
  }

  // Usage calculation
  getUsageStats(orgId: string = this.activeOrgId, boardsCount: number = 2): TenantUsageStats {
    const org = this.organisations.find(o => o.id === orgId) || this.organisations[0];
    const plan = this.plans.find(p => p.id === org.planId) || this.plans[0];

    const activeMembersCount = this.members.filter(m => m.organisationId === org.id && m.isActive).length;
    const pendingInvitesCount = this.invitations.filter(i => i.organisationId === org.id && i.status === 'pending').length;
    const totalMembers = activeMembersCount + pendingInvitesCount;

    const totalWorkspaces = this.workspaces.filter(ws => ws.organisationId === org.id).length;

    return {
      totalMembers,
      maxMembers: plan.maxMembers,
      totalWorkspaces,
      maxWorkspaces: plan.maxWorkspaces,
      totalBoards: boardsCount,
      maxBoards: plan.maxBoards,
      usedStorageBytes: org.usedStorageBytes,
      maxStorageBytes: plan.storageAllowanceBytes,
      plan,
      isBoardLimitReached: boardsCount >= plan.maxBoards,
      isMemberLimitReached: totalMembers >= plan.maxMembers,
      isWorkspaceLimitReached: totalWorkspaces >= plan.maxWorkspaces,
    };
  }

  // Break-Glass Support Protocol
  requestSupportAccess(
    orgId: string,
    ticketReference: string,
    reason: string,
    durationHours: number = 2
  ): SupportAccessSession {
    const org = this.organisations.find(o => o.id === orgId);
    const session: SupportAccessSession = {
      id: `supp-sess-${Date.now()}`,
      organisationId: orgId,
      orgName: org?.name || 'Customer Org',
      platformAdminId: CURRENT_USER.id,
      ticketReference,
      reason,
      status: 'active',
      expiresAt: new Date(Date.now() + durationHours * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.supportSessions.push(session);
    this.save(SAAS_SUPPORT_KEY, this.supportSessions);

    this.logPlatformAudit('support.break_glass_activated', orgId, {
      ticketReference,
      reason,
      durationHours,
    });
    this.logTenantAudit(orgId, 'support.session_activated', 'support', session.id, {
      ticketReference,
      reason,
    });

    return session;
  }

  getSupportSessions(): SupportAccessSession[] {
    return this.supportSessions;
  }

  revokeSupportSession(sessionId: string): void {
    const s = this.supportSessions.find(sess => sess.id === sessionId);
    if (s) {
      s.status = 'revoked';
      this.save(SAAS_SUPPORT_KEY, this.supportSessions);
      this.logPlatformAudit('support.session_revoked', s.organisationId, { sessionId });
    }
  }

  // Audit Logs
  getAuditLogs(orgId: string = this.activeOrgId): AuditLog[] {
    return this.auditLogs.filter(l => l.organisationId === orgId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  getPlatformAuditLogs(): AuditLog[] {
    return this.auditLogs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  private logTenantAudit(
    orgId: string,
    action: string,
    targetType: string,
    targetId?: string,
    metadata?: Record<string, any>
  ): void {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      organisationId: orgId,
      actorId: CURRENT_USER.id,
      actorName: CURRENT_USER.name,
      action,
      targetType,
      targetId,
      metadata,
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    this.save(SAAS_AUDIT_KEY, this.auditLogs);
  }

  private logPlatformAudit(
    action: string,
    targetOrgId?: string,
    details?: Record<string, any>
  ): void {
    const log: AuditLog = {
      id: `aud-plat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      organisationId: targetOrgId || 'global',
      actorId: CURRENT_USER.id,
      actorName: CURRENT_USER.name,
      action: `[PLATFORM] ${action}`,
      targetType: 'platform',
      targetId: targetOrgId,
      metadata: details,
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    this.save(SAAS_AUDIT_KEY, this.auditLogs);
  }

  // Data Export (Complete Tenant JSON Backup)
  exportOrganisationDataJSON(orgId: string = this.activeOrgId): string {
    const org = this.organisations.find(o => o.id === orgId);
    const members = this.getMembers(orgId);
    const workspaces = this.getWorkspaces(orgId);
    const auditLogs = this.getAuditLogs(orgId);

    const exportPayload = {
      exportVersion: '1.0.0-multi-tenant-saas',
      exportedAt: new Date().toISOString(),
      organisation: org,
      members,
      workspaces,
      auditLogs,
    };

    this.logTenantAudit(orgId, 'organisation.exported', 'organisation', orgId, {});
    return JSON.stringify(exportPayload, null, 2);
  }
}

// Global Singleton
const INITIAL_INVITIES = INITIAL_INVITATIONS;
export const tenantService = new MultiTenantService();
