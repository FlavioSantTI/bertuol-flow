import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  History,
  Play,
  Square,
  Download,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { AppUserContext, Clinic } from '../../types/database';
import {
  BackfillChunkResponse,
  BackfillEstimateRecord,
  BackfillExportMetadata,
  buildBackfillDateWindows,
  buildEstimatesBackfillCSV,
  buildEstimatesBackfillJSON,
  diffDaysInclusiveYMD,
  downloadTextArtifact,
  formatDateInSaoPauloYMD,
  formatYMDBR,
  getDefaultBackfillRange,
} from '../../utils/crmEstimatesBackfill';

interface CRMEstimatesBackfillModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinics: Clinic[];
  userContext: AppUserContext;
  defaultClinicId: number | 'all';
  onAfterBackfill: (addedCount: number) => void;
}

type PeriodPreset = '365' | '180' | '90' | '30' | 'custom';
type RunStatus = 'idle' | 'running' | 'completed' | 'cancelled' | 'error';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export const CRMEstimatesBackfillModal: React.FC<CRMEstimatesBackfillModalProps> = ({
  isOpen,
  onClose,
  clinics,
  userContext,
  defaultClinicId,
  onAfterBackfill,
}) => {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('365');
  const [fromDate, setFromDate] = useState<string>(() => getDefaultBackfillRange(365).fromDate);
  const [toDate, setToDate] = useState<string>(() => getDefaultBackfillRange(365).toDate);
  const [clinicId, setClinicId] = useState<number | 'all'>(defaultClinicId);
  const [chunkDays, setChunkDays] = useState<number>(15);
  const [dryRun, setDryRun] = useState<boolean>(false);

  const [status, setStatus] = useState<RunStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentWindowLabel, setCurrentWindowLabel] = useState<string>('');
  const [completedWindows, setCompletedWindows] = useState<number>(0);
  const [totalWindows, setTotalWindows] = useState<number>(0);

  const [totals, setTotals] = useState({
    totalFetched: 0,
    openFound: 0,
    added: 0,
    skippedExisting: 0,
    simulated: 0,
    failedInsert: 0,
    newValueTotal: 0,
  });
  const [records, setRecords] = useState<BackfillEstimateRecord[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const cancelRequestedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setClinicId(defaultClinicId);
    setErrorMessage(null);
  }, [isOpen, defaultClinicId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && status !== 'running') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, status, onClose]);

  if (!isOpen) return null;

  const activeClinics = (clinics || []).filter((c) => c.active);

  const handleSelectPeriodPreset = (preset: PeriodPreset) => {
    setPeriodPreset(preset);
    setErrorMessage(null);
    if (preset !== 'custom') {
      const range = getDefaultBackfillRange(Number(preset));
      setFromDate(range.fromDate);
      setToDate(range.toDate);
    }
  };

  const selectedClinicLabel =
    clinicId === 'all'
      ? 'Todas as Unidades'
      : activeClinics.find((c) => c.id === clinicId)?.shortName || `Unidade ${clinicId}`;

  const spanDays =
    fromDate && toDate && fromDate <= toDate ? diffDaysInclusiveYMD(fromDate, toDate) : 0;

  const previewWindowCount =
    spanDays > 0 && spanDays <= 366
      ? buildBackfillDateWindows(fromDate, toDate, chunkDays).length
      : 0;

  const handleStart = async () => {
    setErrorMessage(null);

    if (!fromDate || !toDate || fromDate > toDate) {
      setErrorMessage('Informe uma data inicial menor ou igual à data final.');
      return;
    }

    if (spanDays > 366) {
      setErrorMessage('O intervalo máximo permitido por execução é de 366 dias (1 ano).');
      return;
    }

    const windows = buildBackfillDateWindows(fromDate, toDate, chunkDays);
    if (windows.length === 0) {
      setErrorMessage('Não foi possível gerar janelas de consulta para o período informado.');
      return;
    }

    cancelRequestedRef.current = false;
    setStatus('running');
    setCompletedWindows(0);
    setTotalWindows(windows.length);
    setCurrentWindowLabel('');
    setWarnings([]);
    setRecords([]);
    setTotals({
      totalFetched: 0,
      openFound: 0,
      added: 0,
      skippedExisting: 0,
      simulated: 0,
      failedInsert: 0,
      newValueTotal: 0,
    });

    const seenEstimateIds = new Set<number>();
    const accRecords: BackfillEstimateRecord[] = [];
    const accWarnings: string[] = [];
    const accTotals = {
      totalFetched: 0,
      openFound: 0,
      added: 0,
      skippedExisting: 0,
      simulated: 0,
      failedInsert: 0,
      newValueTotal: 0,
    };

    let finishedCount = 0;

    for (const win of windows) {
      if (cancelRequestedRef.current) {
        setStatus('cancelled');
        if (accTotals.added > 0) {
          onAfterBackfill(accTotals.added);
        }
        return;
      }

      setCurrentWindowLabel(
        `Janela ${win.index} de ${win.total} · ${formatYMDBR(win.from)} → ${formatYMDBR(win.to)}`
      );

      try {
        const res = await fetch('/api/clinicorp/estimates-backfill-chunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': userContext?.role || '',
            ...(userContext?.email ? { 'x-user-email': userContext.email } : {}),
          },
          body: JSON.stringify({
            from: win.from,
            to: win.to,
            clinicId,
            dryRun,
          }),
        });

        const json: BackfillChunkResponse | null = await res.json().catch(() => null);

        if (!res.ok || !json?.success) {
          const errMsg = json?.error || `Erro HTTP ${res.status}`;
          if (res.status === 400 || res.status === 403) {
            setErrorMessage(errMsg);
            setStatus('error');
            return;
          }
          accWarnings.push(
            `Janela ${win.index}/${win.total} (${formatYMDBR(win.from)}..${formatYMDBR(win.to)}): ${errMsg}`
          );
          setWarnings([...accWarnings]);
        } else {
          accTotals.totalFetched += json.counts?.totalFetched || 0;

          if (Array.isArray(json.warnings) && json.warnings.length > 0) {
            accWarnings.push(...json.warnings);
            setWarnings([...accWarnings]);
          }

          for (const rec of json.records || []) {
            if (seenEstimateIds.has(rec.estimateId)) continue;
            seenEstimateIds.add(rec.estimateId);
            accRecords.push(rec);
            accTotals.openFound += 1;

            if (rec.action === 'GRAVADO') {
              accTotals.added += 1;
              accTotals.newValueTotal += Number(rec.amount || 0);
            } else if (rec.action === 'IGNORADO_EXISTENTE') {
              accTotals.skippedExisting += 1;
            } else if (rec.action === 'SIMULADO') {
              accTotals.simulated += 1;
              accTotals.newValueTotal += Number(rec.amount || 0);
            } else if (rec.action === 'ERRO_GRAVACAO') {
              accTotals.failedInsert += 1;
            }
          }

          setTotals({ ...accTotals });
          setRecords([...accRecords]);
        }
      } catch (err: any) {
        accWarnings.push(
          `Janela ${win.index}/${win.total} (${formatYMDBR(win.from)}..${formatYMDBR(win.to)}): ${
            err?.message || 'Falha de rede'
          }`
        );
        setWarnings([...accWarnings]);
      }

      finishedCount += 1;
      setCompletedWindows(finishedCount);

      if (win.index < win.total && !cancelRequestedRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 280));
      }
    }

    accRecords.sort((a, b) => {
      if (b.estimateDate !== a.estimateDate) return b.estimateDate.localeCompare(a.estimateDate);
      return b.amount - a.amount;
    });
    setRecords([...accRecords]);
    setStatus('completed');

    if (accTotals.added > 0) {
      onAfterBackfill(accTotals.added);
    }
  };

  const handleCancelRun = () => {
    cancelRequestedRef.current = true;
  };

  const buildExportMeta = (): BackfillExportMetadata => ({
    generatedAt: new Date().toLocaleString('pt-BR'),
    fromDate,
    toDate,
    clinicScopeLabel: selectedClinicLabel,
    dryRun,
    chunkDays,
    totalWindows,
    completedWindows,
    cancelled: status === 'cancelled',
    totals,
    warnings,
  });

  const handleDownloadCSV = () => {
    const stamp = formatDateInSaoPauloYMD(new Date());
    const suffix = dryRun ? 'simulacao' : 'importado';
    const csv = buildEstimatesBackfillCSV(records, buildExportMeta());
    downloadTextArtifact(
      csv,
      `orcamentos-open-historico-${suffix}-${stamp}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  const handleDownloadJSON = () => {
    const stamp = formatDateInSaoPauloYMD(new Date());
    const suffix = dryRun ? 'simulacao' : 'importado';
    const jsonStr = buildEstimatesBackfillJSON(records, buildExportMeta());
    downloadTextArtifact(
      jsonStr,
      `orcamentos-open-historico-${suffix}-${stamp}.json`,
      'application/json;charset=utf-8;'
    );
  };

  const progressPct =
    totalWindows > 0 ? Math.min(100, Math.round((completedWindows / totalWindows) * 100)) : 0;

  const isRunning = status === 'running';
  const hasFinished = status === 'completed' || status === 'cancelled';

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Importar Histórico de Orçamentos em Aberto"
      onClick={() => {
        if (!isRunning) onClose();
      }}
      className="fixed inset-0 z-[120] bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-[#147A80] flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Importar Histórico de Orçamentos em Aberto
              </h3>
              <p className="text-xs text-slate-500 truncate">
                Somente status OPEN · Ignora existentes no CRM · Gera CSV e JSON
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isRunning}
            onClick={onClose}
            aria-label="Fechar importação histórica"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-slate-50/50">
          {/* Configuration Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Período de busca no Clinicorp
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: '365', label: 'Último 1 ano (365d)' },
                    { id: '180', label: '6 meses (180d)' },
                    { id: '90', label: '90 dias' },
                    { id: '30', label: '30 dias' },
                    { id: 'custom', label: 'Personalizado' },
                  ] as Array<{ id: PeriodPreset; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isRunning}
                    onClick={() => handleSelectPeriodPreset(opt.id)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 ${
                      periodPreset === opt.id
                        ? 'bg-[#147A80] text-white border-[#147A80]'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Data inicial
                </label>
                <input
                  type="date"
                  disabled={isRunning}
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPeriodPreset('custom');
                  }}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#147A80] disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Data final
                </label>
                <input
                  type="date"
                  disabled={isRunning}
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPeriodPreset('custom');
                  }}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#147A80] disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Unidade
                </label>
                <select
                  disabled={isRunning}
                  value={clinicId}
                  onChange={(e) =>
                    setClinicId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#147A80] disabled:bg-slate-100 cursor-pointer"
                >
                  <option value="all">Todas as Unidades</option>
                  {activeClinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={isRunning}
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded border-slate-300 text-[#147A80] focus:ring-[#147A80]"
                />
                <span>Somente simular (conferir números e baixar CSV/JSON sem gravar no CRM)</span>
              </label>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 tabular-nums">
                <span>Fatiamento:</span>
                <select
                  disabled={isRunning}
                  value={chunkDays}
                  onChange={(e) => setChunkDays(Number(e.target.value))}
                  className="h-7 px-2 rounded border border-slate-200 bg-slate-50 text-xs font-mono text-slate-700 cursor-pointer"
                >
                  <option value={7}>7 dias</option>
                  <option value={15}>15 dias</option>
                  <option value={30}>30 dias</option>
                </select>
                <span>· {previewWindowCount} janela(s)</span>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Live Progress & Counters */}
          {status !== 'idle' && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 min-w-0">
                    {isRunning && (
                      <RefreshCw className="w-3.5 h-3.5 text-[#147A80] animate-spin shrink-0" />
                    )}
                    {status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                    )}
                    {status === 'cancelled' && (
                      <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                    )}
                    <span className="truncate">
                      {isRunning
                        ? currentWindowLabel || 'Preparando janelas...'
                        : status === 'completed'
                        ? dryRun
                          ? 'Simulação concluída com sucesso'
                          : 'Carga histórica concluída e sincronizada com o CRM'
                        : status === 'cancelled'
                        ? 'Carga interrompida pelo usuário'
                        : 'Carga interrompida com erro'}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-[#147A80] shrink-0">
                    {progressPct}% ({completedWindows}/{totalWindows})
                  </span>
                </div>

                <progress
                  value={progressPct}
                  max={100}
                  aria-label="Progresso da carga histórica"
                  className={`w-full h-2 rounded-full overflow-hidden bg-slate-100 [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all ${
                    status === 'cancelled'
                      ? 'accent-[#D97706] [&::-webkit-progress-value]:bg-[#D97706]'
                      : status === 'error'
                      ? 'accent-[#DC2626] [&::-webkit-progress-value]:bg-[#DC2626]'
                      : 'accent-[#147A80] [&::-webkit-progress-value]:bg-[#147A80]'
                  }`}
                />
              </div>

              {/* 4 Tabular Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <div className="text-[11px] font-medium text-slate-500">Encontrados (OPEN)</div>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                    {totals.openFound}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">
                    {dryRun ? 'Novos (Simulados)' : 'Novos Gravados'}
                  </div>
                  <div className="text-base font-bold font-mono tabular-nums text-[#16A34A] mt-0.5">
                    {dryRun ? totals.simulated : totals.added}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">
                    Ignorados (já no CRM)
                  </div>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-600 mt-0.5">
                    {totals.skippedExisting}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">Valor Novo (OPEN)</div>
                  <div className="text-base font-bold font-mono tabular-nums text-[#147A80] mt-0.5">
                    {formatBRL(totals.newValueTotal)}
                  </div>
                </div>
              </div>

              {/* Download CSV / JSON when records exist */}
              {hasFinished && (
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 tabular-nums">
                    {records.length} registro(s) prontos para conferência e backup
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadCSV}
                      className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#147A80]" />
                      <span>Baixar CSV (Excel)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadJSON}
                      className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <FileJson className="w-3.5 h-3.5 text-[#147A80]" />
                      <span>Baixar JSON</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <div className="text-[11px] font-semibold text-amber-700">
                    Avisos durante a consulta ({warnings.length})
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-slate-600 font-mono">
                    {warnings.map((w, idx) => (
                      <div key={idx} className="truncate">
                        · {w}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CLI Reference Tip */}
          <div className="text-[11px] text-slate-500 leading-relaxed">
            Para executar a mesma carga pelo terminal com geração automática em pasta local:{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
              npm run crm:backfill-estimates -- --days=365
            </code>{' '}
            (adicione <code className="px-1 py-0.5 rounded bg-slate-100 font-mono">--dry-run</code>{' '}
            para simular).
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            disabled={isRunning}
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-40"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                type="button"
                onClick={handleCancelRun}
                className="h-9 inline-flex items-center gap-1.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Cancelar após janela atual</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStart}
                className="h-9 inline-flex items-center gap-1.5 px-4 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {dryRun
                    ? 'Executar Simulação (OPEN)'
                    : hasFinished
                    ? 'Executar Nova Busca'
                    : 'Iniciar Carga Histórica'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
