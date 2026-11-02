import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type { Board, List, Card } from '../types';
import type { Organisation, Workspace } from '../types/saas';
import { INITIAL_PLANS } from './tenantService';

export interface SupabaseSyncReport {
  timestamp: string;
  success: boolean;
  message: string;
  stats: {
    plansUpserted: number;
    organisationsUpserted: number;
    workspacesUpserted: number;
    boardsUpserted: number;
    listsUpserted: number;
    cardsUpserted: number;
  };
  errors?: string[];
}

export interface SchemaInspection {
  hasSubscriptionPlans: boolean;
  hasOrganisations: boolean;
  hasWorkspaces: boolean;
  hasBoards: boolean;
  hasLists: boolean;
  hasCards: boolean;
  allTablesReady: boolean;
}

export class SupabaseDataService {
  /**
   * Inspect which tables exist and are queryable in the Supabase database.
   */
  async inspectSchema(): Promise<SchemaInspection> {
    const client = getSupabaseClient();
    const result: SchemaInspection = {
      hasSubscriptionPlans: false,
      hasOrganisations: false,
      hasWorkspaces: false,
      hasBoards: false,
      hasLists: false,
      hasCards: false,
      allTablesReady: false,
    };

    if (!isSupabaseConfigured()) {
      return result;
    }

    try {
      const checkTable = async (table: string): Promise<boolean> => {
        const { error } = await client.from(table).select('id').limit(1);
        return !error || error.code !== '42P01'; // 42P01 is undefined_table
      };

      const [p, o, w, b, l, c] = await Promise.all([
        checkTable('subscription_plans'),
        checkTable('organisations'),
        checkTable('workspaces'),
        checkTable('boards'),
        checkTable('lists'),
        checkTable('cards'),
      ]);

      result.hasSubscriptionPlans = p;
      result.hasOrganisations = o;
      result.hasWorkspaces = w;
      result.hasBoards = b;
      result.hasLists = l;
      result.hasCards = c;
      result.allTablesReady = p && o && w && b && l && c;
    } catch (e) {
      console.error('Error inspecting Supabase schema:', e);
    }

    return result;
  }

  /**
   * Push and seed multi-tenant demo data into Supabase
   */
  async pushDemoData(
    organisations: Organisation[],
    workspaces: Workspace[],
    boards: Board[]
  ): Promise<SupabaseSyncReport> {
    const client = getSupabaseClient();
    const report: SupabaseSyncReport = {
      timestamp: new Date().toISOString(),
      success: false,
      message: '',
      stats: {
        plansUpserted: 0,
        organisationsUpserted: 0,
        workspacesUpserted: 0,
        boardsUpserted: 0,
        listsUpserted: 0,
        cardsUpserted: 0,
      },
      errors: [],
    };

    if (!isSupabaseConfigured()) {
      report.message = 'Supabase client is not configured with valid URL & API key.';
      report.errors?.push(report.message);
      return report;
    }

    try {
      // 1. Sync subscription plans
      const planPayloads = INITIAL_PLANS.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        is_active: p.isActive,
        trial_days: p.trialDays,
        monthly_price_cents: p.monthlyPriceCents,
        yearly_price_cents: p.yearlyPriceCents,
        max_members: p.maxMembers,
        max_workspaces: p.maxWorkspaces,
        max_boards: p.maxBoards,
        storage_allowance_bytes: p.storageAllowanceBytes,
        max_automations_per_month: p.maxAutomationsPerMonth,
        allow_guest_access: p.allowGuestAccess,
        allow_custom_branding: p.allowCustomBranding,
        allow_data_export: p.allowDataExport,
        allow_advanced_audit_logs: p.allowAdvancedAuditLogs,
      }));

      const { error: planErr } = await client
        .from('subscription_plans')
        .upsert(planPayloads, { onConflict: 'id' });

      if (planErr) {
        report.errors?.push(`Plans sync: ${planErr.message}`);
      } else {
        report.stats.plansUpserted = planPayloads.length;
      }

      // 2. Sync Organisations
      // Map organisations with UUIDs if they are in org-slug format
      const orgPayloads = organisations.map((org) => {
        // If org.id is string like 'org-acme', generate or keep valid UUID format
        const id = toUUID(org.id);
        return {
          id,
          name: org.name,
          slug: org.slug || org.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          join_code: org.joinCode || null,
          logo_url: org.logoUrl || null,
          primary_color: org.primaryColor || '#3b82f6',
          status: org.status || 'active',
          status_reason: org.statusReason || null,
          plan_id: org.planId || 'professional',
          used_storage_bytes: org.usedStorageBytes || 0,
          allowed_email_domain: org.allowedEmailDomain || null,
          enforce_admin_invites_only: org.enforceAdminInvitesOnly ?? true,
        };
      });

      const { error: orgErr } = await client
        .from('organisations')
        .upsert(orgPayloads, { onConflict: 'id' });

      if (orgErr) {
        report.errors?.push(`Organisations sync: ${orgErr.message}`);
      } else {
        report.stats.organisationsUpserted = orgPayloads.length;
      }

      // 3. Sync Workspaces
      const wsPayloads = workspaces.map((ws) => {
        const id = toUUID(ws.id);
        const orgId = toUUID(ws.organisationId);
        return {
          id,
          organisation_id: orgId,
          name: ws.name,
          slug: ws.slug || ws.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          description: ws.description || null,
          visibility: ws.visibility || 'organisation',
          created_by: toUUID(ws.createdBy || 'user-admin-default'),
        };
      });

      if (wsPayloads.length > 0) {
        const { error: wsErr } = await client
          .from('workspaces')
          .upsert(wsPayloads, { onConflict: 'id' });

        if (wsErr) {
          report.errors?.push(`Workspaces sync: ${wsErr.message}`);
        } else {
          report.stats.workspacesUpserted = wsPayloads.length;
        }
      }

      // 4. Sync Boards, Lists, and Cards
      let allLists: List[] = [];
      let allCards: Card[] = [];

      for (const b of boards) {
        const boardId = toUUID(b.id);
        const orgId = toUUID(b.organisationId || organisations[0]?.id || 'org-acme');
        const wsId = toUUID(b.workspaceId || workspaces[0]?.id || 'ws-default');

        const { error: boardErr } = await client.from('boards').upsert(
          {
            id: boardId,
            organisation_id: orgId,
            workspace_id: wsId,
            title: b.title,
            description: b.description || '',
            is_starred: b.isStarred || false,
            background: b.background,
            created_by: toUUID('user-admin-default'),
          },
          { onConflict: 'id' }
        );

        if (boardErr) {
          report.errors?.push(`Board "${b.title}": ${boardErr.message}`);
        } else {
          report.stats.boardsUpserted += 1;
        }

        // Collect lists and cards
        if (b.lists) {
          b.lists.forEach((list, idx) => {
            allLists.push({ ...list, boardId: b.id, position: (idx + 1) * 1000 } as any);
          });
        }

        if (b.cards) {
          Object.values(b.cards).forEach((card: Card, cIdx: number) => {
            allCards.push({
              ...card,
              boardId: b.id,
              position: (cIdx + 1) * 1000,
            } as any);
          });
        }
      }

      // Upsert lists
      if (allLists.length > 0) {
        const listPayloads = allLists.map((l: any) => ({
          id: toUUID(l.id),
          board_id: toUUID(l.boardId),
          organisation_id: toUUID(organisations[0]?.id || 'org-acme'),
          title: l.title,
          position: l.position || 1000,
        }));

        const { error: listErr } = await client
          .from('lists')
          .upsert(listPayloads, { onConflict: 'id' });

        if (listErr) {
          report.errors?.push(`Lists sync: ${listErr.message}`);
        } else {
          report.stats.listsUpserted = listPayloads.length;
        }
      }

      // Upsert cards
      if (allCards.length > 0) {
        const cardPayloads = allCards.map((c: any) => ({
          id: toUUID(c.id),
          board_id: toUUID(c.boardId),
          list_id: toUUID(c.listId),
          organisation_id: toUUID(organisations[0]?.id || 'org-acme'),
          title: c.title,
          description: c.description || '',
          position: c.position || 1000,
          due_date: c.dueDate || null,
          due_complete: c.dueComplete || false,
          created_by: toUUID('user-admin-default'),
        }));

        const { error: cardErr } = await client
          .from('cards')
          .upsert(cardPayloads, { onConflict: 'id' });

        if (cardErr) {
          report.errors?.push(`Cards sync: ${cardErr.message}`);
        } else {
          report.stats.cardsUpserted = cardPayloads.length;
        }
      }

      const totalErrors = report.errors?.length || 0;
      report.success = totalErrors === 0;
      report.message = report.success
        ? `Successfully pushed all multi-tenant data to Supabase (${report.stats.organisationsUpserted} orgs, ${report.stats.boardsUpserted} boards, ${report.stats.cardsUpserted} cards)!`
        : `Completed with ${totalErrors} issue(s). Check that database migration has been run in Supabase.`;
    } catch (err: any) {
      report.success = false;
      report.message = err?.message || 'Error executing push to Supabase.';
      report.errors?.push(report.message);
    }

    return report;
  }

  /**
   * Pull organisations and boards from Supabase
   */
  async pullDataFromSupabase(): Promise<{
    success: boolean;
    organisations: any[];
    workspaces: any[];
    boards: any[];
    message: string;
  }> {
    const client = getSupabaseClient();
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        organisations: [],
        workspaces: [],
        boards: [],
        message: 'Supabase is not configured.',
      };
    }

    try {
      const [orgsRes, wsRes, boardsRes, listsRes, cardsRes] = await Promise.all([
        client.from('organisations').select('*'),
        client.from('workspaces').select('*'),
        client.from('boards').select('*'),
        client.from('lists').select('*').order('position', { ascending: true }),
        client.from('cards').select('*').order('position', { ascending: true }),
      ]);

      if (orgsRes.error) throw orgsRes.error;

      // Group lists and cards into boards
      const listsByBoard: Record<string, any[]> = {};
      (listsRes.data || []).forEach((l: any) => {
        if (!listsByBoard[l.board_id]) listsByBoard[l.board_id] = [];
        listsByBoard[l.board_id].push(l);
      });

      const cardsByList: Record<string, any[]> = {};
      (cardsRes.data || []).forEach((c: any) => {
        if (!cardsByList[c.list_id]) cardsByList[c.list_id] = [];
        cardsByList[c.list_id].push(c);
      });

      const constructedBoards: Board[] = (boardsRes.data || []).map((b: any) => {
        const boardCardsMap: Record<string, Card> = {};

        const boardLists = (listsByBoard[b.id] || []).map((l: any) => {
          const listCards = cardsByList[l.id] || [];
          const cardIds: string[] = [];

          listCards.forEach((c: any) => {
            cardIds.push(c.id);
            boardCardsMap[c.id] = {
              id: c.id,
              listId: l.id,
              title: c.title,
              description: c.description || '',
              dueDate: c.due_date || undefined,
              dueComplete: c.due_complete || false,
              labels: [],
              members: [],
              checklists: [],
              comments: [],
              activities: [],
              createdAt: c.created_at || new Date().toISOString(),
            };
          });

          return {
            id: l.id,
            boardId: b.id,
            title: l.title,
            cardIds,
          };
        });

        return {
          id: b.id,
          organisationId: b.organisation_id,
          workspaceId: b.workspace_id,
          title: b.title,
          description: b.description || '',
          isStarred: b.is_starred || false,
          background: b.background,
          lists: boardLists,
          cards: boardCardsMap,
          labels: [],
          members: [],
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        };
      });

      return {
        success: true,
        organisations: orgsRes.data || [],
        workspaces: wsRes.data || [],
        boards: constructedBoards,
        message: `Successfully loaded ${orgsRes.data?.length || 0} organisations and ${constructedBoards.length} boards from Supabase.`,
      };
    } catch (err: any) {
      return {
        success: false,
        organisations: [],
        workspaces: [],
        boards: [],
        message: err?.message || 'Failed to pull data from Supabase.',
      };
    }
  }
}

// Deterministic helper to convert arbitrary string IDs (e.g., 'org-acme') to valid RFC 4122 UUID v4
function toUUID(str: string): string {
  // If already standard UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(str)) {
    return str.toLowerCase();
  }

  // Create deterministic UUID from string hash
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

export const supabaseDataService = new SupabaseDataService();
