import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Megaphone,
  Users,
  Send,
  Settings2,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Eye,
  Save,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Webhook,
  Database,
  Search,
  Tag,
  FileText,
  CalendarClock,
  QrCode,
  Link2,
} from 'lucide-react';
import { AppUserContext, Clinic } from '../../types/database';
import { buildOfficialUrl } from '../../config/siteUrls';
import type {
  SorrisoCampaignConfig,
  SorrisoCampaignStatusResponse,
  SorrisoCriterionCode,
  SorrisoDeliveryMode,
  SorrisoPreviewCandidate,
  SorrisoPreviewResponse,
} from '../../types/campaign';

interface CRMCampaignLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinics: Clinic[];
  userContext?: AppUserContext;
  defaultClinicId: number | 'all';
  activePipelineId?: string;
  onAfterSync?: (summaryMsg: string) => void;
}

const CRITERION_BADGE: Record<
  SorrisoCriterionCode,
  { label: string; className: string }
> = {
  TAG_LANCAMENTO_SORRISO: {
    label: 'Tag LANCAMENTO_SORRISO',
    className: 'bg-teal-50 text-[#0f5c61] border-teal-200',
  },
  ORCAMENTO_ABERTO_180D: {
    label: 'Orçamento ≤180d',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  INATIVO_90D: {
    label: 'Sem retorno >90d',
    className: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
};

const BLOCKED_LABELS: Record<string, string> = {
  SEM_TELEFONE: 'Sem celular válido',
  COOLDOWN_ATIVO: 'Cooldown ativo',
  JA_NA_FILA: 'Já está na fila',
  JA_AGENDADO_OU_CONVERTIDO: 'Já agendado / convertido',
};

export const CRMCampaignLaunchModal: React.FC<CRMCampaignLaunchModalProps> = ({
  isOpen,
  onClose,
  clinics,
  userContext,
  defaultClinicId,
  activePipelineId,
  onAfterSync,
}) => {
  const [activeTab, setActiveTab] = useState<'audience' | 'config' | 'queue'>('audience');
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusData, setStatusData] = useState<SorrisoCampaignStatusResponse | null>(null);
  const [config, setConfig] = useState<SorrisoCampaignConfig | null>(null);
  const [keywordsInput, setKeywordsInput] = useState('');

  // Audience preview state
  const [previewClinicScope, setPreviewClinicScope] = useState<number | 'all'>(defaultClinicId);
  const [includeLiveClinicorp, setIncludeLiveClinicorp] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<SorrisoPreviewResponse | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [showBlocked, setShowBlocked] = useState(false);

  // Actions state
  const [savingConfig, setSavingConfig] = useState(false);
  const [enqueuing, setEnqueuing] = useState(false);
  const [processingBatch, setProcessingBatch] = useState(false);
  const [ignoreBusinessHoursTest, setIgnoreBusinessHoursTest] = useState(false);
  const [controlling, setControlling] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const authHeaders = useMemo<Record<string, string>>(
    () => ({
      'Content-Type': 'application/json',
      'x-user-role': userContext?.role || 'admin_root',
      'x-user-email': userContext?.email || userContext?.userName || 'admin',
    }),
    [userContext]
  );

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/crm/campaigns/sorriso/config', {
        method: 'GET',
        headers: authHeaders,
      });
      const json: SorrisoCampaignStatusResponse & { error?: string } = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setStatusData(json);
      setConfig(json.config);
      setKeywordsInput((json.config.budgetKeywords || []).join(', '));
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Não foi possível carregar a configuração da campanha.',
      });
    } finally {
      setLoadingStatus(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    setPreviewClinicScope(defaultClinicId);
    fetchStatus();
  }, [isOpen, defaultClinicId, fetchStatus]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2200);
  };

  const handleRunPreview = async () => {
    setLoadingPreview(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/crm/campaigns/sorriso/preview', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          clinicScope: previewClinicScope,
          pipelineId: activePipelineId || config?.pipelineId,
          includeClinicorpLiveEstimates: includeLiveClinicorp,
        }),
      });
      const json: SorrisoPreviewResponse & { error?: string } = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setPreviewData(json);
      const nextSelected = new Set<string>(
        json.candidates.filter((c) => !c.blockedReason).map((c) => c.dedupeKey)
      );
      setSelectedKeys(nextSelected);
      setFeedback({
        type: 'info',
        text: `Simulação concluída: ${json.counts.eligible} elegível(is) e ${json.counts.blocked} bloqueado(s) pela higienização.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Falha ao simular audiência da campanha.',
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSavingConfig(true);
    setFeedback(null);
    try {
      const parsedKeywords = keywordsInput
        .split(/[,;\n]+/)
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch('/api/crm/campaigns/sorriso/config', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          ...config,
          pipelineId: activePipelineId || config.pipelineId,
          budgetKeywords: parsedKeywords,
          updatedBy: userContext?.email || userContext?.userName || 'Admin',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setConfig(json.config);
      setFeedback({ type: 'success', text: 'Regras, templates e cadência salvos com sucesso.' });
      await fetchStatus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Erro ao salvar configuração.',
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleEnqueueSelected = async () => {
    if (!previewData) return;
    const chosen = previewData.candidates.filter(
      (c) => !c.blockedReason && selectedKeys.has(c.dedupeKey)
    );
    if (chosen.length === 0) {
      setFeedback({ type: 'error', text: 'Selecione ao menos 1 lead elegível para enfileirar.' });
      return;
    }

    setEnqueuing(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/crm/campaigns/sorriso/enqueue', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          pipelineId: activePipelineId || config?.pipelineId,
          candidates: chosen,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      const importStageLabel =
        json.importStageTitle || statusData?.resolvedPipeline?.firstStageTitle || 'Lead Gerado';
      const sentStageLabel =
        json.sentStageTitle || statusData?.resolvedPipeline?.contactedStageTitle || 'Convite Enviado';
      setFeedback({
        type: 'success',
        text: `${json.enqueuedCount} lead(s) importado(s) na fase "${importStageLabel}" do funil "${json.pipelineName}" e prontos para envio via WhatsApp (WAHA / n8n → "${sentStageLabel}").`,
      });
      setActiveTab('queue');
      await fetchStatus();
      onAfterSync?.(
        `${json.enqueuedCount} lead(s) importado(s) em "${importStageLabel}" na Campanha Lançamento Sorriso.`
      );
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Erro ao enfileirar leads selecionados.',
      });
    } finally {
      setEnqueuing(false);
    }
  };

  const handleProcessBatch = async () => {
    setProcessingBatch(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/crm/campaigns/sorriso/process-batch', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ignoreBusinessHours: ignoreBusinessHoursTest,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      if (json.skipped) {
        setFeedback({ type: 'info', text: json.reason || 'Nenhum disparo executado neste lote.' });
      } else {
        const msg = `Lote concluído: ${json.sent} enviado(s), ${json.failed} falha(s). Cota restante hoje: ${json.dailyRemaining}.`;
        setFeedback({
          type: json.circuitBreakerTripped ? 'error' : 'success',
          text: json.circuitBreakerTripped
            ? `${msg} Fila pausada automaticamente (circuit-breaker).`
            : msg,
        });
        onAfterSync?.(msg);
      }
      await fetchStatus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Erro ao processar lote de WhatsApp.',
      });
    } finally {
      setProcessingBatch(false);
    }
  };

  const handleQueueControl = async (
    action: 'pause' | 'resume' | 'retry_failed' | 'cancel_pending'
  ) => {
    setControlling(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/crm/campaigns/sorriso/control', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      const actionLabels: Record<typeof action, string> = {
        pause: 'Fila pausada com segurança.',
        resume: 'Fila retomada.',
        retry_failed: `${json.affected || 0} item(ns) com falha recolocado(s) na fila.`,
        cancel_pending: `${json.affected || 0} envio(s) pendente(s) cancelado(s).`,
      };
      setFeedback({ type: 'success', text: actionLabels[action] });
      await fetchStatus();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Erro ao controlar fila.',
      });
    } finally {
      setControlling(false);
    }
  };

  const filteredCandidates = useMemo<SorrisoPreviewCandidate[]>(() => {
    if (!previewData) return [];
    const q = searchFilter.trim().toLowerCase();
    return previewData.candidates.filter((c) => {
      if (!showBlocked && c.blockedReason) return false;
      if (!q) return true;
      return (
        c.patientName.toLowerCase().includes(q) ||
        c.patientPhone.includes(q) ||
        (c.treatmentSummary || '').toLowerCase().includes(q)
      );
    });
  }, [previewData, searchFilter, showBlocked]);

  const eligibleVisibleCount = useMemo(
    () => filteredCandidates.filter((c) => !c.blockedReason).length,
    [filteredCandidates]
  );

  if (!isOpen) return null;

  const webhookFullUrl = buildOfficialUrl(
    statusData?.webhookPath || '/api/crm/campaigns/sorriso/process-batch'
  );

  const modalNode = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Campanha WhatsApp — Lançamento Sorriso Bertuol"
      onClick={() => {
        if (!processingBatch && !enqueuing) onClose();
      }}
      className="fixed inset-0 z-[125] bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-2xl border-0 sm:border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-[#147A80] flex items-center justify-center shrink-0">
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Campanha WhatsApp · {statusData?.resolvedPipeline?.name || 'Lançamento Sorriso Bertuol'}
              </h2>
              <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span>Tag LANCAMENTO_SORRISO · Orçamento ≤180d · Sem retorno &gt;90d</span>
                {statusData?.resolvedPipeline && (
                  <span className="font-semibold text-[#0f5c61]">
                    · Fluxo: {statusData.resolvedPipeline.firstStageTitle} → {statusData.resolvedPipeline.contactedStageTitle}
                  </span>
                )}
                {statusData && (
                  <span
                    className={`font-semibold ${
                      statusData.inBusinessHours ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    · {statusData.nowTimeBR} BRT ({statusData.inBusinessHours ? 'Horário comercial' : 'Fora da janela'})
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={processingBatch || enqueuing}
            aria-label="Fechar modal da campanha"
            className="min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-5 border-b border-slate-200 bg-slate-50/70 flex items-center gap-1 overflow-x-auto touch-pan-x shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('audience')}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'audience'
                ? 'border-[#147A80] text-[#147A80]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Audiência & Prévia</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'config'
                ? 'border-[#147A80] text-[#147A80]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>2. Regras, Textos & Anti-Ban</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'queue'
                ? 'border-[#147A80] text-[#147A80]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              3. Fila & Disparo{' '}
              {statusData ? `(${statusData.queueStats.pending} pend.)` : ''}
            </span>
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`px-4 sm:px-5 py-2.5 text-xs font-medium flex items-center justify-between gap-2 border-b shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : feedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-teal-50 text-[#0f5c61] border-teal-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {feedback.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="underline text-[11px] shrink-0 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loadingStatus && !statusData ? (
            <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#147A80]" />
              <span>Carregando motor da campanha...</span>
            </div>
          ) : null}

          {/* TAB 1: AUDIENCE & PREVIEW */}
          {activeTab === 'audience' && (
            <div className="space-y-4">
              {/* Filter & Preview Trigger Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={previewClinicScope}
                      onChange={(e) =>
                        setPreviewClinicScope(
                          e.target.value === 'all' ? 'all' : Number(e.target.value)
                        )
                      }
                      className="h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs font-semibold text-slate-800"
                    >
                      <option value="all">Todas as Unidades</option>
                      {clinics
                        .filter((c) => c.active)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.shortName}
                          </option>
                        ))}
                    </select>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeLiveClinicorp}
                        onChange={(e) => setIncludeLiveClinicorp(e.target.checked)}
                        className="rounded border-slate-300 text-[#147A80] focus:ring-[#147A80]"
                      />
                      <span>Consultar orçamentos ao vivo no Clinicorp (180d)</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunPreview}
                    disabled={loadingPreview}
                    className="h-9 px-3.5 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {loadingPreview ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>{loadingPreview ? 'Calculando audiência...' : 'Calcular Prévia (Dry-Run)'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#147A80]" />
                    Tag <strong>{config?.tagName || 'LANCAMENTO_SORRISO'}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3 h-3 text-amber-600" />
                    Orçamento Pending ≤ <strong>{config?.budgetWindowDays || 180}d</strong>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="w-3 h-3 text-indigo-600" />
                    Sem retorno &gt; <strong>{config?.inactiveMinDays || 90}d</strong> (sem consulta futura)
                  </span>
                </div>
              </div>

              {/* Preview Counts */}
              {previewData && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-white border border-slate-200 rounded-xl p-3">
                      <span className="text-[11px] text-slate-500 block">Elegíveis (Deduplicados)</span>
                      <span className="text-lg font-bold text-[#147A80] tabular-nums">
                        {previewData.counts.eligible}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {previewData.counts.multiCriteria} em 2+ critérios
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3">
                      <span className="text-[11px] text-slate-500 block">Por Tag</span>
                      <span className="text-lg font-bold text-slate-900 tabular-nums">
                        {previewData.counts.byTag}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3">
                      <span className="text-[11px] text-slate-500 block">Orçamento ≤180d</span>
                      <span className="text-lg font-bold text-amber-700 tabular-nums">
                        {previewData.counts.byBudget180d}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3">
                      <span className="text-[11px] text-slate-500 block">Sem retorno &gt;90d</span>
                      <span className="text-lg font-bold text-indigo-700 tabular-nums">
                        {previewData.counts.byInactive90d}
                      </span>
                    </div>
                  </div>

                  {/* Selection toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filtrar nome, fone ou procedimento..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 text-xs text-slate-800"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showBlocked}
                          onChange={(e) => setShowBlocked(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        <span>Mostrar bloqueados ({previewData.counts.blocked})</span>
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedKeys(
                            new Set(
                              filteredCandidates
                                .filter((c) => !c.blockedReason)
                                .map((c) => c.dedupeKey)
                            )
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 cursor-pointer"
                      >
                        Selecionar ({eligibleVisibleCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedKeys(new Set())}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-600 cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  {/* Candidates list */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
                    {filteredCandidates.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        Nenhum lead encontrado com os filtros atuais.
                      </div>
                    ) : (
                      filteredCandidates.map((cand) => {
                        const isBlocked = Boolean(cand.blockedReason);
                        const isChecked = !isBlocked && selectedKeys.has(cand.dedupeKey);
                        return (
                          <div
                            key={cand.dedupeKey}
                            className={`p-3 flex items-start gap-3 text-xs ${
                              isBlocked ? 'bg-slate-50/70 opacity-70' : 'bg-white hover:bg-slate-50/60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={isBlocked}
                              checked={isChecked}
                              onChange={() => {
                                setSelectedKeys((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(cand.dedupeKey)) next.delete(cand.dedupeKey);
                                  else next.add(cand.dedupeKey);
                                  return next;
                                });
                              }}
                              className="mt-0.5 rounded border-slate-300 text-[#147A80] focus:ring-[#147A80]"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-slate-900">{cand.patientName}</span>
                                <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                                  {cand.patientPhone || 'Sem fone'}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                  {cand.clinicName}
                                </span>
                                {cand.priorityScore >= 2 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                                    Prioridade {cand.priorityScore}x
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {cand.matchedCriteria.map((cr) => {
                                  const meta = CRITERION_BADGE[cr];
                                  return (
                                    <span
                                      key={cr}
                                      className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${meta.className}`}
                                    >
                                      {meta.label}
                                    </span>
                                  );
                                })}
                                {cand.daysSinceLastVisit ? (
                                  <span className="text-[11px] text-slate-500">
                                    · {cand.daysSinceLastVisit}d sem vir
                                  </span>
                                ) : null}
                                {cand.estimatedValue ? (
                                  <span className="text-[11px] font-mono text-slate-600">
                                    · R$ {cand.estimatedValue.toLocaleString('pt-BR')}
                                  </span>
                                ) : null}
                                {cand.blockedReason && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                                    Bloqueado: {BLOCKED_LABELS[cand.blockedReason] || cand.blockedReason}
                                  </span>
                                )}
                              </div>

                              {cand.patientAppUrl && (
                                <div className="flex items-center gap-1.5 text-[10px] text-[#0f5c61] font-mono truncate">
                                  {config?.deliveryMode !== 'text_with_link' ? (
                                    <QrCode className="w-3 h-3 shrink-0" />
                                  ) : (
                                    <Link2 className="w-3 h-3 shrink-0" />
                                  )}
                                  <span className="truncate">{cand.patientAppUrl}</span>
                                </div>
                              )}

                              <p className="text-[11px] text-slate-500 whitespace-pre-line line-clamp-3">
                                {cand.renderedPreview}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Enqueue Footer Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <span className="text-xs text-slate-600">
                      <strong>{selectedKeys.size}</strong> lead(s) selecionado(s) serão importados na fase{' '}
                      <strong className="text-[#0f5c61]">
                        {previewData.resolvedPipeline?.firstStageTitle ||
                          statusData?.resolvedPipeline?.firstStageTitle ||
                          'Lead Gerado'}
                      </strong>{' '}
                      e enfileirados para envio via WhatsApp/WAHA/n8n (sem disparar agora).
                    </span>
                    <button
                      type="button"
                      onClick={handleEnqueueSelected}
                      disabled={enqueuing || selectedKeys.size === 0}
                      className="h-10 px-4 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {enqueuing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>
                        {enqueuing
                          ? 'Importando lote...'
                          : `Aprovar Lote → Importar ${selectedKeys.size} em "${
                              previewData.resolvedPipeline?.firstStageTitle ||
                              statusData?.resolvedPipeline?.firstStageTitle ||
                              'Lead Gerado'
                            }"`}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: RULES, TEMPLATES & ANTI-BAN */}
          {activeTab === 'config' && config && (
            <div className="space-y-4">
              {/* Stage mapping for Lead Gerado -> Convite Enviado */}
              {statusData?.resolvedPipeline?.stages && statusData.resolvedPipeline.stages.length > 0 && (
                <div className="bg-teal-50/50 border border-teal-200/80 rounded-xl p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      Fases do Funil ({statusData.resolvedPipeline.name})
                    </h3>
                    <span className="text-[11px] font-semibold text-[#0f5c61]">
                      Detecção automática de &ldquo;Lead Gerado&rdquo; ativa
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        1. Ao aprovar o lote (Importar Leads em):
                      </label>
                      <select
                        value={config.importStageId || ''}
                        onChange={(e) => setConfig({ ...config, importStageId: e.target.value })}
                        className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-800"
                      >
                        <option value="">
                          Automático ({statusData.resolvedPipeline.firstStageTitle})
                        </option>
                        {statusData.resolvedPipeline.stages.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        2. Após envio do convite WAHA / n8n (Mover para):
                      </label>
                      <select
                        value={config.sentStageId || ''}
                        onChange={(e) => setConfig({ ...config, sentStageId: e.target.value })}
                        className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-800"
                      >
                        <option value="">
                          Automático ({statusData.resolvedPipeline.contactedStageTitle})
                        </option>
                        {statusData.resolvedPipeline.stages.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Criteria toggles */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-900">
                  Critérios de Inclusão (Regra OU — pelo menos um)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.includeTagCriterion}
                        onChange={(e) =>
                          setConfig({ ...config, includeTagCriterion: e.target.checked })
                        }
                        className="rounded border-slate-300 text-[#147A80]"
                      />
                      <span className="text-xs font-bold text-slate-800">A. Tag de Lançamento</span>
                    </div>
                    <input
                      type="text"
                      value={config.tagName}
                      onChange={(e) => setConfig({ ...config, tagName: e.target.value })}
                      className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs font-mono"
                    />
                  </label>

                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.includeOpenBudgetsCriterion}
                        onChange={(e) =>
                          setConfig({ ...config, includeOpenBudgetsCriterion: e.target.checked })
                        }
                        className="rounded border-slate-300 text-[#147A80]"
                      />
                      <span className="text-xs font-bold text-slate-800">B. Orçamento Pending</span>
                    </label>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span>Últimos</span>
                      <input
                        type="number"
                        min={7}
                        max={365}
                        value={config.budgetWindowDays}
                        onChange={(e) =>
                          setConfig({ ...config, budgetWindowDays: Number(e.target.value) || 180 })
                        }
                        className="w-20 h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 font-mono text-xs"
                      />
                      <span>dias</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.includeInactiveCriterion}
                        onChange={(e) =>
                          setConfig({ ...config, includeInactiveCriterion: e.target.checked })
                        }
                        className="rounded border-slate-300 text-[#147A80]"
                      />
                      <span className="text-xs font-bold text-slate-800">C. Sem retorno</span>
                    </label>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span>&gt;</span>
                      <input
                        type="number"
                        min={30}
                        max={730}
                        value={config.inactiveMinDays}
                        onChange={(e) =>
                          setConfig({ ...config, inactiveMinDays: Number(e.target.value) || 90 })
                        }
                        className="w-16 h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 font-mono text-xs"
                      />
                      <span>d (teto:</span>
                      <input
                        type="number"
                        min={0}
                        max={3650}
                        value={config.inactiveMaxDays}
                        onChange={(e) =>
                          setConfig({ ...config, inactiveMaxDays: Number(e.target.value) || 0 })
                        }
                        title="0 = sem limite máximo"
                        className="w-16 h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 font-mono text-xs"
                      />
                      <span>)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Palavras-chave clínicas/reabilitação para Orçamentos (separadas por vírgula — deixe vazio para aceitar todos os orçamentos pendentes)
                  </label>
                  <input
                    type="text"
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    placeholder="implante, protese, protocolo, coroa, reabilitacao, ortodontia..."
                    className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Anti-ban cadence */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-900">
                  Cadência Anti-Ban & Proteção WhatsApp
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Lote / ciclo</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={config.batchSize}
                      onChange={(e) =>
                        setConfig({ ...config, batchSize: Number(e.target.value) || 10 })
                      }
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Teto diário</label>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={config.dailyLimit}
                      onChange={(e) =>
                        setConfig({ ...config, dailyLimit: Number(e.target.value) || 60 })
                      }
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Jitter mín (s)</label>
                    <input
                      type="number"
                      min={5}
                      max={90}
                      value={config.minDelaySec}
                      onChange={(e) =>
                        setConfig({ ...config, minDelaySec: Number(e.target.value) || 15 })
                      }
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Jitter máx (s)</label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={config.maxDelaySec}
                      onChange={(e) =>
                        setConfig({ ...config, maxDelaySec: Number(e.target.value) || 35 })
                      }
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Cooldown (dias)</label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={config.cooldownDays}
                      onChange={(e) =>
                        setConfig({ ...config, cooldownDays: Number(e.target.value) || 30 })
                      }
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2.5 font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.businessHoursOnly}
                      onChange={(e) =>
                        setConfig({ ...config, businessHoursOnly: e.target.checked })
                      }
                      className="rounded border-slate-300 text-[#147A80]"
                    />
                    <span>Restringir ao horário comercial (Seg–Sex 08h–19h, Sáb 08h–12h BRT)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                      className="rounded border-slate-300 text-[#147A80]"
                    />
                    <span>Worker interno automático ativo (a cada 5 min)</span>
                  </label>
                </div>
              </div>

              {/* WAHA Link Preview & QR Code Delivery */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-[#147A80]" />
                    <span>Link do App, Preview WAHA &amp; QR Code</span>
                  </h3>
                  <span className="text-[11px] text-[#0f5c61] font-semibold">
                    WAHA `/api/sendText` + `/api/sendImage`
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(
                    [
                      {
                        value: 'qrcode_with_caption',
                        title: 'QR Code + Legenda com Link',
                        desc: 'Envia 1 imagem nítida do QR Code via WAHA /api/sendImage com o texto e link na legenda (fallback automático para texto).',
                      },
                      {
                        value: 'text_with_link',
                        title: 'Texto + Link Preview WAHA',
                        desc: 'Envia somente texto via WAHA /api/sendText com linkPreview ativo gerando card oficial do portal.',
                      },
                      {
                        value: 'text_and_qrcode',
                        title: 'Texto com Link + QR Code',
                        desc: 'Envia texto com Link Preview e, 2 segundos depois, envia a imagem do QR Code do paciente.',
                      },
                    ] as Array<{ value: SorrisoDeliveryMode; title: string; desc: string }>
                  ).map((opt) => {
                    const active = (config.deliveryMode || 'qrcode_with_caption') === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setConfig({ ...config, deliveryMode: opt.value })}
                        className={`text-left rounded-xl border p-3 transition-colors cursor-pointer ${
                          active
                            ? 'bg-teal-50/70 border-[#147A80] ring-1 ring-[#147A80]/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              active ? 'border-[#147A80]' : 'border-slate-300'
                            }`}
                          >
                            {active && <span className="w-2 h-2 rounded-full bg-[#147A80]" />}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{opt.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      URL oficial do App do Paciente ({'{link_app}'})
                    </label>
                    <input
                      type="url"
                      value={config.appLinkUrl || 'https://bertuolflow.app-bertuol.tech/paciente'}
                      onChange={(e) => setConfig({ ...config, appLinkUrl: e.target.value })}
                      placeholder="https://bertuolflow.app-bertuol.tech/paciente"
                      className="w-full h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-2 text-xs text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.personalizeAppLink ?? true}
                        onChange={(e) =>
                          setConfig({ ...config, personalizeAppLink: e.target.checked })
                        }
                        className="rounded border-slate-300 text-[#147A80]"
                      />
                      <span>Personalizar link/QR com telefone e nome do paciente</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableLinkPreview ?? true}
                        onChange={(e) =>
                          setConfig({ ...config, enableLinkPreview: e.target.checked })
                        }
                        className="rounded border-slate-300 text-[#147A80]"
                      />
                      <span>Ativar Link Preview no WAHA (`linkPreview: true`)</span>
                    </label>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-900 leading-relaxed">
                  <strong>Importante no WhatsApp:</strong> quando o paciente ainda não salvou o número da clínica nem respondeu antes, o próprio WhatsApp desativa o clique no link na 1ª mensagem. Enviar com <strong>QR Code + instrução para responder "SIM"</strong> resolve isso: assim que o paciente responde, o link fica azul e clicável na hora.
                </div>
              </div>

              {/* Segmented templates */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-900">
                    Templates Segmentados por Critério
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {'{nome}'} · {'{clinica}'} · {'{procedimento}'} · {'{dias}'} ·{' '}
                      <strong className="text-[#0f5c61]">{'{link_app}'}</strong>
                    </span>
                    {(!config.templates.tag.includes('{link_app}') ||
                      !config.templates.budget_180d.includes('{link_app}') ||
                      !config.templates.inactive_90d.includes('{link_app}')) && (
                      <button
                        type="button"
                        onClick={() => {
                          const appendBlock =
                            '\n\n📲 Acesse o App Clube Sorriso Bertuol:\n{link_app}\n\n_(Se o link não ficar clicável direto, responda *SIM* aqui ou aponte a câmera para o QR Code!)_';
                          setConfig({
                            ...config,
                            templates: {
                              tag: config.templates.tag.includes('{link_app}')
                                ? config.templates.tag
                                : `${config.templates.tag.trim()}${appendBlock}`,
                              budget_180d: config.templates.budget_180d.includes('{link_app}')
                                ? config.templates.budget_180d
                                : `${config.templates.budget_180d.trim()}${appendBlock}`,
                              inactive_90d: config.templates.inactive_90d.includes('{link_app}')
                                ? config.templates.inactive_90d
                                : `${config.templates.inactive_90d.trim()}${appendBlock}`,
                            },
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#0f5c61] border border-teal-200 text-[11px] font-bold cursor-pointer"
                      >
                        + Inserir {'{link_app}'} nos textos
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0f5c61] mb-1">
                      Template 1 — Tag LANCAMENTO_SORRISO
                    </label>
                    <textarea
                      rows={3}
                      value={config.templates.tag}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          templates: { ...config.templates, tag: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                      Template 2 — Orçamento em Aberto (≤ 180 dias)
                    </label>
                    <textarea
                      rows={3}
                      value={config.templates.budget_180d}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          templates: { ...config.templates, budget_180d: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-800 mb-1">
                      Template 3 — Sem retorno (&gt; 90 dias)
                    </label>
                    <textarea
                      rows={3}
                      value={config.templates.inactive_90d}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          templates: { ...config.templates, inactive_90d: e.target.value },
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="h-10 px-4 rounded-xl bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingConfig ? 'Salvando...' : 'Salvar Regras e Templates'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: QUEUE, EXECUTION & N8N */}
          {activeTab === 'queue' && statusData && (
            <div className="space-y-4">
              {/* Queue metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <span className="text-[11px] text-slate-500 block">Pendentes na Fila</span>
                  <span className="text-lg font-bold text-[#147A80] tabular-nums">
                    {statusData.queueStats.pending}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <span className="text-[11px] text-slate-500 block">Enviados Hoje</span>
                  <span className="text-lg font-bold text-emerald-700 tabular-nums">
                    {statusData.queueStats.sentToday}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Restam {statusData.queueStats.dailyRemaining} hoje
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <span className="text-[11px] text-slate-500 block">Total Entregues</span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">
                    {statusData.queueStats.sent}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <span className="text-[11px] text-slate-500 block">Falhas</span>
                  <span className="text-lg font-bold text-rose-700 tabular-nums">
                    {statusData.queueStats.failed}
                  </span>
                </div>
              </div>

              {/* Execution controls */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleProcessBatch}
                    disabled={processingBatch || statusData.queueStats.pending === 0}
                    className="h-9 px-3.5 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {processingBatch ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {processingBatch
                        ? 'Disparando lote...'
                        : `Disparar Próximo Lote (${statusData.config.batchSize})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQueueControl(statusData.config.paused ? 'resume' : 'pause')
                    }
                    disabled={controlling}
                    className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    {statusData.config.paused ? (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Retomar Fila</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pausar Fila</span>
                      </>
                    )}
                  </button>

                  {statusData.queueStats.failed > 0 && (
                    <button
                      type="button"
                      onClick={() => handleQueueControl('retry_failed')}
                      disabled={controlling}
                      className="h-9 px-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reenfileirar Falhas ({statusData.queueStats.failed})</span>
                    </button>
                  )}

                  {statusData.queueStats.pending > 0 && (
                    <button
                      type="button"
                      onClick={() => handleQueueControl('cancel_pending')}
                      disabled={controlling}
                      className="h-9 px-3 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-xs font-semibold text-rose-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancelar Pendentes</span>
                    </button>
                  )}
                </div>

                {!statusData.inBusinessHours && (
                  <label className="flex items-center gap-2 text-[11px] text-amber-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ignoreBusinessHoursTest}
                      onChange={(e) => setIgnoreBusinessHoursTest(e.target.checked)}
                      className="rounded border-amber-300"
                    />
                    <span>Ignorar restrição de horário comercial neste disparo manual de teste</span>
                  </label>
                )}
              </div>

              {/* Queue preview list */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[240px] overflow-y-auto">
                {statusData.queuePreview.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    A fila está vazia. Use a aba <strong>1. Audiência & Prévia</strong> para calcular e enfileirar leads.
                  </div>
                ) : (
                  statusData.queuePreview.map((item) => (
                    <div
                      key={item.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs bg-white"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 truncate">
                            {item.patientName}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                            {item.mobilePhone}
                          </span>
                        </div>
                        {item.lastError && (
                          <p className="text-[11px] text-rose-600 truncate">{item.lastError}</p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          item.status === 'sent'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status === 'failed'
                            ? 'bg-rose-50 text-rose-700'
                            : item.status === 'pending'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* n8n Webhook + SQL Migration Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Webhook className="w-3.5 h-3.5 text-[#147A80]" />
                      Webhook n8n (Lotes a cada 15 min)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(webhookFullUrl, 'webhook')}
                      className="text-[11px] font-semibold text-[#147A80] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'webhook' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'webhook' ? 'Copiado' : 'Copiar URL'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 break-all text-slate-700">
                    POST {webhookFullUrl}
                  </p>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Dispara o próximo microlote via WAHA (QR Code + Link) e move o card automaticamente de{' '}
                    <strong>{statusData.resolvedPipeline.firstStageTitle}</strong> →{' '}
                    <strong>{statusData.resolvedPipeline.contactedStageTitle}</strong>.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Header: <code className="font-mono">Authorization: Bearer &lt;CAMPAIGN_CRON_SECRET&gt;</code>
                    <br />
                    Consulta fila n8n: <code className="font-mono">GET /api/crm/campaigns/sorriso/queue?status=pending</code>
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-[#147A80]" />
                      Persistência ({statusData.storageMode === 'supabase' ? 'Supabase Ativo' : 'Fallback Local'})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(statusData.sqlMigration, 'sql')}
                      className="text-[11px] font-semibold text-[#147A80] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'sql' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'sql' ? 'SQL Copiado' : 'Copiar SQL'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {statusData.storageMode === 'supabase'
                      ? 'Tabela public.crm_campaign_queue conectada no Supabase com idempotência por telefone.'
                      : 'Rode o SQL copiado no Supabase SQL Editor para migrar a fila local para public.crm_campaign_queue.'}
                  </p>
                </div>
              </div>

              {/* Recent Batch History */}
              {statusData.history.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Últimos Lotes Executados
                  </h4>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-[11px]">
                    {statusData.history.slice(0, 6).map((h) => (
                      <div key={h.id} className="px-3 py-2 flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-500">
                          {new Date(h.runAt).toLocaleString('pt-BR')} · {h.trigger}
                        </span>
                        <span className="font-semibold text-slate-800 tabular-nums">
                          {h.sent} enviado(s) · {h.failed} falha(s)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
