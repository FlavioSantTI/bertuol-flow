-- ============================================================================
-- CLUBE SORRISO BERTUOL — TABELA DE ACEITE OBRIGATÓRIO DE TERMOS E PRIVACIDADE
-- Versão do Regulamento: 1.0 (Novembro de 2026)
-- Conformidade: CDC (arts. 30-31), LGPD (Lei 13.709/2018) e Resolução CFO 271/2025
-- ============================================================================
-- Execute este script no SQL Editor do Supabase para armazenar os aceites
-- eletrônicos dos pacientes de forma dedicada e separada do prontuário clínico.

CREATE TABLE IF NOT EXISTS public.patient_terms_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key TEXT NOT NULL,
  patient_id TEXT,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_document_id TEXT,
  clinic_id INTEGER DEFAULT 1,
  terms_version TEXT NOT NULL DEFAULT '1.0-2026-11',
  terms_hash TEXT NOT NULL,
  accepted_terms BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_privacy BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  acceptance_channel TEXT NOT NULL DEFAULT 'patient_portal_first_access',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT patient_terms_acceptances_key_version_unique UNIQUE (patient_key, terms_version),
  CONSTRAINT patient_terms_acceptances_mandatory_check CHECK (
    accepted_terms = TRUE AND accepted_privacy = TRUE
  )
);

CREATE INDEX IF NOT EXISTS idx_patient_terms_acceptances_phone
  ON public.patient_terms_acceptances (patient_phone);

CREATE INDEX IF NOT EXISTS idx_patient_terms_acceptances_patient_id
  ON public.patient_terms_acceptances (patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_terms_acceptances_accepted_at
  ON public.patient_terms_acceptances (accepted_at DESC);

ALTER TABLE public.patient_terms_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow backend full access to patient_terms_acceptances" ON public.patient_terms_acceptances;
CREATE POLICY "Allow backend full access to patient_terms_acceptances"
  ON public.patient_terms_acceptances
  FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

COMMENT ON TABLE public.patient_terms_acceptances IS
  'Registro auditável de aceite eletrônico do Regulamento do Clube Sorriso Bertuol e Política de Privacidade (LGPD) no primeiro acesso do paciente.';
