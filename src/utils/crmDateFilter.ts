import { CRMLeadOpportunity } from '../types/crm';

export type CRMDateField =
  | 'createdAt'
  | 'nextContactDate'
  | 'estimateDate'
  | 'lastVisitDate'
  | 'scheduledDate';

export type CRMDatePreset =
  | 'all'
  | 'today'
  | '7d'
  | '30d'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface CRMDateRange {
  start: string | null;
  end: string | null;
  isActive: boolean;
  summaryLabel: string;
}

export const CRM_DATE_FIELD_OPTIONS: Array<{ value: CRMDateField; label: string }> = [
  { value: 'createdAt', label: 'Data de Entrada' },
  { value: 'nextContactDate', label: 'Próximo Follow-up' },
  { value: 'estimateDate', label: 'Data do Orçamento' },
  { value: 'lastVisitDate', label: 'Última Consulta' },
  { value: 'scheduledDate', label: 'Data do Agendamento' },
];

export const CRM_DATE_PRESET_OPTIONS: Array<{ value: CRMDatePreset; label: string }> = [
  { value: 'all', label: 'Todo período' },
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês anterior' },
  { value: 'custom', label: 'Personalizado' },
];

export function toLocalYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatYMDShort(ymd: string): string {
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Normalizes any opportunity date string (YYYY-MM-DD, DD/MM/YYYY, or ISO timestamp)
 * into a local-calendar YYYY-MM-DD string to avoid UTC off-by-one discrepancies.
 */
export function normalizeOpportunityDateYMD(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  // Plain YYYY-MM-DD (no time component) — keep exact calendar day
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Brazilian DD/MM/YYYY format
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  }

  // ISO timestamp with time/timezone (e.g. createdAt) — convert to local calendar day
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return toLocalYMD(parsed);
  }

  // Fallback prefix extraction
  const isoPrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return isoPrefix ? isoPrefix[1] : null;
}

export function resolveCRMDateRange(
  preset: CRMDatePreset,
  customStart: string,
  customEnd: string,
  now: Date = new Date()
): CRMDateRange {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayYMD = toLocalYMD(today);

  if (preset === 'all') {
    return { start: null, end: null, isActive: false, summaryLabel: 'Todo período' };
  }

  if (preset === 'today') {
    return { start: todayYMD, end: todayYMD, isActive: true, summaryLabel: 'Hoje' };
  }

  if (preset === '7d') {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);
    return {
      start: toLocalYMD(startDate),
      end: todayYMD,
      isActive: true,
      summaryLabel: 'Últimos 7 dias',
    };
  }

  if (preset === '30d') {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29);
    return {
      start: toLocalYMD(startDate),
      end: todayYMD,
      isActive: true,
      summaryLabel: 'Últimos 30 dias',
    };
  }

  if (preset === 'this_month') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: toLocalYMD(first),
      end: toLocalYMD(last),
      isActive: true,
      summaryLabel: 'Este mês',
    };
  }

  if (preset === 'last_month') {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const last = new Date(today.getFullYear(), today.getMonth(), 0);
    return {
      start: toLocalYMD(first),
      end: toLocalYMD(last),
      isActive: true,
      summaryLabel: 'Mês anterior',
    };
  }

  // Custom range (open or closed; swap safely if start > end)
  let start = customStart.trim() || null;
  let end = customEnd.trim() || null;
  if (!start && !end) {
    return { start: null, end: null, isActive: false, summaryLabel: 'Personalizado' };
  }
  if (start && end && start > end) {
    [start, end] = [end, start];
  }
  const summaryLabel =
    start && end
      ? `${formatYMDShort(start)} → ${formatYMDShort(end)}`
      : start
      ? `A partir de ${formatYMDShort(start)}`
      : `Até ${formatYMDShort(end!)}`;

  return { start, end, isActive: true, summaryLabel };
}

export function getCRMDateFieldLabel(field: CRMDateField): string {
  return CRM_DATE_FIELD_OPTIONS.find((f) => f.value === field)?.label || 'Data de Entrada';
}

export function matchesCRMDateFilter(
  opp: CRMLeadOpportunity,
  field: CRMDateField,
  range: CRMDateRange
): boolean {
  if (!range.isActive) return true;
  const oppYMD = normalizeOpportunityDateYMD(opp[field]);
  if (!oppYMD) return false;
  if (range.start && oppYMD < range.start) return false;
  if (range.end && oppYMD > range.end) return false;
  return true;
}
