-- ============================================================================
-- CLUBE SORRISO BERTUOL — SCRIPT COMPLETO DE BANCO DE DADOS (SUPABASE / POSTGRES)
-- Versão do Programa e Regulamento: 1.0 · Novembro de 2026
-- Operadora: Bertuol Coworking Odonto Ltda. (Palmas-TO e Paraíso do Tocantins-TO)
-- ============================================================================
-- Script 100% idempotente: pode ser executado mais de uma vez com segurança no
-- SQL Editor do Supabase. Cria todas as tabelas do Clube Sorriso, Termos LGPD
-- e já povoa os Níveis, Benefícios, Regras de Pontuação e Catálogo de Vantagens
-- extraídos diretamente do documento oficial Versão 1.0.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ACEITE ELETRÔNICO DE TERMOS E POLÍTICA DE PRIVACIDADE (LGPD / CDC)
--    Mantido separado do prontuário clínico (public.patients.notes).
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 2. NÍVEIS DO CLUBE SORRISO (ARQUITETURA DOS 4 NÍVEIS · PÁGS. 3-4)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clube_sorriso_tiers (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  badge TEXT NOT NULL,
  color_theme TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  min_points INTEGER NOT NULL DEFAULT 0,
  multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  brand_promise TEXT NOT NULL,
  entry_criteria TEXT NOT NULL,
  fast_track_criteria TEXT NOT NULL,
  benefits_description TEXT NOT NULL,
  family_dependents_limit INTEGER NOT NULL DEFAULT 0,
  family_dependents_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  ascension_gift_title TEXT,
  ascension_gift_reference_cost NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. BENEFÍCIOS DETALHADOS POR NÍVEL E PROTOCOLO DIAMANTE (PÁGS. 7-9)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clube_sorriso_tier_benefits (
  id TEXT PRIMARY KEY,
  tier_id TEXT NOT NULL REFERENCES public.clube_sorriso_tiers(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'beneficio', -- beneficio | protocolo_prioridade | presente_ascensao | experiencia
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  service_sla TEXT,
  reference_cost_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clube_sorriso_tier_benefits_tier
  ON public.clube_sorriso_tier_benefits (tier_id, sort_order);

-- ----------------------------------------------------------------------------
-- 4. REGRAS DE PONTUAÇÃO E BÔNUS POR COMPORTAMENTO (PÁGS. 4-5)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clube_sorriso_scoring_rules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points_reward INTEGER NOT NULL,
  trigger_event TEXT NOT NULL UNIQUE,
  frequency_limit TEXT NOT NULL,
  business_objective TEXT,
  applies_tier_multiplier BOOLEAN NOT NULL DEFAULT TRUE,
  counts_for_status BOOLEAN NOT NULL DEFAULT FALSE,
  requires_image_consent BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. CATÁLOGO OFICIAL DE VANTAGENS E RESGATES (PÁGS. 10-11)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clube_sorriso_rewards (
  id TEXT PRIMARY KEY,
  clinic_id INTEGER,
  category TEXT NOT NULL, -- credito_sorriso | servico_clinico | produto_bucal
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  min_tier TEXT NOT NULL DEFAULT 'bronze', -- bronze | prata | ouro | diamante
  points_required INTEGER NOT NULL,
  credit_equivalent_brl NUMERIC(10,2),
  reference_cost_text TEXT,
  requires_clinical_evaluation BOOLEAN NOT NULL DEFAULT FALSE,
  max_payment_discount_pct INTEGER,
  stock_available INTEGER NOT NULL DEFAULT 50,
  voucher_validity_days INTEGER NOT NULL DEFAULT 45,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clube_sorriso_rewards_category_tier
  ON public.clube_sorriso_rewards (category, min_tier, points_required);

-- ----------------------------------------------------------------------------
-- 6. CONTAS DOS PACIENTES NO CLUBE (DUAS CONTAS: STATUS vs PONTOS SORRISO)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clube_sorriso_patient_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key TEXT NOT NULL UNIQUE,
  patient_id TEXT,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  clinic_id INTEGER DEFAULT 1,
  current_tier_id TEXT NOT NULL DEFAULT 'tier_bronze' REFERENCES public.clube_sorriso_tiers(id),
  status_points_12m INTEGER NOT NULL DEFAULT 0,
  smile_points_balance INTEGER NOT NULL DEFAULT 0,
  tier_achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tier_review_due_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '12 months'),
  preventive_clause_used_last_cycle BOOLEAN NOT NULL DEFAULT FALSE,
  fast_track_contract_value NUMERIC(12,2),
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clube_sorriso_accounts_phone
  ON public.clube_sorriso_patient_accounts (patient_phone);

CREATE INDEX IF NOT EXISTS idx_clube_sorriso_accounts_tier
  ON public.clube_sorriso_patient_accounts (current_tier_id);

-- ----------------------------------------------------------------------------
-- 7. EXTRATO DE PONTOS COM VALIDADE DE 24 MESES E MULTIPLICADOR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clube_sorriso_point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.clube_sorriso_patient_accounts(id) ON DELETE CASCADE,
  patient_phone TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- payment | behavior_bonus | redemption | reversal | expiration | manual_adjustment
  rule_id TEXT REFERENCES public.clube_sorriso_scoring_rules(id),
  base_points INTEGER NOT NULL,
  multiplier_applied NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  status_points_delta INTEGER NOT NULL DEFAULT 0,
  smile_points_delta INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference_external_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clube_sorriso_tx_account_created
  ON public.clube_sorriso_point_transactions (account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clube_sorriso_tx_expires
  ON public.clube_sorriso_point_transactions (expires_at)
  WHERE expires_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 8. VOUCHERS DE RESGATE (COM CONTROLE DE AVALIAÇÃO CLÍNICA E ESTORNO)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clube_sorriso_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.clube_sorriso_patient_accounts(id) ON DELETE SET NULL,
  reward_id TEXT REFERENCES public.clube_sorriso_rewards(id) ON DELETE SET NULL,
  patient_phone TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  reward_title TEXT NOT NULL,
  points_spent INTEGER NOT NULL,
  secret_code TEXT NOT NULL UNIQUE,
  requires_clinical_evaluation BOOLEAN NOT NULL DEFAULT FALSE,
  clinical_approval_status TEXT DEFAULT 'pending', -- pending | approved | contraindicated_refunded | not_applicable
  status TEXT NOT NULL DEFAULT 'pending', -- pending | redeemed | cancelled_refunded | expired
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by_staff TEXT,
  clinical_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clube_sorriso_vouchers_phone
  ON public.clube_sorriso_vouchers (patient_phone, created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. CONTA FAMÍLIA (NÍVEIS OURO: ATÉ 3 DEPENDENTES · DIAMANTE: ATÉ 5 DEPENDENTES)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clube_sorriso_family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_account_id UUID NOT NULL REFERENCES public.clube_sorriso_patient_accounts(id) ON DELETE CASCADE,
  dependent_patient_id TEXT,
  dependent_name TEXT NOT NULL,
  dependent_phone TEXT,
  relationship TEXT NOT NULL, -- conjuge | filho | dependente
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clube_sorriso_family_holder
  ON public.clube_sorriso_family_members (holder_account_id);

-- ============================================================================
-- SEED OFICIAL — DADOS EXTRAÍDOS DO DOCUMENTO CLUBE SORRISO BERTUOL (VERSÃO 1.0)
-- ============================================================================

-- A) 4 Níveis Oficiais (Págs. 1, 4, 7-9)
INSERT INTO public.clube_sorriso_tiers (
  id, slug, name, badge, color_theme, sort_order, min_points, multiplier,
  brand_promise, entry_criteria, fast_track_criteria, benefits_description,
  family_dependents_limit, family_dependents_multiplier,
  ascension_gift_title, ascension_gift_reference_cost, is_active
) VALUES
  (
    'tier_bronze', 'bronze', 'Bronze', '🥉', 'bronze', 1, 0, 1.00,
    'Aqui, cada cuidado com o seu sorriso vale a pena.',
    'Cadastro no app e primeira consulta realizada',
    'Automática no cadastro',
    'Acesso ao clube, boas-vindas (100 pts perfil + 50 pts anamnese), lembretes inteligentes, bônus de aniversário (150 pts), catálogo Bronze e Crédito Sorriso.',
    0, 1.00, NULL, 0, TRUE
  ),
  (
    'tier_prata', 'prata', 'Prata', '🥈', 'prata', 2, 2500, 1.15,
    'Você cuida com constância, e a gente reconhece.',
    '2.500 pontos de status em 12 meses (R$ 2.500 pagos)',
    '2 indicações convertidas em 12 meses',
    'Multiplicador 1,15x, Kit Cuidado Profissional na ascensão, catálogo Prata ampliado e lista de espera preferencial na agenda.',
    0, 1.00, 'Kit Cuidado Profissional (Curaprox CS 5460 + raspador Curaprox + fio Oral-B 50m)', 106.00, TRUE
  ),
  (
    'tier_ouro', 'ouro', 'Ouro', '🥇', 'ouro', 3, 7000, 1.25,
    'Seu sorriso tem uma equipe que conhece você pelo nome.',
    '7.000 pontos de status em 12 meses (R$ 7.000 pagos)',
    'Contrato de tratamento a partir de R$ 7.000 assinado e com entrada paga',
    'Multiplicador 1,25x, Escova elétrica Oral-B Pro Series 1 na ascensão, Kit Aniversário Ouro, Kit Pós-Procedimento, agenda preferencial (7 dias), Conta Família (até 3 dependentes) e revisão estética anual.',
    3, 1.00, 'Escova elétrica Oral-B Pro Series 1', 169.90, TRUE
  ),
  (
    'tier_diamante', 'diamante', 'Diamante', '💎', 'diamante', 4, 15000, 1.50,
    'Você nunca espera. A clínica se organiza em torno de você.',
    '15.000 pontos de status em 12 meses (R$ 15.000 pagos)',
    'Contrato de tratamento a partir de R$ 15.000 assinado e com entrada paga',
    'Multiplicador 1,50x, Irrigador oral Waterpik Cordless Enhance WF21 na ascensão, Protocolo de Prioridade Absoluta (urgência 24h, concierge WhatsApp 1h, recepção ≤10 min, 2 horários reservados/semana), Check-up Diamante anual incluso, Conta Família até 5 dependentes (1,15x) e Encontro Diamante.',
    5, 1.15, 'Irrigador oral portátil Waterpik Cordless Enhance WF21', 689.90, TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  badge = EXCLUDED.badge,
  min_points = EXCLUDED.min_points,
  multiplier = EXCLUDED.multiplier,
  brand_promise = EXCLUDED.brand_promise,
  entry_criteria = EXCLUDED.entry_criteria,
  fast_track_criteria = EXCLUDED.fast_track_criteria,
  benefits_description = EXCLUDED.benefits_description,
  family_dependents_limit = EXCLUDED.family_dependents_limit,
  family_dependents_multiplier = EXCLUDED.family_dependents_multiplier,
  ascension_gift_title = EXCLUDED.ascension_gift_title,
  ascension_gift_reference_cost = EXCLUDED.ascension_gift_reference_cost,
  updated_at = NOW();

-- B) Benefícios Detalhados por Nível e Protocolo de Prioridade (Págs. 7-9)
INSERT INTO public.clube_sorriso_tier_benefits (
  id, tier_id, category, title, description, service_sla, reference_cost_text, sort_order, is_active
) VALUES
  -- Bronze
  ('ben_bronze_1', 'tier_bronze', 'beneficio', 'Boas-vindas imediatas', '100 pontos pelo cadastro completo no aplicativo e 50 pontos pela anamnese digital antes da 1ª consulta.', NULL, NULL, 1, TRUE),
  ('ben_bronze_2', 'tier_bronze', 'beneficio', 'Catálogo Bronze e Crédito Sorriso', 'Resgate de itens de higiene bucal premium, dessensibilização, profilaxia extra e Crédito Sorriso (1.000 pts = R$ 30).', NULL, NULL, 2, TRUE),
  ('ben_bronze_3', 'tier_bronze', 'beneficio', 'Lembretes inteligentes e aniversário', 'Notificação automática da revisão semestral e bônus de 150 pontos no aniversário do titular.', NULL, NULL, 3, TRUE),
  -- Prata
  ('ben_prata_1', 'tier_prata', 'presente_ascensao', 'Kit Cuidado Profissional na ascensão', 'Escova Curaprox CS 5460, raspador de língua Curaprox e fio dental Oral-B Essential 50 m entregues pessoalmente na clínica.', 'Na consulta seguinte à ascensão', 'R$ 106,00', 1, TRUE),
  ('ben_prata_2', 'tier_prata', 'beneficio', 'Multiplicador 1,15x e Catálogo Prata', '15% a mais em todos os pagamentos e bônus + acesso a garrafa térmica inox personalizada, refil de gel clareador (com avaliação) e manutenção de lentes de resina.', NULL, NULL, 2, TRUE),
  ('ben_prata_3', 'tier_prata', 'protocolo_prioridade', 'Lista de espera preferencial', 'Prioridade para ser avisado primeiro quando surgir desistência na agenda da clínica.', 'Aviso prioritário', NULL, 3, TRUE),
  -- Ouro
  ('ben_ouro_1', 'tier_ouro', 'presente_ascensao', 'Escova elétrica Oral-B Pro Series 1', 'Entregue na ascensão ao nível Ouro com orientação prática de uso pelo profissional responsável.', 'Na ascensão ao nível Ouro', 'R$ 169,90', 1, TRUE),
  ('ben_ouro_2', 'tier_ouro', 'beneficio', 'Kit Aniversário Ouro e Kit Pós-Procedimento', 'Garrafa térmica inox personalizada com nome do paciente no aniversário + kit pós-procedimento (compressa de gel, protetor labial e cartão de cuidados) após cirurgias, clareamentos ou lentes.', NULL, 'R$ 47,00 / R$ 25-35', 2, TRUE),
  ('ben_ouro_3', 'tier_ouro', 'protocolo_prioridade', 'Agenda preferencial (7 dias)', 'Abertura de horários com 7 dias de antecedência em relação ao público geral, incluindo início da manhã, fim da tarde e sábados.', '7 dias de antecedência', NULL, 3, TRUE),
  ('ben_ouro_4', 'tier_ouro', 'beneficio', 'Conta Família (até 3 dependentes) e Revisão Estética Anual', 'Até 3 dependentes (cônjuge e filhos) somam pontos ao saldo do titular + 1 consulta anual de 20 min para fotografia, avaliação de cor e polimento estético sem custo.', '1 revisão estética/ano', NULL, 4, TRUE),
  -- Diamante
  ('ben_diamante_1', 'tier_diamante', 'protocolo_prioridade', 'Urgência odontológica em até 24h', 'Atendimento no mesmo dia ou em até 24 horas, em qualquer especialidade disponível.', 'Mesmo dia ou até 24h', NULL, 1, TRUE),
  ('ben_diamante_2', 'tier_diamante', 'protocolo_prioridade', 'Horários reservados semanais', '2 horários por semana em cada unidade ficam bloqueados exclusivamente para pacientes Diamante até 48 horas antes.', '2 horários/semana por unidade', NULL, 2, TRUE),
  ('ben_diamante_3', 'tier_diamante', 'protocolo_prioridade', 'Concierge direto por WhatsApp', 'Contato direto por WhatsApp com secretária de referência para agendamentos e solicitações.', 'Resposta em até 1h no horário comercial', NULL, 3, TRUE),
  ('ben_diamante_4', 'tier_diamante', 'protocolo_prioridade', 'Recepção sem espera e retorno 48h', 'Meta de no máximo 10 minutos entre check-in e consultório, atendimento integrado Palmas/Paraíso e ligação da equipe clínica em até 48h após cirurgias/procedimentos relevantes.', 'Espera ≤ 10 min · Retorno ≤ 48h', NULL, 4, TRUE),
  ('ben_diamante_5', 'tier_diamante', 'presente_ascensao', 'Irrigador oral Waterpik Cordless Enhance WF21', 'Presente de ascensão ao Diamante clinicamente indicado para implantes, coroas e pontes, entregue com treinamento de uso.', 'Na ascensão ao Diamante', 'R$ 689,90', 5, TRUE),
  ('ben_diamante_6', 'tier_diamante', 'experiencia', 'Check-up Diamante Anual, Conta Família (5 dependentes 1,15x) e Encontro Diamante', 'Check-up anual completo incluso (avaliação, profilaxia, fotos e relatório), Kit Aniversário Premium, até 5 dependentes com multiplicador Prata (1,15x) e convite para evento anual exclusivo.', 'Anual', 'R$ 100-140 / R$ 80-100 / R$ 60-100', 6, TRUE)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  service_sla = EXCLUDED.service_sla,
  reference_cost_text = EXCLUDED.reference_cost_text,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- C) 11 Regras Oficiais de Pontuação (Pág. 4-5 — sem premiar Google Reviews)
INSERT INTO public.clube_sorriso_scoring_rules (
  id, title, description, points_reward, trigger_event, frequency_limit,
  business_objective, applies_tier_multiplier, counts_for_status, requires_image_consent, is_active
) VALUES
  (
    'rule_payment_base', 'Pagamento de Consulta ou Tratamento',
    'Cada R$ 1,00 efetivamente pago (PIX, cartão, boleto ou dinheiro) gera 1 ponto de status + 1 ponto base multiplicado pelo nível vigente.',
    1, 'payment_received_per_brl', 'A cada R$ 1,00 pago',
    'Relacionamento de longo prazo e LTV', TRUE, TRUE, FALSE, TRUE
  ),
  (
    'rule_profile_complete', 'Cadastro no App com Perfil Completo',
    'Bônus de boas-vindas creditado ao completar todos os dados cadastrais no aplicativo Clube Sorriso.',
    100, 'profile_completed', 'Uma vez',
    'Base de dados qualificada (LGPD)', TRUE, FALSE, FALSE, TRUE
  ),
  (
    'rule_digital_anamnesis', 'Anamnese Digital Antes da 1ª Consulta',
    'Preenchimento da anamnese digital pelo aplicativo antes do primeiro atendimento clínico.',
    50, 'digital_anamnesis_completed', 'Uma vez',
    'Agilidade na recepção', TRUE, FALSE, FALSE, TRUE
  ),
  (
    'rule_punctual_checkin', 'Check-in Pontual na Recepção',
    'Check-in realizado via QR Code no totem da recepção até o horário marcado da consulta.',
    20, 'checkin_on_time', 'Por consulta',
    'Reduz atrasos e ociosidade de cadeira', TRUE, FALSE, FALSE, TRUE
  ),
  (
    'rule_semiannual_review', 'Revisão Semestral Realizada no Prazo',
    'Comparecimento e realização da consulta preventiva semestral dentro da janela recomendada.',
    150, 'semiannual_preventive_review', '2 por ano',
    'Retenção e recorrência preventiva', TRUE, FALSE, FALSE, TRUE
  ),
  (
    'rule_installment_on_time', 'Parcela Paga Até o Vencimento',
    'Pontuação de adimplência creditada a cada parcela liquidada até a data de vencimento.',
    15, 'installment_paid_on_time', 'Por parcela',
    'Adimplência e previsibilidade de caixa', TRUE, FALSE, FALSE, TRUE
  ),
  (
    'rule_referral_converted', 'Indicação Convertida',
    'Novo paciente indicado realiza e paga a primeira consulta ou inicia tratamento na clínica.',
    500, 'referral_converted', 'Sem limite',
    'Captação orgânica de baixo custo', TRUE, FALSE, FALSE, TRUE
  ),
  (
    'rule_referred_welcome', 'Bônus de Boas-vindas do Indicado',
    'Bônus especial para o paciente que chega à Bertuol por indicação de um membro do clube.',
    200, 'referred_patient_welcome', 'Uma vez',
    'Conversão do paciente indicado', TRUE, FALSE, FALSE, TRUE
  ),
  (
    'rule_birthday', 'Aniversário do Titular',
    'Bônus anual de relacionamento creditado no aniversário do membro titular do Clube Sorriso.',
    150, 'patient_birthday', '1 por ano',
    'Vínculo emocional e retenção', TRUE, FALSE, FALSE, TRUE
  ),
  (
    'rule_social_tag', 'Publicação Marcando a Clínica (com Termo de Imagem)',
    'Publicação orgânica nas redes sociais marcando a clínica, válida somente com termo de autorização de uso de imagem assinado.',
    100, 'social_media_mention', '1 por mês',
    'Prova social orgânica', TRUE, FALSE, TRUE, TRUE
  ),
  (
    'rule_internal_nps', 'Pesquisa Interna de Satisfação (NPS)',
    'Resposta à pesquisa interna pós-atendimento no aplicativo (avaliações no Google não são premiadas).',
    30, 'internal_nps_answered', 'Por atendimento',
    'Gestão contínua da qualidade', TRUE, FALSE, FALSE, TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  points_reward = EXCLUDED.points_reward,
  frequency_limit = EXCLUDED.frequency_limit,
  business_objective = EXCLUDED.business_objective,
  applies_tier_multiplier = EXCLUDED.applies_tier_multiplier,
  counts_for_status = EXCLUDED.counts_for_status,
  requires_image_consent = EXCLUDED.requires_image_consent,
  updated_at = NOW();

-- D) 15 Itens Oficiais do Catálogo de Vantagens e Resgates (Págs. 10-11)
--    Serviços clínicos primeiro (sustentam margem e trazem paciente à cadeira)
INSERT INTO public.clube_sorriso_rewards (
  id, clinic_id, category, title, description, min_tier, points_required,
  credit_equivalent_brl, reference_cost_text, requires_clinical_evaluation,
  max_payment_discount_pct, stock_available, voucher_validity_days, image_url, sort_order, is_active
) VALUES
  -- 5.1 Crédito Sorriso (Resgate Universal)
  (
    'rew_credito_sorriso_3000', NULL, 'credito_sorriso',
    'Crédito Sorriso · R$ 90 em Tratamentos (3.000 pts)',
    'Resgate universal: cada 1.000 pontos equivale a R$ 30,00 de abatimento em qualquer tratamento (mínimo 3.000 pts, limitado a até 30% do valor do pagamento).',
    'bronze', 3000, 90.00, 'R$ 0,03 por ponto (até 30% por pagamento)', FALSE, 30, 999, 60,
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=80', 1, TRUE
  ),
  -- 5.2 Serviços da Clínica (TODOS com Regra Clínica Inegociável: requires_clinical_evaluation = TRUE)
  (
    'rew_srv_fluor_dessensibilizante', NULL, 'servico_clinico',
    'Aplicação de Flúor ou Dessensibilizante',
    'Sessão clínica de proteção do esmalte ou alívio de sensibilidade. Gera voucher sujeito à avaliação e indicação do cirurgião-dentista.',
    'bronze', 1500, 45.00, 'Custo marginal est.: R$ 20 a R$ 35', TRUE, NULL, 60, 45,
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80', 2, TRUE
  ),
  (
    'rew_srv_profilaxia_extra', NULL, 'servico_clinico',
    'Profilaxia e Polimento Extra (fora das revisões)',
    'Limpeza profissional completa com polimento coronário fora do ciclo semestral. Sujeito à avaliação clínica.',
    'bronze', 3000, 90.00, 'Custo marginal est.: R$ 45 a R$ 70', TRUE, NULL, 50, 60,
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=80', 3, TRUE
  ),
  (
    'rew_srv_manutencao_lentes', NULL, 'servico_clinico',
    'Manutenção e Polimento de Lentes de Resina',
    'Polimento de alto brilho e revisão de margens para conservação de lentes de resina. Exclusivo nível Prata ou superior, mediante avaliação clínica.',
    'prata', 4500, 135.00, 'Custo marginal est.: R$ 60 a R$ 90', TRUE, NULL, 40, 60,
    'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&auto=format&fit=crop&q=80', 4, TRUE
  ),
  (
    'rew_srv_simulacao_digital', NULL, 'servico_clinico',
    'Simulação Digital do Sorriso (Escaneamento e Projeto)',
    'Escaneamento intraoral e planejamento digital personalizado do sorriso (disponível em unidades com scanner). Exclusivo Ouro+, sujeito à avaliação clínica.',
    'ouro', 6000, 180.00, 'Custo marginal est.: R$ 30 a R$ 60', TRUE, NULL, 30, 60,
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80', 5, TRUE
  ),
  (
    'rew_srv_clareamento_caseiro', NULL, 'servico_clinico',
    'Clareamento Caseiro Completo (Moldeiras e Gel)',
    'Protocolo completo supervisionado com moldeiras personalizadas e gel clareador profissional. Exclusivo Ouro+, mediante indicação clínica.',
    'ouro', 9000, 270.00, 'Custo marginal est.: R$ 120 a R$ 160', TRUE, NULL, 25, 60,
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80', 6, TRUE
  ),
  (
    'rew_srv_clareamento_consultorio', NULL, 'servico_clinico',
    'Sessão de Clareamento em Consultório',
    'Sessão clínica de clareamento estético conduzida pelo especialista. Exclusivo Ouro+, condicionada à avaliação prévia do cirurgião-dentista.',
    'ouro', 12000, 360.00, 'Custo marginal est.: R$ 120 a R$ 200', TRUE, NULL, 20, 60,
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&auto=format&fit=crop&q=80', 7, TRUE
  ),
  -- 5.3 Produtos de Cuidado Bucal
  (
    'rew_prod_fio_oralb', NULL, 'produto_bucal',
    'Fio Dental Oral-B Essential 50 m',
    'Fio dental de uso diário recomendado pela equipe clínica. Retirada na recepção da clínica.',
    'bronze', 600, 18.00, 'Ref. varejo: R$ 15,89 a R$ 20,99', FALSE, NULL, 80, 30,
    'https://images.unsplash.com/photo-1559591937-e1022067756f?w=600&auto=format&fit=crop&q=80', 8, TRUE
  ),
  (
    'rew_prod_escova_curaprox', NULL, 'produto_bucal',
    'Escova Curaprox CS 5460 Ultra Soft',
    'Escova suíça ultramacia com 5.460 cerdas para higienização delicada sem agredir gengivas.',
    'bronze', 1300, 39.00, 'Ref. varejo: R$ 24,00 a R$ 45,28', FALSE, NULL, 60, 30,
    'https://images.unsplash.com/photo-1559591937-e1022067756f?w=600&auto=format&fit=crop&q=80', 9, TRUE
  ),
  (
    'rew_prod_kit_viagem', NULL, 'produto_bucal',
    'Kit Viagem de Higiene Bucal',
    'Estojo funcional com escova, creme dental e fio dental ideal para rotina fora de casa.',
    'bronze', 1300, 39.00, 'Ref. varejo: R$ 39,99', FALSE, NULL, 50, 30,
    'https://images.unsplash.com/photo-1559591937-e1022067756f?w=600&auto=format&fit=crop&q=80', 10, TRUE
  ),
  (
    'rew_prod_raspador_curaprox', NULL, 'produto_bucal',
    'Raspador de Língua Curaprox',
    'Higienizador lingual anatômico para controle de saburra e hálito fresco no dia a dia.',
    'bronze', 1600, 48.00, 'Ref. varejo: R$ 47,99', FALSE, NULL, 40, 30,
    'https://images.unsplash.com/photo-1559591937-e1022067756f?w=600&auto=format&fit=crop&q=80', 11, TRUE
  ),
  (
    'rew_prod_garrafa_inox', NULL, 'produto_bucal',
    'Garrafa Térmica Inox Personalizada',
    'Garrafa térmica em aço inox personalizada com o nome do paciente e assinatura discreta Bertuol. Exclusivo nível Prata ou superior.',
    'prata', 1600, 48.00, 'Ref. custo: cerca de R$ 47,00', FALSE, NULL, 35, 45,
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80', 12, TRUE
  ),
  (
    'rew_prod_refil_gel_clareador', NULL, 'produto_bucal',
    'Refil de Gel Clareador Caseiro (4 seringas, com avaliação)',
    'Kit com 4 seringas de gel clareador profissional (Power Bleaching 16%). Exclusivo Prata+, entregue somente com moldeira da clínica e avaliação prévia.',
    'prata', 2000, 60.00, 'Ref. varejo: R$ 59,60', TRUE, NULL, 30, 45,
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80', 13, TRUE
  ),
  (
    'rew_prod_escova_eletrica_oralb', NULL, 'produto_bucal',
    'Escova Elétrica Oral-B Pro Series 1',
    'Escova dental elétrica com sensor de pressão e temporizador profissional. Exclusivo nível Ouro ou superior.',
    'ouro', 5700, 171.00, 'Ref. varejo: R$ 169,90', FALSE, NULL, 15, 60,
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80', 14, TRUE
  ),
  (
    'rew_prod_irrigador_waterpik', NULL, 'produto_bucal',
    'Irrigador Oral Waterpik Cordless Enhance WF21',
    'Irrigador oral portátil sem fio de referência clínica, ideal para implantes, coroas, próteses e familiares. Exclusivo nível Diamante.',
    'diamante', 23000, 690.00, 'Ref. varejo: R$ 689,90', FALSE, NULL, 8, 60,
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80', 15, TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  min_tier = EXCLUDED.min_tier,
  points_required = EXCLUDED.points_required,
  credit_equivalent_brl = EXCLUDED.credit_equivalent_brl,
  reference_cost_text = EXCLUDED.reference_cost_text,
  requires_clinical_evaluation = EXCLUDED.requires_clinical_evaluation,
  max_payment_discount_pct = EXCLUDED.max_payment_discount_pct,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — LIBERA OPERAÇÃO SEGURA VIA BACKEND / SERVICE ROLE
-- ============================================================================
ALTER TABLE public.patient_terms_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clube_sorriso_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clube_sorriso_tier_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clube_sorriso_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clube_sorriso_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clube_sorriso_patient_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clube_sorriso_point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clube_sorriso_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clube_sorriso_family_members ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'patient_terms_acceptances',
    'clube_sorriso_tiers',
    'clube_sorriso_tier_benefits',
    'clube_sorriso_scoring_rules',
    'clube_sorriso_rewards',
    'clube_sorriso_patient_accounts',
    'clube_sorriso_point_transactions',
    'clube_sorriso_vouchers',
    'clube_sorriso_family_members'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow backend full access to %I" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow backend full access to %I" ON public.%I FOR ALL USING (TRUE) WITH CHECK (TRUE);', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================================
-- VERIFICAÇÃO RÁPIDA APÓS EXECUÇÃO
-- ============================================================================
SELECT 'clube_sorriso_tiers' AS tabela, COUNT(*) AS registros FROM public.clube_sorriso_tiers
UNION ALL
SELECT 'clube_sorriso_tier_benefits', COUNT(*) FROM public.clube_sorriso_tier_benefits
UNION ALL
SELECT 'clube_sorriso_scoring_rules', COUNT(*) FROM public.clube_sorriso_scoring_rules
UNION ALL
SELECT 'clube_sorriso_rewards', COUNT(*) FROM public.clube_sorriso_rewards
UNION ALL
SELECT 'patient_terms_acceptances', COUNT(*) FROM public.patient_terms_acceptances;
