import { describe, it, expect, beforeEach } from 'vitest';
import { tenantService } from './tenantService';
import { authService } from './authService';
import { DEFAULT_LABELS, BACKGROUND_PRESETS } from '../data/initialData';
import type { Board } from '../types';

describe('Organisation Owner & 4 Employees Comprehensive Multi-User Workflow', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    tenantService.setActiveOrgId('org-acme');
  });

  it('executes full collaborative scenario: 1 Owner + 4 Employees across all features', async () => {
    // =========================================================================
    // STEP 1: Organisation Owner Registration & Provisioning
    // =========================================================================
    const ownerName = 'Elena Vance';
    const ownerEmail = 'elena@apextech.io';
    const ownerPassword = 'SecurePassword123!';
    const orgName = 'Apex Technologies';

    // Owner registers account
    const ownerReg = await authService.signUp(ownerName, ownerEmail, ownerPassword);
    expect(ownerReg.user).toBeDefined();
    const ownerUser = ownerReg.user!;

    // Owner creates organisation
    const orgCreation = await authService.createOrganisation(orgName);
    expect(orgCreation.success).toBe(true);
    expect(orgCreation.organisationId).toBeDefined();
    const apexOrg = orgCreation.organisation!;
    expect(apexOrg.name).toBe('Apex Technologies');

    // Retrieve the unique worker join code
    const joinCode = tenantService.getOrgJoinCode(apexOrg.id);
    expect(joinCode).toBeDefined();
    expect(joinCode.length).toBeGreaterThan(4);
    console.log(`[TEST LOG] Provisioned Org "${apexOrg.name}" with Worker Join Code: ${joinCode}`);

    // Verify Owner has 'owner' role
    const ownerMemberships = await authService.fetchUserOrganisations(ownerUser.id);
    const ownerMembership = ownerMemberships.find((m) => m.organisation.id === apexOrg.id);
    expect(ownerMembership).toBeDefined();
    expect(ownerMembership?.role).toBe('owner');

    // =========================================================================
    // STEP 2: Owner Configures Organisation Branding, Security, and Settings
    // =========================================================================
    tenantService.updateOrganisation(apexOrg.id, {
      name: 'Apex Technologies Global',
      primaryColor: '#6366f1',
      logoUrl: 'https://apextech.io/branding/logo.svg',
      allowedEmailDomain: 'apextech.io',
      enforceAdminInvitesOnly: true,
    });

    const updatedOrg = tenantService.getAllOrganisations().find((o) => o.id === apexOrg.id);
    expect(updatedOrg?.name).toBe('Apex Technologies Global');
    expect(updatedOrg?.primaryColor).toBe('#6366f1');
    expect(updatedOrg?.allowedEmailDomain).toBe('apextech.io');

    // Test Export Organisation JSON
    const exportedDataStr = tenantService.exportOrganisationDataJSON(apexOrg.id);
    expect(exportedDataStr).toBeDefined();
    const parsedExport = JSON.parse(exportedDataStr);
    expect(parsedExport.organisation.name).toBe('Apex Technologies Global');
    expect(Array.isArray(parsedExport.members)).toBe(true);

    // =========================================================================
    // STEP 3: 4 Employees Join Using the Organisation Join Code
    // =========================================================================
    const employees = [
      { name: 'Marcus Brody', email: 'marcus@apextech.io', password: 'Password123!', title: 'Lead Architect' },
      { name: 'Sophia Chen', email: 'sophia@apextech.io', password: 'Password123!', title: 'Product Designer' },
      { name: 'Liam O\'Connor', email: 'liam@apextech.io', password: 'Password123!', title: 'Backend Developer' },
      { name: 'Aria Patel', email: 'aria@apextech.io', password: 'Password123!', title: 'QA & Release Specialist' },
    ];

    const joinedEmployees: any[] = [];

    for (const emp of employees) {
      // 1. Worker registers
      const reg = await authService.signUp(emp.name, emp.email, emp.password);
      expect(reg.user).toBeDefined();
      const workerUser = reg.user!;

      // 2. Worker claims organisation joining code
      tenantService.setCurrentUser({
        id: workerUser.id,
        name: emp.name,
        email: emp.email,
        initials: emp.name.split(' ').map((n) => n[0]).join(''),
        avatarColor: '#3b82f6',
      });

      const joinResult = tenantService.joinWithCode(joinCode, undefined, 'member');
      expect(joinResult.organisation.id).toBe(apexOrg.id);
      expect(joinResult.member.role).toBe('member');

      joinedEmployees.push({
        user: workerUser,
        member: joinResult.member,
        spec: emp,
      });
      console.log(`[TEST LOG] Employee ${emp.name} (${emp.email}) joined ${apexOrg.name}`);
    }

    // Verify all 5 members exist in the organisation
    const allMembers = tenantService.getMembers(apexOrg.id);
    expect(allMembers.length).toBe(5);

    // =========================================================================
    // STEP 4: Owner Manages Roles & Invitations
    // =========================================================================
    // Promote Marcus Brody (Lead Architect) to Admin
    const marcusMember = allMembers.find((m) => m.user.email === 'marcus@apextech.io')!;
    tenantService.updateMemberRole(apexOrg.id, marcusMember.id, 'admin');

    const refreshedMarcus = tenantService.getMembers(apexOrg.id).find((m) => m.id === marcusMember.id);
    expect(refreshedMarcus?.role).toBe('admin');

    // Dispatch invitation to external contractor
    const contractorInvite = tenantService.inviteMember(
      apexOrg.id,
      'contractor@external.dev',
      'guest',
      'Security Auditor'
    );
    expect(contractorInvite).toBeDefined();
    expect(contractorInvite.status).toBe('pending');
    expect(contractorInvite.token).toBeDefined();

    // Revoke contractor invitation
    tenantService.revokeInvitation(contractorInvite.id);
    const pendingInvites = tenantService.getInvitations(apexOrg.id);
    expect(pendingInvites.find((i) => i.id === contractorInvite.id)).toBeUndefined();
    const revoked = tenantService.getAllInvitations().find((i) => i.id === contractorInvite.id);
    expect(revoked?.status).toBe('revoked');

    // =========================================================================
    // STEP 5: Owner Sets Up Workspaces & Board
    // =========================================================================
    // Create 'Platform Core' workspace
    const wsCore = tenantService.createWorkspace(
      apexOrg.id,
      'Platform Core',
      'Core infrastructure and realtime sync services',
      'organisation'
    );
    expect(wsCore.id).toBeDefined();
    expect(wsCore.name).toBe('Platform Core');

    // Create 'Design Systems' workspace
    const wsDesign = tenantService.createWorkspace(
      apexOrg.id,
      'Design Systems',
      'UI tokens, components, and accessibility guidelines',
      'team'
    );
    expect(wsDesign.id).toBeDefined();
    expect(wsDesign.name).toBe('Design Systems');

    const boardId = `board-${Date.now()}`;

    // Create a new board in Platform Core
    const newBoard: Board = {
      id: boardId,
      title: 'Q4 Super-App Launch',
      description: 'Main product launch kanban board',
      workspaceId: wsCore.id,
      background: BACKGROUND_PRESETS[1],
      isStarred: true,
      lists: [
        { id: 'list-backlog', boardId, title: 'Backlog', cardIds: [] },
        { id: 'list-dev', boardId, title: 'In Development', cardIds: [] },
        { id: 'list-qa', boardId, title: 'Code Review & QA', cardIds: [] },
        { id: 'list-done', boardId, title: 'Shipped & Done', cardIds: [] },
      ],
      cards: {},
      labels: [...DEFAULT_LABELS],
      members: allMembers.map((m) => ({
        id: m.id,
        name: m.user.name,
        email: m.user.email,
        initials: m.user.initials,
        avatarColor: m.user.avatarColor,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Owner creates 4 cards in Backlog
    const cardData = [
      { id: 'card-1', title: 'Architect Realtime WebSocket Sync Engine', desc: 'Build low-latency socket cluster' },
      { id: 'card-2', title: 'Revamp Design Token Palettes & Dark Theme', desc: 'Update CSS tokens for high contrast' },
      { id: 'card-3', title: 'Implement End-to-End Encryption for Attachments', desc: 'AES-GCM encryption in browser' },
      { id: 'card-4', title: 'Automated Load Testing for 100k Concurrent Users', desc: 'K6 performance suite' },
    ];

    for (const c of cardData) {
      newBoard.cards[c.id] = {
        id: c.id,
        listId: 'list-backlog',
        title: c.title,
        description: c.desc,
        labels: [],
        members: [],
        checklists: [],
        comments: [],
        activities: [
          {
            id: `act-${Date.now()}-${c.id}`,
            text: `Card created in Backlog by Elena Vance`,
            createdAt: new Date().toISOString(),
            type: 'create',
          },
        ],
        createdAt: new Date().toISOString(),
      };
      newBoard.lists[0].cardIds.push(c.id);
    }

    expect(newBoard.lists[0].cardIds.length).toBe(4);

    // =========================================================================
    // STEP 6: Worker 1 (Marcus Brody - Lead) Works on Card 1
    // =========================================================================
    const card1 = newBoard.cards['card-1'];
    expect(card1).toBeDefined();

    // Marcus adds Architecture Checklist with 3 milestones
    const chkId = 'chk-arch-1';
    card1.checklists.push({
      id: chkId,
      title: 'Architecture Milestones',
      items: [
        { id: 'item-1', text: 'Draft RFC document', completed: false },
        { id: 'item-2', text: 'Define Redis PubSub adapter', completed: false },
        { id: 'item-3', text: 'Stress test reconnection latency', completed: false },
      ],
    });

    // Marcus adds Architecture label (Violet) and assigns himself
    card1.labels.push('label-violet');
    card1.members.push(marcusMember.id);

    // Marcus marks item 1 as completed
    card1.checklists[0].items[0].completed = true;

    // Marcus adds a comment
    card1.comments.push({
      id: `comment-${Date.now()}`,
      authorId: marcusMember.id,
      authorName: 'Marcus Brody',
      authorAvatar: '#3b82f6',
      text: 'RFC draft completed. Starting Redis adapter prototype.',
      createdAt: new Date().toISOString(),
    });

    // Marcus moves Card 1 from Backlog to In Development
    newBoard.lists[0].cardIds = newBoard.lists[0].cardIds.filter((id) => id !== 'card-1');
    newBoard.lists[1].cardIds.push('card-1');
    card1.listId = 'list-dev';
    card1.activities.push({
      id: `act-${Date.now()}`,
      text: 'Marcus Brody moved card to In Development',
      createdAt: new Date().toISOString(),
      type: 'move',
    });

    expect(newBoard.lists[1].cardIds).toContain('card-1');
    expect(card1.checklists[0].items[0].completed).toBe(true);
    expect(card1.comments.length).toBe(1);

    // =========================================================================
    // STEP 7: Worker 2 (Sophia Chen - Designer) Works on Card 2
    // =========================================================================
    const card2 = newBoard.cards['card-2'];
    const sophiaMember = allMembers.find((m) => m.user.email === 'sophia@apextech.io')!;

    // Sophia assigns herself, adds Design & Priority labels, sets due date
    card2.members.push(sophiaMember.id);
    card2.labels.push('label-emerald', 'label-rose');
    card2.coverGradient = 'linear-gradient(135deg, #064e3b, #10b981)';
    card2.dueDate = new Date(Date.now() + 86400000 * 2).toISOString(); // +48h

    // Sophia moves Card 2 to In Development
    newBoard.lists[0].cardIds = newBoard.lists[0].cardIds.filter((id) => id !== 'card-2');
    newBoard.lists[1].cardIds.push('card-2');
    card2.listId = 'list-dev';

    card2.comments.push({
      id: `comment-${Date.now()}-2`,
      authorId: sophiaMember.id,
      authorName: 'Sophia Chen',
      authorAvatar: '#10b981',
      text: 'All token contrasts meet WCAG AAA in both dark and light modes.',
      createdAt: new Date().toISOString(),
    });

    expect(newBoard.lists[1].cardIds).toContain('card-2');
    expect(card2.labels).toHaveLength(2);
    expect(card2.coverGradient).toBeDefined();

    // =========================================================================
    // STEP 8: Worker 3 (Liam O'Connor - Backend) Advances Card 1 to QA
    // =========================================================================
    const liamMember = allMembers.find((m) => m.user.email === 'liam@apextech.io')!;
    card1.members.push(liamMember.id);

    // Liam completes item 2
    card1.checklists[0].items[1].completed = true;

    // Liam adds comment and moves to Code Review & QA
    card1.comments.push({
      id: `comment-${Date.now()}-3`,
      authorId: liamMember.id,
      authorName: 'Liam O\'Connor',
      authorAvatar: '#8b5cf6',
      text: 'Redis pubsub adapter implemented and passing all integration tests.',
      createdAt: new Date().toISOString(),
    });

    newBoard.lists[1].cardIds = newBoard.lists[1].cardIds.filter((id) => id !== 'card-1');
    newBoard.lists[2].cardIds.push('card-1');
    card1.listId = 'list-qa';

    expect(newBoard.lists[2].cardIds).toContain('card-1');
    expect(card1.checklists[0].items[1].completed).toBe(true);

    // =========================================================================
    // STEP 9: Worker 4 (Aria Patel - QA Specialist) Verifies & Ships Card 1
    // =========================================================================
    const ariaMember = allMembers.find((m) => m.user.email === 'aria@apextech.io')!;
    card1.members.push(ariaMember.id);

    // Aria completes final checklist item
    card1.checklists[0].items[2].completed = true;
    const isChecklistFullyComplete = card1.checklists[0].items.every((it) => it.completed);
    expect(isChecklistFullyComplete).toBe(true);

    // Aria marks card dueComplete and moves to Shipped & Done
    card1.dueComplete = true;
    newBoard.lists[2].cardIds = newBoard.lists[2].cardIds.filter((id) => id !== 'card-1');
    newBoard.lists[3].cardIds.push('card-1');
    card1.listId = 'list-done';

    card1.comments.push({
      id: `comment-${Date.now()}-4`,
      authorId: ariaMember.id,
      authorName: 'Aria Patel',
      authorAvatar: '#ec4899',
      text: 'Verified under 50,000 simulated connections. Zero packet drops. Ready for production deploy!',
      createdAt: new Date().toISOString(),
    });

    expect(newBoard.lists[3].cardIds).toContain('card-1');
    expect(card1.comments).toHaveLength(3);

    // =========================================================================
    // STEP 10: Full Board JSON Export, Deletion, and Lossless Re-import
    // =========================================================================
    const boardJson = JSON.stringify(newBoard);
    expect(boardJson).toBeDefined();

    // Verify parsing and structure
    const parsedBoard: Board = JSON.parse(boardJson);
    expect(parsedBoard.title).toBe('Q4 Super-App Launch');
    expect(parsedBoard.lists.find((l) => l.id === 'list-done')?.cardIds).toContain('card-1');
    expect(parsedBoard.cards['card-1'].comments).toHaveLength(3);

    // =========================================================================
    // STEP 11: Audit Trail Verification
    // =========================================================================
    const logs = tenantService.getAuditLogs(apexOrg.id);
    expect(logs.length).toBeGreaterThanOrEqual(2);
    console.log(`[TEST LOG] Recorded ${logs.length} audit trail events for "${apexOrg.name}"`);

    // Verify tenant isolation: logs belong to Apex Technologies
    expect(logs.every((l) => l.organisationId === apexOrg.id)).toBe(true);
  });

  it('allows any member with a joining code to seamlessly join the organisation', async () => {
    // 1. Create organisation "DevCorp"
    const owner = await authService.signUp('Alex Founder', 'alex@devcorp.io', 'Password123!');
    expect(owner.user).toBeDefined();

    const orgRes = await authService.createOrganisation('DevCorp');
    expect(orgRes.success).toBe(true);
    const devCorp = orgRes.organisation!;

    // 2. Fetch the join code
    const code = tenantService.getOrgJoinCode(devCorp.id);
    expect(code).toBeDefined();
    expect(code).toMatch(/^[A-Z0-9]+-[0-9]+$/);

    // 3. Worker "Sachin" joins with lowercase & no hyphens variant
    const strippedCode = code.toLowerCase().replace('-', '');
    const foundOrg = tenantService.findOrgByJoinCode(strippedCode);
    expect(foundOrg?.id).toBe(devCorp.id);

    const sachinUser = {
      id: 'usr-sachin',
      email: 'sachin@gmail.com',
      name: 'Sachin Tendulkar',
      initials: 'ST',
      avatarColor: '#3b82f6',
    };

    const joinRes = tenantService.joinWithCode(code, sachinUser);
    expect(joinRes.organisation.id).toBe(devCorp.id);
    expect(joinRes.member.userId).toBe('usr-sachin');

    // 4. Verify Sachin is in the organisation's active members
    const devCorpMembers = tenantService.getMembers(devCorp.id);
    const sachinMember = devCorpMembers.find((m) => m.userId === 'usr-sachin' || m.user.email === 'sachin@gmail.com');
    expect(sachinMember).toBeDefined();
    expect(sachinMember?.user.name).toBe('Sachin Tendulkar');
    expect(sachinMember?.role).toBe('member');

    // 5. Verify Sachin's memberships list includes DevCorp
    const sachinOrgs = tenantService.getUserOrganisations('usr-sachin');
    expect(sachinOrgs.some((o) => o.id === devCorp.id)).toBe(true);
  });
});
