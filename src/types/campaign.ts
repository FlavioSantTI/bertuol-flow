export type SorrisoCriterionCode =
  | 'TAG_LANCAMENTO_SORRISO'
  | 'ORCAMENTO_ABERTO_180D'
  | 'INATIVO_90D';

export type SorrisoTemplateSegment = 'tag' | 'budget_180d' | 'inactive_90d';

export type SorrisoQueueStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';

export type SorrisoDeliveryMode = 'text_with_link' | 'qrcode_with_caption' | 'text_and_qrcode';

export interface SorrisoCampaignConfig {
  campaignKey: string;
  pipelineId: string; // Resolved dynamically from crm_pipelines ('Lançamento Sorriso Bertuol')
  pipelineName: string;
  enabled: boolean;
  paused: boolean;
  clinicScope: number | 'all';
  includeTagCriterion: boolean;
  tagName: string; // Default: 'LANCAMENTO_SORRISO'
  includeOpenBudgetsCriterion: boolean;
  budgetWindowDays: number; // Default: 180
  budgetKeywords: string[]; // Clinical/rehabilitation terms; empty = all pending estimates
  includeInactiveCriterion: boolean;
  inactiveMinDays: number; // Default: 90
  inactiveMaxDays: number; // 0 = no upper cap
  cooldownDays: number; // Default: 30
  batchSize: number; // Default: 10 per batch
  dailyLimit: number; // Default: 60 per day
  minDelaySec: number; // Default: 15
  maxDelaySec: number; // Default: 35
  businessHoursOnly: boolean; // Mon-Fri 08:00-19:00, Sat 08:00-12:00 (America/Sao_Paulo)
  followUpDays: number; // Default: 2
  appLinkUrl: string; // Default: 'https://bertuolflow.app-bertuol.tech/paciente'
  personalizeAppLink: boolean; // Appends ?portal=paciente&phone=...&name=...
  deliveryMode: SorrisoDeliveryMode; // Default: 'qrcode_with_caption'
  enableLinkPreview: boolean; // WAHA linkPreview: true on /api/sendText
  importStageId?: string; // Optional override; auto-resolves "Lead Gerado" stage
  sentStageId?: string; // Optional override; auto-resolves "Convite/WhatsApp Enviado" stage
  templates: {
    tag: string;
    budget_180d: string;
    inactive_90d: string;
  };
  updatedAt?: string;
  updatedBy?: string;
}

export interface SorrisoPreviewCandidate {
  dedupeKey: string;
  patientId: number;
  patientName: string;
  patientPhone: string;
  clinicId: number;
  clinicName: string;
  matchedCriteria: SorrisoCriterionCode[];
  primarySegment: SorrisoTemplateSegment;
  priorityScore: number; // 1 to 3
  lastVisitDate?: string;
  daysSinceLastVisit?: number;
  estimateDate?: string;
  estimatedValue?: number;
  treatmentSummary?: string;
  existingLeadId?: string;
  patientAppUrl?: string;
  renderedPreview: string;
  blockedReason?: 'SEM_TELEFONE' | 'COOLDOWN_ATIVO' | 'JA_NA_FILA' | 'JA_AGENDADO_OU_CONVERTIDO' | null;
}

export interface SorrisoQueueItem {
  id: string;
  campaignKey: string;
  pipelineId: string;
  clinicId: number;
  clinicName: string;
  patientId: number;
  patientName: string;
  mobilePhone: string;
  matchedCriteria: SorrisoCriterionCode[];
  primarySegment: SorrisoTemplateSegment;
  priorityScore: number;
  patientAppUrl?: string;
  renderedMessage: string;
  status: SorrisoQueueStatus;
  crmLeadId?: string;
  attempts: number;
  lastError?: string;
  whatsappMode?: string;
  createdAt: string;
  sentAt?: string;
  updatedAt: string;
}

export interface SorrisoBatchLogEntry {
  id: string;
  runAt: string;
  trigger: 'manual' | 'scheduler' | 'n8n';
  processed: number;
  sent: number;
  failed: number;
  skippedWindow: boolean;
  circuitBreakerTripped: boolean;
  warnings: string[];
}

export interface SorrisoPipelineStageOption {
  id: string;
  title: string;
  semanticType: string;
}

export interface SorrisoCampaignStatusResponse {
  success: boolean;
  config: SorrisoCampaignConfig;
  resolvedPipeline: {
    id: string;
    name: string;
    found: boolean;
    firstStageId: string;
    firstStageTitle: string;
    contactedStageId: string;
    contactedStageTitle: string;
    stages: SorrisoPipelineStageOption[];
  };
  queueStats: {
    pending: number;
    sending: number;
    sent: number;
    failed: number;
    cancelled: number;
    sentToday: number;
    dailyRemaining: number;
  };
  queuePreview: SorrisoQueueItem[];
  history: SorrisoBatchLogEntry[];
  webhookPath: string;
  cronSecretConfigured: boolean;
  storageMode: 'supabase' | 'local_fallback';
  inBusinessHours: boolean;
  nowTimeBR: string;
  todayBR: string;
  sqlMigration: string;
}

export interface SorrisoPreviewResponse {
  success: boolean;
  resolvedPipeline: {
    id: string;
    name: string;
    found: boolean;
    firstStageId?: string;
    firstStageTitle?: string;
    contactedStageId?: string;
    contactedStageTitle?: string;
  };
  counts: {
    totalCandidates: number;
    eligible: number;
    blocked: number;
    byTag: number;
    byBudget180d: number;
    byInactive90d: number;
    multiCriteria: number;
  };
  candidates: SorrisoPreviewCandidate[];
  warnings: string[];
}
