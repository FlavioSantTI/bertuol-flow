import {
  CRMLabel,
  CRMLeadOpportunity,
  CRMPipeline,
  CRMStageSemantic,
  CRMType,
} from '../types/crm';
import { Clinic } from '../types/database';
import { CRMService } from '../services/crmService';
import {
  CRMDateField,
  CRMDateRange,
  formatYMDShort,
  getCRMDateFieldLabel,
  normalizeOpportunityDateYMD,
  toLocalYMD,
} from './crmDateFilter';

export interface CRMFunnelStepMetric {
  id: string;
  label: string;
  semanticType: CRMStageSemantic;
  count: number;
  cumulativeCount: number;
  value: number;
  stepConversionRate: number | null; // % vs. previous cumulative step
  shareOfTotal: number; // % of total leads in scope
  color: string;
}

export interface CRMLossReasonMetric {
  reason: string;
  count: number;
  pct: number;
  lostValue: number;
}

export interface CRMCriticalLeadItem {
  opp: CRMLeadOpportunity;
  clinicName: string;
  pipelineName: string;
  stageTitle: string;
  daysStale: number;
  isSLAAlert: boolean;
  isFollowUpOverdue: boolean;
  isFollowUpToday: boolean;
  urgencyLabel: string;
  urgencyScore: number;
}

export interface CRMPipelineComparisonRow {
  pipelineId: string;
  name: string;
  total: number;
  active: number;
  urgent: number;
  scheduled: number;
  converted: number;
  lost: number;
  conversionRate: number;
  openValue: number;
  convertedValue: number;
}

export interface CRMUnitComparisonRow {
  clinicId: number;
  name: string;
  total: number;
  active: number;
  scheduled: number;
  converted: number;
  lost: number;
  conversionRate: number;
  openValue: number;
  convertedValue: number;
  avgTicket: number;
}

export interface CRMDentistComparisonRow {
  dentistName: string;
  total: number;
  active: number;
  scheduled: number;
  converted: number;
  lost: number;
  conversionRate: number;
  openValue: number;
  convertedValue: number;
  avgTicket: number;
}

export interface CRMSourceComparisonRow {
  source: string;
  total: number;
  active: number;
  scheduled: number;
  converted: number;
  lost: number;
  conversionRate: number;
  openValue: number;
  convertedValue: number;
}

export interface CRMAnalyticsSnapshot {
  scopeLabel: string;
  totalLeads: number;
  activeLeads: number;
  scheduledLeads: number;
  convertedLeads: number;
  lostLeads: number;
  overallConversionRate: number;
  financial: {
    openValue: number;
    scheduledValue: number;
    convertedValue: number;
    lostValue: number;
    grossTotalValue: number;
    avgTicketAll: number;
    avgTicketConverted: number;
    approvalRateDecided: number;
    approvalRateGross: number;
    budgetsCount: number;
    budgetsOpenValue: number;
    budgetsConvertedValue: number;
    chartData: Array<{
      name: string;
      value: number;
      count: number;
      color: string;
    }>;
  };
  funnel: {
    steps: CRMFunnelStepMetric[];
    lostCount: number;
    lostValue: number;
    lostPct: number;
  };
  losses: CRMLossReasonMetric[];
  sla: {
    overdueFollowUps: number;
    todayFollowUps: number;
    staleOver48h: number;
    totalUrgent: number;
    noContactYet: number;
    avgContactAttemptsAll: number;
    avgContactAttemptsConverted: number;
    criticalLeads: CRMCriticalLeadItem[];
  };
  byPipeline: CRMPipelineComparisonRow[];
  byUnit: CRMUnitComparisonRow[];
  byDentist: CRMDentistComparisonRow[];
  bySource: CRMSourceComparisonRow[];
  scopedOpportunities: CRMLeadOpportunity[];
}

const SEMANTIC_META: Record<
  CRMStageSemantic,
  { label: string; color: string; order: number }
> = {
  new: { label: 'Entrada / Novo', color: '#0F766E', order: 0 },
  contacted: { label: 'Em Contato', color: '#147A80', order: 1 },
  scheduled: { label: 'Agendado', color: '#0369A1', order: 2 },
  converted: { label: 'Convertido', color: '#16A34A', order: 3 },
  lost: { label: 'Perdido', color: '#DC2626', order: 4 },
};

const STAGE_COLOR_HEX: Record<string, string> = {
  blue: '#0284C7',
  amber: '#D97706',
  indigo: '#4F46E5',
  teal: '#147A80',
  emerald: '#16A34A',
  rose: '#DC2626',
  slate: '#64748B',
};

const TYPE_FALLBACK_SOURCE: Record<CRMType, string> = {
  recall_6m: 'Recall 6+ Meses',
  treatment_pending: 'Orçamento Clinicorp',
  whatsapp_lead: 'WhatsApp',
  indication: 'Indicação',
  other: 'Outros',
};

export function normalizeCRMSourceLabel(opp: CRMLeadOpportunity): string {
  const raw = String(opp.source || '').trim();
  if (!raw) {
    return TYPE_FALLBACK_SOURCE[opp.type] || 'Não informado';
  }
  const lower = raw.toLowerCase();
  if (lower.includes('clinicorp') || lower.includes('orçamento') || lower.includes('orcamento')) {
    return 'Orçamento Clinicorp';
  }
  if (lower.includes('n8n') || lower.includes('recall')) {
    return 'Recall 6+ Meses (n8n)';
  }
  if (lower.includes('whatsapp') || lower.includes('wpp') || lower.includes('zap')) {
    return 'WhatsApp';
  }
  if (lower.includes('insta')) {
    return 'Instagram';
  }
  if (lower.includes('google') || lower.includes('ads') || lower.includes('tráfego') || lower.includes('trafego') || lower.includes('meta') || lower.includes('facebook')) {
    return 'Tráfego Pago / Mídia';
  }
  if (lower.includes('indic')) {
    return 'Indicação';
  }
  if (lower.includes('balc') || lower.includes('recep') || lower.includes('presencial')) {
    return 'Balcão / Recepção';
  }
  return raw;
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPercentPT(value: number): string {
  if (!Number.isFinite(value)) return '0,0%';
  return `${value.toFixed(1).replace('.', ',')}%`;
}

function safePct(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

export function computeCRMAnalytics(
  dateFilteredOpportunities: CRMLeadOpportunity[],
  pipelines: CRMPipeline[],
  clinics: Clinic[],
  scopePipelineId: 'all' | string,
  selectedClinicId: number | 'all'
): CRMAnalyticsSnapshot {
  const pipelineMap = new Map<string, CRMPipeline>();
  pipelines.forEach((p) => pipelineMap.set(p.id, p));

  const clinicMap = new Map<number, Clinic>();
  clinics.forEach((c) => clinicMap.set(c.id, c));

  const resolveSemantic = (opp: CRMLeadOpportunity): CRMStageSemantic => {
    const pl = pipelineMap.get(opp.pipelineId);
    return CRMService.resolveStageSemantic(pl, opp.stage);
  };

  const resolveStageTitle = (opp: CRMLeadOpportunity): string => {
    const pl = pipelineMap.get(opp.pipelineId);
    const found = pl?.stages.find((s) => s.id === opp.stage);
    return found?.title || SEMANTIC_META[resolveSemantic(opp)].label;
  };

  // Opportunities filtered by clinic only (for pipeline comparison table)
  const unitFilteredAllPipelines = dateFilteredOpportunities.filter(
    (o) => selectedClinicId === 'all' || o.clinicId === selectedClinicId
  );

  // Opportunities filtered by pipeline scope only (for unit comparison table)
  const pipelineScopedAllUnits = dateFilteredOpportunities.filter(
    (o) => scopePipelineId === 'all' || o.pipelineId === scopePipelineId
  );

  // Exact working set for main KPIs, funnel, finance, losses, SLA, dentists, sources
  const scopedOpportunities = unitFilteredAllPipelines.filter(
    (o) => scopePipelineId === 'all' || o.pipelineId === scopePipelineId
  );

  const activePipelineObj =
    scopePipelineId === 'all' ? undefined : pipelineMap.get(scopePipelineId);
  const scopeLabel = activePipelineObj ? activePipelineObj.name : 'Todos os Funis';

  const todayYMD = toLocalYMD(new Date());

  let activeLeads = 0;
  let scheduledLeads = 0;
  let convertedLeads = 0;
  let lostLeads = 0;

  let openValue = 0;
  let scheduledValue = 0;
  let convertedValue = 0;
  let lostValue = 0;

  let valuedAllSum = 0;
  let valuedAllCount = 0;
  let valuedConvertedSum = 0;
  let valuedConvertedCount = 0;

  let budgetsCount = 0;
  let budgetsOpenValue = 0;
  let budgetsConvertedValue = 0;

  let overdueFollowUps = 0;
  let todayFollowUps = 0;
  let staleOver48h = 0;
  let noContactYet = 0;
  let totalAttemptsAll = 0;
  let totalAttemptsConverted = 0;

  const lossMap = new Map<string, { count: number; lostValue: number }>();
  const criticalLeads: CRMCriticalLeadItem[] = [];

  for (const opp of scopedOpportunities) {
    const pl = pipelineMap.get(opp.pipelineId);
    const semantic = resolveSemantic(opp);
    const val = Number(opp.estimatedValue || 0);
    const attempts = Number(opp.contactAttempts || 0);

    totalAttemptsAll += attempts;

    if (val > 0) {
      valuedAllSum += val;
      valuedAllCount += 1;
    }

    const isBudgetOpp =
      Boolean(opp.estimateId) ||
      opp.type === 'treatment_pending' ||
      opp.pipelineId === 'budgets';

    if (isBudgetOpp) {
      budgetsCount += 1;
    }

    if (semantic === 'converted') {
      convertedLeads += 1;
      convertedValue += val;
      totalAttemptsConverted += attempts;
      if (val > 0) {
        valuedConvertedSum += val;
        valuedConvertedCount += 1;
      }
      if (isBudgetOpp) budgetsConvertedValue += val;
    } else if (semantic === 'lost') {
      lostLeads += 1;
      lostValue += val;
      const reason = (opp.lostReason || '').trim() || 'Motivo não informado';
      const prev = lossMap.get(reason) || { count: 0, lostValue: 0 };
      prev.count += 1;
      prev.lostValue += val;
      lossMap.set(reason, prev);
    } else {
      activeLeads += 1;
      openValue += val;
      if (isBudgetOpp) budgetsOpenValue += val;

      if (semantic === 'scheduled') {
        scheduledLeads += 1;
        scheduledValue += val;
      }
      if (semantic === 'new' && attempts === 0) {
        noContactYet += 1;
      }

      const nextYMD = normalizeOpportunityDateYMD(opp.nextContactDate);
      const isOverdue = Boolean(nextYMD && nextYMD < todayYMD);
      const isToday = Boolean(nextYMD && nextYMD === todayYMD);
      const daysStale = CRMService.getSLADaysStale(opp, pl);
      const isSLA = daysStale >= 2;

      if (isOverdue) overdueFollowUps += 1;
      if (isToday) todayFollowUps += 1;
      if (isSLA) staleOver48h += 1;

      if (isOverdue || isToday || isSLA) {
        const urgencyParts: string[] = [];
        if (isOverdue && nextYMD) urgencyParts.push(`Follow-up vencido (${formatYMDShort(nextYMD)})`);
        else if (isToday) urgencyParts.push('Follow-up hoje');
        if (isSLA) urgencyParts.push(`SLA ${daysStale}d parado`);

        const urgencyScore =
          (isOverdue ? 100 : 0) +
          (isSLA ? 60 + daysStale * 5 : 0) +
          (isToday ? 35 : 0) +
          Math.min(val / 250, 40);

        criticalLeads.push({
          opp,
          clinicName: clinicMap.get(opp.clinicId)?.shortName || `Unidade ${opp.clinicId}`,
          pipelineName: pl?.name || opp.pipelineId,
          stageTitle: resolveStageTitle(opp),
          daysStale,
          isSLAAlert: isSLA,
          isFollowUpOverdue: isOverdue,
          isFollowUpToday: isToday,
          urgencyLabel: urgencyParts.join(' · '),
          urgencyScore,
        });
      }
    }
  }

  criticalLeads.sort((a, b) => b.urgencyScore - a.urgencyScore);

  const totalLeads = scopedOpportunities.length;
  const grossTotalValue = openValue + convertedValue + lostValue;
  const decidedValue = convertedValue + lostValue;
  const decidedCount = convertedLeads + lostLeads;

  const approvalRateDecided =
    decidedValue > 0
      ? safePct(convertedValue, decidedValue)
      : safePct(convertedLeads, decidedCount);

  const approvalRateGross =
    grossTotalValue > 0
      ? safePct(convertedValue, grossTotalValue)
      : safePct(convertedLeads, totalLeads);

  // Funnel steps
  let funnelSteps: CRMFunnelStepMetric[] = [];

  if (activePipelineObj) {
    const progressiveStages = activePipelineObj.stages.filter(
      (s) => s.semanticType !== 'lost'
    );
    const stageCounts = progressiveStages.map((stage) => {
      const matched = scopedOpportunities.filter((o) => o.stage === stage.id);
      return {
        stage,
        count: matched.length,
        value: matched.reduce((sum, o) => sum + Number(o.estimatedValue || 0), 0),
      };
    });

    // Cumulative count: leads that are at this stage or further along in the pipeline
    funnelSteps = stageCounts.map((entry, idx) => {
      const cumulativeCount = stageCounts
        .slice(idx)
        .reduce((sum, item) => sum + item.count, 0);
      const prevCumulative =
        idx === 0
          ? null
          : stageCounts
              .slice(idx - 1)
              .reduce((sum, item) => sum + item.count, 0);

      return {
        id: entry.stage.id,
        label: entry.stage.title,
        semanticType: entry.stage.semanticType,
        count: entry.count,
        cumulativeCount,
        value: entry.value,
        stepConversionRate:
          prevCumulative === null
            ? null
            : prevCumulative > 0
            ? (cumulativeCount / prevCumulative) * 100
            : 0,
        shareOfTotal: safePct(entry.count, totalLeads),
        color: STAGE_COLOR_HEX[entry.stage.color] || '#147A80',
      };
    });
  } else {
    const progressiveSemantics: CRMStageSemantic[] = [
      'new',
      'contacted',
      'scheduled',
      'converted',
    ];
    const semCounts = progressiveSemantics.map((sem) => {
      const matched = scopedOpportunities.filter((o) => resolveSemantic(o) === sem);
      return {
        sem,
        count: matched.length,
        value: matched.reduce((sum, o) => sum + Number(o.estimatedValue || 0), 0),
      };
    });

    funnelSteps = semCounts.map((entry, idx) => {
      const cumulativeCount = semCounts
        .slice(idx)
        .reduce((sum, item) => sum + item.count, 0);
      const prevCumulative =
        idx === 0
          ? null
          : semCounts
              .slice(idx - 1)
              .reduce((sum, item) => sum + item.count, 0);

      return {
        id: entry.sem,
        label: SEMANTIC_META[entry.sem].label,
        semanticType: entry.sem,
        count: entry.count,
        cumulativeCount,
        value: entry.value,
        stepConversionRate:
          prevCumulative === null
            ? null
            : prevCumulative > 0
            ? (cumulativeCount / prevCumulative) * 100
            : 0,
        shareOfTotal: safePct(entry.count, totalLeads),
        color: SEMANTIC_META[entry.sem].color,
      };
    });
  }

  // Losses sorted by count desc, then lostValue desc
  const losses: CRMLossReasonMetric[] = Array.from(lossMap.entries())
    .map(([reason, data]) => ({
      reason,
      count: data.count,
      pct: safePct(data.count, lostLeads),
      lostValue: data.lostValue,
    }))
    .sort((a, b) => b.count - a.count || b.lostValue - a.lostValue);

  // Pipeline comparison table (all pipelines, respecting date + unit filters)
  const byPipeline: CRMPipelineComparisonRow[] = pipelines.map((pl) => {
    const plOpps = unitFilteredAllPipelines.filter((o) => o.pipelineId === pl.id);
    let active = 0;
    let urgent = 0;
    let scheduled = 0;
    let converted = 0;
    let lost = 0;
    let plOpenVal = 0;
    let plConvVal = 0;

    for (const o of plOpps) {
      const sem = CRMService.resolveStageSemantic(pl, o.stage);
      const val = Number(o.estimatedValue || 0);
      if (sem === 'converted') {
        converted += 1;
        plConvVal += val;
      } else if (sem === 'lost') {
        lost += 1;
      } else {
        active += 1;
        plOpenVal += val;
        if (sem === 'scheduled') scheduled += 1;
        if (CRMService.isFollowUpDue(o, pl) || CRMService.isSLAAlert(o, pl)) {
          urgent += 1;
        }
      }
    }

    return {
      pipelineId: pl.id,
      name: pl.name,
      total: plOpps.length,
      active,
      urgent,
      scheduled,
      converted,
      lost,
      conversionRate: safePct(converted, plOpps.length),
      openValue: plOpenVal,
      convertedValue: plConvVal,
    };
  });

  // Unit comparison table (active clinics, respecting date + pipeline scope)
  const activeClinics = clinics.filter((c) => c.active);
  const byUnit: CRMUnitComparisonRow[] = activeClinics.map((clinic) => {
    const cOpps = pipelineScopedAllUnits.filter((o) => o.clinicId === clinic.id);
    let active = 0;
    let scheduled = 0;
    let converted = 0;
    let lost = 0;
    let cOpenVal = 0;
    let cConvVal = 0;
    let cConvValCount = 0;

    for (const o of cOpps) {
      const sem = resolveSemantic(o);
      const val = Number(o.estimatedValue || 0);
      if (sem === 'converted') {
        converted += 1;
        cConvVal += val;
        if (val > 0) cConvValCount += 1;
      } else if (sem === 'lost') {
        lost += 1;
      } else {
        active += 1;
        cOpenVal += val;
        if (sem === 'scheduled') scheduled += 1;
      }
    }

    return {
      clinicId: clinic.id,
      name: clinic.shortName || clinic.name,
      total: cOpps.length,
      active,
      scheduled,
      converted,
      lost,
      conversionRate: safePct(converted, cOpps.length),
      openValue: cOpenVal,
      convertedValue: cConvVal,
      avgTicket: cConvValCount > 0 ? cConvVal / cConvValCount : 0,
    };
  });

  // Dentist comparison
  const dentistMap = new Map<
    string,
    {
      total: number;
      active: number;
      scheduled: number;
      converted: number;
      lost: number;
      openValue: number;
      convertedValue: number;
      convertedValuedCount: number;
    }
  >();

  for (const o of scopedOpportunities) {
    const name = (o.dentistName || '').trim() || 'Sem dentista definido';
    const acc = dentistMap.get(name) || {
      total: 0,
      active: 0,
      scheduled: 0,
      converted: 0,
      lost: 0,
      openValue: 0,
      convertedValue: 0,
      convertedValuedCount: 0,
    };
    const sem = resolveSemantic(o);
    const val = Number(o.estimatedValue || 0);
    acc.total += 1;
    if (sem === 'converted') {
      acc.converted += 1;
      acc.convertedValue += val;
      if (val > 0) acc.convertedValuedCount += 1;
    } else if (sem === 'lost') {
      acc.lost += 1;
    } else {
      acc.active += 1;
      acc.openValue += val;
      if (sem === 'scheduled') acc.scheduled += 1;
    }
    dentistMap.set(name, acc);
  }

  const byDentist: CRMDentistComparisonRow[] = Array.from(dentistMap.entries())
    .map(([dentistName, d]) => ({
      dentistName,
      total: d.total,
      active: d.active,
      scheduled: d.scheduled,
      converted: d.converted,
      lost: d.lost,
      conversionRate: safePct(d.converted, d.total),
      openValue: d.openValue,
      convertedValue: d.convertedValue,
      avgTicket:
        d.convertedValuedCount > 0 ? d.convertedValue / d.convertedValuedCount : 0,
    }))
    .sort(
      (a, b) =>
        b.convertedValue - a.convertedValue ||
        b.openValue - a.openValue ||
        b.total - a.total
    );

  // Source / Channel comparison
  const sourceMap = new Map<
    string,
    {
      total: number;
      active: number;
      scheduled: number;
      converted: number;
      lost: number;
      openValue: number;
      convertedValue: number;
    }
  >();

  for (const o of scopedOpportunities) {
    const src = normalizeCRMSourceLabel(o);
    const acc = sourceMap.get(src) || {
      total: 0,
      active: 0,
      scheduled: 0,
      converted: 0,
      lost: 0,
      openValue: 0,
      convertedValue: 0,
    };
    const sem = resolveSemantic(o);
    const val = Number(o.estimatedValue || 0);
    acc.total += 1;
    if (sem === 'converted') {
      acc.converted += 1;
      acc.convertedValue += val;
    } else if (sem === 'lost') {
      acc.lost += 1;
    } else {
      acc.active += 1;
      acc.openValue += val;
      if (sem === 'scheduled') acc.scheduled += 1;
    }
    sourceMap.set(src, acc);
  }

  const bySource: CRMSourceComparisonRow[] = Array.from(sourceMap.entries())
    .map(([source, s]) => ({
      source,
      total: s.total,
      active: s.active,
      scheduled: s.scheduled,
      converted: s.converted,
      lost: s.lost,
      conversionRate: safePct(s.converted, s.total),
      openValue: s.openValue,
      convertedValue: s.convertedValue,
    }))
    .sort((a, b) => b.total - a.total || b.convertedValue - a.convertedValue);

  const openNonScheduledValue = Math.max(openValue - scheduledValue, 0);
  const openNonScheduledCount = Math.max(activeLeads - scheduledLeads, 0);

  return {
    scopeLabel,
    totalLeads,
    activeLeads,
    scheduledLeads,
    convertedLeads,
    lostLeads,
    overallConversionRate: safePct(convertedLeads, totalLeads),
    financial: {
      openValue,
      scheduledValue,
      convertedValue,
      lostValue,
      grossTotalValue,
      avgTicketAll: valuedAllCount > 0 ? valuedAllSum / valuedAllCount : 0,
      avgTicketConverted:
        valuedConvertedCount > 0 ? valuedConvertedSum / valuedConvertedCount : 0,
      approvalRateDecided,
      approvalRateGross,
      budgetsCount,
      budgetsOpenValue,
      budgetsConvertedValue,
      chartData: [
        {
          name: 'Em Negociação',
          value: openNonScheduledValue,
          count: openNonScheduledCount,
          color: '#D97706',
        },
        {
          name: 'Agendados',
          value: scheduledValue,
          count: scheduledLeads,
          color: '#147A80',
        },
        {
          name: 'Convertidos',
          value: convertedValue,
          count: convertedLeads,
          color: '#16A34A',
        },
        {
          name: 'Perdidos',
          value: lostValue,
          count: lostLeads,
          color: '#DC2626',
        },
      ],
    },
    funnel: {
      steps: funnelSteps,
      lostCount: lostLeads,
      lostValue,
      lostPct: safePct(lostLeads, totalLeads),
    },
    losses,
    sla: {
      overdueFollowUps,
      todayFollowUps,
      staleOver48h,
      totalUrgent: criticalLeads.length,
      noContactYet,
      avgContactAttemptsAll: totalLeads > 0 ? totalAttemptsAll / totalLeads : 0,
      avgContactAttemptsConverted:
        convertedLeads > 0 ? totalAttemptsConverted / convertedLeads : 0,
      criticalLeads: criticalLeads.slice(0, 8),
    },
    byPipeline,
    byUnit,
    byDentist,
    bySource,
    scopedOpportunities,
  };
}

function escapeCSVCell(value: string | number | undefined | null): string {
  const str = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  if (str.includes(';') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCRMDashboardCSV(params: {
  analytics: CRMAnalyticsSnapshot;
  pipelines: CRMPipeline[];
  clinics: Clinic[];
  labels: CRMLabel[];
  selectedClinicLabel: string;
  dateField: CRMDateField;
  dateRange: CRMDateRange;
}): string {
  const {
    analytics,
    pipelines,
    clinics,
    labels,
    selectedClinicLabel,
    dateField,
    dateRange,
  } = params;

  const pipelineMap = new Map(pipelines.map((p) => [p.id, p]));
  const clinicMap = new Map(clinics.map((c) => [c.id, c.shortName || c.name]));
  const labelMap = new Map(labels.map((l) => [l.id, l.name]));

  const rows: string[][] = [];
  const generatedAt = new Date().toLocaleString('pt-BR');

  rows.push(['BERTUOL ODONTOLOGIA AVANÇADA — RELATÓRIO GERENCIAL DO CRM']);
  rows.push(['Gerado em', generatedAt]);
  rows.push(['Escopo de Funil', analytics.scopeLabel]);
  rows.push(['Unidade', selectedClinicLabel]);
  rows.push([
    'Filtro de Data',
    dateRange.isActive
      ? `${getCRMDateFieldLabel(dateField)}: ${dateRange.summaryLabel}`
      : 'Todo período',
  ]);
  rows.push([]);

  rows.push(['RESUMO EXECUTIVO']);
  rows.push([
    'Total de Leads',
    'Ativos',
    'Agendados',
    'Convertidos',
    'Perdidos',
    'Conversão Global (%)',
    'Em Negociação (R$)',
    'Receita Convertida (R$)',
    'Ticket Médio Convertido (R$)',
    'Valor Perdido (R$)',
  ]);
  rows.push([
    String(analytics.totalLeads),
    String(analytics.activeLeads),
    String(analytics.scheduledLeads),
    String(analytics.convertedLeads),
    String(analytics.lostLeads),
    analytics.overallConversionRate.toFixed(1).replace('.', ','),
    analytics.financial.openValue.toFixed(2).replace('.', ','),
    analytics.financial.convertedValue.toFixed(2).replace('.', ','),
    analytics.financial.avgTicketConverted.toFixed(2).replace('.', ','),
    analytics.financial.lostValue.toFixed(2).replace('.', ','),
  ]);
  rows.push([]);

  rows.push(['FUNIL DE CONVERSÃO']);
  rows.push(['Etapa', 'Leads na Etapa', 'Acumulado', 'Taxa vs. Etapa Anterior (%)', 'Valor na Etapa (R$)']);
  for (const step of analytics.funnel.steps) {
    rows.push([
      step.label,
      String(step.count),
      String(step.cumulativeCount),
      step.stepConversionRate === null
        ? 'Base'
        : step.stepConversionRate.toFixed(1).replace('.', ','),
      step.value.toFixed(2).replace('.', ','),
    ]);
  }
  rows.push([
    'Perdidos',
    String(analytics.funnel.lostCount),
    '-',
    analytics.funnel.lostPct.toFixed(1).replace('.', ','),
    analytics.funnel.lostValue.toFixed(2).replace('.', ','),
  ]);
  rows.push([]);

  rows.push(['BASE DETALHADA DE OPORTUNIDADES']);
  rows.push([
    'Paciente',
    'Telefone / Contato',
    'Unidade',
    'Funil',
    'Etapa',
    'Dentista',
    'Origem',
    'Tratamento / Interesse',
    'Valor Estimado (R$)',
    'Tentativas',
    'Rótulos',
    'Motivo de Perda',
    'Data Entrada',
    'Próximo Follow-up',
    'Data Orçamento',
    'Data Agendamento',
  ]);

  for (const opp of analytics.scopedOpportunities) {
    const pl = pipelineMap.get(opp.pipelineId);
    const stageTitle =
      pl?.stages.find((s) => s.id === opp.stage)?.title || opp.stage;
    const oppLabels = (opp.labels || [])
      .map((id) => labelMap.get(id) || id)
      .join(', ');

    rows.push([
      opp.patientName,
      opp.patientPhone,
      clinicMap.get(opp.clinicId) || String(opp.clinicId),
      pl?.name || opp.pipelineId,
      stageTitle,
      opp.dentistName || 'Sem dentista definido',
      normalizeCRMSourceLabel(opp),
      opp.treatmentDescription || '',
      Number(opp.estimatedValue || 0).toFixed(2).replace('.', ','),
      String(opp.contactAttempts || 0),
      oppLabels,
      opp.lostReason || '',
      normalizeOpportunityDateYMD(opp.createdAt) || '',
      normalizeOpportunityDateYMD(opp.nextContactDate) || '',
      normalizeOpportunityDateYMD(opp.estimateDate) || '',
      normalizeOpportunityDateYMD(opp.scheduledDate) || '',
    ]);
  }

  return '\uFEFF' + rows.map((r) => r.map(escapeCSVCell).join(';')).join('\r\n');
}

export function downloadCRMDashboardCSV(csvContent: string, scopeLabel: string): void {
  const safeSlug = scopeLabel
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const dateStamp = toLocalYMD(new Date());
  const filename = `crm-relatorio-${safeSlug || 'geral'}-${dateStamp}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
