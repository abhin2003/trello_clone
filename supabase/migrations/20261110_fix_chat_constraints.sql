-- ============================================================================
-- STRATCREST FLOW - REAL-TIME CHAT CROSS-DEVICE CONSTRAINT REMOVAL
-- ============================================================================
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- Drops foreign key locks to auth.users so workspace users can send chat messages.
-- ============================================================================

ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_recipient_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_organisation_id_fkey;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Chat message access by all" ON public.chat_messages;
CREATE POLICY "Chat message access by all" ON public.chat_messages FOR ALL USING (true);

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN others THEN null;
END $$;
