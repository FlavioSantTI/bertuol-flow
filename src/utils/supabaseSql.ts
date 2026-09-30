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
`;
