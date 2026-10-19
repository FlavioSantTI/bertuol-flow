-- =========================================================================
-- SCRIPT DE MENSAGERIA INTERNA (SUPABASE / POSTGRESQL)
-- Projeto: Bertuol Odontologia Avançada (sswbkfrpxboxmjvunhzt)
-- Módulo: Conversas em Tempo Real, Atendimento, Participantes e Auditoria
-- =========================================================================
-- Execute este script no SQL Editor do seu projeto Supabase:
-- Link direto: https://supabase.com/dashboard/project/sswbkfrpxboxmjvunhzt/sql
-- =========================================================================

-- 1. Habilitar extensão para geração de UUID caso não esteja ativa
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Conversas (conversations)
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id INTEGER NOT NULL DEFAULT 1,
    patient_id TEXT,
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
    subject TEXT DEFAULT 'Atendimento Bertuol Flow',
    assigned_to_user_id TEXT,
    assigned_to_name TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_preview TEXT,
    closed_at TIMESTAMPTZ
);

-- 3. Tabela de Mensagens (messages)
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('patient', 'staff', 'dentist', 'system')),
    sender_name TEXT NOT NULL,
    sender_user_id TEXT,
    sender_patient_id TEXT,
    body TEXT NOT NULL,
    client_message_id TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela de Participantes da Conversa (conversation_participants)
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    participant_type TEXT NOT NULL CHECK (participant_type IN ('patient', 'staff', 'dentist')),
    user_id TEXT,
    user_name TEXT,
    patient_id TEXT,
    added_by TEXT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 5. Tabela de Eventos de Auditoria e Histórico (conversation_events)
CREATE TABLE IF NOT EXISTS public.conversation_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    actor_id TEXT,
    actor_name TEXT,
    actor_type TEXT,
    event_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Índices para Alto Desempenho
CREATE INDEX IF NOT EXISTS idx_conversations_clinic_status ON public.conversations(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_patient_phone ON public.conversations(patient_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON public.messages(client_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_participants_conv ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_events_conv ON public.conversation_events(conversation_id, created_at ASC);

-- 7. Configuração de RLS (Row Level Security) e Permissões Seguras
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_events ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso irrestrito para chave anon da API do backend Bertuol Flow
DROP POLICY IF EXISTS "Anon Conversations Policy" ON public.conversations;
CREATE POLICY "Anon Conversations Policy" ON public.conversations 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Messages Policy" ON public.messages;
CREATE POLICY "Anon Messages Policy" ON public.messages 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Participants Policy" ON public.conversation_participants;
CREATE POLICY "Anon Participants Policy" ON public.conversation_participants 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Events Policy" ON public.conversation_events;
CREATE POLICY "Anon Events Policy" ON public.conversation_events 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- Garantir privilégios
GRANT ALL ON public.conversations TO anon, authenticated, service_role;
GRANT ALL ON public.messages TO anon, authenticated, service_role;
GRANT ALL ON public.conversation_participants TO anon, authenticated, service_role;
GRANT ALL ON public.conversation_events TO anon, authenticated, service_role;

-- 8. Ativação no Supabase Realtime (WebSockets para chat instantâneo)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 9. Inserção de dados iniciais reais para validação (opcional / idempotente)
INSERT INTO public.conversations (id, clinic_id, patient_name, patient_phone, status, subject, assigned_to_name, last_message_preview)
VALUES 
  ('conv-init-1', 1, 'Paciente Teste Bertuol', '63992474826', 'open', 'Atendimento de Boas-Vindas', 'Recepção Palmas', 'Olá! Seja bem-vindo à mensageria oficial da Bertuol Odontologia.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.messages (id, conversation_id, sender_type, sender_name, body, client_message_id, is_read)
VALUES
  ('msg-init-1', 'conv-init-1', 'staff', 'Recepção Palmas', 'Olá! Seja bem-vindo à mensageria oficial da Bertuol Odontologia.', 'cli-init-1', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.conversation_participants (id, conversation_id, participant_type, user_name, is_active)
VALUES
  ('part-init-1', 'conv-init-1', 'staff', 'Recepção Palmas', true)
ON CONFLICT (id) DO NOTHING;

-- Verificação final do status das tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('conversations', 'messages', 'conversation_participants', 'conversation_events');
