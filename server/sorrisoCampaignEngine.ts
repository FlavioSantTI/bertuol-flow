import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SorrisoBatchLogEntry,
  SorrisoCampaignConfig,
  SorrisoCriterionCode,
  SorrisoDeliveryMode,
  SorrisoPreviewCandidate,
  SorrisoQueueItem,
  SorrisoTemplateSegment,
} from '../src/types/campaign';

export interface SorrisoCampaignEngineDeps {
  supabase: SupabaseClient;
  dataDir: string;
  multiTenantClinics: Array<{
    id: number;
    name: string;
    shortName?: string;
    active?: boolean;
    clinicorp_business_id?: number;
  }>;
  isAdminRequest: (req: Request) => boolean;
  sendWhatsAppTextDirect: (params: {
    recipientPhone: string;
    message: string;
    instanceName?: string;
    linkPreview?: boolean;
    linkPreviewHighQuality?: boolean;
  }) => Promise<{
    success: boolean;
    mode?: string;
    error?: string;
  }>;
  sendWhatsAppImageDirect: (params: {
    recipientPhone: string;
    imageBase64: string;
    mimetype?: string;
    filename?: string;
    caption?: string;
    instanceName?: string;
  }) => Promise<{
    success: boolean;
    mode?: string;
    error?: string;
  }>;
  resolveClinicorpContext: (clinicId?: number, businessId?: number) => {
    configured: boolean;
    user: string;
    key: string;
    baseUrl: string;
    authHeader: string;
  };
  getSaoPauloClockParts: (date?: Date) => {
    ymd: string;
    year: string;
    month: string;
    day: string;
    hhmm: string;
  };
  addDaysYMD: (ymd: string, deltaDays: number) => string;
}

export const SORRISO_QUEUE_SQL_MIGRATION = `-- Tabela de fila persistente para Campanha WhatsApp (Lançamento Sorriso Bertuol)
CREATE TABLE IF NOT EXISTS public.crm_campaign_queue (
  id TEXT PRIMARY KEY,
  campaign_key TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  clinic_id INTEGER NOT NULL DEFAULT 1,
  clinic_name TEXT NOT NULL DEFAULT 'Palmas (Matriz)',
  patient_id BIGINT NOT NULL DEFAULT 0,
  patient_name TEXT NOT NULL,
  mobile_phone TEXT NOT NULL,
  matched_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_segment TEXT NOT NULL DEFAULT 'inactive_90d',
  priority_score INTEGER NOT NULL DEFAULT 1,
  rendered_message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  crm_lead_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  whatsapp_mode TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_campaign_queue_unique_phone
  ON public.crm_campaign_queue (campaign_key, mobile_phone);

CREATE INDEX IF NOT EXISTS idx_crm_campaign_queue_status
  ON public.crm_campaign_queue (campaign_key, status, priority_score DESC, created_at ASC);`;

const OFFICIAL_PATIENT_APP_URL = 'https://bertuolflow.app-bertuol.tech/paciente';

const LEGACY_TEMPLATES_WITHOUT_LINK = {
  tag: 'Olá {nome}, tudo bem? Aqui é da Clínica Bertuol Odontologia ({clinica}). Como você demonstrou interesse no *Lançamento Sorriso Bertuol*, reservamos condições especiais e horários prioritários de avaliação para esta semana. Posso te enviar as opções disponíveis?',
  budget_180d:
    'Olá {nome}, tudo bem? Aqui é da Clínica Bertuol Odontologia ({clinica}). Estamos com o *Lançamento Sorriso Bertuol* ativo e lembramos do seu plano de tratamento ({procedimento}) em aberto. Liberamos condições facilitadas para você dar continuidade com a nossa equipe. Podemos conversar rapidinho por aqui?',
  inactive_90d:
    'Olá {nome}, tudo bem? Aqui é da Clínica Bertuol Odontologia ({clinica}). Já faz mais de {dias} dias desde seu último atendimento conosco e queremos convidar você para o *Lançamento Sorriso Bertuol*, com avaliação preventiva e condições especiais para pacientes da casa. Qual melhor período para agendarmos?',
};

const DEFAULT_SORRISO_CAMPAIGN_CONFIG: SorrisoCampaignConfig = {
  campaignKey: 'lancamento_sorriso_bertuol',
  pipelineId: '',
  pipelineName: 'Lançamento Sorriso Bertuol',
  enabled: false,
  paused: false,
  clinicScope: 'all',
  includeTagCriterion: true,
  tagName: 'LANCAMENTO_SORRISO',
  includeOpenBudgetsCriterion: true,
  budgetWindowDays: 180,
  budgetKeywords: [
    'implante',
    'protese',
    'protocolo',
    'coroa',
    'reabilitacao',
    'ortodontia',
    'alinhador',
    'cirurgia',
    'endodontia',
    'periodontia',
  ],
  includeInactiveCriterion: true,
  inactiveMinDays: 90,
  inactiveMaxDays: 0,
  cooldownDays: 30,
  batchSize: 10,
  dailyLimit: 60,
  minDelaySec: 15,
  maxDelaySec: 35,
  businessHoursOnly: true,
  followUpDays: 2,
  appLinkUrl: OFFICIAL_PATIENT_APP_URL,
  personalizeAppLink: true,
  deliveryMode: 'qrcode_with_caption',
  enableLinkPreview: true,
  templates: {
    tag:
      'Olá {nome}, tudo bem? Aqui é da Clínica Bertuol Odontologia ({clinica}). Como você demonstrou interesse no *Lançamento Sorriso Bertuol*, reservamos condições especiais e horários prioritários para você!\n\n📲 Acesse o App Clube Sorriso Bertuol:\n{link_app}\n\n_(Se o link não ficar clicável direto, responda *SIM* aqui ou aponte a câmera para o QR Code acima!)_',
    budget_180d:
      'Olá {nome}, tudo bem? Aqui é da Clínica Bertuol Odontologia ({clinica}). Estamos com o *Lançamento Sorriso Bertuol* ativo e lembramos do seu plano ({procedimento}) em aberto, com condições facilitadas.\n\n📲 Acesse o App Clube Sorriso Bertuol:\n{link_app}\n\n_(Se o link não ficar clicável direto, responda *SIM* aqui ou aponte a câmera para o QR Code acima!)_',
    inactive_90d:
      'Olá {nome}, tudo bem? Aqui é da Clínica Bertuol Odontologia ({clinica}). Já faz mais de {dias} dias desde seu último atendimento conosco e queremos convidar você para o *Lançamento Sorriso Bertuol*.\n\n📲 Acesse o App Clube Sorriso Bertuol:\n{link_app}\n\n_(Se o link não ficar clicável direto, responda *SIM* aqui ou aponte a câmera para o QR Code acima!)_',
  },
};

interface SorrisoCampaignLocalStore {
  config: SorrisoCampaignConfig;
  queue: SorrisoQueueItem[];
  history: SorrisoBatchLogEntry[];
}

function normalizeText(value?: string | null): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizePhoneDigits(raw?: string | null): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function phoneMatchSuffix(digits: string): string {
  if (!digits) return '';
  return digits.length >= 8 ? digits.slice(-8) : digits;
}

function computeDaysBetweenYMD(olderYmd: string, newerYmd: string): number {
  const [y1, m1, d1] = olderYmd.split('-').map(Number);
  const [y2, m2, d2] = newerYmd.split('-').map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0;
  const t1 = Date.UTC(y1, m1 - 1, d1, 12, 0, 0);
  const t2 = Date.UTC(y2, m2 - 1, d2, 12, 0, 0);
  return Math.floor((t2 - t1) / 86400000);
}

function extractYMD(raw?: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return null;
}

function isInSaoPauloBusinessHours(now: Date = new Date()): boolean {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const weekday = (parts.find((p) => p.type === 'weekday')?.value || '').toLowerCase();
    let hour = Number(parts.find((p) => p.type === 'hour')?.value || '0');
    if (hour === 24) hour = 0;
    const minute = Number(parts.find((p) => p.type === 'minute')?.value || '0');
    const totalMinutes = hour * 60 + minute;

    if (weekday.startsWith('sun')) return false;
    if (weekday.startsWith('sat')) {
      return totalMinutes >= 8 * 60 && totalMinutes < 12 * 60;
    }
    return totalMinutes >= 8 * 60 && totalMinutes < 19 * 60;
  } catch {
    return true;
  }
}

function isCampaignCronSecretValid(req: Request): boolean {
  const secrets = [
    String(process.env.CAMPAIGN_CRON_SECRET || '').trim(),
    String(process.env.BIRTHDAY_CRON_SECRET || '').trim(),
  ].filter(Boolean);
  if (secrets.length === 0) return false;

  const authHeader = String(req.headers.authorization || '').trim();
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const candidate = bearerToken || String(req.headers['x-cron-secret'] || '').trim();
  if (!candidate) return false;

  const candBuf = Buffer.from(candidate, 'utf-8');
  for (const secret of secrets) {
    const secBuf = Buffer.from(secret, 'utf-8');
    if (secBuf.length === candBuf.length && crypto.timingSafeEqual(secBuf, candBuf)) {
      return true;
    }
  }
  return false;
}

function sanitizeCampaignAppBaseUrl(raw?: string | null): string {
  const candidate = String(raw || '').trim();
  if (!candidate) return OFFICIAL_PATIENT_APP_URL;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:') return OFFICIAL_PATIENT_APP_URL;
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return OFFICIAL_PATIENT_APP_URL;
  }
}

function buildPatientCampaignAppUrl(
  cfg: Pick<SorrisoCampaignConfig, 'appLinkUrl' | 'personalizeAppLink'>,
  patient: { phone?: string; name?: string }
): string {
  const baseUrl = sanitizeCampaignAppBaseUrl(cfg.appLinkUrl);
  if (!cfg.personalizeAppLink) return baseUrl;
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('portal', 'paciente');
    const cleanPhone = String(patient.phone || '').replace(/\D/g, '');
    if (cleanPhone) {
      url.searchParams.set('phone', cleanPhone);
    }
    const cleanName = String(patient.name || '').trim().slice(0, 80);
    if (cleanName) {
      url.searchParams.set('name', cleanName);
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
}

function renderCampaignMessage(
  template: string,
  vars: { nome: string; clinica: string; procedimento?: string; dias?: number; linkApp?: string }
): string {
  const resolvedLink = vars.linkApp || OFFICIAL_PATIENT_APP_URL;
  return String(template || '')
    .replace(/\{nome\}/gi, vars.nome || 'Paciente')
    .replace(/\{clinica\}/gi, vars.clinica || 'Palmas (Matriz)')
    .replace(/\{procedimento\}/gi, vars.procedimento || 'plano de tratamento')
    .replace(/\{dias\}/gi, String(vars.dias ?? 90))
    .replace(/\{link_app\}|\{link_portal\}/gi, resolvedLink);
}

function formatCriteriaReadable(criteria: SorrisoCriterionCode[]): string {
  const labels: Record<SorrisoCriterionCode, string> = {
    TAG_LANCAMENTO_SORRISO: 'Tag LANCAMENTO_SORRISO',
    ORCAMENTO_ABERTO_180D: 'Orçamento Aberto (≤180d)',
    INATIVO_90D: 'Sem retorno (>90d)',
  };
  return criteria.map((c) => labels[c] || c).join(' + ');
}

export function registerSorrisoCampaignRoutes(app: Express, deps: SorrisoCampaignEngineDeps): {
  startWorker: () => void;
} {
  const storeFilePath = path.resolve(deps.dataDir, 'sorriso-campaign-store.json');

  const readStore = (): SorrisoCampaignLocalStore => {
    try {
      if (fs.existsSync(storeFilePath)) {
        const parsed = JSON.parse(fs.readFileSync(storeFilePath, 'utf-8'));
        const savedTemplates = parsed?.config?.templates || {};
        const upgradeIfLegacy = (key: SorrisoTemplateSegment) => {
          const val = typeof savedTemplates[key] === 'string' ? savedTemplates[key].trim() : '';
          if (!val || val === LEGACY_TEMPLATES_WITHOUT_LINK[key]) {
            return DEFAULT_SORRISO_CAMPAIGN_CONFIG.templates[key];
          }
          return val;
        };
        return {
          config: {
            ...DEFAULT_SORRISO_CAMPAIGN_CONFIG,
            ...(parsed?.config || {}),
            appLinkUrl: sanitizeCampaignAppBaseUrl(parsed?.config?.appLinkUrl),
            templates: {
              tag: upgradeIfLegacy('tag'),
              budget_180d: upgradeIfLegacy('budget_180d'),
              inactive_90d: upgradeIfLegacy('inactive_90d'),
            },
          },
          queue: Array.isArray(parsed?.queue) ? parsed.queue : [],
          history: Array.isArray(parsed?.history) ? parsed.history.slice(0, 40) : [],
        };
      }
    } catch (err: any) {
      console.warn('[Sorriso Campaign] Erro ao ler store local:', err?.message);
    }
    return {
      config: { ...DEFAULT_SORRISO_CAMPAIGN_CONFIG },
      queue: [],
      history: [],
    };
  };

  const saveStore = (store: SorrisoCampaignLocalStore) => {
    try {
      fs.writeFileSync(
        storeFilePath,
        JSON.stringify(
          {
            config: store.config,
            queue: store.queue.slice(0, 5000),
            history: store.history.slice(0, 40),
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (err: any) {
      console.warn('[Sorriso Campaign] Erro ao salvar store local:', err?.message);
    }
  };

  let localStore: SorrisoCampaignLocalStore = readStore();
  let batchRunning = false;
  let workerStarted = false;
  let supabaseQueueAvailable: boolean | null = null;

  const isMissingTableError = (err: any): boolean => {
    const msg = String(err?.message || '').toLowerCase();
    const code = String(err?.code || '');
    return (
      code === '42P01' ||
      code === 'PGRST205' ||
      msg.includes('does not exist') ||
      msg.includes('could not find the table') ||
      msg.includes('schema cache')
    );
  };

  const mapQueueRowToItem = (row: any): SorrisoQueueItem => ({
    id: String(row.id),
    campaignKey: String(row.campaign_key || localStore.config.campaignKey),
    pipelineId: String(row.pipeline_id || ''),
    clinicId: Number(row.clinic_id || 1),
    clinicName: String(row.clinic_name || 'Palmas (Matriz)'),
    patientId: Number(row.patient_id || 0),
    patientName: String(row.patient_name || ''),
    mobilePhone: String(row.mobile_phone || ''),
    matchedCriteria: Array.isArray(row.matched_criteria) ? row.matched_criteria : [],
    primarySegment: (row.primary_segment || 'inactive_90d') as SorrisoTemplateSegment,
    priorityScore: Number(row.priority_score || 1),
    renderedMessage: String(row.rendered_message || ''),
    status: (row.status || 'pending') as SorrisoQueueItem['status'],
    crmLeadId: row.crm_lead_id ? String(row.crm_lead_id) : undefined,
    attempts: Number(row.attempts || 0),
    lastError: row.last_error ? String(row.last_error) : undefined,
    whatsappMode: row.whatsapp_mode ? String(row.whatsapp_mode) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    sentAt: row.sent_at ? String(row.sent_at) : undefined,
    updatedAt: String(row.updated_at || new Date().toISOString()),
  });

  const loadQueueItems = async (campaignKey: string): Promise<{
    items: SorrisoQueueItem[];
    storageMode: 'supabase' | 'local_fallback';
  }> => {
    try {
      const { data, error } = await deps.supabase
        .from('crm_campaign_queue')
        .select('*')
        .eq('campaign_key', campaignKey)
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(3000);

      if (!error && Array.isArray(data)) {
        supabaseQueueAvailable = true;
        return {
          items: data.map(mapQueueRowToItem),
          storageMode: 'supabase',
        };
      }
      if (error && isMissingTableError(error)) {
        supabaseQueueAvailable = false;
      }
    } catch {
      supabaseQueueAvailable = false;
    }

    const filtered = localStore.queue
      .filter((item) => item.campaignKey === campaignKey)
      .sort((a, b) => b.priorityScore - a.priorityScore || a.createdAt.localeCompare(b.createdAt));

    return {
      items: filtered,
      storageMode: 'local_fallback',
    };
  };

  const upsertQueueItems = async (items: SorrisoQueueItem[]): Promise<'supabase' | 'local_fallback'> => {
    if (items.length === 0) {
      return supabaseQueueAvailable ? 'supabase' : 'local_fallback';
    }

    if (supabaseQueueAvailable !== false) {
      try {
        const rows = items.map((item) => ({
          id: item.id,
          campaign_key: item.campaignKey,
          pipeline_id: item.pipelineId,
          clinic_id: item.clinicId,
          clinic_name: item.clinicName,
          patient_id: item.patientId || 0,
          patient_name: item.patientName,
          mobile_phone: item.mobilePhone,
          matched_criteria: item.matchedCriteria,
          primary_segment: item.primarySegment,
          priority_score: item.priorityScore,
          rendered_message: item.renderedMessage,
          status: item.status,
          crm_lead_id: item.crmLeadId || null,
          attempts: item.attempts,
          last_error: item.lastError || null,
          whatsapp_mode: item.whatsappMode || null,
          created_at: item.createdAt,
          sent_at: item.sentAt || null,
          updated_at: item.updatedAt,
        }));

        const { error } = await deps.supabase
          .from('crm_campaign_queue')
          .upsert(rows, { onConflict: 'campaign_key,mobile_phone' });

        if (!error) {
          supabaseQueueAvailable = true;
          return 'supabase';
        }
        if (isMissingTableError(error)) {
          supabaseQueueAvailable = false;
        }
      } catch {
        supabaseQueueAvailable = false;
      }
    }

    // Local fallback persistence (atomic deduplication by campaignKey + mobilePhone)
    const byKey = new Map<string, SorrisoQueueItem>();
    for (const existing of localStore.queue) {
      byKey.set(`${existing.campaignKey}::${existing.mobilePhone}`, existing);
    }
    for (const item of items) {
      byKey.set(`${item.campaignKey}::${item.mobilePhone}`, item);
    }
    localStore.queue = Array.from(byKey.values());
    saveStore(localStore);
    return 'local_fallback';
  };

  const updateQueueItem = async (item: SorrisoQueueItem): Promise<void> => {
    if (supabaseQueueAvailable !== false) {
      try {
        const { error } = await deps.supabase
          .from('crm_campaign_queue')
          .update({
            status: item.status,
            crm_lead_id: item.crmLeadId || null,
            attempts: item.attempts,
            last_error: item.lastError || null,
            whatsapp_mode: item.whatsappMode || null,
            sent_at: item.sentAt || null,
            updated_at: item.updatedAt,
          })
          .eq('id', item.id);
        if (!error) {
          supabaseQueueAvailable = true;
          return;
        }
        if (isMissingTableError(error)) {
          supabaseQueueAvailable = false;
        }
      } catch {
        supabaseQueueAvailable = false;
      }
    }

    const idx = localStore.queue.findIndex((q) => q.id === item.id);
    if (idx >= 0) {
      localStore.queue[idx] = item;
    } else {
      localStore.queue.push(item);
    }
    saveStore(localStore);
  };

  const resolveSorrisoPipeline = async (preferredPipelineId?: string): Promise<{
    id: string;
    name: string;
    found: boolean;
    firstStageId: string;
    firstStageTitle: string;
    contactedStageId: string;
    contactedStageTitle: string;
    stages: Array<{ id: string; title: string; semanticType: string }>;
    closedStageIds: Set<string>;
  }> => {
    try {
      const { data: pipelines } = await deps.supabase
        .from('crm_pipelines')
        .select('id, name, stages, is_active')
        .neq('is_active', false);

      if (Array.isArray(pipelines) && pipelines.length > 0) {
        const targetId = String(preferredPipelineId || localStore.config.pipelineId || '').trim();
        let matched =
          (targetId ? pipelines.find((p: any) => String(p.id) === targetId) : undefined) ||
          pipelines.find((p: any) => {
            const n = normalizeText(p.name);
            return n.includes('lancamento sorriso') || (n.includes('lancamento') && n.includes('sorriso'));
          }) ||
          pipelines.find((p: any) => normalizeText(p.name).includes('sorriso'));

        if (matched) {
          const rawStages: any[] = Array.isArray(matched.stages) ? matched.stages : [];
          const normalizedStages = rawStages
            .filter((s) => s && (s.id || s.title))
            .map((s) => ({
              id: String(s.id || ''),
              title: String(s.title || s.name || s.id || ''),
              semanticType: String(s.semanticType || 'contacted'),
            }));

          const isLeadGeneratedStage = (s: { id: string; title: string }) => {
            const titleNorm = normalizeText(s.title);
            const idNorm = normalizeText(s.id);
            return (
              titleNorm.includes('lead gerado') ||
              titleNorm.includes('leads gerados') ||
              idNorm.includes('lead_gerado') ||
              idNorm.includes('lead-gerado') ||
              idNorm === 'leadgerado'
            );
          };

          const isInviteSentStage = (s: { id: string; title: string }) => {
            const titleNorm = normalizeText(s.title);
            const idNorm = normalizeText(s.id);
            return (
              titleNorm.includes('convite') ||
              titleNorm.includes('whatsapp') ||
              titleNorm.includes('enviad') ||
              titleNorm.includes('dispar') ||
              titleNorm.includes('contat') ||
              idNorm.includes('convite') ||
              idNorm === 'contacted'
            );
          };

          const configuredImportId = String(localStore.config.importStageId || '').trim();
          const configuredSentId = String(localStore.config.sentStageId || '').trim();

          const firstStage =
            (configuredImportId
              ? normalizedStages.find((s) => s.id === configuredImportId)
              : undefined) ||
            normalizedStages.find(isLeadGeneratedStage) ||
            normalizedStages.find((s) => s.semanticType === 'new') ||
            normalizedStages[0] || {
              id: 'new',
              title: 'Lead Gerado',
              semanticType: 'new',
            };

          const firstIdx = normalizedStages.findIndex((s) => s.id === firstStage.id);
          const otherStages = normalizedStages.filter((s) => s.id !== firstStage.id);

          const contactedStage =
            (configuredSentId
              ? otherStages.find((s) => s.id === configuredSentId)
              : undefined) ||
            otherStages.find(isInviteSentStage) ||
            otherStages.find((s) => s.semanticType === 'contacted') ||
            (firstIdx >= 0 && normalizedStages[firstIdx + 1]
              ? normalizedStages[firstIdx + 1]
              : undefined) ||
            otherStages[0] || {
              id: 'contacted',
              title: 'Convite Enviado',
              semanticType: 'contacted',
            };

          const closedStageIds = new Set<string>(
            normalizedStages
              .filter(
                (s) =>
                  s.id !== firstStage.id &&
                  s.id !== contactedStage.id &&
                  ['scheduled', 'converted', 'lost'].includes(s.semanticType)
              )
              .map((s) => s.id)
          );
          closedStageIds.add('scheduled');
          closedStageIds.add('converted');
          closedStageIds.add('lost');
          closedStageIds.delete(firstStage.id);
          closedStageIds.delete(contactedStage.id);

          return {
            id: String(matched.id),
            name: String(matched.name || 'Lançamento Sorriso Bertuol'),
            found: true,
            firstStageId: firstStage.id || 'new',
            firstStageTitle: firstStage.title || 'Lead Gerado',
            contactedStageId: contactedStage.id || 'contacted',
            contactedStageTitle: contactedStage.title || 'Convite Enviado',
            stages: normalizedStages,
            closedStageIds,
          };
        }
      }
    } catch {
      // Fallback below
    }

    return {
      id: preferredPipelineId || localStore.config.pipelineId || 'lancamento_sorriso_bertuol',
      name: localStore.config.pipelineName || 'Lançamento Sorriso Bertuol',
      found: false,
      firstStageId: 'new',
      firstStageTitle: 'Lead Gerado',
      contactedStageId: 'contacted',
      contactedStageTitle: 'Convite Enviado',
      stages: [
        { id: 'new', title: 'Lead Gerado', semanticType: 'new' },
        { id: 'contacted', title: 'Convite Enviado', semanticType: 'contacted' },
      ],
      closedStageIds: new Set(['scheduled', 'converted', 'lost']),
    };
  };

  const getClinicLabel = (clinicId: number): string => {
    const matched = deps.multiTenantClinics.find((c) => Number(c.id) === Number(clinicId));
    return matched?.shortName || matched?.name || (clinicId === 2 ? 'Paraíso' : 'Palmas (Matriz)');
  };

  const resolveClinicIdFromTenant = (tenantId?: string | null): number => {
    const t = String(tenantId || '').toLowerCase();
    return t.includes('5d30567b') ? 2 : 1;
  };

  const buildSorrisoAudiencePreview = async (opts: {
    clinicScope?: number | 'all';
    pipelineId?: string;
    includeClinicorpLiveEstimates?: boolean;
  }): Promise<{
    resolvedPipeline: {
      id: string;
      name: string;
      found: boolean;
      firstStageId: string;
      firstStageTitle: string;
      contactedStageId: string;
      contactedStageTitle: string;
    };
    candidates: SorrisoPreviewCandidate[];
    warnings: string[];
  }> => {
    const cfg = localStore.config;
    const clock = deps.getSaoPauloClockParts();
    const todayYMD = clock.ymd;
    const warnings: string[] = [];
    const effectiveScope: number | 'all' =
      opts.clinicScope === 'all'
        ? 'all'
        : typeof opts.clinicScope === 'number' && Number.isFinite(opts.clinicScope)
        ? opts.clinicScope
        : cfg.clinicScope;

    const pipeline = await resolveSorrisoPipeline(opts.pipelineId);
    const { items: queueItems } = await loadQueueItems(cfg.campaignKey);

    // Build cooldown & active queue lookup maps
    const activeQueuePhones = new Set<string>();
    const cooldownPhones = new Set<string>();
    const cooldownCutoffYMD = deps.addDaysYMD(todayYMD, -Math.max(1, cfg.cooldownDays));

    for (const q of queueItems) {
      const suffix = phoneMatchSuffix(normalizePhoneDigits(q.mobilePhone));
      if (!suffix) continue;
      if (q.status === 'pending' || q.status === 'sending') {
        activeQueuePhones.add(suffix);
      } else if (q.status === 'sent') {
        const sentYmd = extractYMD(q.sentAt || q.updatedAt);
        if (sentYmd && sentYmd >= cooldownCutoffYMD) {
          cooldownPhones.add(suffix);
        }
      }
    }

    // 1. Load labels to match tag name ('LANCAMENTO_SORRISO') -> label IDs
    const targetTagNormalized = normalizeText(cfg.tagName || 'LANCAMENTO_SORRISO');
    const matchingLabelTokens = new Set<string>([
      targetTagNormalized,
      'lbl_lancamento_sorriso',
      'lancamento_sorriso',
      'lancamento sorriso',
    ]);

    try {
      const { data: crmLabels } = await deps.supabase.from('crm_labels').select('id, name');
      if (Array.isArray(crmLabels)) {
        for (const lbl of crmLabels as any[]) {
          const n = normalizeText(lbl.name);
          if (n === targetTagNormalized || n.includes(targetTagNormalized)) {
            matchingLabelTokens.add(normalizeText(lbl.id));
            matchingLabelTokens.add(n);
          }
        }
      }
    } catch {
      // Non-fatal
    }

    // 2. Load CRM leads (crm_leads_recall)
    let crmLeads: any[] = [];
    try {
      const { data, error } = await deps.supabase
        .from('crm_leads_recall')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(4000);
      if (error) {
        warnings.push(`Leitura de crm_leads_recall: ${error.message}`);
      } else if (Array.isArray(data)) {
        crmLeads = data;
      }
    } catch (err: any) {
      warnings.push(`Falha ao consultar crm_leads_recall: ${err?.message || 'erro'}`);
    }

    // Identify leads already closed/scheduled in the Lançamento Sorriso pipeline
    const closedInTargetPhones = new Set<string>();
    const closedInTargetPatientIds = new Set<number>();
    const existingLeadInTargetByKey = new Map<string, string>();

    for (const row of crmLeads) {
      if (String(row.pipeline_id || '') !== pipeline.id) continue;
      const phone = normalizePhoneDigits(row.mobile_phone);
      const suffix = phoneMatchSuffix(phone);
      const pid = Number(row.patient_id || 0);
      const stage = String(row.stage || '');

      if (suffix) existingLeadInTargetByKey.set(`phone:${suffix}`, String(row.id));
      if (pid > 0) existingLeadInTargetByKey.set(`pid:${pid}`, String(row.id));

      if (pipeline.closedStageIds.has(stage)) {
        if (suffix) closedInTargetPhones.add(suffix);
        if (pid > 0) closedInTargetPatientIds.add(pid);
      }
    }

    // 3. Load appointments from Supabase to detect latest completed visit & future scheduled appointments
    const futurePatientNames = new Set<string>();
    const futurePatientPhones = new Set<string>();
    const lastCompletedByPhone = new Map<string, { date: string; procedure?: string }>();
    const lastCompletedByName = new Map<string, { date: string; procedure?: string }>();

    try {
      const pageSize = 1000;
      let offset = 0;
      while (offset < 8000) {
        const { data: appts, error } = await deps.supabase
          .from('appointments')
          .select('patient_name, patient_phone, date, procedures, status')
          .order('date', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error || !appts || appts.length === 0) break;

        for (const appt of appts as any[]) {
          const ymd = extractYMD(appt.date);
          if (!ymd) continue;
          const statusNorm = normalizeText(appt.status);
          const isCancelledOrMissed =
            statusNorm.includes('cancel') ||
            statusNorm.includes('falt') ||
            statusNorm.includes('miss') ||
            statusNorm.includes('excl') ||
            statusNorm.includes('delet');
          if (isCancelledOrMissed) continue;

          const nameNorm = normalizeText(appt.patient_name);
          const phoneSuffix = phoneMatchSuffix(normalizePhoneDigits(appt.patient_phone));

          if (ymd >= todayYMD) {
            if (nameNorm) futurePatientNames.add(nameNorm);
            if (phoneSuffix) futurePatientPhones.add(phoneSuffix);
          } else {
            if (phoneSuffix) {
              const prev = lastCompletedByPhone.get(phoneSuffix);
              if (!prev || ymd > prev.date) {
                lastCompletedByPhone.set(phoneSuffix, {
                  date: ymd,
                  procedure: appt.procedures ? String(appt.procedures) : undefined,
                });
              }
            }
            if (nameNorm) {
              const prev = lastCompletedByName.get(nameNorm);
              if (!prev || ymd > prev.date) {
                lastCompletedByName.set(nameNorm, {
                  date: ymd,
                  procedure: appt.procedures ? String(appt.procedures) : undefined,
                });
              }
            }
          }
        }

        if (appts.length < pageSize) break;
        offset += pageSize;
      }
    } catch {
      // Optional enrichment
    }

    // Candidate accumulator (keyed by phone suffix when valid, else pid/name)
    interface MutableCandidate {
      dedupeKey: string;
      patientId: number;
      patientName: string;
      patientPhone: string;
      clinicId: number;
      clinicName: string;
      criteriaSet: Set<SorrisoCriterionCode>;
      lastVisitDate?: string;
      daysSinceLastVisit?: number;
      estimateDate?: string;
      estimatedValue?: number;
      treatmentSummary?: string;
      existingLeadId?: string;
    }

    const candidatesMap = new Map<string, MutableCandidate>();

    const upsertCandidate = (input: {
      patientId: number;
      patientName: string;
      rawPhone?: string | null;
      clinicId: number;
      criterion: SorrisoCriterionCode;
      lastVisitDate?: string;
      daysSinceLastVisit?: number;
      estimateDate?: string;
      estimatedValue?: number;
      treatmentSummary?: string;
      existingLeadId?: string;
    }) => {
      const cleanName = String(input.patientName || '')
        .replace(/\s*\(\d+\)\s*$/, '')
        .trim();
      if (!cleanName) return;

      const clinicId = Number(input.clinicId || 1);
      if (typeof effectiveScope === 'number' && clinicId !== effectiveScope) return;

      const phone = normalizePhoneDigits(input.rawPhone);
      const suffix = phoneMatchSuffix(phone);
      const nameNorm = normalizeText(cleanName);
      const key = suffix
        ? `phone:${suffix}`
        : input.patientId > 0
        ? `pid:${input.patientId}`
        : `name:${nameNorm}`;

      const existing = candidatesMap.get(key);
      if (!existing) {
        candidatesMap.set(key, {
          dedupeKey: key,
          patientId: input.patientId || 0,
          patientName: cleanName,
          patientPhone: phone,
          clinicId,
          clinicName: getClinicLabel(clinicId),
          criteriaSet: new Set([input.criterion]),
          lastVisitDate: input.lastVisitDate,
          daysSinceLastVisit: input.daysSinceLastVisit,
          estimateDate: input.estimateDate,
          estimatedValue: input.estimatedValue,
          treatmentSummary: input.treatmentSummary,
          existingLeadId:
            input.existingLeadId ||
            (suffix ? existingLeadInTargetByKey.get(`phone:${suffix}`) : undefined) ||
            (input.patientId > 0 ? existingLeadInTargetByKey.get(`pid:${input.patientId}`) : undefined),
        });
      } else {
        existing.criteriaSet.add(input.criterion);
        if (!existing.patientPhone && phone) existing.patientPhone = phone;
        if (!existing.patientId && input.patientId) existing.patientId = input.patientId;
        if (input.estimateDate && (!existing.estimateDate || input.estimateDate > existing.estimateDate)) {
          existing.estimateDate = input.estimateDate;
        }
        if (input.estimatedValue && (!existing.estimatedValue || input.estimatedValue > existing.estimatedValue)) {
          existing.estimatedValue = input.estimatedValue;
        }
        if (input.treatmentSummary && !existing.treatmentSummary) {
          existing.treatmentSummary = input.treatmentSummary;
        }
        if (input.lastVisitDate && (!existing.lastVisitDate || input.lastVisitDate > existing.lastVisitDate)) {
          existing.lastVisitDate = input.lastVisitDate;
          existing.daysSinceLastVisit = input.daysSinceLastVisit;
        }
        if (!existing.existingLeadId && input.existingLeadId) {
          existing.existingLeadId = input.existingLeadId;
        }
      }
    };

    const normalizedKeywords = (cfg.budgetKeywords || [])
      .map((k) => normalizeText(k))
      .filter(Boolean);

    const matchesBudgetKeywords = (text?: string | null): boolean => {
      if (normalizedKeywords.length === 0) return true;
      const norm = normalizeText(text);
      if (!norm) return true; // If estimate description is missing, keep it for manual review in dryRun
      return normalizedKeywords.some((kw) => norm.includes(kw));
    };

    const budgetCutoffYMD = deps.addDaysYMD(todayYMD, -Math.max(1, cfg.budgetWindowDays || 180));

    // === EVALUATE CRITERION A (TAG LANCAMENTO_SORRISO) + CRITERION B (CRM OPEN BUDGETS <=180d) + CRITERION C (CRM >90d) ===
    for (const row of crmLeads) {
      const pid = Number(row.patient_id || 0);
      const name = String(row.patient_name || '').trim();
      const phone = String(row.mobile_phone || '').trim();
      const clinicId = Number(row.clinic_id || 1);
      const stage = String(row.stage || '');
      const pipelineId = String(row.pipeline_id || '');
      const labelsArr: string[] = Array.isArray(row.labels) ? row.labels.map(String) : [];

      // Criterion A: Tag LANCAMENTO_SORRISO (or already sitting in stage 'new' of target pipeline)
      if (cfg.includeTagCriterion) {
        const hasTag = labelsArr.some((lbl) => {
          const norm = normalizeText(lbl);
          return matchingLabelTokens.has(norm) || norm.includes(targetTagNormalized);
        });
        const isQueuedInTargetPipeline =
          pipelineId === pipeline.id && stage === pipeline.firstStageId;

        if (hasTag || isQueuedInTargetPipeline) {
          upsertCandidate({
            patientId: pid,
            patientName: name,
            rawPhone: phone,
            clinicId,
            criterion: 'TAG_LANCAMENTO_SORRISO',
            treatmentSummary: row.ultimo_procedimento ? String(row.ultimo_procedimento) : undefined,
            estimatedValue: Number(row.estimated_value || 0) || undefined,
            existingLeadId: pipelineId === pipeline.id ? String(row.id) : undefined,
          });
        }
      }

      // Criterion B: Open Budgets (Pending) within last 180 days from CRM budgets pipeline
      if (cfg.includeOpenBudgetsCriterion) {
        const isBudgetRow =
          pipelineId === 'budgets' ||
          String(row.type || row.opportunity_type || '') === 'treatment_pending';
        const isOpenStage = !['scheduled', 'converted', 'lost'].includes(stage);

        if (isBudgetRow && isOpenStage) {
          const customFields: any[] = Array.isArray(row.custom_fields) ? row.custom_fields : [];
          const sysEstField = customFields.find(
            (cf) => cf?.id === '__sys_estimate_date' || normalizeText(cf?.label).includes('data do orcamento')
          );
          const estDate =
            extractYMD(sysEstField?.value) ||
            extractYMD(row.data_ultimo_agendamento) ||
            extractYMD(row.created_at);

          if (!estDate || estDate >= budgetCutoffYMD) {
            const procText = String(row.ultimo_procedimento || row.notes || '');
            if (matchesBudgetKeywords(procText)) {
              upsertCandidate({
                patientId: pid,
                patientName: name,
                rawPhone: phone,
                clinicId,
                criterion: 'ORCAMENTO_ABERTO_180D',
                estimateDate: estDate || undefined,
                estimatedValue: Number(row.estimated_value || 0) || undefined,
                treatmentSummary: row.ultimo_procedimento ? String(row.ultimo_procedimento) : undefined,
              });
            }
          }
        }
      }

      // Criterion C (from CRM recall rows): Last visit > 90 days
      if (cfg.includeInactiveCriterion) {
        const suffix = phoneMatchSuffix(normalizePhoneDigits(phone));
        const nameNorm = normalizeText(name);
        const hasFutureAppt =
          (suffix && futurePatientPhones.has(suffix)) || (nameNorm && futurePatientNames.has(nameNorm));
        if (!hasFutureAppt) {
          const apptLast =
            (suffix ? lastCompletedByPhone.get(suffix) : undefined) ||
            (nameNorm ? lastCompletedByName.get(nameNorm) : undefined);
          const rowLastYmd = extractYMD(row.data_ultimo_agendamento);
          const bestLastYmd =
            apptLast?.date && rowLastYmd
              ? apptLast.date > rowLastYmd
                ? apptLast.date
                : rowLastYmd
              : apptLast?.date || rowLastYmd;

          const computedDays = bestLastYmd
            ? computeDaysBetweenYMD(bestLastYmd, todayYMD)
            : Number(row.dias_desde_ultimo || 0);

          const meetsMin = computedDays > Math.max(1, cfg.inactiveMinDays || 90);
          const meetsMax = !cfg.inactiveMaxDays || computedDays <= cfg.inactiveMaxDays;

          if (meetsMin && meetsMax) {
            upsertCandidate({
              patientId: pid,
              patientName: name,
              rawPhone: phone,
              clinicId,
              criterion: 'INATIVO_90D',
              lastVisitDate: bestLastYmd || undefined,
              daysSinceLastVisit: computedDays,
              treatmentSummary: apptLast?.procedure || (row.ultimo_procedimento ? String(row.ultimo_procedimento) : undefined),
            });
          }
        }
      }
    }

    // === CRITERION A (patients.notes tag) + CRITERION C (active Supabase patients with completed visit > 90d) ===
    if (cfg.includeTagCriterion || cfg.includeInactiveCriterion) {
      try {
        const pageSize = 1000;
        let offset = 0;
        while (offset < 10000) {
          const { data: patients, error } = await deps.supabase
            .from('patients')
            .select('id, external_id, name, mobile_phone, tenant_id, is_active, is_deleted, notes, updated_at')
            .neq('is_active', false)
            .range(offset, offset + pageSize - 1);

          if (error || !patients || patients.length === 0) break;

          for (const p of patients as any[]) {
            if (p.is_deleted === true) continue;
            const clinicId = resolveClinicIdFromTenant(p.tenant_id);
            if (typeof effectiveScope === 'number' && clinicId !== effectiveScope) continue;

            const name = String(p.name || '').trim();
            if (!name) continue;
            const phone = String(p.mobile_phone || '').trim();
            const pid = Number(p.external_id || 0);
            const suffix = phoneMatchSuffix(normalizePhoneDigits(phone));
            const nameNorm = normalizeText(name);

            if (cfg.includeTagCriterion && p.notes) {
              const notesNorm = normalizeText(p.notes);
              if (notesNorm.includes(targetTagNormalized)) {
                upsertCandidate({
                  patientId: pid,
                  patientName: name,
                  rawPhone: phone,
                  clinicId,
                  criterion: 'TAG_LANCAMENTO_SORRISO',
                });
              }
            }

            if (cfg.includeInactiveCriterion) {
              const hasFutureAppt =
                (suffix && futurePatientPhones.has(suffix)) || (nameNorm && futurePatientNames.has(nameNorm));
              if (hasFutureAppt) continue;

              const apptLast =
                (suffix ? lastCompletedByPhone.get(suffix) : undefined) ||
                (nameNorm ? lastCompletedByName.get(nameNorm) : undefined);

              if (apptLast?.date) {
                const days = computeDaysBetweenYMD(apptLast.date, todayYMD);
                const meetsMin = days > Math.max(1, cfg.inactiveMinDays || 90);
                const meetsMax = !cfg.inactiveMaxDays || days <= cfg.inactiveMaxDays;
                if (meetsMin && meetsMax) {
                  upsertCandidate({
                    patientId: pid,
                    patientName: name,
                    rawPhone: phone,
                    clinicId,
                    criterion: 'INATIVO_90D',
                    lastVisitDate: apptLast.date,
                    daysSinceLastVisit: days,
                    treatmentSummary: apptLast.procedure,
                  });
                }
              }
            }
          }

          if (patients.length < pageSize) break;
          offset += pageSize;
        }
      } catch (err: any) {
        warnings.push(`Leitura de pacientes Supabase: ${err?.message || 'falha'}`);
      }
    }

    // === OPTIONAL LIVE CLINICORP OPEN ESTIMATES (last 180d, Pending/OPEN) ===
    if (cfg.includeOpenBudgetsCriterion && opts.includeClinicorpLiveEstimates) {
      const targetClinics =
        typeof effectiveScope === 'number'
          ? deps.multiTenantClinics.filter((c) => Number(c.id) === effectiveScope)
          : deps.multiTenantClinics.filter((c) => c.active !== false);

      const seenAuth = new Set<string>();
      for (const clinic of targetClinics) {
        const ctx = deps.resolveClinicorpContext(Number(clinic.id), Number(clinic.clinicorp_business_id));
        if (!ctx.configured) continue;
        const sig = `${ctx.baseUrl}::${ctx.user}`;
        if (seenAuth.has(sig)) continue;
        seenAuth.add(sig);

        // Fetch in 60-day windows to cover budgetWindowDays reliably without huge Clinicorp payloads
        const totalDays = Math.min(365, Math.max(30, cfg.budgetWindowDays || 180));
        const windowStep = 60;
        for (let endOffset = 0; endOffset < totalDays; endOffset += windowStep) {
          const toYmd = deps.addDaysYMD(todayYMD, -endOffset);
          const fromYmd = deps.addDaysYMD(todayYMD, -Math.min(totalDays, endOffset + windowStep));
          try {
            const qs = new URLSearchParams({
              subscriber_id: ctx.user,
              from: fromYmd,
              to: toYmd,
            });
            const apiRes = await fetch(`${ctx.baseUrl}/estimates/list?${qs.toString()}`, {
              method: 'GET',
              headers: { Authorization: ctx.authHeader, Accept: 'application/json' },
            });
            if (!apiRes.ok) continue;
            const rawJson = await apiRes.json().catch(() => null);
            const list: any[] = Array.isArray(rawJson)
              ? rawJson
              : Array.isArray(rawJson?.data)
              ? rawJson.data
              : [];

            for (const est of list) {
              const statusNorm = normalizeText(est?.Status || est?.status || est?.StatusDescription);
              const isPending =
                !statusNorm ||
                statusNorm.includes('open') ||
                statusNorm.includes('pend') ||
                statusNorm.includes('aberto') ||
                statusNorm.includes('aguard');
              const isExcluded =
                statusNorm.includes('approv') ||
                statusNorm.includes('aprov') ||
                statusNorm.includes('delet') ||
                statusNorm.includes('cancel') ||
                statusNorm.includes('reject');
              if (!isPending || isExcluded) continue;

              const patientName = String(est?.PatientName || est?.patient_name || '').trim();
              if (!patientName) continue;
              const patientId = Number(est?.PatientId || est?.patient_id || 0);
              const rawPhone = String(est?.MobilePhone || est?.Phone || est?.mobile_phone || '').trim();
              const estDate = extractYMD(est?.Date || est?.CreatedAt || est?.date) || toYmd;

              const proceduresText = Array.isArray(est?.Items)
                ? est.Items.map((it: any) => it?.ProcedureDescription || it?.Description || '').join(', ')
                : String(est?.Description || est?.TreatmentDescription || '');
              if (!matchesBudgetKeywords(proceduresText)) continue;

              upsertCandidate({
                patientId,
                patientName,
                rawPhone,
                clinicId: Number(clinic.id),
                criterion: 'ORCAMENTO_ABERTO_180D',
                estimateDate: estDate,
                estimatedValue: Number(est?.TotalAmount || est?.Amount || 0) || undefined,
                treatmentSummary: proceduresText ? proceduresText.slice(0, 140) : 'Orçamento em aberto',
              });
            }
          } catch {
            // Non-fatal: CRM budgets already loaded
          }
        }
      }
    }

    // Build final preview array with template rendering & blocked reasons
    const candidates: SorrisoPreviewCandidate[] = [];
    for (const c of candidatesMap.values()) {
      const matchedCriteria = Array.from(c.criteriaSet);
      const priorityScore = matchedCriteria.length;
      const primarySegment: SorrisoTemplateSegment = c.criteriaSet.has('ORCAMENTO_ABERTO_180D')
        ? 'budget_180d'
        : c.criteriaSet.has('TAG_LANCAMENTO_SORRISO')
        ? 'tag'
        : 'inactive_90d';

      const suffix = phoneMatchSuffix(c.patientPhone);
      const hasValidPhone = c.patientPhone.length >= 10;

      let blockedReason: SorrisoPreviewCandidate['blockedReason'] = null;
      if (!hasValidPhone) {
        blockedReason = 'SEM_TELEFONE';
      } else if (
        (suffix && closedInTargetPhones.has(suffix)) ||
        (c.patientId > 0 && closedInTargetPatientIds.has(c.patientId))
      ) {
        blockedReason = 'JA_AGENDADO_OU_CONVERTIDO';
      } else if (suffix && activeQueuePhones.has(suffix)) {
        blockedReason = 'JA_NA_FILA';
      } else if (suffix && cooldownPhones.has(suffix)) {
        blockedReason = 'COOLDOWN_ATIVO';
      }

      const firstName = c.patientName.split(' ')[0] || c.patientName;
      const patientAppUrl = buildPatientCampaignAppUrl(cfg, {
        phone: c.patientPhone,
        name: c.patientName,
      });
      const renderedPreview = renderCampaignMessage(cfg.templates[primarySegment], {
        nome: firstName,
        clinica: c.clinicName,
        procedimento: c.treatmentSummary || 'plano de tratamento',
        dias: c.daysSinceLastVisit || cfg.inactiveMinDays || 90,
        linkApp: patientAppUrl,
      });

      candidates.push({
        dedupeKey: c.dedupeKey,
        patientId: c.patientId,
        patientName: c.patientName,
        patientPhone: c.patientPhone,
        clinicId: c.clinicId,
        clinicName: c.clinicName,
        matchedCriteria,
        primarySegment,
        priorityScore,
        lastVisitDate: c.lastVisitDate,
        daysSinceLastVisit: c.daysSinceLastVisit,
        estimateDate: c.estimateDate,
        estimatedValue: c.estimatedValue,
        treatmentSummary: c.treatmentSummary,
        existingLeadId: c.existingLeadId,
        patientAppUrl,
        renderedPreview,
        blockedReason,
      });
    }

    candidates.sort((a, b) => {
      const aBlocked = a.blockedReason ? 1 : 0;
      const bBlocked = b.blockedReason ? 1 : 0;
      if (aBlocked !== bBlocked) return aBlocked - bBlocked;
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      return a.patientName.localeCompare(b.patientName, 'pt-BR');
    });

    return {
      resolvedPipeline: {
        id: pipeline.id,
        name: pipeline.name,
        found: pipeline.found,
        firstStageId: pipeline.firstStageId,
        firstStageTitle: pipeline.firstStageTitle,
        contactedStageId: pipeline.contactedStageId,
        contactedStageTitle: pipeline.contactedStageTitle,
      },
      candidates,
      warnings,
    };
  };

  const syncCardInSorrisoPipeline = async (params: {
    pipelineId: string;
    stageId: string;
    stageTitle?: string;
    item: SorrisoQueueItem;
    waDelivered: boolean;
    waError?: string;
    followUpYMD: string;
    triggerLabel: string;
  }): Promise<string | undefined> => {
    const nowIso = new Date().toISOString();
    const firstName = params.item.patientName.split(' ')[0] || params.item.patientName;
    const criteriaReadable = formatCriteriaReadable(params.item.matchedCriteria);
    const stageLabel = params.stageTitle || 'Lead Gerado';
    const deliveryStatus = params.waDelivered
      ? `Convite enviado (${params.item.whatsappMode || 'WAHA'})`
      : params.waError
      ? `Falha no disparo (${params.waError})`
      : `Aguardando envio WAHA/n8n (${stageLabel})`;

    const noteText = params.waDelivered
      ? `Convite da Campanha Lançamento Sorriso Bertuol enviado via WhatsApp/WAHA (${criteriaReadable}).`
      : params.waError
      ? `Tentativa de disparo da Campanha Lançamento Sorriso falhou (${params.waError}). Mantido em "${stageLabel}" para reenvio.`
      : `Lead importado pelo gerador da Campanha Lançamento Sorriso na fase "${stageLabel}" (${criteriaReadable}). Pronto para disparo via WhatsApp (WAHA / n8n).`;

    const customFields = [
      { id: 'cf-campanha', label: 'Campanha', value: 'Lançamento Sorriso Bertuol' },
      { id: 'cf-criterio', label: 'Critério de Inclusão', value: criteriaReadable },
      { id: 'cf-wa-status', label: 'Status Disparo WA', value: deliveryStatus },
      ...(params.item.patientAppUrl
        ? [{ id: 'cf-link-app', label: 'Link App / QR', value: params.item.patientAppUrl }]
        : []),
    ];

    // If card already exists in target pipeline, update it cleanly
    if (params.item.crmLeadId) {
      try {
        const updatePayload: Record<string, any> = {
          pipeline_id: params.pipelineId,
          stage: params.stageId,
          mensagem_whatsapp: params.item.renderedMessage,
          notes: noteText,
          updated_at: nowIso,
          custom_fields: customFields,
        };
        if (params.waDelivered) {
          updatePayload.last_contact_date = nowIso;
          updatePayload.next_contact_date = params.followUpYMD;
          updatePayload.contact_attempts = Math.max(1, params.item.attempts || 1);
        }

        const { error } = await deps.supabase
          .from('crm_leads_recall')
          .update(updatePayload)
          .eq('id', params.item.crmLeadId);
        if (!error) return params.item.crmLeadId;
        console.warn('[Sorriso Campaign] Erro ao atualizar card existente no CRM:', error.message);
      } catch (err: any) {
        console.warn('[Sorriso Campaign] Exceção ao atualizar card no CRM:', err?.message);
      }
    }

    const resolvedLeadType =
      params.item.primarySegment === 'budget_180d' ? 'treatment_pending' : 'whatsapp_lead';

    const baseRow = {
      pipeline_id: params.pipelineId,
      type: resolvedLeadType,
      source: `Campanha Lançamento Sorriso · ${criteriaReadable}`,
      patient_id: params.item.patientId || Math.floor(Date.now() % 1000000000),
      patient_name: params.item.patientName,
      primeiro_nome: firstName,
      mobile_phone: params.item.mobilePhone,
      data_ultimo_agendamento: deps.getSaoPauloClockParts().ymd,
      ultimo_procedimento: `Lançamento Sorriso · ${criteriaReadable}`,
      dias_desde_ultimo: 0,
      tipo_mensagem:
        params.item.primarySegment === 'budget_180d'
          ? 'B'
          : params.item.primarySegment === 'tag'
          ? 'A'
          : 'C',
      mensagem_whatsapp: params.item.renderedMessage,
      stage: params.stageId,
      priority: params.item.priorityScore >= 2 ? 'high' : 'medium',
      clinic_id: params.item.clinicId || 1,
      dentist_name: 'Corpo Clínico Bertuol',
      estimated_value: 0,
      points_bonus: 50,
      notes: noteText,
      last_contact_date: params.waDelivered ? nowIso : null,
      updated_at: nowIso,
    };

    const fullRow = {
      ...baseRow,
      labels: ['lbl_lancamento_sorriso'],
      notes_history: [
        {
          id: `note-sorriso-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          text: noteText,
          author: params.triggerLabel,
          createdAt: nowIso,
        },
      ],
      custom_fields: customFields,
      contact_attempts: params.waDelivered ? 1 : 0,
      next_contact_date: params.waDelivered ? params.followUpYMD : null,
    };

    try {
      const { data: insertedFull, error: fullErr } = await deps.supabase
        .from('crm_leads_recall')
        .insert(fullRow)
        .select('id')
        .single();
      if (!fullErr && insertedFull?.id) return String(insertedFull.id);
      if (fullErr) {
        console.warn('[Sorriso Campaign] Insert fullRow falhou, tentando baseRow:', fullErr.message);
      }

      const { data: insertedBase, error: baseErr } = await deps.supabase
        .from('crm_leads_recall')
        .insert(baseRow)
        .select('id')
        .single();
      if (!baseErr && insertedBase?.id) return String(insertedBase.id);
      if (baseErr) {
        console.warn('[Sorriso Campaign] Insert baseRow falhou:', baseErr.message);
      }
    } catch (err: any) {
      console.warn('[Sorriso Campaign] Exceção ao criar card no CRM:', err?.message);
    }

    return params.item.crmLeadId;
  };

  const processCampaignBatch = async (options: {
    trigger: 'manual' | 'scheduler' | 'n8n';
    batchSizeOverride?: number;
    ignoreBusinessHours?: boolean;
  }): Promise<{
    status: number;
    payload: Record<string, any>;
  }> => {
    if (batchRunning) {
      return {
        status: 409,
        payload: {
          success: false,
          error: 'Já existe um lote da Campanha Lançamento Sorriso em execução. Aguarde concluir.',
        },
      };
    }

    const cfg = localStore.config;
    const clock = deps.getSaoPauloClockParts();
    const inHours = isInSaoPauloBusinessHours();

    if (cfg.paused && options.trigger !== 'manual') {
      return {
        status: 200,
        payload: {
          success: true,
          skipped: true,
          reason: 'Campanha pausada.',
          processed: 0,
          sent: 0,
          failed: 0,
        },
      };
    }

    if (cfg.businessHoursOnly && !inHours && !options.ignoreBusinessHours) {
      return {
        status: 200,
        payload: {
          success: true,
          skipped: true,
          skippedWindow: true,
          reason: `Fora da janela comercial (Seg–Sex 08:00–19:00, Sáb 08:00–12:00 BRT). Hora atual: ${clock.hhmm}.`,
          processed: 0,
          sent: 0,
          failed: 0,
        },
      };
    }

    batchRunning = true;
    const warnings: string[] = [];
    let processed = 0;
    let sent = 0;
    let failed = 0;
    let consecutiveErrors = 0;
    let circuitBreakerTripped = false;

    try {
      const pipeline = await resolveSorrisoPipeline(cfg.pipelineId);
      const { items } = await loadQueueItems(cfg.campaignKey);

      const sentToday = items.filter(
        (it) => it.status === 'sent' && extractYMD(it.sentAt || it.updatedAt) === clock.ymd
      ).length;
      const dailyRemaining = Math.max(0, (cfg.dailyLimit || 60) - sentToday);

      if (dailyRemaining === 0) {
        return {
          status: 200,
          payload: {
            success: true,
            skipped: true,
            reason: `Limite diário de ${cfg.dailyLimit} disparos já atingido hoje (${clock.ymd}).`,
            processed: 0,
            sent: 0,
            failed: 0,
            dailyRemaining: 0,
          },
        };
      }

      const requestedBatch = Math.min(
        30,
        Math.max(1, Number(options.batchSizeOverride || cfg.batchSize || 10))
      );
      const pendingItems = items
        .filter((it) => it.status === 'pending')
        .sort((a, b) => b.priorityScore - a.priorityScore || a.createdAt.localeCompare(b.createdAt))
        .slice(0, Math.min(requestedBatch, dailyRemaining));

      const followUpYMD = deps.addDaysYMD(clock.ymd, Math.max(1, cfg.followUpDays || 2));
      const triggerLabel =
        options.trigger === 'n8n'
          ? 'Automação n8n (Lançamento)'
          : options.trigger === 'scheduler'
          ? 'Worker Interno (Lançamento)'
          : 'Disparo Manual (Lançamento)';

      const minDelayMs = Math.max(3, Math.min(60, cfg.minDelaySec || 15)) * 1000;
      const maxDelayMs = Math.max(minDelayMs, Math.min(120, cfg.maxDelaySec || 35) * 1000);
      // Keep manual interactive clicks responsive while still pacing sends safely
      const effectiveMinMs = options.trigger === 'manual' ? Math.min(minDelayMs, 4000) : minDelayMs;
      const effectiveMaxMs = options.trigger === 'manual' ? Math.min(maxDelayMs, 8000) : maxDelayMs;

      for (const item of pendingItems) {
        if (processed > 0) {
          const jitter =
            effectiveMinMs + Math.floor(Math.random() * Math.max(1000, effectiveMaxMs - effectiveMinMs));
          await new Promise((resolve) => setTimeout(resolve, jitter));
        }

        item.status = 'sending';
        item.attempts += 1;
        item.updatedAt = new Date().toISOString();
        await updateQueueItem(item);

        const targetAppUrl =
          item.patientAppUrl ||
          buildPatientCampaignAppUrl(cfg, {
            phone: item.mobilePhone,
            name: item.patientName,
          });
        const deliveryMode: SorrisoDeliveryMode = cfg.deliveryMode || 'qrcode_with_caption';

        let waRes: { success: boolean; mode?: string; error?: string };

        if (deliveryMode === 'qrcode_with_caption') {
          try {
            const QRCode = (await import('qrcode')).default;
            const qrDataUrl = await QRCode.toDataURL(targetAppUrl, {
              width: 640,
              margin: 2,
              color: { dark: '#0F172A', light: '#FFFFFF' },
              errorCorrectionLevel: 'M',
            });
            const imgRes = await deps.sendWhatsAppImageDirect({
              recipientPhone: item.mobilePhone,
              imageBase64: qrDataUrl,
              mimetype: 'image/png',
              filename: 'clube-sorriso-bertuol-qrcode.png',
              caption: item.renderedMessage,
            });
            if (imgRes.success) {
              waRes = imgRes;
            } else {
              // Automatic safe fallback to /api/sendText with linkPreview so delivery never drops
              warnings.push(
                `${item.patientName}: QR Code via /api/sendImage indisponível (${imgRes.error || 'fallback'}), enviado via texto com link preview.`
              );
              waRes = await deps.sendWhatsAppTextDirect({
                recipientPhone: item.mobilePhone,
                message: item.renderedMessage,
                linkPreview: cfg.enableLinkPreview ?? true,
              });
            }
          } catch {
            waRes = await deps.sendWhatsAppTextDirect({
              recipientPhone: item.mobilePhone,
              message: item.renderedMessage,
              linkPreview: cfg.enableLinkPreview ?? true,
            });
          }
        } else if (deliveryMode === 'text_and_qrcode') {
          waRes = await deps.sendWhatsAppTextDirect({
            recipientPhone: item.mobilePhone,
            message: item.renderedMessage,
            linkPreview: cfg.enableLinkPreview ?? true,
          });
          if (waRes.success) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 1800));
              const QRCode = (await import('qrcode')).default;
              const qrDataUrl = await QRCode.toDataURL(targetAppUrl, {
                width: 640,
                margin: 2,
                color: { dark: '#0F172A', light: '#FFFFFF' },
                errorCorrectionLevel: 'M',
              });
              const qrRes = await deps.sendWhatsAppImageDirect({
                recipientPhone: item.mobilePhone,
                imageBase64: qrDataUrl,
                mimetype: 'image/png',
                filename: 'clube-sorriso-bertuol-qrcode.png',
                caption: '📱 Aponte a câmera para o QR Code acima para abrir direto o App Clube Sorriso Bertuol.',
              });
              if (qrRes.success) {
                waRes = { ...waRes, mode: `${waRes.mode || 'waha'}+qr` };
              }
            } catch {
              // Non-fatal: primary text message was already delivered
            }
          }
        } else {
          waRes = await deps.sendWhatsAppTextDirect({
            recipientPhone: item.mobilePhone,
            message: item.renderedMessage,
            linkPreview: cfg.enableLinkPreview ?? true,
          });
        }

        processed += 1;

        if (waRes.success) {
          consecutiveErrors = 0;
          sent += 1;
          item.status = 'sent';
          item.whatsappMode = waRes.mode;
          item.lastError = undefined;
          item.sentAt = new Date().toISOString();
          item.updatedAt = item.sentAt;
          item.crmLeadId = await syncCardInSorrisoPipeline({
            pipelineId: pipeline.id,
            stageId: pipeline.contactedStageId,
            stageTitle: pipeline.contactedStageTitle,
            item,
            waDelivered: true,
            followUpYMD,
            triggerLabel,
          });
          await updateQueueItem(item);
        } else {
          consecutiveErrors += 1;
          failed += 1;
          item.status = 'failed';
          item.lastError = waRes.error || 'Falha no gateway WhatsApp';
          item.updatedAt = new Date().toISOString();
          warnings.push(`${item.patientName}: ${item.lastError}`);
          item.crmLeadId = await syncCardInSorrisoPipeline({
            pipelineId: pipeline.id,
            stageId: pipeline.firstStageId,
            stageTitle: pipeline.firstStageTitle,
            item,
            waDelivered: false,
            waError: item.lastError,
            followUpYMD,
            triggerLabel,
          });
          await updateQueueItem(item);

          if (consecutiveErrors >= 3) {
            circuitBreakerTripped = true;
            localStore.config.paused = true;
            warnings.push(
              'Circuit-breaker acionado: fila pausada automaticamente após 3 falhas consecutivas no gateway WhatsApp.'
            );
            break;
          }
        }
      }

      const logEntry: SorrisoBatchLogEntry = {
        id: `sorriso-batch-${Date.now()}`,
        runAt: new Date().toISOString(),
        trigger: options.trigger,
        processed,
        sent,
        failed,
        skippedWindow: false,
        circuitBreakerTripped,
        warnings: warnings.slice(0, 15),
      };

      if (processed > 0 || circuitBreakerTripped) {
        localStore.history = [logEntry, ...localStore.history].slice(0, 40);
      }
      saveStore(localStore);

      return {
        status: 200,
        payload: {
          success: true,
          processed,
          sent,
          failed,
          circuitBreakerTripped,
          dailyRemaining: Math.max(0, dailyRemaining - sent),
          warnings,
        },
      };
    } catch (err: any) {
      return {
        status: 500,
        payload: {
          success: false,
          error: err?.message || 'Erro inesperado ao processar lote da campanha.',
        },
      };
    } finally {
      batchRunning = false;
    }
  };

  // === ROUTES ===

  // 1. GET config + queue status + pipeline resolution + SQL migration
  app.get('/api/crm/campaigns/sorriso/config', async (req: Request, res: Response) => {
    if (!deps.isAdminRequest(req) && !isCampaignCronSecretValid(req)) {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores ou gerência podem acessar a campanha Lançamento Sorriso.',
      });
    }

    const clock = deps.getSaoPauloClockParts();
    const pipeline = await resolveSorrisoPipeline(localStore.config.pipelineId);
    const { items, storageMode } = await loadQueueItems(localStore.config.campaignKey);

    const pending = items.filter((i) => i.status === 'pending').length;
    const sending = items.filter((i) => i.status === 'sending').length;
    const sent = items.filter((i) => i.status === 'sent').length;
    const failed = items.filter((i) => i.status === 'failed').length;
    const cancelled = items.filter((i) => i.status === 'cancelled').length;
    const sentToday = items.filter(
      (i) => i.status === 'sent' && extractYMD(i.sentAt || i.updatedAt) === clock.ymd
    ).length;

    return res.json({
      success: true,
      config: {
        ...localStore.config,
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
      },
      resolvedPipeline: {
        id: pipeline.id,
        name: pipeline.name,
        found: pipeline.found,
        firstStageId: pipeline.firstStageId,
        firstStageTitle: pipeline.firstStageTitle,
        contactedStageId: pipeline.contactedStageId,
        contactedStageTitle: pipeline.contactedStageTitle,
        stages: pipeline.stages,
      },
      queueStats: {
        pending,
        sending,
        sent,
        failed,
        cancelled,
        sentToday,
        dailyRemaining: Math.max(0, (localStore.config.dailyLimit || 60) - sentToday),
      },
      queuePreview: items.slice(0, 120),
      history: localStore.history,
      webhookPath: '/api/crm/campaigns/sorriso/process-batch',
      cronSecretConfigured: Boolean(
        String(process.env.CAMPAIGN_CRON_SECRET || process.env.BIRTHDAY_CRON_SECRET || '').trim()
      ),
      storageMode,
      inBusinessHours: isInSaoPauloBusinessHours(),
      nowTimeBR: clock.hhmm,
      todayBR: clock.ymd,
      sqlMigration: SORRISO_QUEUE_SQL_MIGRATION,
    });
  });

  // 2. PUT config
  app.put('/api/crm/campaigns/sorriso/config', async (req: Request, res: Response) => {
    if (!deps.isAdminRequest(req)) {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores ou gerência podem editar a campanha Lançamento Sorriso.',
      });
    }

    const body = req.body || {};
    const prev = localStore.config;

    const clamp = (val: any, fallback: number, min: number, max: number) => {
      const n = Number(val);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(max, Math.max(min, Math.floor(n)));
    };

    const budgetWindowDays = clamp(body.budgetWindowDays, prev.budgetWindowDays, 7, 365);
    const inactiveMinDays = clamp(body.inactiveMinDays, prev.inactiveMinDays, 30, 730);
    const inactiveMaxDays = clamp(body.inactiveMaxDays, prev.inactiveMaxDays, 0, 3650);
    const cooldownDays = clamp(body.cooldownDays, prev.cooldownDays, 1, 180);
    const batchSize = clamp(body.batchSize, prev.batchSize, 1, 30);
    const dailyLimit = clamp(body.dailyLimit, prev.dailyLimit, 1, 300);
    const minDelaySec = clamp(body.minDelaySec, prev.minDelaySec, 5, 90);
    const maxDelaySec = Math.max(minDelaySec, clamp(body.maxDelaySec, prev.maxDelaySec, 5, 120));
    const followUpDays = clamp(body.followUpDays, prev.followUpDays, 1, 15);

    const rawKeywords = Array.isArray(body.budgetKeywords)
      ? body.budgetKeywords.map((k: any) => String(k || '').trim()).filter(Boolean).slice(0, 40)
      : prev.budgetKeywords;

    const validateTpl = (val: any, fallback: string) => {
      const s = String(val ?? fallback).trim();
      return s.length >= 15 && s.length <= 2000 ? s : fallback;
    };

    const rawScope = body.clinicScope;
    const clinicScope: number | 'all' =
      rawScope === 'all' || rawScope == null
        ? 'all'
        : Number.isFinite(Number(rawScope))
        ? Number(rawScope)
        : prev.clinicScope;

    const allowedDeliveryModes: SorrisoDeliveryMode[] = [
      'text_with_link',
      'qrcode_with_caption',
      'text_and_qrcode',
    ];
    const deliveryMode: SorrisoDeliveryMode = allowedDeliveryModes.includes(body.deliveryMode)
      ? body.deliveryMode
      : prev.deliveryMode || 'qrcode_with_caption';

    localStore.config = {
      ...prev,
      pipelineId: body.pipelineId ? String(body.pipelineId).trim() : prev.pipelineId,
      pipelineName: body.pipelineName ? String(body.pipelineName).trim().slice(0, 120) : prev.pipelineName,
      enabled: Boolean(body.enabled ?? prev.enabled),
      paused: Boolean(body.paused ?? prev.paused),
      clinicScope,
      includeTagCriterion: Boolean(body.includeTagCriterion ?? prev.includeTagCriterion),
      tagName: String(body.tagName || prev.tagName || 'LANCAMENTO_SORRISO').trim().slice(0, 60),
      includeOpenBudgetsCriterion: Boolean(
        body.includeOpenBudgetsCriterion ?? prev.includeOpenBudgetsCriterion
      ),
      budgetWindowDays,
      budgetKeywords: rawKeywords,
      includeInactiveCriterion: Boolean(body.includeInactiveCriterion ?? prev.includeInactiveCriterion),
      inactiveMinDays,
      inactiveMaxDays,
      cooldownDays,
      batchSize,
      dailyLimit,
      minDelaySec,
      maxDelaySec,
      businessHoursOnly: Boolean(body.businessHoursOnly ?? prev.businessHoursOnly),
      followUpDays,
      appLinkUrl: sanitizeCampaignAppBaseUrl(body.appLinkUrl ?? prev.appLinkUrl),
      personalizeAppLink: Boolean(body.personalizeAppLink ?? prev.personalizeAppLink ?? true),
      deliveryMode,
      enableLinkPreview: Boolean(body.enableLinkPreview ?? prev.enableLinkPreview ?? true),
      importStageId:
        typeof body.importStageId === 'string'
          ? body.importStageId.trim().slice(0, 80)
          : prev.importStageId || '',
      sentStageId:
        typeof body.sentStageId === 'string'
          ? body.sentStageId.trim().slice(0, 80)
          : prev.sentStageId || '',
      templates: {
        tag: validateTpl(body.templates?.tag, prev.templates.tag),
        budget_180d: validateTpl(body.templates?.budget_180d, prev.templates.budget_180d),
        inactive_90d: validateTpl(body.templates?.inactive_90d, prev.templates.inactive_90d),
      },
      updatedAt: new Date().toISOString(),
      updatedBy: String(req.headers['x-user-email'] || body.updatedBy || 'Admin'),
    };

    saveStore(localStore);

    return res.json({
      success: true,
      config: localStore.config,
    });
  });

  // 3. POST preview (dryRun audience calculation)
  app.post('/api/crm/campaigns/sorriso/preview', async (req: Request, res: Response) => {
    if (!deps.isAdminRequest(req) && !isCampaignCronSecretValid(req)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado para simulação da campanha.',
      });
    }

    try {
      const rawScope = req.body?.clinicScope;
      const clinicScope: number | 'all' | undefined =
        rawScope === 'all'
          ? 'all'
          : rawScope != null && Number.isFinite(Number(rawScope))
          ? Number(rawScope)
          : undefined;

      const result = await buildSorrisoAudiencePreview({
        clinicScope,
        pipelineId: req.body?.pipelineId ? String(req.body.pipelineId) : undefined,
        includeClinicorpLiveEstimates: Boolean(req.body?.includeClinicorpLiveEstimates),
      });

      const eligible = result.candidates.filter((c) => !c.blockedReason);
      const blocked = result.candidates.filter((c) => Boolean(c.blockedReason));

      return res.json({
        success: true,
        resolvedPipeline: result.resolvedPipeline,
        counts: {
          totalCandidates: result.candidates.length,
          eligible: eligible.length,
          blocked: blocked.length,
          byTag: eligible.filter((c) => c.matchedCriteria.includes('TAG_LANCAMENTO_SORRISO')).length,
          byBudget180d: eligible.filter((c) => c.matchedCriteria.includes('ORCAMENTO_ABERTO_180D'))
            .length,
          byInactive90d: eligible.filter((c) => c.matchedCriteria.includes('INATIVO_90D')).length,
          multiCriteria: eligible.filter((c) => c.priorityScore >= 2).length,
        },
        candidates: result.candidates.slice(0, 600),
        warnings: result.warnings,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Erro ao calcular audiência da campanha.',
      });
    }
  });

  // 4. POST enqueue (creates cards in pipeline + inserts approved leads into persistent queue)
  app.post('/api/crm/campaigns/sorriso/enqueue', async (req: Request, res: Response) => {
    if (!deps.isAdminRequest(req)) {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores ou gerência podem enfileirar leads na campanha.',
      });
    }

    try {
      const rawSelected = Array.isArray(req.body?.candidates) ? req.body.candidates : [];
      if (rawSelected.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Selecione ao menos 1 lead elegível para enfileirar.',
        });
      }

      const capped = rawSelected.slice(0, 500);
      const pipeline = await resolveSorrisoPipeline(
        req.body?.pipelineId ? String(req.body.pipelineId) : localStore.config.pipelineId
      );
      const clock = deps.getSaoPauloClockParts();
      const followUpYMD = deps.addDaysYMD(clock.ymd, Math.max(1, localStore.config.followUpDays || 2));
      const nowIso = new Date().toISOString();

      const newItems: SorrisoQueueItem[] = [];
      let skippedInvalid = 0;

      const allowedCriteria = new Set<SorrisoCriterionCode>([
        'TAG_LANCAMENTO_SORRISO',
        'ORCAMENTO_ABERTO_180D',
        'INATIVO_90D',
      ]);

      for (const raw of capped) {
        const phone = normalizePhoneDigits(raw.patientPhone || raw.mobilePhone);
        const name = String(raw.patientName || '').trim().slice(0, 160);
        if (!name || phone.length < 10) {
          skippedInvalid += 1;
          continue;
        }

        const filteredCriteria: SorrisoCriterionCode[] = Array.isArray(raw.matchedCriteria)
          ? raw.matchedCriteria.filter((c: any): c is SorrisoCriterionCode => allowedCriteria.has(c))
          : [];
        const criteria: SorrisoCriterionCode[] =
          filteredCriteria.length > 0 ? filteredCriteria : ['INATIVO_90D'];
        const primarySegment: SorrisoTemplateSegment =
          raw.primarySegment === 'budget_180d' || raw.primarySegment === 'tag'
            ? raw.primarySegment
            : 'inactive_90d';
        const message = String(raw.renderedPreview || raw.renderedMessage || '')
          .trim()
          .slice(0, 2000);
        if (message.length < 10) {
          skippedInvalid += 1;
          continue;
        }

        const patientAppUrl =
          typeof raw.patientAppUrl === 'string' && /^https:\/\//i.test(raw.patientAppUrl.trim())
            ? raw.patientAppUrl.trim().slice(0, 500)
            : buildPatientCampaignAppUrl(localStore.config, { phone, name });

        const item: SorrisoQueueItem = {
          id: `q-sorriso-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          campaignKey: localStore.config.campaignKey,
          pipelineId: pipeline.id,
          clinicId: Number(raw.clinicId || 1),
          clinicName: String(raw.clinicName || getClinicLabel(Number(raw.clinicId || 1))),
          patientId: Number(raw.patientId || 0),
          patientName: name,
          mobilePhone: phone,
          matchedCriteria: criteria,
          primarySegment,
          priorityScore: Math.max(1, Math.min(3, Number(raw.priorityScore || criteria.length || 1))),
          patientAppUrl,
          renderedMessage: message,
          status: 'pending',
          crmLeadId: raw.existingLeadId ? String(raw.existingLeadId) : undefined,
          attempts: 0,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        // Ensure card is imported into "Lead Gerado" stage right away (without firing WhatsApp yet)
        item.crmLeadId = await syncCardInSorrisoPipeline({
          pipelineId: pipeline.id,
          stageId: pipeline.firstStageId,
          stageTitle: pipeline.firstStageTitle,
          item,
          waDelivered: false,
          followUpYMD,
          triggerLabel: `Aprovação de Lote (${pipeline.firstStageTitle})`,
        });

        newItems.push(item);
      }

      const storageMode = await upsertQueueItems(newItems);

      return res.json({
        success: true,
        enqueuedCount: newItems.length,
        skippedInvalid,
        storageMode,
        pipelineId: pipeline.id,
        pipelineName: pipeline.name,
        importStageId: pipeline.firstStageId,
        importStageTitle: pipeline.firstStageTitle,
        sentStageId: pipeline.contactedStageId,
        sentStageTitle: pipeline.contactedStageTitle,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || 'Erro ao enfileirar leads na campanha.',
      });
    }
  });

  // 4b. GET queue items (for n8n inspection / orchestration of Lead Gerado pending invites)
  app.get('/api/crm/campaigns/sorriso/queue', async (req: Request, res: Response) => {
    if (!deps.isAdminRequest(req) && !isCampaignCronSecretValid(req)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado à fila da campanha.',
      });
    }

    const statusFilter = String(req.query.status || 'pending').trim().toLowerCase();
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
    const pipeline = await resolveSorrisoPipeline(localStore.config.pipelineId);
    const { items, storageMode } = await loadQueueItems(localStore.config.campaignKey);

    const filtered =
      statusFilter === 'all'
        ? items
        : items.filter((it) => it.status === statusFilter);

    return res.json({
      success: true,
      storageMode,
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      importStageId: pipeline.firstStageId,
      importStageTitle: pipeline.firstStageTitle,
      sentStageId: pipeline.contactedStageId,
      sentStageTitle: pipeline.contactedStageTitle,
      deliveryMode: localStore.config.deliveryMode || 'qrcode_with_caption',
      totalMatching: filtered.length,
      items: filtered.slice(0, limit).map((it) => ({
        ...it,
        patientAppUrl:
          it.patientAppUrl ||
          buildPatientCampaignAppUrl(localStore.config, {
            phone: it.mobilePhone,
            name: it.patientName,
          }),
      })),
    });
  });

  // 5. POST process-batch (n8n Cron Webhook via Bearer secret OR manual Admin button)
  app.post('/api/crm/campaigns/sorriso/process-batch', async (req: Request, res: Response) => {
    const validCron = isCampaignCronSecretValid(req);
    const validAdmin = deps.isAdminRequest(req);

    if (!validCron && !validAdmin) {
      return res.status(403).json({
        success: false,
        error:
          'Acesso negado. Use Authorization: Bearer <CAMPAIGN_CRON_SECRET> (n8n) ou perfil administrativo autenticado.',
      });
    }

    const trigger: 'n8n' | 'manual' = validCron && !validAdmin ? 'n8n' : 'manual';
    const result = await processCampaignBatch({
      trigger,
      batchSizeOverride: req.body?.batchSize ? Number(req.body.batchSize) : undefined,
      ignoreBusinessHours: Boolean(req.body?.ignoreBusinessHours) && validAdmin,
    });

    return res.status(result.status).json(result.payload);
  });

  // 6. POST queue control (pause / resume / retry-failed / cancel-pending)
  app.post('/api/crm/campaigns/sorriso/control', async (req: Request, res: Response) => {
    if (!deps.isAdminRequest(req)) {
      return res.status(403).json({
        success: false,
        error: 'Apenas administradores ou gerência podem controlar a fila da campanha.',
      });
    }

    const action = String(req.body?.action || '').trim();
    if (!['pause', 'resume', 'retry_failed', 'cancel_pending'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Ação inválida. Use pause, resume, retry_failed ou cancel_pending.',
      });
    }

    if (action === 'pause') {
      localStore.config.paused = true;
      saveStore(localStore);
      return res.json({ success: true, paused: true });
    }

    if (action === 'resume') {
      localStore.config.paused = false;
      saveStore(localStore);
      return res.json({ success: true, paused: false });
    }

    const { items } = await loadQueueItems(localStore.config.campaignKey);
    const nowIso = new Date().toISOString();
    let affected = 0;

    for (const item of items) {
      if (action === 'retry_failed' && item.status === 'failed') {
        item.status = 'pending';
        item.lastError = undefined;
        item.updatedAt = nowIso;
        await updateQueueItem(item);
        affected += 1;
      } else if (action === 'cancel_pending' && item.status === 'pending') {
        item.status = 'cancelled';
        item.updatedAt = nowIso;
        await updateQueueItem(item);
        affected += 1;
      }
    }

    return res.json({ success: true, action, affected });
  });

  const startWorker = () => {
    if (workerStarted) return;
    workerStarted = true;

    const tick = async () => {
      try {
        const cfg = localStore.config;
        if (!cfg.enabled || cfg.paused || batchRunning) return;
        if (cfg.businessHoursOnly && !isInSaoPauloBusinessHours()) return;

        const { items } = await loadQueueItems(cfg.campaignKey);
        const hasPending = items.some((i) => i.status === 'pending');
        if (!hasPending) return;

        await processCampaignBatch({ trigger: 'scheduler' });
      } catch (err: any) {
        console.warn('[Sorriso Campaign Worker] Erro no ciclo:', err?.message);
      }
    };

    // Check every 5 minutes for safe micro-batch pacing
    setInterval(tick, 5 * 60 * 1000);
  };

  return { startWorker };
}
