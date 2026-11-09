import { describe, it, expect, beforeEach } from 'vitest';
import { tenantService, INITIAL_PLANS, CURRENT_USER } from './tenantService';

describe('Stratcrest Flow: Multi-Tenant SaaS Architecture Tests', () => {
  beforeEach(() => {
    // Reset to Acme Corporation as active tenant
    tenantService.setActiveOrgId('org-acme');
  });

  describe('1. Multi-Tenant Data Isolation', () => {
    it('should strictly isolate organisation memberships and avoid cross-tenant leakage', () => {
      const acmeMembers = tenantService.getMembers('org-acme');
      const technovaMembers = tenantService.getMembers('org-technova');

      expect(acmeMembers.length).toBeGreaterThan(0);
      expect(technovaMembers.length).toBeGreaterThan(0);

      // Verify no member list leaks across tenants
      const acmeMemberIds = acmeMembers.map((m) => m.id);
      const technovaMemberIds = technovaMembers.map((m) => m.id);

      const intersection = acmeMemberIds.filter((id) => technovaMemberIds.includes(id));
      expect(intersection).toHaveLength(0);

      // All Acme members belong to org-acme
      acmeMembers.forEach((m) => expect(m.organisationId).toBe('org-acme'));
      // All TechNova members belong to org-technova
      technovaMembers.forEach((m) => expect(m.organisationId).toBe('org-technova'));
    });

    it('should isolate workspaces per tenant', () => {
      const acmeWorkspaces = tenantService.getWorkspaces('org-acme');
      const technovaWorkspaces = tenantService.getWorkspaces('org-technova');

      expect(acmeWorkspaces.length).toBeGreaterThan(0);
      expect(technovaWorkspaces.length).toBeGreaterThan(0);

      acmeWorkspaces.forEach((w) => expect(w.organisationId).toBe('org-acme'));
      technovaWorkspaces.forEach((w) => expect(w.organisationId).toBe('org-technova'));
    });

    it('should support company owner restricting workspace access to specific members', () => {
      // Create a restricted workspace with allowed member IDs
      const restrictedWs = tenantService.createWorkspace(
        'org-acme',
        'Executive & Legal',
        'Confidential executive workspace',
        'private',
        ['om-acme-1', 'om-acme-2']
      );

      expect(restrictedWs.allowedMemberIds).toBeDefined();
      expect(restrictedWs.allowedMemberIds).toEqual(['om-acme-1', 'om-acme-2']);

      // Update workspace access restrictions
      const updated = tenantService.updateWorkspace('org-acme', restrictedWs.id, {
        allowedMemberIds: ['om-acme-1'],
      });
      expect(updated.allowedMemberIds).toEqual(['om-acme-1']);
    });
  });

  describe('2. Multi-Organisation Switching & Role Resolution', () => {
    it('should allow user to belong to multiple organisations with different roles without duplicate accounts', () => {
      const userOrgs = tenantService.getUserOrganisations(CURRENT_USER.id);
      expect(userOrgs.length).toBeGreaterThanOrEqual(3);

      const acmeMembership = userOrgs.find((o) => o.id === 'org-acme');
      const technovaMembership = userOrgs.find((o) => o.id === 'org-technova');
      const stratcrestMembership = userOrgs.find((o) => o.id === 'org-stratcrest');

      expect(acmeMembership).toBeDefined();
      expect(acmeMembership?.userRole).toBe('owner');

      expect(technovaMembership).toBeDefined();
      expect(technovaMembership?.userRole).toBe('admin');

      expect(stratcrestMembership).toBeDefined();
      expect(stratcrestMembership?.userRole).toBe('member');
    });

    it('should switch active organisation context cleanly', () => {
      tenantService.setActiveOrgId('org-technova');
      expect(tenantService.getActiveOrgId()).toBe('org-technova');
      expect(tenantService.getActiveOrganisation().name).toBe('TechNova Solutions');
      expect(tenantService.getCurrentUserRole('org-technova')).toBe('admin');

      tenantService.setActiveOrgId('org-acme');
      expect(tenantService.getActiveOrgId()).toBe('org-acme');
      expect(tenantService.getActiveOrganisation().name).toBe('Acme Corporation');
      expect(tenantService.getCurrentUserRole('org-acme')).toBe('owner');
    });
  });

  describe('3. Backend Quota Limits Enforcement', () => {
    it('should accurately calculate usage stats against plan quotas', () => {
      const stats = tenantService.getUsageStats('org-acme', 3);
      expect(stats.plan.id).toBe('professional');
      expect(stats.totalBoards).toBe(3);
      expect(stats.isBoardLimitReached).toBe(false); // Pro has 999999 boards
    });

    it('should operate with unlimited quota on invitations', () => {
      // Find starter plan limits
      const starterPlan = INITIAL_PLANS.find((p) => p.id === 'starter')!;
      expect(starterPlan.maxMembers).toBe(999999);

      // Verify inviting works when quota is not reached
      const invite = tenantService.inviteMember(
        'org-technova',
        'test.engineer@technova.io',
        'member',
        'QA Tester'
      );
      expect(invite.email).toBe('test.engineer@technova.io');
      expect(invite.token).toBeTruthy();
      expect(invite.status).toBe('pending');
    });

    it('should allow platform admin to adjust subscription plan quotas dynamically', () => {
      const originalPlans = tenantService.getSubscriptionPlans();
      const freePlan = originalPlans.find((p) => p.id === 'free_trial')!;

      tenantService.updateSubscriptionPlan('free_trial', { maxBoards: 8 });
      const updatedPlans = tenantService.getSubscriptionPlans();
      const updatedFree = updatedPlans.find((p) => p.id === 'free_trial')!;

      expect(updatedFree.maxBoards).toBe(8);

      // Revert back
      tenantService.updateSubscriptionPlan('free_trial', { maxBoards: freePlan.maxBoards });
    });
  });

  describe('4. Organisation Onboarding & Invitation Lifecycle', () => {
    it('Option A: Platform admin provisions organisation and creates owner invite', () => {
      const { organisation, inviteToken } = tenantService.provisionOrganisation({
        name: 'Omni Consumer Products',
        slug: 'ocp-detroit',
        planId: 'professional',
        ownerEmail: 'dick.jones@ocp.com',
        ownerName: 'Richard Jones',
      });

      expect(organisation.name).toBe('Omni Consumer Products');
      expect(organisation.slug).toBe('ocp-detroit');
      expect(organisation.status).toBe('active');
      expect(inviteToken).toBeTruthy();

      // Accepting invitation joins user to organisation
      const acceptResult = tenantService.acceptInvitation(inviteToken);
      expect(acceptResult.organisationId).toBe(organisation.id);

      // Verify membership
      const members = tenantService.getMembers(organisation.id);
      expect(members.some((m) => m.userId === CURRENT_USER.id)).toBe(true);
    });

    it('Option B: Customer creates self-serve organisation and becomes owner', () => {
      const selfServeOrg = tenantService.createOrganisationSelfServe({
        name: 'Cyberdyne Systems Corp',
        slug: 'cyberdyne-defense',
        planId: 'starter',
        firstWorkspaceName: 'Skynet Research',
      });

      expect(selfServeOrg.name).toBe('Cyberdyne Systems Corp');
      expect(selfServeOrg.status).toBe('active');

      // Current user should be owner
      const role = tenantService.getCurrentUserRole(selfServeOrg.id);
      expect(role).toBe('owner');

      // First workspace should exist
      const ws = tenantService.getWorkspaces(selfServeOrg.id);
      expect(ws.length).toBeGreaterThan(0);
      expect(ws[0].name).toBe('Skynet Research');
    });
  });

  describe('5. Platform Administration & Support Break-Glass Protocol', () => {
    it('should allow platform admin to view all registered tenants and usage', () => {
      const allOrgs = tenantService.getAllOrganisations();
      expect(allOrgs.length).toBeGreaterThanOrEqual(4);
      allOrgs.forEach((o) => {
        expect(typeof o.memberCount).toBe('number');
        expect(typeof o.boardCount).toBe('number');
      });
    });

    it('should enforce suspension and reactivation of organisations', () => {
      const testOrg = tenantService.createOrganisationSelfServe({
        name: 'Initech Software',
        slug: 'initech-tps',
        planId: 'starter',
        firstWorkspaceName: 'TPS Reports',
      });

      tenantService.suspendOrganisation(testOrg.id, 'Terms of service violation');
      const suspendedOrg = tenantService.getActiveOrganisation();
      expect(suspendedOrg.status).toBe('suspended');
      expect(suspendedOrg.statusReason).toBe('Terms of service violation');

      tenantService.reactivateOrganisation(testOrg.id);
      const reactivatedOrg = tenantService.getActiveOrganisation();
      expect(reactivatedOrg.status).toBe('active');
      expect(reactivatedOrg.statusReason).toBeUndefined();
    });

    it('should require break-glass authorization for platform admin customer content access', () => {
      const session = tenantService.requestSupportAccess(
        'org-technova',
        'TICK-5421',
        'Customer reported board column rendering discrepancy'
      );

      expect(session.ticketReference).toBe('TICK-5421');
      expect(session.status).toBe('active');
      expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());

      // Revoking session terminates access
      tenantService.revokeSupportSession(session.id);
      const sessions = tenantService.getSupportSessions();
      const revoked = sessions.find((s) => s.id === session.id);
      expect(revoked?.status).toBe('revoked');
    });
  });

  describe('6. Data Export & Observability', () => {
    it('should export complete organisation backup in valid JSON format', () => {
      const jsonStr = tenantService.exportOrganisationDataJSON('org-acme');
      const parsed = JSON.parse(jsonStr);

      expect(parsed.exportVersion).toBe('1.0.0-multi-tenant-saas');
      expect(parsed.organisation.id).toBe('org-acme');
      expect(Array.isArray(parsed.members)).toBe(true);
      expect(Array.isArray(parsed.workspaces)).toBe(true);
      expect(Array.isArray(parsed.auditLogs)).toBe(true);
    });
  });

  describe('7. Organisation Join Codes & Worker Registration', () => {
    it('should return join code for organisation and allow workers to find it', () => {
      const code = tenantService.getOrgJoinCode('org-acme');
      expect(code).toBeTruthy();
      expect(code).toBe('ACME-2026');

      const found = tenantService.findOrgByJoinCode('acme-2026');
      expect(found).toBeDefined();
      expect(found?.id).toBe('org-acme');
    });

    it('should allow worker to join organisation using join code', () => {
      const workerProfile = {
        id: 'user-worker-test',
        email: 'worker.test@example.com',
        name: 'Worker Test',
        initials: 'WT',
        avatarColor: '#10b981',
      };

      const result = tenantService.joinWithCode('ACME-2026', workerProfile, 'member');
      expect(result.organisation.id).toBe('org-acme');
      expect(result.member.userId).toBe('user-worker-test');
      expect(result.member.role).toBe('member');

      // Verify member appears in members list
      const members = tenantService.getMembers('org-acme');
      const joined = members.find((m) => m.userId === 'user-worker-test');
      expect(joined).toBeDefined();
    });

    it('should reject invalid join code', () => {
      expect(() => {
        tenantService.joinWithCode('INVALID-CODE-999');
      }).toThrow(/Invalid organisation joining code/);
    });

    it('should support async join code resolution across sessions and devices', async () => {
      const org = await tenantService.findOrgByJoinCodeAsync('ACME-2026');
      expect(org).toBeDefined();
      expect(org?.id).toBe('org-acme');
    });

    it('should support fetching members from Supabase with graceful fallback', async () => {
      const members = await tenantService.fetchMembersFromSupabase('org-acme');
      expect(members).toBeDefined();
      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBeGreaterThan(0);
    });
  });
});
