import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  Calendar,
  Download,
  Printer,
  RotateCcw,
  Search,
  ChevronRight,
  AlertTriangle,
  Layers,
  Filter,
} from 'lucide-react';
import { CRMLabel, CRMLeadOpportunity, CRMPipeline } from '../../types/crm';
import { Clinic } from '../../types/database';
import {
  CRM_DATE_FIELD_OPTIONS,
  CRM_DATE_PRESET_OPTIONS,
  CRMDateField,
  CRMDatePreset,
  CRMDateRange,
  getCRMDateFieldLabel,
} from '../../utils/crmDateFilter';
import {
  buildCRMDashboardCSV,
  computeCRMAnalytics,
  downloadCRMDashboardCSV,
  formatCurrencyBRL,
  formatPercentPT,
} from '../../utils/crmAnalytics';

interface CRMDashboardViewProps {
  dateFilteredOpportunities: CRMLeadOpportunity[];
  totalUnfilteredCount: number;
  pipelines: CRMPipeline[];
  activePipeline?: CRMPipeline;
  clinics: Clinic[];
  labels: CRMLabel[];
  dashboardScope: 'all' | string;
  onChangeDashboardScope: (scope: 'all' | string) => void;
  selectedClinicId: number | 'all';
  onChangeClinicId: (clinicId: number | 'all') => void;
  dateField: CRMDateField;
  datePreset: CRMDatePreset;
  customStartDate: string;
  customEndDate: string;
  resolvedDateRange: CRMDateRange;
  onChangeDateField: (field: CRMDateField) => void;
  onChangeDatePreset: (preset: CRMDatePreset) => void;
  onChangeCustomStartDate: (val: string) => void;
  onChangeCustomEndDate: (val: string) => void;
  onClearDateFilter: () => void;
  onOpenLead: (oppId: string) => void;
  onNotify: (message: string) => void;
}

const formatCompactBRL = (val: number): string => {
  if (!Number.isFinite(val)) return 'R$ 0';
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(1).replace('.', ',')}k`;
  return `R$ ${Math.round(val)}`;
};

export const CRMDashboardView: React.FC<CRMDashboardViewProps> = ({
  dateFilteredOpportunities,
  totalUnfilteredCount,
  pipelines,
  activePipeline,
  clinics,
  labels,
  dashboardScope,
  onChangeDashboardScope,
  selectedClinicId,
  onChangeClinicId,
  dateField,
  datePreset,
  customStartDate,
  customEndDate,
  resolvedDateRange,
  onChangeDateField,
  onChangeDatePreset,
  onChangeCustomStartDate,
  onChangeCustomEndDate,
  onClearDateFilter,
  onOpenLead,
  onNotify,
}) => {
  const [dentistSearch, setDentistSearch] = useState('');
  const [showAllDentists, setShowAllDentists] = useState(false);

  const analytics = useMemo(
    () =>
      computeCRMAnalytics(
        dateFilteredOpportunities,
        pipelines,
        clinics,
        dashboardScope,
        selectedClinicId
      ),
    [dateFilteredOpportunities, pipelines, clinics, dashboardScope, selectedClinicId]
  );

  const activeClinics = useMemo(() => clinics.filter((c) => c.active), [clinics]);

  const selectedClinicLabel = useMemo(() => {
    if (selectedClinicId === 'all') return 'Todas as Unidades';
    const found = clinics.find((c) => c.id === selectedClinicId);
    return found?.shortName || found?.name || `Unidade ${selectedClinicId}`;
  }, [clinics, selectedClinicId]);

  const filteredDentists = useMemo(() => {
    const q = dentistSearch.trim().toLowerCase();
    if (!q) return analytics.byDentist;
    return analytics.byDentist.filter((d) => d.dentistName.toLowerCase().includes(q));
  }, [analytics.byDentist, dentistSearch]);

  const visibleDentists = showAllDentists
    ? filteredDentists
    : filteredDentists.slice(0, 8);

  const hasAnyActiveFilter =
    resolvedDateRange.isActive ||
    selectedClinicId !== 'all' ||
    dashboardScope !== 'all';

  const handleResetAllFilters = () => {
    onClearDateFilter();
    onChangeClinicId('all');
    onChangeDashboardScope('all');
  };

  const handleExportCSV = () => {
    const csv = buildCRMDashboardCSV({
      analytics,
      pipelines,
      clinics,
      labels,
      selectedClinicLabel,
      dateField,
      dateRange: resolvedDateRange,
    });
    downloadCRMDashboardCSV(csv, analytics.scopeLabel);
    onNotify(
      `Planilha CSV exportada com ${analytics.totalLeads} oportunidade(s) (${analytics.scopeLabel}).`
    );
  };

  const handlePrintPDF = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    document.body.classList.add('crm-report-printing');

    const cleanup = () => {
      document.body.classList.remove('crm-report-printing');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.setTimeout(() => {
      window.print();
    }, 60);
    // Fallback cleanup in case afterprint does not fire in some embedded webviews
    window.setTimeout(cleanup, 4000);
  };

  const sourceChartData = useMemo(
    () =>
      analytics.bySource.slice(0, 6).map((item) => ({
        name:
          item.source.length > 22
            ? `${item.source.slice(0, 20)}…`
            : item.source,
        fullName: item.source,
        total: item.total,
        converted: item.converted,
        convertedValue: item.convertedValue,
        conversionRate: item.conversionRate,
      })),
    [analytics.bySource]
  );

  const printedAtLabel = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-5">
      {/* Corporate Print-Only Header (visible exclusively in @media print) */}
      <div className="hidden crm-print-only border-b-2 border-[#147A80] pb-3 mb-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Bertuol Odontologia Avançada — Relatório Gerencial do CRM
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Escopo: {analytics.scopeLabel} · Unidade: {selectedClinicLabel} · Período:{' '}
              {resolvedDateRange.isActive
                ? `${getCRMDateFieldLabel(dateField)} (${resolvedDateRange.summaryLabel})`
                : 'Todo período'}
            </p>
          </div>
          <span className="text-[11px] font-mono tabular-nums text-slate-500">
            Emitido em {printedAtLabel}
          </span>
        </div>
      </div>

      {/* Control Bar: Scope + Unit + Date Filter + Export/Print */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 crm-no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Funnel Scope Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => onChangeDashboardScope('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  dashboardScope === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos os Funis
              </button>
              {activePipeline && (
                <button
                  type="button"
                  onClick={() => onChangeDashboardScope(activePipeline.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    dashboardScope === activePipeline.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Funil Atual ({activePipeline.name})
                </button>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={dashboardScope}
                onChange={(e) => onChangeDashboardScope(e.target.value)}
                aria-label="Selecionar funil do relatório"
                className="h-8 bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs rounded-lg px-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#147A80]"
              >
                <option value="all">Consolidado — Todos os Funis</option>
                {pipelines.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedClinicId}
              onChange={(e) =>
                onChangeClinicId(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              aria-label="Filtrar relatório por unidade"
              className="h-8 bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs rounded-lg px-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#147A80]"
            >
              <option value="all">Todas as Unidades</option>
              {activeClinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortName}
                </option>
              ))}
            </select>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-[#147A80]" />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrintPDF}
              className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Synchronized Date Filter Row */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5">
              <Calendar
                className={`w-3.5 h-3.5 shrink-0 ${
                  resolvedDateRange.isActive ? 'text-[#147A80]' : 'text-slate-400'
                }`}
              />
              <select
                value={dateField}
                onChange={(e) => onChangeDateField(e.target.value as CRMDateField)}
                aria-label="Campo de data do relatório"
                className={`h-8 rounded-lg px-2.5 text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#147A80] ${
                  resolvedDateRange.isActive
                    ? 'bg-teal-50/70 border-teal-300 text-[#0f5c61]'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {CRM_DATE_FIELD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {CRM_DATE_PRESET_OPTIONS.map((preset) => {
                const isSelected = datePreset === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => onChangeDatePreset(preset.value)}
                    className={`h-8 px-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#147A80] text-white border-[#147A80]'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {datePreset === 'custom' && (
              <div className="inline-flex flex-wrap items-center gap-1.5">
                <label className="text-[11px] font-medium text-slate-500">De</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => onChangeCustomStartDate(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                />
                <label className="text-[11px] font-medium text-slate-500">Até</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => onChangeCustomEndDate(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="tabular-nums">
              {analytics.totalLeads} oportunidade(s) analisada(s)
              {totalUnfilteredCount > analytics.totalLeads
                ? ` · base total ${totalUnfilteredCount}`
                : ''}
            </span>
            {hasAnyActiveFilter && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#147A80] hover:text-[#0f5c61] cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State when active filters return 0 leads */}
      {analytics.totalLeads === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Filter className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Nenhuma oportunidade encontrada para os filtros selecionados
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Escopo: {analytics.scopeLabel} · Unidade: {selectedClinicLabel} ·{' '}
            {resolvedDateRange.isActive
              ? `${getCRMDateFieldLabel(dateField)}: ${resolvedDateRange.summaryLabel}`
              : 'Todo período'}
            . Ajuste o período ou limpe os filtros para visualizar os indicadores completos.
          </p>
          {hasAnyActiveFilter && (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="mt-2 h-9 inline-flex items-center gap-1.5 px-4 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Layer 1: 4 Executive Financial & Conversion KPIs */}
          <div className="bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 crm-print-block">
            <div className="p-4 space-y-1">
              <div className="text-xs font-medium text-slate-500">
                Valor em negociação
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {formatCurrencyBRL(analytics.financial.openValue)}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                {analytics.activeLeads} ativos · {analytics.scheduledLeads} agendados (
                {formatCurrencyBRL(analytics.financial.scheduledValue)})
              </div>
            </div>

            <div className="p-4 space-y-1">
              <div className="text-xs font-medium text-slate-500">
                Receita convertida
              </div>
              <div className="text-xl font-bold text-[#16A34A] font-mono tabular-nums">
                {formatCurrencyBRL(analytics.financial.convertedValue)}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                {analytics.convertedLeads} convertidos · conversão global{' '}
                <span className="font-semibold text-slate-700">
                  {formatPercentPT(analytics.overallConversionRate)}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-1">
              <div className="text-xs font-medium text-slate-500">
                Ticket médio convertido
              </div>
              <div className="text-xl font-bold text-[#147A80] font-mono tabular-nums">
                {formatCurrencyBRL(analytics.financial.avgTicketConverted)}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                Média geral com valor:{' '}
                <span className="font-semibold text-slate-700">
                  {formatCurrencyBRL(analytics.financial.avgTicketAll)}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-1">
              <div className="text-xs font-medium text-slate-500">
                Valor perdido no período
              </div>
              <div className="text-xl font-bold text-[#DC2626] font-mono tabular-nums">
                {formatCurrencyBRL(analytics.financial.lostValue)}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                {analytics.lostLeads} perdidos · aprovação sobre decididos{' '}
                <span className="font-semibold text-slate-700">
                  {formatPercentPT(analytics.financial.approvalRateDecided)}
                </span>
              </div>
            </div>
          </div>

          {/* Layer 2: Conversion Funnel + Financial / Budgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Block 1: Conversion Funnel */}
            <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between crm-print-block">
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Funil de Conversão & Taxas entre Etapas
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {analytics.scopeLabel} · volume acumulado e taxa de passagem passo a passo
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                    {analytics.totalLeads} leads
                  </span>
                </div>

                <div className="h-[210px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.funnel.steps}
                      layout="vertical"
                      margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={132}
                        tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: '#F8FAFC' }}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
                        }}
                        formatter={(value: unknown, _name: unknown, props: { payload?: { count?: number; value?: number; stepConversionRate?: number | null } }) => {
                          const p = props?.payload;
                          const stepRate =
                            p?.stepConversionRate === null || p?.stepConversionRate === undefined
                              ? 'Base do funil'
                              : `${formatPercentPT(p.stepConversionRate)} da etapa anterior`;
                          return [
                            `${value} acumulados · ${p?.count ?? 0} atuais · ${formatCurrencyBRL(
                              p?.value ?? 0
                            )} (${stepRate})`,
                            'Funil',
                          ];
                        }}
                      />
                      <Bar dataKey="cumulativeCount" radius={[0, 6, 6, 0]} maxBarSize={24}>
                        {analytics.funnel.steps.map((step) => (
                          <Cell key={step.id} fill={step.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2 pr-2">Etapa</th>
                      <th className="py-2 px-2 text-right">Na etapa</th>
                      <th className="py-2 px-2 text-right">Passagem</th>
                      <th className="py-2 pl-2 text-right">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {analytics.funnel.steps.map((step) => (
                      <tr key={step.id}>
                        <td className="py-2 pr-2 font-medium text-slate-900">{step.label}</td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums">
                          {step.count}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums text-[#147A80] font-semibold">
                          {step.stepConversionRate === null
                            ? 'Base'
                            : formatPercentPT(step.stepConversionRate)}
                        </td>
                        <td className="py-2 pl-2 text-right font-mono tabular-nums text-slate-700">
                          {formatCurrencyBRL(step.value)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/70">
                      <td className="py-2 pr-2 font-medium text-[#DC2626]">
                        Perdidos / Desistências
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-[#DC2626] font-semibold">
                        {analytics.funnel.lostCount}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums text-[#DC2626]">
                        {formatPercentPT(analytics.funnel.lostPct)}
                      </td>
                      <td className="py-2 pl-2 text-right font-mono tabular-nums text-[#DC2626]">
                        {formatCurrencyBRL(analytics.funnel.lostValue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Block 2: Financial & Budgets */}
            <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between crm-print-block">
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Financeiro de Orçamentos & Distribuição de Valor
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Comparativo de receita em negociação, agendada, convertida e perdida
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                    Total {formatCurrencyBRL(analytics.financial.grossTotalValue)}
                  </span>
                </div>

                <div className="h-[210px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.financial.chartData}
                      margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={formatCompactBRL}
                        width={64}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: '#F8FAFC' }}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
                        }}
                        formatter={(value: unknown, _name: unknown, props: { payload?: { count?: number } }) => [
                          `${formatCurrencyBRL(Number(value || 0))} (${props?.payload?.count ?? 0} leads)`,
                          'Valor',
                        ]}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                        {analytics.financial.chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px] font-medium text-slate-500">
                    Orçamentos monitorados
                  </div>
                  <div className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {analytics.financial.budgetsCount}
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    Aberto {formatCurrencyBRL(analytics.financial.budgetsOpenValue)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-medium text-slate-500">
                    Orçamentos aprovados
                  </div>
                  <div className="text-sm font-bold text-[#16A34A] font-mono tabular-nums mt-0.5">
                    {formatCurrencyBRL(analytics.financial.budgetsConvertedValue)}
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    Sobre total {formatPercentPT(analytics.financial.approvalRateGross)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-medium text-slate-500">
                    Fechamento (Ganho vs. Perda)
                  </div>
                  <div className="text-sm font-bold text-[#147A80] font-mono tabular-nums mt-0.5">
                    {formatPercentPT(analytics.financial.approvalRateDecided)}
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {analytics.convertedLeads}G / {analytics.lostLeads}P decididos
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Layer 3: Loss Reasons + Operational Health & SLA Bottlenecks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Block 3A: Loss Reasons */}
            <section className="bg-white rounded-xl border border-slate-200 p-5 crm-print-block">
              <div className="flex items-baseline justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Motivos de Perda & Impacto Financeiro
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Principais objeções registradas e valor perdido associado
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                  {analytics.lostLeads} perdido(s)
                </span>
              </div>

              {analytics.losses.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Nenhum lead marcado como perdido no escopo e período selecionados.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {analytics.losses.map((item) => (
                    <div key={item.reason} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-3 text-xs">
                        <span className="font-medium text-slate-800">{item.reason}</span>
                        <span className="font-mono tabular-nums text-slate-600 shrink-0">
                          {item.count} ({formatPercentPT(item.pct)}) ·{' '}
                          <span className="font-semibold text-[#DC2626]">
                            {formatCurrencyBRL(item.lostValue)}
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#DC2626] rounded-full"
                          style={{ width: `${Math.max(item.pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Block 3B: Operational SLA & Critical Leads Drill-Down */}
            <section className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between crm-print-block">
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Saúde Operacional & Gargalos de SLA
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Atrasos de retorno, leads parados e esforço médio de contato
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                    {analytics.sla.noContactYet} sem 1º contato
                  </span>
                </div>

                {/* 4 Inline Operational Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">
                      Follow-up vencido
                    </div>
                    <div
                      className={`text-base font-bold font-mono tabular-nums mt-0.5 ${
                        analytics.sla.overdueFollowUps > 0
                          ? 'text-[#DC2626]'
                          : 'text-slate-900'
                      }`}
                    >
                      {analytics.sla.overdueFollowUps}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">
                      Follow-up hoje
                    </div>
                    <div
                      className={`text-base font-bold font-mono tabular-nums mt-0.5 ${
                        analytics.sla.todayFollowUps > 0
                          ? 'text-[#D97706]'
                          : 'text-slate-900'
                      }`}
                    >
                      {analytics.sla.todayFollowUps}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">
                      Parados SLA &gt;48h
                    </div>
                    <div
                      className={`text-base font-bold font-mono tabular-nums mt-0.5 ${
                        analytics.sla.staleOver48h > 0
                          ? 'text-[#DC2626]'
                          : 'text-slate-900'
                      }`}
                    >
                      {analytics.sla.staleOver48h}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-slate-500">
                      Média tentativas
                    </div>
                    <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                      {analytics.sla.avgContactAttemptsAll.toFixed(1).replace('.', ',')}
                    </div>
                  </div>
                </div>

                {/* Actionable Critical Leads List */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-700">
                      Prioridades para ação imediata
                    </span>
                    <span className="text-[11px] text-slate-400 crm-no-print">
                      Clique para abrir a ficha do paciente
                    </span>
                  </div>

                  {analytics.sla.criticalLeads.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Nenhum gargalo de SLA ou follow-up pendente neste recorte.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {analytics.sla.criticalLeads.slice(0, 6).map((item) => (
                        <button
                          key={item.opp.id}
                          type="button"
                          onClick={() => onOpenLead(item.opp.id)}
                          className="w-full py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-left cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  item.isFollowUpOverdue || item.isSLAAlert
                                    ? 'text-[#DC2626]'
                                    : 'text-[#D97706]'
                                }`}
                              />
                              <span className="text-xs font-semibold text-slate-900 truncate">
                                {item.opp.patientName}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {item.clinicName} · {item.pipelineName} ·{' '}
                              <span
                                className={
                                  item.isFollowUpOverdue || item.isSLAAlert
                                    ? 'text-[#DC2626] font-medium'
                                    : 'text-[#D97706] font-medium'
                                }
                              >
                                {item.urgencyLabel}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {Number(item.opp.estimatedValue || 0) > 0 && (
                              <span className="text-xs font-mono tabular-nums font-semibold text-slate-700">
                                {formatCurrencyBRL(Number(item.opp.estimatedValue || 0))}
                              </span>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#147A80] transition-colors crm-no-print" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Layer 4A: Performance by Pipeline (Interactive Scope Drill-Down) */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 crm-print-block">
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Desempenho por Funil Comercial
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visão consolidada respeitando o filtro de data e unidade ativos · clique em um funil para detalhar acima
                </p>
              </div>
              {dashboardScope !== 'all' && (
                <button
                  type="button"
                  onClick={() => onChangeDashboardScope('all')}
                  className="text-xs font-semibold text-[#147A80] hover:underline cursor-pointer crm-no-print"
                >
                  Voltar para Todos os Funis
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Funil</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-right">Ativos</th>
                    <th className="py-2.5 px-3 text-right">Follow-ups / SLA</th>
                    <th className="py-2.5 px-3 text-right">Agendados</th>
                    <th className="py-2.5 px-3 text-right">Convertidos</th>
                    <th className="py-2.5 px-3 text-right">Conversão</th>
                    <th className="py-2.5 px-3 text-right">Em negociação</th>
                    <th className="py-2.5 px-3 text-right">Convertido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {analytics.byPipeline.map((row) => {
                    const isFocused = dashboardScope === row.pipelineId;
                    return (
                      <tr
                        key={row.pipelineId}
                        onClick={() =>
                          onChangeDashboardScope(isFocused ? 'all' : row.pipelineId)
                        }
                        className={`cursor-pointer transition-colors ${
                          isFocused ? 'bg-teal-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {row.name}
                          {isFocused && (
                            <span className="ml-2 text-[11px] font-medium text-[#147A80]">
                              · selecionado
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                          {row.total}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {row.active}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#D97706] font-semibold">
                          {row.urgent}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#147A80] font-semibold">
                          {row.scheduled}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#16A34A] font-semibold">
                          {row.converted}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-700">
                          {formatPercentPT(row.conversionRate)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {formatCurrencyBRL(row.openValue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#16A34A]">
                          {formatCurrencyBRL(row.convertedValue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Layer 4B: Unit Comparison + Source / Channel Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Performance by Unit */}
            <section className="bg-white rounded-xl border border-slate-200 p-5 crm-print-block">
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Comparativo por Unidade
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {analytics.scopeLabel} · volume, conversão e faturamento por clínica
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2.5 px-2">Unidade</th>
                      <th className="py-2.5 px-2 text-right">Ativos</th>
                      <th className="py-2.5 px-2 text-right">Agend.</th>
                      <th className="py-2.5 px-2 text-right">Conv.</th>
                      <th className="py-2.5 px-2 text-right">Taxa</th>
                      <th className="py-2.5 px-2 text-right">Ticket</th>
                      <th className="py-2.5 px-2 text-right">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {analytics.byUnit.map((unit) => (
                      <tr key={unit.clinicId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-2 font-semibold text-slate-900">
                          {unit.name}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                          {unit.active}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums text-[#147A80] font-semibold">
                          {unit.scheduled}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums text-[#16A34A] font-semibold">
                          {unit.converted}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-700">
                          {formatPercentPT(unit.conversionRate)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-600">
                          {formatCurrencyBRL(unit.avgTicket)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums font-bold text-[#16A34A]">
                          {formatCurrencyBRL(unit.convertedValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Performance by Source / Channel */}
            <section className="bg-white rounded-xl border border-slate-200 p-5 crm-print-block">
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Desempenho por Origem / Canal
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Volume de leads e retorno financeiro por canal de entrada
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                  {analytics.bySource.length} canal(is)
                </span>
              </div>

              {sourceChartData.length > 0 && (
                <div className="h-[160px] w-full mb-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sourceChartData}
                      layout="vertical"
                      margin={{ top: 2, right: 16, left: 4, bottom: 2 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={{ stroke: '#E2E8F0' }}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={132}
                        tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: '#F8FAFC' }}
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '12px',
                        }}
                        formatter={(value: unknown, _name: unknown, props: { payload?: { converted?: number; conversionRate?: number; convertedValue?: number } }) => [
                          `${value} leads · ${props?.payload?.converted ?? 0} conv. (${formatPercentPT(
                            props?.payload?.conversionRate ?? 0
                          )}) · ${formatCurrencyBRL(props?.payload?.convertedValue ?? 0)}`,
                          'Canal',
                        ]}
                      />
                      <Bar dataKey="total" fill="#147A80" radius={[0, 6, 6, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="overflow-x-auto border-t border-slate-100 pt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2 px-2">Origem</th>
                      <th className="py-2 px-2 text-right">Leads</th>
                      <th className="py-2 px-2 text-right">Conv.</th>
                      <th className="py-2 px-2 text-right">Taxa</th>
                      <th className="py-2 px-2 text-right">Receita</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {analytics.bySource.map((src) => (
                      <tr key={src.source} className="hover:bg-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-900">{src.source}</td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums">
                          {src.total}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums text-[#16A34A] font-semibold">
                          {src.converted}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700">
                          {formatPercentPT(src.conversionRate)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono tabular-nums font-semibold text-[#16A34A]">
                          {formatCurrencyBRL(src.convertedValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Layer 4C: Performance by Dentist */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 crm-print-block">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Desempenho por Dentista
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Carteira comercial, taxa de fechamento e faturamento atribuído por profissional
                </p>
              </div>

              {analytics.byDentist.length > 5 && (
                <div className="relative w-full sm:w-60 crm-no-print">
                  <input
                    type="text"
                    placeholder="Filtrar dentista..."
                    value={dentistSearch}
                    onChange={(e) => setDentistSearch(e.target.value)}
                    className="w-full h-8 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-8 pr-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Profissional</th>
                    <th className="py-2.5 px-3 text-right">Leads</th>
                    <th className="py-2.5 px-3 text-right">Ativos</th>
                    <th className="py-2.5 px-3 text-right">Agendados</th>
                    <th className="py-2.5 px-3 text-right">Convertidos</th>
                    <th className="py-2.5 px-3 text-right">Conversão</th>
                    <th className="py-2.5 px-3 text-right">Em negociação</th>
                    <th className="py-2.5 px-3 text-right">Ticket médio</th>
                    <th className="py-2.5 px-3 text-right">Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {visibleDentists.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-slate-400">
                        Nenhum dentista corresponde à busca informada.
                      </td>
                    </tr>
                  ) : (
                    visibleDentists.map((d) => (
                      <tr key={d.dentistName} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {d.dentistName}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                          {d.total}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {d.active}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#147A80] font-semibold">
                          {d.scheduled}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#16A34A] font-semibold">
                          {d.converted}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-700">
                          {formatPercentPT(d.conversionRate)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {formatCurrencyBRL(d.openValue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                          {formatCurrencyBRL(d.avgTicket)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#16A34A]">
                          {formatCurrencyBRL(d.convertedValue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredDentists.length > 8 && (
              <div className="mt-3 pt-2 border-t border-slate-100 flex justify-center crm-no-print">
                <button
                  type="button"
                  onClick={() => setShowAllDentists((prev) => !prev)}
                  className="text-xs font-semibold text-[#147A80] hover:text-[#0f5c61] cursor-pointer"
                >
                  {showAllDentists
                    ? 'Mostrar apenas os 8 principais'
                    : `Ver todos os ${filteredDentists.length} profissionais`}
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
