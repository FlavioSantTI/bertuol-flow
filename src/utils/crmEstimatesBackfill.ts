import { CRMEstimateProcedure } from '../types/crm';

export interface BackfillDateWindow {
  index: number;
  total: number;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

export type BackfillRecordAction =
  | 'GRAVADO'
  | 'IGNORADO_EXISTENTE'
  | 'SIMULADO'
  | 'ERRO_GRAVACAO';

export interface BackfillEstimateRecord {
  estimateId: number;
  estimateDate: string; // YYYY-MM-DD
  createDate: string; // YYYY-MM-DD
  status: 'OPEN';
  businessId: number;
  clinicId: number;
  clinicName: string;
  patientId: number;
  patientName: string;
  patientPhone: string;
  phoneEnrichedFromSupabase?: boolean;
  dentistName: string;
  amount: number;
  procedures: CRMEstimateProcedure[];
  procedureSummary: string;
  action: BackfillRecordAction;
  errorMessage?: string;
}

export interface BackfillChunkResponse {
  success: boolean;
  fromDate: string;
  toDate: string;
  dryRun: boolean;
  counts: {
    totalFetched: number;
    openFound: number;
    added: number;
    skippedExisting: number;
    simulated: number;
    failedInsert: number;
  };
  newValueTotal: number;
  records: BackfillEstimateRecord[];
  warnings?: string[];
  error?: string;
  code?: string;
}

export interface BackfillExportMetadata {
  generatedAt: string;
  fromDate: string;
  toDate: string;
  clinicScopeLabel: string;
  dryRun: boolean;
  chunkDays: number;
  totalWindows: number;
  completedWindows: number;
  cancelled?: boolean;
  totals: {
    totalFetched: number;
    openFound: number;
    added: number;
    skippedExisting: number;
    simulated: number;
    failedInsert: number;
    newValueTotal: number;
  };
  warnings: string[];
}

export const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateInSaoPauloYMD(date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // Fallback to local calendar date
  }
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function addDaysToYMD(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const utc = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
  utc.setUTCDate(utc.getUTCDate() + deltaDays);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function diffDaysInclusiveYMD(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const fMs = Date.UTC(fy, (fm || 1) - 1, fd || 1, 12, 0, 0);
  const tMs = Date.UTC(ty, (tm || 1) - 1, td || 1, 12, 0, 0);
  return Math.floor((tMs - fMs) / 86400000) + 1;
}

export function formatYMDBR(ymd: string): string {
  const parts = String(ymd || '').split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getDefaultBackfillRange(days = 365, now: Date = new Date()): {
  fromDate: string;
  toDate: string;
} {
  const clampedDays = Math.max(1, Math.min(366, Math.floor(days)));
  const toDate = formatDateInSaoPauloYMD(now);
  const fromDate = addDaysToYMD(toDate, -(clampedDays - 1));
  return { fromDate, toDate };
}

/**
 * Splits [fromDate, toDate] into sequential windows of `chunkDays` days,
 * ordered from newest to oldest so recent open estimates are imported first.
 */
export function buildBackfillDateWindows(
  fromDate: string,
  toDate: string,
  chunkDays = 15
): BackfillDateWindow[] {
  if (!YMD_REGEX.test(fromDate) || !YMD_REGEX.test(toDate)) return [];
  const safeChunk = Math.max(1, Math.min(31, Math.floor(chunkDays)));
  let start = fromDate;
  let end = toDate;
  if (start > end) {
    [start, end] = [end, start];
  }

  const rawWindows: Array<{ from: string; to: string }> = [];
  let cursorEnd = end;
  while (cursorEnd >= start) {
    const candidateStart = addDaysToYMD(cursorEnd, -(safeChunk - 1));
    const windowStart = candidateStart < start ? start : candidateStart;
    rawWindows.push({ from: windowStart, to: cursorEnd });
    if (windowStart <= start) break;
    cursorEnd = addDaysToYMD(windowStart, -1);
  }

  return rawWindows.map((w, idx) => ({
    index: idx + 1,
    total: rawWindows.length,
    from: w.from,
    to: w.to,
  }));
}

export function extractEstimateIdFromSource(source?: string | null): number | null {
  if (!source) return null;
  const match = String(source).match(/Or[cç]amento\s*#(\d+)/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function normalizeNameKey(name?: string | null): string {
  return String(name || '')
    .replace(/\s*\(\d+\)\s*$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildEstimateProcedureSummary(procs: CRMEstimateProcedure[]): string {
  if (!procs || procs.length === 0) return 'Plano de Tratamento em Aberto';
  const firstTwo = procs
    .slice(0, 2)
    .map((p) => (p.tooth ? `${p.description} (D.${p.tooth})` : p.description));
  return procs.length > 2
    ? `${firstTwo.join(' · ')} +${procs.length - 2}`
    : firstTwo.join(' · ');
}

/**
 * Neutralizes spreadsheet formula injection (=, +, -, @, tab, CR) and quotes safely for PT-BR CSV (;).
 */
function sanitizeCSVCell(value: string | number | boolean | null | undefined): string {
  let str = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(';') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildEstimatesBackfillCSV(
  records: BackfillEstimateRecord[],
  meta: BackfillExportMetadata
): string {
  const rows: string[][] = [];

  rows.push(['BERTUOL ODONTOLOGIA AVANÇADA — CARGA HISTÓRICA DE ORÇAMENTOS EM ABERTO (CLINICORP)']);
  rows.push(['Gerado em', meta.generatedAt]);
  rows.push(['Período analisado', `${formatYMDBR(meta.fromDate)} até ${formatYMDBR(meta.toDate)}`]);
  rows.push(['Unidade', meta.clinicScopeLabel]);
  rows.push(['Modo', meta.dryRun ? 'Simulação (Dry-Run — sem gravação no CRM)' : 'Gravação no Supabase (CRM)']);
  rows.push([
    'Resumo',
    `OPEN encontrados: ${meta.totals.openFound} | Novos gravados: ${meta.totals.added} | Ignorados existentes: ${meta.totals.skippedExisting} | Simulados: ${meta.totals.simulated} | Valor novo: R$ ${meta.totals.newValueTotal.toFixed(2).replace('.', ',')}`,
  ]);
  rows.push([]);

  rows.push([
    'estimate_id',
    'data_orcamento',
    'status',
    'unidade',
    'paciente',
    'telefone',
    'dentista',
    'valor_estimado',
    'qtd_procedimentos',
    'procedimentos',
    'acao_crm',
  ]);

  for (const rec of records) {
    const procDetails = (rec.procedures || [])
      .map((p) => {
        const toothStr = p.tooth ? ` (D.${p.tooth})` : '';
        const valStr = p.amount > 0 ? ` R$ ${p.amount.toFixed(2).replace('.', ',')}` : '';
        return `${p.description}${toothStr}${valStr}`;
      })
      .join(' | ');

    rows.push([
      String(rec.estimateId),
      rec.estimateDate,
      rec.status,
      rec.clinicName,
      rec.patientName,
      rec.patientPhone || '',
      rec.dentistName,
      Number(rec.amount || 0).toFixed(2).replace('.', ','),
      String(rec.procedures?.length || 0),
      procDetails || rec.procedureSummary,
      rec.action,
    ]);
  }

  return '\uFEFF' + rows.map((r) => r.map(sanitizeCSVCell).join(';')).join('\r\n');
}

export function buildEstimatesBackfillJSON(
  records: BackfillEstimateRecord[],
  meta: BackfillExportMetadata
): string {
  return JSON.stringify(
    {
      metadata: meta,
      estimates: records,
    },
    null,
    2
  );
}

export function downloadTextArtifact(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
