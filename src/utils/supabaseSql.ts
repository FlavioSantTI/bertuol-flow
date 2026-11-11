export const SUPABASE_DDL_SCRIPT = `-- ============================================================
-- BERTUOL ODONTOLOGIA AVANÇADA - SUPABASE DB_Bertuol (SSWBKFR...)
-- Script DDL: Sistema Multi-Clínicas, Agendamentos, RBAC & Push
-- Perfis: Admin Root, Admin Técnico, Gerente de Atendimento, Dentista, Recepção
-- ============================================================

-- 1. TABELA DE CATEGORIAS / ESPECIALIDADES
CREATE TABLE IF NOT EXISTS public.appointment_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL, -- Cor HEX
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir especialidades padrão com as cores do Design System Bertuol
INSERT INTO public.appointment_categories (id, name, color) VALUES
    ('cat_orto', 'Ortodontia', '#8B5CF6'),
    ('cat_impl', 'Implantodontia', '#0284C7'),
    ('cat_endo', 'Endodontia', '#E11D48'),
    ('cat_rest', 'Dentística Restauradora', '#D97706'),
    ('cat_prev', 'Profilaxia e Prevenção', '#059669'),
    ('cat_urg',  'Urgência Odontológica', '#DC2626')
ON CONFLICT (id) DO NOTHING;

-- 2. TABELA DE AGENDAMENTOS (Compatível com Clinicorp e IA Gemini)
CREATE TABLE IF NOT EXISTS public.appointments (
    id BIGSERIAL PRIMARY KEY,
    id_clinicorp BIGINT,                         -- ID do agendamento no Clinicorp
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    dentist_id BIGINT NOT NULL REFERENCES public.dentistas(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(50),
    procedures TEXT NOT NULL,                    -- Ex: "Instalação de Alinhadores Invisíveis"
    notes TEXT,                                 -- Anamnese / Observações clínicas
    from_time VARCHAR(10) NOT NULL,             -- Ex: "09:30"
    to_time VARCHAR(10) NOT NULL,               -- Ex: "10:30"
    date DATE NOT NULL,                         -- Ex: "2026-09-26"
    atomic_date BIGINT,                         -- Ex: 202609260930 (ordenador rápido do Clinicorp)
    category_id VARCHAR(50) REFERENCES public.appointment_categories(id),
    ai_summary TEXT,                            -- Resumo clínico inteligente gerado pelo Gemini
    ai_summary_created_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'scheduled',     -- scheduled, completed, cancelled, no_show
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABELA DE USUÁRIOS E PERFIS (RBAC SEGURO)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefone VARCHAR(30),
    role VARCHAR(30) NOT NULL DEFAULT 'dentist',
    -- 'admin_root': Acesso total irrestrito (Favuca)
    -- 'admin_tecnico': TI / Webhooks por clínica autorizada
    -- 'gerente_atendimento': Gestão de todas as agendas da(s) sua(s) clínica(s), sem acesso a configurações
    -- 'dentist': Agenda restrita ao seu próprio atendimento
    -- 'recepcao': Recepção restrita à sua unidade física local
    dentista_id BIGINT,                          -- Vínculo com Clinicorp (apenas se role = 'dentist')
    pin_hash VARCHAR(100),                       -- PIN simples de 4 dígitos para login rápido no tablet/celular
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Compatibilidade com scripts e ferramentas padrão do Supabase que buscam 'profiles':
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
    id,
    id AS user_id,
    nome,
    nome AS full_name,
    email,
    telefone,
    telefone AS phone,
    role,
    dentista_id,
    ativo AS is_active,
    created_at,
    created_at AS updated_at
FROM public.usuarios;

-- 4. VÍNCULO MULTI-CLÍNICA POR USUÁRIO (Permite Gerente gerir Palmas + Paraíso, etc.)
CREATE TABLE IF NOT EXISTS public.usuario_clinicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    clinica_id INT NOT NULL,                     -- 1: Palmas, 2: Paraíso, 3: Araguaína
    criado_em TIMESTAMPTZ DEFAULT now(),
    UNIQUE(usuario_id, clinica_id)
);

-- 5. TABELA DE APARELHOS FÍSICOS (Push Token iPhone APNs / Android FCM)
CREATE TABLE IF NOT EXISTS public.dispositivos_notificacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    aparelho_nome VARCHAR(100),                  -- Ex: "iPhone 15 Pro do Favuca", "Galaxy S23 Dr. Claudio"
    plataforma VARCHAR(20) NOT NULL,             -- 'ios', 'android', 'web'
    push_token TEXT NOT NULL,                    -- Token exclusivo do hardware/navegador
    is_admin_monitor BOOLEAN DEFAULT false,      -- Se true, recebe cópia de todas as notificações para auditoria
    ativo BOOLEAN DEFAULT true,
    ultimo_acesso TIMESTAMPTZ DEFAULT now(),
    criado_em TIMESTAMPTZ DEFAULT now(),
    UNIQUE(usuario_id, push_token)
);

-- 6. ÍNDICES DE ALTA PERFORMANCE (Para buscas em milissegundos)
CREATE INDEX IF NOT EXISTS idx_appointments_dentist_date 
    ON public.appointments (dentist_id, date);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic 
    ON public.appointments (clinic_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_role 
    ON public.usuarios (role) WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_dispositivos_usuario 
    ON public.dispositivos_notificacao (usuario_id) WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_usuario_clinicas_user 
    ON public.usuario_clinicas (usuario_id);

-- 7. ATIVAR ROW LEVEL SECURITY (RLS) E REGRAS IDEMPOTENTES
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispositivos_notificacao ENABLE ROW LEVEL SECURITY;

-- Remover policies pré-existentes para garantir execução segura (evita erro 42710)
DROP POLICY IF EXISTS "Permitir leitura de agendamentos por clínica" ON public.appointments;
CREATE POLICY "Permitir leitura de agendamentos por clínica" 
    ON public.appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção e atualização de agendamentos" ON public.appointments;
CREATE POLICY "Permitir inserção e atualização de agendamentos" 
    ON public.appointments FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura e escrita de categorias" ON public.appointment_categories;
CREATE POLICY "Permitir leitura e escrita de categorias" 
    ON public.appointment_categories FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura e escrita de usuarios" ON public.usuarios;
CREATE POLICY "Permitir leitura e escrita de usuarios" 
    ON public.usuarios FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura e escrita de usuario_clinicas" ON public.usuario_clinicas;
CREATE POLICY "Permitir leitura e escrita de usuario_clinicas" 
    ON public.usuario_clinicas FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir leitura e escrita de dispositivos" ON public.dispositivos_notificacao;
CREATE POLICY "Permitir leitura e escrita de dispositivos" 
    ON public.dispositivos_notificacao FOR ALL USING (true);

-- 8. CARGA INICIAL DE USUÁRIOS PADRÃO (SEEDS)
INSERT INTO public.usuarios (nome, email, role, dentista_id, ativo) VALUES
    ('Favuca Dias (Admin Root)', 'favuca.dias@gmail.com', 'admin_root', NULL, true),
    ('Gerente de Atendimento Multi-Unidades', 'gerencia@bertuolodontologia.com.br', 'gerente_atendimento', NULL, true),
    ('Suporte Técnico TI', 'ti@bertuolodontologia.com.br', 'admin_tecnico', NULL, true),
    ('Dr. Claudio Borba', 'claudio@bertuolodontologia.com.br', 'dentist', 5229563695136768, true),
    ('Dr. Ari Bertuol', 'ari@bertuolodontologia.com.br', 'dentist', 6177152107544576, true),
    ('Dra. Ariane C. Bertuol', 'ariane@bertuolodontologia.com.br', 'dentist', 5454048267862016, true),
    ('Recepção Matriz Palmas', 'recepcao.palmas@bertuolodontologia.com.br', 'recepcao', NULL, true),
    ('Recepção Unidade Paraíso', 'recepcao.paraiso@bertuolodontologia.com.br', 'recepcao', NULL, true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 9. PORTAL DO PACIENTE & GAMIFICAÇÃO (PRD v1.2)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.patient_magic_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_phone VARCHAR(30) NOT NULL,
    session_token VARCHAR(64) UNIQUE NOT NULL,
    appointment_id BIGINT REFERENCES public.appointments(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reception_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id INT NOT NULL,
    appointment_id BIGINT REFERENCES public.appointments(id) ON DELETE CASCADE,
    patient_phone VARCHAR(30) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    dentist_id BIGINT NOT NULL,
    method VARCHAR(30) NOT NULL DEFAULT 'qr_code_totem',
    dentist_notified BOOLEAN DEFAULT false,
    dentist_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gamification_rules (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    points_reward INT NOT NULL,
    trigger_event VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patient_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_phone VARCHAR(30) NOT NULL,
    patient_name VARCHAR(255),
    rule_id VARCHAR(50) REFERENCES public.gamification_rules(id) ON DELETE SET NULL,
    appointment_id BIGINT REFERENCES public.appointments(id) ON DELETE SET NULL,
    points INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rewards_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id INT,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    points_required INT NOT NULL,
    stock_available INT NOT NULL DEFAULT 0,
    voucher_validity_days INT DEFAULT 30,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id UUID NOT NULL REFERENCES public.rewards_catalog(id) ON DELETE RESTRICT,
    patient_phone VARCHAR(30) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    points_spent INT NOT NULL,
    secret_code VARCHAR(12) UNIQUE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    claimed_at TIMESTAMPTZ,
    claimed_by_user_id UUID,
    claimed_clinic_id INT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para novas tabelas de pacientes e gamificação
ALTER TABLE public.patient_magic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reception_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura e escrita de sessoes" ON public.patient_magic_sessions FOR ALL USING (true);
CREATE POLICY "Permitir leitura e escrita de checkins" ON public.reception_checkins FOR ALL USING (true);
CREATE POLICY "Permitir leitura e escrita de regras" ON public.gamification_rules FOR ALL USING (true);
CREATE POLICY "Permitir leitura e escrita de pontos" ON public.patient_points FOR ALL USING (true);
CREATE POLICY "Permitir leitura e escrita de catalogo" ON public.rewards_catalog FOR ALL USING (true);
CREATE POLICY "Permitir leitura e escrita de redencoes" ON public.reward_redemptions FOR ALL USING (true);

-- 9. TABELA DE CREDENCIAIS BIOMÉTRICAS WEBAUTHN / PASSKEYS (FASE 1)
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    public_key TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    device_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_webauthn_user ON public.webauthn_credentials(user_id);
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura e escrita de credenciais webauthn" ON public.webauthn_credentials FOR ALL USING (true);

-- 10. MÓDULO DE MENSAGERIA INTERNA (PRD v2)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id INT NOT NULL,
    patient_id UUID,
    patient_name VARCHAR(150) NOT NULL,
    patient_phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'pending', 'closed'
    subject VARCHAR(150),
    assigned_to_user_id TEXT,
    assigned_to_name VARCHAR(150),
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_message_at TIMESTAMPTZ DEFAULT now(),
    last_message_preview TEXT,
    closed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_conversations_clinic ON public.conversations(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON public.conversations(assigned_to_user_id);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id TEXT,
    user_name VARCHAR(150),
    patient_id TEXT,
    participant_type VARCHAR(20) NOT NULL, -- 'patient', 'staff', 'dentist'
    added_by TEXT,
    added_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(conversation_id, user_id),
    UNIQUE(conversation_id, patient_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'patient', 'staff', 'dentist', 'system'
    sender_user_id TEXT,
    sender_name VARCHAR(150) NOT NULL,
    sender_patient_id TEXT,
    body TEXT NOT NULL,
    client_message_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_client_msg UNIQUE (conversation_id, client_message_id)
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS public.message_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id TEXT,
    patient_id TEXT,
    read_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    actor_id TEXT,
    actor_name VARCHAR(150),
    actor_type VARCHAR(20) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir conversas" ON public.conversations FOR ALL USING (true);
CREATE POLICY "Permitir participantes" ON public.conversation_participants FOR ALL USING (true);
CREATE POLICY "Permitir mensagens" ON public.messages FOR ALL USING (true);
CREATE POLICY "Permitir recibos" ON public.message_receipts FOR ALL USING (true);
CREATE POLICY "Permitir eventos" ON public.conversation_events FOR ALL USING (true);
`;

export const SUPABASE_MESSAGING_DDL = `-- ============================================================
-- BERTUOL FLOW - MÓDULO DE MENSAGERIA INTERNA (SUPABASE DDL)
-- Tabelas: conversations, conversation_participants, messages,
--          message_receipts, conversation_events
-- Execute este script no SQL Editor do Supabase (sswbkfrpxboxmjvunhzt)
-- ============================================================

-- 1. TABELA DE CONVERSAS
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id INT NOT NULL DEFAULT 1,
    clinic_uuid UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    patient_name VARCHAR(150) NOT NULL,
    patient_phone VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'pending', 'closed'
    subject VARCHAR(150),
    assigned_to_user_id TEXT,
    assigned_to_name VARCHAR(150),
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_message_at TIMESTAMPTZ DEFAULT now(),
    last_message_preview TEXT,
    closed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_conversations_clinic_status ON public.conversations(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON public.conversations(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_patient_phone ON public.conversations(patient_phone);

-- 2. TABELA DE PARTICIPANTES DA CONVERSA
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id TEXT,
    user_name VARCHAR(150),
    patient_id TEXT,
    participant_type VARCHAR(20) NOT NULL DEFAULT 'patient', -- 'patient', 'staff', 'dentist'
    added_by TEXT,
    added_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(conversation_id, user_id),
    UNIQUE(conversation_id, patient_id)
);

-- 3. TABELA DE MENSAGENS
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'patient', 'staff', 'dentist', 'system'
    sender_user_id TEXT,
    sender_name VARCHAR(150) NOT NULL,
    sender_patient_id TEXT,
    body TEXT NOT NULL,
    client_message_id UUID NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_client_msg UNIQUE (conversation_id, client_message_id)
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id, created_at ASC);

-- 4. TABELA DE RECIBOS DE LEITURA
CREATE TABLE IF NOT EXISTS public.message_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id TEXT,
    patient_id TEXT,
    read_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TRILHA DE AUDITORIA OPERACIONAL
CREATE TABLE IF NOT EXISTS public.conversation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    actor_id TEXT,
    actor_name VARCHAR(150),
    actor_type VARCHAR(20) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS e criar políticas permissivas
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir conversas" ON public.conversations;
CREATE POLICY "Permitir conversas" ON public.conversations FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir participantes" ON public.conversation_participants;
CREATE POLICY "Permitir participantes" ON public.conversation_participants FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir mensagens" ON public.messages;
CREATE POLICY "Permitir mensagens" ON public.messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir recibos" ON public.message_receipts;
CREATE POLICY "Permitir recibos" ON public.message_receipts FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir eventos" ON public.conversation_events;
CREATE POLICY "Permitir eventos" ON public.conversation_events FOR ALL USING (true);

-- Habilitar Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- 6. INSERIR DADOS REAIS DE DEMONSTRAÇÃO CLÍNICA
INSERT INTO public.conversations (
    id, clinic_id, patient_name, patient_phone, status, subject, assigned_to_name, last_message_preview, created_at, updated_at, last_message_at
) VALUES 
(
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    1,
    'Alice Póvoa',
    '63992474826',
    'open',
    'Dúvida sobre alinhadores e retorno',
    'Recepção Palmas',
    'Olá! Sim, recebemos ontem e já estão prontos para a sua consulta de hoje.',
    now() - interval '2 hours',
    now() - interval '30 minutes',
    now() - interval '30 minutes'
),
(
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    1,
    'Juceline Palmas',
    '63993390500',
    'open',
    'Orientações pós-procedimento',
    'Dra. Ariane Bertuol',
    'Doutora, posso fazer bochecho com antisséptico hoje?',
    now() - interval '4 hours',
    now() - interval '1 hour',
    now() - interval '1 hour'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.messages (
    id, conversation_id, sender_type, sender_name, sender_patient_id, body, client_message_id, is_read, created_at
) VALUES
(
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'patient',
    'Alice Póvoa',
    '63992474826',
    'Olá, gostaria de confirmar se meu novo jogo de alinhadores já chegou na clínica.',
    'd4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f9a',
    true,
    now() - interval '2 hours'
),
(
    'd4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f9b',
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'staff',
    'Recepção Palmas',
    NULL,
    'Olá Alice! Sim, recebemos ontem e já estão prontos para a sua consulta de hoje às 18:00 com a Dra. Ariane.',
    'e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a0b',
    true,
    now() - interval '30 minutes'
),
(
    'e5f6a7b8-9c0d-1e2f-3a4b-5c6d7e8f9a0c',
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'patient',
    'Juceline Palmas',
    '63993390500',
    'Doutora, posso fazer bochecho com antisséptico hoje?',
    'f6a7b89c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
    false,
    now() - interval '1 hour'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.conversation_participants (
    conversation_id, patient_id, user_id, user_name, participant_type, is_active
) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '63992474826', NULL, 'Alice Póvoa', 'patient', true),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NULL, 'usr_rec_palmas', 'Recepção Palmas', 'staff', true),
('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', '63993390500', NULL, 'Juceline Palmas', 'patient', true),
('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', NULL, 'usr_ariane', 'Dra. Ariane Bertuol', 'dentist', true)
ON CONFLICT DO NOTHING;
`;

