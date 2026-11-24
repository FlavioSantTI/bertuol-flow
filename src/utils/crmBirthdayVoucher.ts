import { CRMLeadOpportunity } from '../types/crm';

export interface BirthdayAutomationConfig {
  enabled: boolean;
  scheduledTime: string; // HH:MM in America/Sao_Paulo (e.g. "08:30")
  clinicScope: number | 'all';
  validityDays: number; // Default 7
  benefitTitle: string;
  messageTemplate: string;
  sendWhatsApp: boolean;
  sendAppNotification: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export type BirthdayRecordStatus =
  | 'ENVIADO_WHATSAPP'
  | 'CARD_SEM_TELEFONE'
  | 'ERRO_WHATSAPP_CARD_CRIADO'
  | 'JA_ENVIADO_ANO'
  | 'SIMULADO_NOVO'
  | 'SIMULADO_SEM_TELEFONE';

export interface BirthdayDispatchRecord {
  patientId: number;
  patientName: string;
  patientPhone: string;
  clinicId: number;
  clinicName: string;
  birthDate?: string;
  voucherCode: string;
  expiresAt: string; // YYYY-MM-DD
  status: BirthdayRecordStatus;
  whatsappMode?: string;
  errorMessage?: string;
}

export interface BirthdayRunLogEntry {
  id: string;
  runAt: string; // ISO
  dateBR: string; // YYYY-MM-DD (America/Sao_Paulo)
  trigger: 'scheduler' | 'n8n' | 'manual';
  dryRun: boolean;
  clinicScope: number | 'all';
  totalFound: number;
  whatsappSent: number;
  cardsCreated: number;
  skippedAlreadySent: number;
  noPhone: number;
  whatsappFailed: number;
  warnings: string[];
}

export interface BirthdayConfigResponse {
  success: boolean;
  config: BirthdayAutomationConfig;
  lastScheduledRunDate: string | null;
  schedulerRunning: boolean;
  cronSecretConfigured: boolean;
  webhookPath: string;
  history: BirthdayRunLogEntry[];
  todayBR: string;
  nowTimeBR: string;
  error?: string;
}

export interface BirthdayRunResponse {
  success: boolean;
  alreadyProcessed?: boolean;
  dateBR: string;
  trigger: 'scheduler' | 'n8n' | 'manual';
  dryRun: boolean;
  counts: {
    totalFound: number;
    whatsappSent: number;
    cardsCreated: number;
    skippedAlreadySent: number;
    noPhone: number;
    whatsappFailed: number;
  };
  records: BirthdayDispatchRecord[];
  warnings: string[];
  error?: string;
}

export interface ExtractedBirthdayVoucher {
  code: string;
  expiresAt?: string; // YYYY-MM-DD
  expiresLabelBR?: string; // DD/MM
  daysRemaining?: number;
  state: 'active' | 'expiring_soon' | 'today' | 'expired' | 'redeemed';
  whatsappStatus?: string;
}

export const DEFAULT_BIRTHDAY_MESSAGE_TEMPLATE =
  'Parabéns, {nome}! Feliz aniversário! A equipe da {clinica} preparou um presente especial para você: Cortesia de Aniversário (Profilaxia + Diagnóstico Sky Câmera). Apresente seu voucher exclusivo *{voucher}* válido até *{validade}* (7 dias). Responda esta mensagem para reservarmos seu horário!';

export function formatBirthdayYMDToDM(ymd?: string): string | undefined {
  if (!ymd) return undefined;
  const parts = String(ymd).split('T')[0].split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}`;
}

export function formatBirthdayYMDToBR(ymd?: string): string | undefined {
  if (!ymd) return undefined;
  const parts = String(ymd).split('T')[0].split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getTodaySaoPauloYMD(): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // Fallback
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

function parseExpirationToYMD(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }
  return undefined;
}

function diffDaysYMD(fromYMD: string, toYMD: string): number {
  const [fy, fm, fd] = fromYMD.split('-').map(Number);
  const [ty, tm, td] = toYMD.split('-').map(Number);
  const fMs = Date.UTC(fy, (fm || 1) - 1, fd || 1, 12, 0, 0);
  const tMs = Date.UTC(ty, (tm || 1) - 1, td || 1, 12, 0, 0);
  return Math.round((tMs - fMs) / 86400000);
}

/**
 * Extracts birthday voucher info (BRT-ANIV-XXXX, validity countdown, WhatsApp status)
 * from a CRMLeadOpportunity's customFields or source string.
 */
export function extractBirthdayVoucherInfo(
  opp: CRMLeadOpportunity
): ExtractedBirthdayVoucher | null {
  const fields = opp.customFields || [];

  const voucherField = fields.find((f) => /voucher/i.test(f.label) && !/validade/i.test(f.label));
  const expiryField = fields.find((f) => /validade/i.test(f.label));
  const waStatusField = fields.find((f) => /disparo|whatsapp/i.test(f.label));

  let code = voucherField?.value?.trim();
  if (!code && opp.source) {
    const srcMatch = opp.source.match(/(BRT-ANIV-[A-Z0-9-]+)/i);
    if (srcMatch) code = srcMatch[1].toUpperCase();
  }
  if (!code && opp.mensagemWhatsapp) {
    const msgMatch = opp.mensagemWhatsapp.match(/(BRT-ANIV-[A-Z0-9-]+)/i);
    if (msgMatch) code = msgMatch[1].toUpperCase();
  }
  if (!code && opp.notes) {
    const notesMatch = opp.notes.match(/(BRT-ANIV-[A-Z0-9-]+)/i);
    if (notesMatch) code = notesMatch[1].toUpperCase();
  }
  if (!code && opp.treatmentDescription) {
    const descMatch = opp.treatmentDescription.match(/(BRT-ANIV-[A-Z0-9-]+)/i);
    if (descMatch) code = descMatch[1].toUpperCase();
  }

  if (!code) return null;

  let expiresAt = parseExpirationToYMD(expiryField?.value);
  if (!expiresAt && opp.notes) {
    const expMatch = opp.notes.match(/v[aá]lido\s+at[eé]:?\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i);
    if (expMatch) expiresAt = parseExpirationToYMD(expMatch[1]);
  }
  const expiresLabelBR = formatBirthdayYMDToDM(expiresAt);

  if (opp.stage === 'converted') {
    return {
      code,
      expiresAt,
      expiresLabelBR,
      daysRemaining: 0,
      state: 'redeemed',
      whatsappStatus: waStatusField?.value,
    };
  }

  let daysRemaining: number | undefined;
  let state: ExtractedBirthdayVoucher['state'] = 'active';

  if (expiresAt) {
    const todayYMD = getTodaySaoPauloYMD();
    daysRemaining = diffDaysYMD(todayYMD, expiresAt);
    if (daysRemaining < 0) {
      state = 'expired';
    } else if (daysRemaining === 0) {
      state = 'today';
    } else if (daysRemaining <= 2) {
      state = 'expiring_soon';
    } else {
      state = 'active';
    }
  }

  return {
    code,
    expiresAt,
    expiresLabelBR,
    daysRemaining,
    state,
    whatsappStatus: waStatusField?.value,
  };
}

export function renderBirthdayMessagePreview(
  template: string,
  vars: { nome: string; clinica: string; voucher: string; validade: string }
): string {
  return String(template || DEFAULT_BIRTHDAY_MESSAGE_TEMPLATE)
    .replace(/\{nome\}/gi, vars.nome)
    .replace(/\{clinica\}/gi, vars.clinica)
    .replace(/\{voucher\}/gi, vars.voucher)
    .replace(/\{validade\}/gi, vars.validade);
}
