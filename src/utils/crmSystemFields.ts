import type { CRMCustomField, CRMLeadOpportunity } from '../types/crm';

export const SYS_FIELD_ESTIMATE_DATE = '__sys_estimate_date';
export const SYS_FIELD_LAST_VISIT_PROC = '__sys_last_visit_proc';
export const SYS_FIELD_LAST_VISIT_SYNCED = '__sys_last_visit_synced';

const SYSTEM_FIELD_IDS = new Set<string>([
  SYS_FIELD_ESTIMATE_DATE,
  SYS_FIELD_LAST_VISIT_PROC,
  SYS_FIELD_LAST_VISIT_SYNCED,
]);

export function isSystemCustomField(field: CRMCustomField | null | undefined): boolean {
  if (!field) return false;
  return SYSTEM_FIELD_IDS.has(String(field.id || '')) || String(field.id || '').startsWith('__sys_');
}

export function stripSystemCustomFields(fields?: CRMCustomField[] | null): CRMCustomField[] {
  if (!Array.isArray(fields)) return [];
  return fields.filter((f) => f && !isSystemCustomField(f));
}

export function extractSystemCustomMeta(fields?: CRMCustomField[] | null): {
  estimateDate?: string;
  lastVisitProcedure?: string;
  lastVisitSyncedAt?: string;
} {
  if (!Array.isArray(fields)) return {};
  const map = new Map<string, string>();
  for (const f of fields) {
    if (f && isSystemCustomField(f) && typeof f.value === 'string' && f.value.trim()) {
      map.set(f.id, f.value.trim());
    }
  }
  const rawEst = map.get(SYS_FIELD_ESTIMATE_DATE);
  return {
    estimateDate: rawEst ? rawEst.split('T')[0] : undefined,
    lastVisitProcedure: map.get(SYS_FIELD_LAST_VISIT_PROC),
    lastVisitSyncedAt: map.get(SYS_FIELD_LAST_VISIT_SYNCED),
  };
}

export function mergeSystemCustomFields(
  userFields: CRMCustomField[] | undefined | null,
  meta: {
    estimateDate?: string | null;
    lastVisitProcedure?: string | null;
    lastVisitSyncedAt?: string | null;
  }
): CRMCustomField[] {
  const cleanUser = stripSystemCustomFields(userFields);
  const sysEntries: CRMCustomField[] = [];

  const est = meta.estimateDate ? String(meta.estimateDate).split('T')[0].trim() : '';
  if (est && /^\d{4}-\d{2}-\d{2}$/.test(est)) {
    sysEntries.push({
      id: SYS_FIELD_ESTIMATE_DATE,
      label: 'Data do Orçamento',
      value: est,
    });
  }

  const proc = meta.lastVisitProcedure ? String(meta.lastVisitProcedure).trim() : '';
  if (proc) {
    sysEntries.push({
      id: SYS_FIELD_LAST_VISIT_PROC,
      label: 'Procedimento Última Vinda',
      value: proc.slice(0, 140),
    });
  }

  const synced = meta.lastVisitSyncedAt ? String(meta.lastVisitSyncedAt).trim() : '';
  if (synced) {
    sysEntries.push({
      id: SYS_FIELD_LAST_VISIT_SYNCED,
      label: 'Última Vinda Sincronizada',
      value: synced,
    });
  }

  return [...cleanUser, ...sysEntries];
}

export function formatYMDToBR(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  const ymd = trimmed.split('T')[0];
  const parts = ymd.split('-');
  if (parts.length !== 3) return trimmed;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function normalizeYMDString(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = String(raw).trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return undefined;
}

export function computeDaysSinceYMD(raw?: string | null): number | undefined {
  const ymd = normalizeYMDString(raw);
  if (!ymd) return undefined;
  const ts = new Date(`${ymd}T12:00:00`).getTime();
  if (Number.isNaN(ts)) return undefined;
  return Math.max(0, Math.floor((Date.now() - ts) / 86400000));
}

export function hasReturnedAfterEstimate(opp: Pick<CRMLeadOpportunity, 'estimateDate' | 'lastVisitDate'>): boolean {
  const est = normalizeYMDString(opp.estimateDate);
  const visit = normalizeYMDString(opp.lastVisitDate);
  if (!est || !visit) return false;
  return visit > est;
}
