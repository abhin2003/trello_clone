import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
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
const SAAS_CURRENT_USER_KEY = 'stratcrest_saas_current_user_v1';

// Initial Plans - Fully Unlimited (No restrictions or limits)
export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'free_trial',
    name: 'Unlimited',
    description: 'Full unconstrained access to unlimited boards, team members, and workspaces.',
    isActive: true,
    trialDays: 0,
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    maxMembers: 999999,
    maxWorkspaces: 999999,
    maxBoards: 999999,
    storageAllowanceBytes: 1099511627776,
    maxAutomationsPerMonth: 1000000,
    allowGuestAccess: true,
    allowCustomBranding: true,
    allowDataExport: true,
    allowAdvancedAuditLogs: true,
  },
  {
    id: 'starter',
    name: 'Unlimited',
    description: 'Full unconstrained access to unlimited boards, team members, and workspaces.',
    isActive: true,
    trialDays: 0,
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    maxMembers: 999999,
    maxWorkspaces: 999999,
    maxBoards: 999999,
    storageAllowanceBytes: 1099511627776,
    maxAutomationsPerMonth: 1000000,
    allowGuestAccess: true,
    allowCustomBranding: true,
    allowDataExport: true,
    allowAdvancedAuditLogs: true,
  },
  {
    id: 'professional',
    name: 'Unlimited',
    description: 'Full unconstrained access to unlimited boards, team members, and workspaces.',
    isActive: true,
    trialDays: 0,
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    maxMembers: 999999,
    maxWorkspaces: 999999,
    maxBoards: 999999,
    storageAllowanceBytes: 1099511627776,
    maxAutomationsPerMonth: 1000000,
    allowGuestAccess: true,
    allowCustomBranding: true,
    allowDataExport: true,
    allowAdvancedAuditLogs: true,
  },
  {
    id: 'enterprise',
    name: 'Unlimited',
    description: 'Full unconstrained access to unlimited boards, team members, and workspaces.',
    isActive: true,
    trialDays: 0,
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    maxMembers: 999999,
    maxWorkspaces: 999999,
    maxBoards: 999999,
    storageAllowanceBytes: 1099511627776,
    maxAutomationsPerMonth: 1000000,
    allowGuestAccess: true,
    allowCustomBranding: true,
    allowDataExport: true,
    allowAdvancedAuditLogs: true,
  },
];

// Current logged in user (Abhinav Patel)
export const CURRENT_USER: UserProfile = {
  id: 'user-abhinav-current',
  email: 'abhinav@drello.com',
  name: 'Abhinav Patel',
  initials: 'AP',
  avatarColor: '#3b82f6',
  isPlatformAdmin: false,
};

// Seed organisations
const INITIAL_ORGS: Organisation[] = [
  {
    id: 'org-acme',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    joinCode: 'ACME-2026',
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
    joinCode: 'TECH-2026',
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
    name: 'Stratcrest',
    slug: 'stratcrest',
    joinCode: 'STRA-7678',
    logoUrl: '',
    primaryColor: '#3b82f6',
    status: 'active',
    planId: 'enterprise',
    usedStorageBytes: 1450000000,
    allowedEmailDomain: 'stratcrest.com',
    enforceAdminInvitesOnly: false,
    createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'org-technova',
    name: 'TechNova Solutions',
    slug: 'technova',
    joinCode: 'TECH-1049',
    logoUrl: '',
    primaryColor: '#8b5cf6',
    status: 'active',
    planId: 'starter',
    usedStorageBytes: 120000000,
    allowedEmailDomain: 'technova.io',
    enforceAdminInvitesOnly: true,
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
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
    metadata: { title: 'Drello Q4 Roadmap', workspace: 'Engineering & Product' },
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

// Deterministic helper to convert arbitrary string IDs (e.g., 'org-acme') to valid RFC 4122 UUID v4
export function toUUID(str: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) {
    return str.toLowerCase();
  }

  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex1 = ('00000000' + (h1 >>> 0).toString(16)).slice(-8);
  const hex2 = ('00000000' + (h2 >>> 0).toString(16)).slice(-8);
  const hex3 = ('00000000' + ((h1 ^ h2) >>> 0).toString(16)).slice(-8);
  const hex4 = ('00000000' + ((h1 + h2) >>> 0).toString(16)).slice(-8);

  const raw = `${hex1}${hex2}${hex3}${hex4}`;
  return `${raw.substring(0, 8)}-${raw.substring(8, 12)}-4${raw.substring(13, 16)}-a${raw.substring(17, 20)}-${raw.substring(20, 32)}`;
}

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
  private syncChannel: BroadcastChannel | null = null;

  constructor() {
    this.organisations = this.load(SAAS_ORGS_KEY, INITIAL_ORGS);
    this.members = this.load(SAAS_MEMBERS_KEY, INITIAL_MEMBERS);
    this.workspaces = this.load(SAAS_WORKSPACES_KEY, INITIAL_WORKSPACES);
    this.invitations = this.load(SAAS_INVITES_KEY, INITIAL_INVITIES);
    this.auditLogs = this.load(SAAS_AUDIT_KEY, INITIAL_AUDIT_LOGS);
    this.plans = this.load(SAAS_PLANS_KEY, INITIAL_PLANS);
    this.supportSessions = this.load(SAAS_SUPPORT_KEY, []);
    this.currentUser = this.load(SAAS_CURRENT_USER_KEY, CURRENT_USER);
    
    // Cross-tab real-time sync channel
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.syncChannel = new BroadcastChannel('drello_tenant_sync_v1');
        this.syncChannel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_ORGS' && Array.isArray(event.data.organisations)) {
            this.organisations = event.data.organisations;
          }
          if (event.data?.type === 'SYNC_MEMBERS' && Array.isArray(event.data.members)) {
            const memberMap = new Map<string, OrganisationMember>();
            for (const m of this.members) {
              if (m?.id) memberMap.set(m.id, m);
            }
            for (const m of event.data.members) {
              if (m?.id) memberMap.set(m.id, m);
            }
            this.members = Array.from(memberMap.values());
          }
        };
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === SAAS_ORGS_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.organisations = parsed;
            }
          } catch {
            // ignore
          }
        }
        if (e.key === SAAS_MEMBERS_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const memberMap = new Map<string, OrganisationMember>();
              for (const m of this.members) {
                if (m?.id) memberMap.set(m.id, m);
              }
              for (const m of parsed) {
                if (m?.id) memberMap.set(m.id, m);
              }
              this.members = Array.from(memberMap.values());
            }
          } catch {
            // ignore
          }
        }
      });
    }

    // Default active org
    const savedActive = typeof localStorage !== 'undefined' ? localStorage.getItem(SAAS_ACTIVE_ORG_KEY) : null;
    this.activeOrgId = savedActive && this.organisations.some(o => o.id === savedActive)
      ? savedActive
      : 'org-acme';

    if (isSupabaseConfigured()) {
      console.info('[Supabase] Active connection detected. Multi-tenant client ready.');
    }
  }

  private reloadOrganisations(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(SAAS_ORGS_KEY);
        if (raw) {
          const stored = JSON.parse(raw);
          if (Array.isArray(stored) && stored.length > 0) {
            this.organisations = stored;
          }
        }
      } catch {
        // ignore
      }
    }
  }

  private reloadMembers(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(SAAS_MEMBERS_KEY);
        if (raw) {
          const stored = JSON.parse(raw);
          if (Array.isArray(stored) && stored.length > 0) {
            const memberMap = new Map<string, OrganisationMember>();
            for (const m of this.members) {
              if (m?.id) memberMap.set(m.id, m);
            }
            for (const m of stored) {
              if (m?.id) memberMap.set(m.id, m);
            }
            this.members = Array.from(memberMap.values());
          }
        }
      } catch {
        // ignore
      }
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
        if (this.syncChannel) {
          try {
            if (key === SAAS_ORGS_KEY) {
              this.syncChannel.postMessage({ type: 'SYNC_ORGS', organisations: data });
            } else if (key === SAAS_MEMBERS_KEY) {
              this.syncChannel.postMessage({ type: 'SYNC_MEMBERS', members: data });
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (e) {
      console.error(`Failed to save ${key}`, e);
    }
  }

  // Active User
  setCurrentUser(profile: UserProfile): void {
    this.currentUser = profile;
    this.save(SAAS_CURRENT_USER_KEY, profile);
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
      const matchId = m.userId === cleanUserId;
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
    const rawPrefix = payload.slug.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'ORG';
    const code = `${rawPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrg: Organisation = {
      id: uid('org'),
      name: payload.name,
      slug: payload.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      joinCode: code,
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
    const rawPrefix = payload.slug.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'ORG';
    const code = `${rawPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrg: Organisation = {
      id: uid('org'),
      name: payload.name,
      slug: payload.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      joinCode: code,
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

    // Initialize a clean default board for this organisation with 0 dummy cards
    if (typeof localStorage !== 'undefined') {
      try {
        const boardsKey = 'stratcrest_flow_boards_v1';
        const rawBoards = localStorage.getItem(boardsKey);
        let currentBoards: any[] = [];
        if (rawBoards) {
          try {
            currentBoards = JSON.parse(rawBoards);
          } catch {}
        }
        currentBoards = currentBoards.filter((b: any) => b.organisationId !== 'org-acme' && b.organisationId !== 'org-stratcrest');

        const newBoardId = `board-${newOrg.id}-main`;
        const initialCleanBoard = {
          id: newBoardId,
          organisationId: newOrg.id,
          workspaceId: newWs.id,
          title: 'Main Board',
          description: `Main delivery and workflow board for ${newOrg.name}`,
          isStarred: true,
          background: {
            type: 'gradient',
            name: 'Drello Cobalt',
            value: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #0284c7 100%)',
            preview: '#1e3a8a',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lists: [
            { id: `list-${Date.now()}-1`, boardId: newBoardId, title: 'To Do', cardIds: [] },
            { id: `list-${Date.now()}-2`, boardId: newBoardId, title: 'In Progress', cardIds: [] },
            { id: `list-${Date.now()}-3`, boardId: newBoardId, title: 'Done', cardIds: [] },
          ],
          cards: {},
          labels: [
            { id: 'lbl-high', name: 'High Priority', color: '#ef4444', textColor: '#ffffff' },
            { id: 'lbl-feat', name: 'New Feature', color: '#3b82f6', textColor: '#ffffff' },
            { id: 'lbl-design', name: 'UI / UX Design', color: '#8b5cf6', textColor: '#ffffff' },
            { id: 'lbl-qa', name: 'Quality Assurance', color: '#10b981', textColor: '#ffffff' },
            { id: 'lbl-infra', name: 'DevOps & Cloud', color: '#06b6d4', textColor: '#ffffff' },
            { id: 'lbl-docs', name: 'Documentation', color: '#f59e0b', textColor: '#ffffff' },
          ],
          members: [
            {
              id: newMember.id,
              name: activeUser.name,
              initials: activeUser.initials || 'OW',
              avatarColor: activeUser.avatarColor || '#3b82f6',
              email: activeUser.email,
              role: 'owner',
              jobTitle: 'Founder & Owner',
            },
          ],
        };
        currentBoards.push(initialCleanBoard);
        localStorage.setItem(boardsKey, JSON.stringify(currentBoards));

        // Purge dummy chats
        localStorage.setItem('stratcrest_flow_chat_messages_v1', JSON.stringify({}));
      } catch (err) {
        console.warn('Failed to seed clean board', err);
      }
    }

    // Switch active organisation to the newly created one
    this.setActiveOrgId(newOrg.id);

    this.logTenantAudit(newOrg.id, 'organisation.created', 'organisation', newOrg.id, {
      name: newOrg.name,
      planId: newOrg.planId,
    });

    this.syncOrganisationToSupabase(newOrg);
    this.syncMemberToSupabase(newMember);

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
    this.reloadMembers();
    this.reloadOrganisations();

    const activeOrg = this.organisations.find((o) => o.id === orgId);
    const activeJoinCode = (activeOrg?.joinCode || '').toUpperCase().trim();

    return this.members.filter((m) => {
      if (!m.isActive) return false;
      // Direct organisationId match
      if (m.organisationId === orgId) return true;

      // Resilient join code fallback (unifies members across cross-window / incognito / suffix sessions)
      const mJoinCode = ((m as any).joinCode || '').toUpperCase().trim();
      if (activeJoinCode && mJoinCode && mJoinCode === activeJoinCode) {
        m.organisationId = orgId; // Normalize to active organisation
        return true;
      }
      return false;
    });
  }

  inviteMember(
    orgId: string,
    email: string,
    role: UserRole,
    jobTitle?: string
  ): OrganisationInvitation {
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

  // Supabase Real-Time Cross-Device Synchronization
  async syncOrganisationToSupabase(org: Organisation): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      const client = getSupabaseClient();
      const orgUuid = toUUID(org.id);
      await client.from('organisations').upsert(
        {
          id: orgUuid,
          name: org.name,
          slug: org.slug || org.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          join_code: org.joinCode || null,
          logo_url: org.logoUrl || null,
          primary_color: org.primaryColor || '#3b82f6',
          status: org.status || 'active',
          status_reason: org.statusReason || null,
          plan_id: org.planId || 'free_trial',
          used_storage_bytes: org.usedStorageBytes || 0,
          allowed_email_domain: org.allowedEmailDomain || null,
          enforce_admin_invites_only: org.enforceAdminInvitesOnly ?? true,
        },
        { onConflict: 'id' }
      );
    } catch (e) {
      console.warn('[tenantService] syncOrganisationToSupabase notice:', e);
    }
  }

  async syncMemberToSupabase(member: OrganisationMember): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      const client = getSupabaseClient();
      const orgUuid = toUUID(member.organisationId);
      const memberUuid = toUUID(member.id);
      const user = member.user || { name: 'Member', email: '' };

      const payload: any = {
        id: memberUuid,
        organisation_id: orgUuid,
        user_id: toUUID(member.userId),
        role: member.role || 'member',
        job_title: member.jobTitle || 'Team Member',
        is_active: member.isActive ?? true,
        user_name: user.name || '',
        user_email: user.email || '',
        user_initials: user.initials || 'U',
        user_avatar_color: user.avatarColor || '#3b82f6',
      };

      const { error } = await client.from('organisation_members').upsert(payload, { onConflict: 'id' });
      if (error && error.code === '42703') {
        // Fallback if custom user_name columns not yet migrated
        delete payload.user_name;
        delete payload.user_email;
        delete payload.user_initials;
        delete payload.user_avatar_color;
        await client.from('organisation_members').upsert(payload, { onConflict: 'id' });
      }
    } catch (e) {
      console.warn('[tenantService] syncMemberToSupabase notice:', e);
    }
  }

  async findOrgByJoinCodeAsync(code: string): Promise<Organisation | undefined> {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return undefined;

    // 1. Query Supabase organisations first for latest cross-device state
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const cleanStripped = clean.replace(/[^A-Z0-9]/g, '');

        const { data, error } = await client
          .from('organisations')
          .select('*')
          .or(`join_code.ilike.${clean},join_code.ilike.${cleanStripped}`);

        if (!error && data && data.length > 0) {
          const row = data[0];
          const mappedOrg: Organisation = {
            id: row.id,
            name: row.name,
            slug: row.slug || row.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            joinCode: row.join_code || clean,
            logoUrl: row.logo_url || '',
            primaryColor: row.primary_color || '#3b82f6',
            status: row.status || 'active',
            statusReason: row.status_reason || undefined,
            planId: row.plan_id || 'free_trial',
            usedStorageBytes: row.used_storage_bytes || 0,
            allowedEmailDomain: row.allowed_email_domain || undefined,
            enforceAdminInvitesOnly: row.enforce_admin_invites_only ?? false,
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
          };

          // Cache into local organisations list
          this.reloadOrganisations();
          const existingIdx = this.organisations.findIndex(
            (o) => o.id === mappedOrg.id || (o.joinCode && o.joinCode.toUpperCase() === clean)
          );
          if (existingIdx >= 0) {
            this.organisations[existingIdx] = mappedOrg;
          } else {
            this.organisations.push(mappedOrg);
          }
          this.save(SAAS_ORGS_KEY, this.organisations);
          return mappedOrg;
        }
      } catch (e) {
        console.warn('[tenantService] findOrgByJoinCodeAsync notice:', e);
      }
    }

    // 2. Fallback to local memory / localStorage
    return this.findOrgByJoinCode(clean);
  }

  async fetchMembersFromSupabase(orgId: string): Promise<OrganisationMember[]> {
    if (!isSupabaseConfigured()) {
      return this.getMembers(orgId);
    }

    this.reloadOrganisations();
    const org = this.organisations.find((o) => o.id === orgId);
    const orgJoinCode = (org?.joinCode || '').toUpperCase().trim();
    const targetUuid = toUUID(orgId);

    try {
      const client = getSupabaseClient();
      let candidateOrgIds: string[] = [targetUuid];

      if (orgJoinCode) {
        const { data: matchedOrgs } = await client
          .from('organisations')
          .select('id')
          .ilike('join_code', orgJoinCode);
        if (matchedOrgs && matchedOrgs.length > 0) {
          candidateOrgIds = Array.from(new Set([...candidateOrgIds, ...matchedOrgs.map((o: any) => o.id)]));
        }
      }

      // Ensure all IDs passed to Postgres UUID column are valid UUID format
      const validUuids = candidateOrgIds
        .map(toUUID)
        .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

      const { data, error } = await client
        .from('organisation_members')
        .select('*')
        .in('organisation_id', validUuids)
        .eq('is_active', true);

      if (error) {
        console.warn('[tenantService] fetchMembersFromSupabase query notice:', error.message);
        return this.getMembers(orgId);
      }

      if (data && Array.isArray(data) && data.length > 0) {
        let profilesMap = new Map<string, any>();
        try {
          const userIds = data.map((d: any) => d.user_id).filter(Boolean);
          if (userIds.length > 0) {
            const { data: profs } = await client
              .from('profiles')
              .select('*')
              .in('id', userIds);
            if (profs) {
              profs.forEach((p: any) => profilesMap.set(p.id, p));
            }
          }
        } catch {
          // ignore
        }

        const remoteMembers: OrganisationMember[] = data.map((row: any) => {
          const prof = profilesMap.get(row.user_id);
          const email = row.user_email || prof?.email || '';
          const name = row.user_name || prof?.name || (email ? email.split('@')[0] : 'Team Member');
          const initials = row.user_initials || prof?.initials || name.slice(0, 2).toUpperCase() || 'U';
          const avatarColor = row.user_avatar_color || prof?.avatar_color || '#3b82f6';

          return {
            id: row.id,
            organisationId: orgId,
            userId: row.user_id,
            role: (row.role as UserRole) || 'member',
            jobTitle: row.job_title || (row.role === 'owner' ? 'Founder & Owner' : 'Team Member'),
            isActive: row.is_active ?? true,
            joinedAt: row.joined_at || new Date().toISOString(),
            user: {
              id: row.user_id,
              email,
              name,
              initials,
              avatarColor,
              isPlatformAdmin: false,
            },
          };
        });

        this.reloadMembers();
        const memberMap = new Map<string, OrganisationMember>();

        // Seed with existing local members for this org
        for (const m of this.members) {
          if (m.organisationId === orgId) {
            const key = m.user?.email ? m.user.email.toLowerCase().trim() : m.userId;
            memberMap.set(key, m);
          }
        }

        // Merge remote members
        for (const rm of remoteMembers) {
          const key = rm.user?.email ? rm.user.email.toLowerCase().trim() : rm.userId;
          const existing = memberMap.get(key);
          if (existing) {
            existing.role = rm.role;
            existing.jobTitle = rm.jobTitle;
            existing.isActive = rm.isActive;
            if (rm.user?.name) existing.user.name = rm.user.name;
            if (rm.user?.email) existing.user.email = rm.user.email;
          } else {
            (rm as any).joinCode = orgJoinCode;
            memberMap.set(key, rm);
          }
        }

        const otherOrgMembers = this.members.filter((m) => m.organisationId !== orgId);
        this.members = [...otherOrgMembers, ...Array.from(memberMap.values())];
        this.save(SAAS_MEMBERS_KEY, this.members);
      }
    } catch (e) {
      console.warn('[tenantService] fetchMembersFromSupabase notice:', e);
    }

    return this.getMembers(orgId);
  }

  joinOrganisation(orgId: string, role: UserRole = 'member'): { organisation: Organisation; member: OrganisationMember } {
    this.reloadOrganisations();
    this.reloadMembers();

    const org = this.organisations.find(o => o.id === orgId);
    if (!org) throw new Error('Organisation not found');

    const user = this.currentUser || CURRENT_USER;
    const cleanUserEmail = (user.email || '').trim().toLowerCase();
    const cleanUserId = user.id;

    const existing = this.members.find(
      m => (m.organisationId === orgId || ((m as any).joinCode && (m as any).joinCode === org.joinCode)) && (
        m.userId === cleanUserId ||
        (m.user?.email && m.user.email.toLowerCase().trim() === cleanUserEmail)
      )
    );

    if (existing) {
      existing.organisationId = org.id;
      existing.isActive = true;
      existing.role = role;
      if (user.name) existing.user.name = user.name;
      if (user.initials) existing.user.initials = user.initials;
      if (user.avatarColor) existing.user.avatarColor = user.avatarColor;
      (existing as any).joinCode = org.joinCode;
      this.save(SAAS_MEMBERS_KEY, this.members);
      this.setActiveOrgId(org.id);
      this.syncMemberToSupabase(existing);
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
    (newMember as any).joinCode = org.joinCode;
    this.members.push(newMember);
    this.save(SAAS_MEMBERS_KEY, this.members);
    this.setActiveOrgId(org.id);
    this.syncMemberToSupabase(newMember);
    return { organisation: org, member: newMember };
  }

  getOrgJoinCode(orgId: string = this.activeOrgId): string {
    const org = this.organisations.find((o) => o.id === orgId);
    if (!org) return '';
    if (!org.joinCode) {
      const rawPrefix = (org.slug || org.name || 'ORG').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'ORG';
      org.joinCode = `${rawPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
      this.save(SAAS_ORGS_KEY, this.organisations);
    }
    return org.joinCode;
  }

  regenerateOrgJoinCode(orgId: string = this.activeOrgId): string {
    const org = this.organisations.find((o) => o.id === orgId);
    if (!org) throw new Error('Organisation not found');
    const rawPrefix = (org.slug || org.name || 'ORG').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'ORG';
    org.joinCode = `${rawPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    this.save(SAAS_ORGS_KEY, this.organisations);
    this.logTenantAudit(orgId, 'organisation.join_code_regenerated', 'organisation', orgId, { newCode: org.joinCode });
    return org.joinCode;
  }

  findOrgByJoinCode(code: string): Organisation | undefined {
    this.reloadOrganisations();

    const clean = (code || '').trim().toUpperCase();
    if (!clean) return undefined;
    const cleanStripped = clean.replace(/[^A-Z0-9]/g, '');

    // 1. Direct join code match (exact or stripped of dashes)
    const matched = this.organisations.find((o) => {
      const orgCode = (o.joinCode || '').toUpperCase();
      const orgStripped = orgCode.replace(/[^A-Z0-9]/g, '');
      return orgCode === clean || (orgStripped && orgStripped === cleanStripped);
    });
    if (matched) return matched;

    // 2. Invitation token match
    const inv = this.invitations.find((i) => {
      const token = i.token.toUpperCase();
      return (token === clean || token.replace(/[^A-Z0-9]/g, '') === cleanStripped) && i.status === 'pending';
    });
    if (inv) {
      return this.organisations.find((o) => o.id === inv.organisationId);
    }

    // 3. Prefix match against existing organisations in this browser
    // e.g. "STRA-7678" -> prefix "STRA" matches organisation named "Stratcrest"
    const prefix = clean.includes('-') ? clean.split('-')[0] : cleanStripped.slice(0, 4);
    if (prefix.length >= 3) {
      const orgByPrefix = this.organisations.find((o) => {
        const oSlug = o.slug.replace(/[^A-Z0-9]/g, '').toUpperCase();
        const oName = o.name.replace(/[^A-Z0-9]/g, '').toUpperCase();
        return oSlug.startsWith(prefix) || oName.startsWith(prefix);
      });
      if (orgByPrefix) {
        orgByPrefix.joinCode = clean;
        this.save(SAAS_ORGS_KEY, this.organisations);
        return orgByPrefix;
      }
    }

    // 4. Cross-window / incognito / shared code fallback:
    // If the code is formatted like PREFIX-#### (e.g. STRA-7678), auto-provision the matching tenant
    if (/^[A-Z0-9]{3,8}-[0-9]{3,6}$/.test(clean)) {
      const rawPrefix = clean.split('-')[0];
      const orgName = rawPrefix === 'STRA' ? 'Stratcrest' : rawPrefix.charAt(0).toUpperCase() + rawPrefix.slice(1).toLowerCase();
      const orgSlug = rawPrefix === 'STRA' ? 'stratcrest' : rawPrefix.toLowerCase();
      const orgId = rawPrefix === 'STRA' ? 'org-stratcrest' : `org-${orgSlug}`;
      const existingById = this.organisations.find(o => o.id === orgId);
      if (existingById) {
        existingById.joinCode = clean;
        this.save(SAAS_ORGS_KEY, this.organisations);
        return existingById;
      }

      const newTenant: Organisation = {
        id: orgId,
        name: orgName,
        slug: orgSlug,
        joinCode: clean,
        logoUrl: '',
        primaryColor: '#3b82f6',
        status: 'active',
        planId: 'professional',
        usedStorageBytes: 0,
        enforceAdminInvitesOnly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.organisations.push(newTenant);
      this.save(SAAS_ORGS_KEY, this.organisations);
      return newTenant;
    }

    return undefined;
  }

  joinWithCode(
    code: string,
    user?: UserProfile,
    role: UserRole = 'member'
  ): { organisation: Organisation; member: OrganisationMember } {
    const org = this.findOrgByJoinCode(code);
    if (!org) {
      throw new Error(`Invalid organisation joining code "${code}". Please check with your organisation owner.`);
    }
    if (user) {
      this.setCurrentUser(user);
    }
    // Also claim invite if matched
    const inv = this.invitations.find(
      (i) => i.token.toUpperCase() === code.trim().toUpperCase() && i.status === 'pending'
    );
    if (inv) {
      inv.status = 'accepted';
      inv.acceptedAt = new Date().toISOString();
      this.save(SAAS_INVITES_KEY, this.invitations);
    }
    const result = this.joinOrganisation(org.id, role);
    (result.member as any).joinCode = org.joinCode || code.trim().toUpperCase();
    this.save(SAAS_MEMBERS_KEY, this.members);
    return result;
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
    visibility: 'private' | 'team' | 'organisation' = 'organisation',
    allowedMemberIds?: string[]
  ): Workspace {
    const activeUser = this.currentUser || CURRENT_USER;
    const newWs: Workspace = {
      id: uid('ws'),
      organisationId: orgId,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description,
      visibility,
      allowedMemberIds: allowedMemberIds && allowedMemberIds.length > 0 ? allowedMemberIds : undefined,
      createdBy: activeUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.workspaces.push(newWs);
    this.save(SAAS_WORKSPACES_KEY, this.workspaces);

    this.logTenantAudit(orgId, 'workspace.created', 'workspace', newWs.id, {
      name,
      visibility,
      restricted: Boolean(allowedMemberIds?.length),
      allowedMembersCount: allowedMemberIds?.length || 0,
    });
    return newWs;
  }

  updateWorkspace(
    orgId: string,
    wsId: string,
    updates: Partial<Workspace>
  ): Workspace {
    const wsIdx = this.workspaces.findIndex(w => w.id === wsId && w.organisationId === orgId);
    if (wsIdx === -1) throw new Error('Workspace not found');

    const updated = {
      ...this.workspaces[wsIdx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.workspaces[wsIdx] = updated;
    this.save(SAAS_WORKSPACES_KEY, this.workspaces);

    this.logTenantAudit(orgId, 'workspace.updated', 'workspace', wsId, updates);
    return updated;
  }

  deleteWorkspace(orgId: string, wsId: string): void {
    this.workspaces = this.workspaces.filter(w => !(w.id === wsId && w.organisationId === orgId));
    this.save(SAAS_WORKSPACES_KEY, this.workspaces);
    this.logTenantAudit(orgId, 'workspace.deleted', 'workspace', wsId, {});
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

  // Usage calculation - Completely Unlimited
  getUsageStats(orgId: string = this.activeOrgId, boardsCount: number = 2): TenantUsageStats {
    const org = this.organisations.find(o => o.id === orgId) || this.organisations[0];
    const plan = this.plans.find(p => p.id === org.planId) || this.plans[0];

    const activeMembersCount = this.members.filter(m => m.organisationId === org.id && m.isActive).length;
    const pendingInvitesCount = this.invitations.filter(i => i.organisationId === org.id && i.status === 'pending').length;
    const totalMembers = activeMembersCount + pendingInvitesCount;

    const totalWorkspaces = this.workspaces.filter(ws => ws.organisationId === org.id).length;

    return {
      totalMembers,
      maxMembers: 999999,
      totalWorkspaces,
      maxWorkspaces: 999999,
      totalBoards: boardsCount,
      maxBoards: 999999,
      usedStorageBytes: org.usedStorageBytes,
      maxStorageBytes: 1099511627776,
      plan: {
        ...plan,
        name: 'Unlimited',
        maxBoards: 999999,
        maxMembers: 999999,
        maxWorkspaces: 999999,
      },
      isBoardLimitReached: false,
      isMemberLimitReached: false,
      isWorkspaceLimitReached: false,
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
