import { describe, it, expect } from 'vitest';
import { getSupabaseClient } from '../lib/supabase';
import { toUUID } from './tenantService';

describe('Live Chat Verification in Supabase', () => {
  const akashEmail = 'akashrithurishitha@gmail.com';
  const akashId = '89ed757d-51a1-4592-a84c-40efdb8eab0f';
  const strivecadEmail = 'strivecad@gmail.com';
  const strivecadId = '705290e1-4290-4ac6-a2c2-3a27b2e33ba7';
  const orgId = '36648316-81af-4a09-a7cb-e91fb813ed1f';

  it('tests bidirectional chat messaging between Akash and Strivecad', async () => {
    const client = getSupabaseClient();
    const emailConvKey = [akashEmail, strivecadEmail].sort().join('__');

    // 1. Akash sends "Hello strivecad"
    const msg1Id = toUUID(`msg-akash-${Date.now()}`);
    const { data: d1, error: e1 } = await client
      .from('chat_messages')
      .insert({
        id: msg1Id,
        organisation_id: toUUID(orgId),
        conversation_key: emailConvKey,
        sender_id: toUUID(akashId),
        sender_name: 'akash',
        sender_email: akashEmail,
        recipient_id: toUUID(strivecadId),
        recipient_email: strivecadEmail,
        text: 'Hello strivecad! Glad to have you on the Crest team.',
        status: 'sent',
      })
      .select();

    expect(e1).toBeNull();
    expect(d1?.length).toBe(1);

    // 2. Strivecad replies "Thanks Akash! Ready to work."
    const msg2Id = toUUID(`msg-strivecad-${Date.now()}`);
    const { data: d2, error: e2 } = await client
      .from('chat_messages')
      .insert({
        id: msg2Id,
        organisation_id: toUUID(orgId),
        conversation_key: emailConvKey,
        sender_id: toUUID(strivecadId),
        sender_name: 'strivecad',
        sender_email: strivecadEmail,
        recipient_id: toUUID(akashId),
        recipient_email: akashEmail,
        text: 'Thanks Akash! Ready to work.',
        status: 'sent',
      })
      .select();

    expect(e2).toBeNull();
    expect(d2?.length).toBe(1);

    // 3. Query conversation from Strivecad's perspective
    const filterParts = [
      `conversation_key.eq.${emailConvKey}`,
      `and(sender_email.eq.${akashEmail},recipient_email.eq.${strivecadEmail})`,
      `and(sender_email.eq.${strivecadEmail},recipient_email.eq.${akashEmail})`,
    ];

    const { data: conversation, error: qErr } = await client
      .from('chat_messages')
      .select('*')
      .or(filterParts.join(','))
      .order('created_at', { ascending: true });

    expect(qErr).toBeNull();
    expect(conversation).toBeDefined();
    expect(conversation!.length).toBeGreaterThanOrEqual(2);

    const texts = conversation!.map((m) => m.text);
    expect(texts).toContain('Hello strivecad! Glad to have you on the Crest team.');
    expect(texts).toContain('Thanks Akash! Ready to work.');
  }, 15000);
});


