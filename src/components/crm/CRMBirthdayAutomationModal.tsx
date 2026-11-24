import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Cake,
  Play,
  Eye,
  Save,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Webhook,
  ListChecks,
} from 'lucide-react';
import { AppUserContext, Clinic } from '../../types/database';
import {
  BirthdayAutomationConfig,
  BirthdayConfigResponse,
  BirthdayDispatchRecord,
  BirthdayRunLogEntry,
  BirthdayRunResponse,
  DEFAULT_BIRTHDAY_MESSAGE_TEMPLATE,
  formatBirthdayYMDToBR,
  renderBirthdayMessagePreview,
} from '../../utils/crmBirthdayVoucher';

interface CRMBirthdayAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinics: Clinic[];
  userContext: AppUserContext;
  defaultClinicId: number | 'all';
  onAfterRun: (summaryMessage: string) => void;
}

type ModalTab = 'config' | 'history' | 'n8n';

const STATUS_META: Record<
  BirthdayDispatchRecord['status'],
  { label: string; toneClass: string }
> = {
  ENVIADO_WHATSAPP: { label: 'WhatsApp enviado + card', toneClass: 'text-[#16A34A]' },
  CARD_SEM_TELEFONE: { label: 'Card criado (sem telefone)', toneClass: 'text-[#D97706]' },
  ERRO_WHATSAPP_CARD_CRIADO: { label: 'Card criado (falha WhatsApp)', toneClass: 'text-[#DC2626]' },
  JA_ENVIADO_ANO: { label: 'Já enviado neste ano', toneClass: 'text-slate-500' },
  SIMULADO_NOVO: { label: 'Pronto para envio', toneClass: 'text-[#147A80]' },
  SIMULADO_SEM_TELEFONE: { label: 'Sem telefone válido', toneClass: 'text-[#D97706]' },
};

const TRIGGER_LABEL: Record<BirthdayRunLogEntry['trigger'], string> = {
  scheduler: 'Agendador Interno',
  n8n: 'Webhook n8n',
  manual: 'Manual (CRM)',
};

export const CRMBirthdayAutomationModal: React.FC<CRMBirthdayAutomationModalProps> = ({
  isOpen,
  onClose,
  clinics,
  userContext,
  defaultClinicId,
  onAfterRun,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('config');
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [runningMode, setRunningMode] = useState<'none' | 'dry' | 'live'>('none');

  const [config, setConfig] = useState<BirthdayAutomationConfig>({
    enabled: true,
    scheduledTime: '08:30',
    clinicScope: defaultClinicId,
    validityDays: 7,
    benefitTitle: 'Cortesia de Aniversário: Profilaxia + Diagnóstico Sky Câmera',
    messageTemplate: DEFAULT_BIRTHDAY_MESSAGE_TEMPLATE,
    sendWhatsApp: true,
    sendAppNotification: true,
    updatedAt: '',
  });

  const [meta, setMeta] = useState<{
    lastScheduledRunDate: string | null;
    schedulerRunning: boolean;
    cronSecretConfigured: boolean;
    webhookPath: string;
    todayBR: string;
    nowTimeBR: string;
  }>({
    lastScheduledRunDate: null,
    schedulerRunning: false,
    cronSecretConfigured: false,
    webhookPath: '/api/crm/birthdays/run-daily',
    todayBR: '',
    nowTimeBR: '',
  });

  const [history, setHistory] = useState<BirthdayRunLogEntry[]>([]);
  const [runResult, setRunResult] = useState<BirthdayRunResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      'x-user-role': userContext?.role || '',
      ...(userContext?.email ? { 'x-user-email': userContext.email } : {}),
    }),
    [userContext?.role, userContext?.email]
  );

  const fetchConfig = useCallback(async () => {
    setLoadingConfig(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/crm/birthdays/config', {
        method: 'GET',
        headers: authHeaders,
      });
      const json: BirthdayConfigResponse | null = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErrorMessage(json?.error || `Falha ao carregar configuração (HTTP ${res.status}).`);
        return;
      }
      setConfig(json.config);
      setHistory(Array.isArray(json.history) ? json.history : []);
      setMeta({
        lastScheduledRunDate: json.lastScheduledRunDate,
        schedulerRunning: Boolean(json.schedulerRunning),
        cronSecretConfigured: Boolean(json.cronSecretConfigured),
        webhookPath: json.webhookPath || '/api/crm/birthdays/run-daily',
        todayBR: json.todayBR || '',
        nowTimeBR: json.nowTimeBR || '',
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro de conexão ao buscar automação de aniversariantes.');
    } finally {
      setLoadingConfig(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setRunResult(null);
    fetchConfig();
  }, [isOpen, fetchConfig]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && runningMode === 'none') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, runningMode, onClose]);

  if (!isOpen) return null;

  const activeClinics = (clinics || []).filter((c) => c.active);
  const isBusy = runningMode !== 'none' || savingConfig;

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/crm/birthdays/config', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(config),
      });
      const json: BirthdayConfigResponse | null = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErrorMessage(json?.error || `Erro ao salvar (HTTP ${res.status}).`);
        return;
      }
      setConfig(json.config);
      setHistory(Array.isArray(json.history) ? json.history : []);
      setMeta({
        lastScheduledRunDate: json.lastScheduledRunDate,
        schedulerRunning: Boolean(json.schedulerRunning),
        cronSecretConfigured: Boolean(json.cronSecretConfigured),
        webhookPath: json.webhookPath || '/api/crm/birthdays/run-daily',
        todayBR: json.todayBR || '',
        nowTimeBR: json.nowTimeBR || '',
      });
      setSuccessMessage(
        `Configuração salva. Agendador interno ${json.config.enabled ? `ativo às ${json.config.scheduledTime} (BRT)` : 'pausado'}.`
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha de rede ao salvar configuração.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRunDaily = async (dryRun: boolean) => {
    setRunningMode(dryRun ? 'dry' : 'live');
    setErrorMessage(null);
    setSuccessMessage(null);
    setRunResult(null);

    try {
      const res = await fetch('/api/crm/birthdays/run-daily', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          dryRun,
          clinicScope: config.clinicScope,
        }),
      });
      const json: BirthdayRunResponse | null = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setErrorMessage(json?.error || `Erro ao executar rotina (HTTP ${res.status}).`);
        return;
      }
      setRunResult(json);
      await fetchConfig();

      if (!dryRun) {
        const msg = `Aniversariantes (${formatBirthdayYMDToBR(json.dateBR) || json.dateBR}): ${json.counts.whatsappSent} WhatsApp enviado(s), ${json.counts.cardsCreated} card(s) criado(s) no CRM.`;
        setSuccessMessage(msg);
        onAfterRun(msg);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha de rede ao executar rotina de aniversariantes.');
    } finally {
      setRunningMode('none');
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

  const previewClinicName =
    config.clinicScope === 'all'
      ? activeClinics[0]?.shortName || 'Palmas (Matriz)'
      : activeClinics.find((c) => c.id === config.clinicScope)?.shortName || 'Bertuol Odontologia';

  const previewExpiryDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (Number(config.validityDays) || 7));
    return d.toLocaleDateString('pt-BR');
  })();

  const liveMessagePreview = renderBirthdayMessagePreview(config.messageTemplate, {
    nome: 'Maria',
    clinica: `Clínica Bertuol (${previewClinicName})`,
    voucher: 'BRT-ANIV-7K4M',
    validade: previewExpiryDate,
  });

  const webhookFullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${meta.webhookPath}`
      : `https://bertuolflow.app-bertuol.tech${meta.webhookPath}`;

  const n8nPayloadExample = JSON.stringify(
    {
      dryRun: false,
      clinicScope: config.clinicScope,
    },
    null,
    2
  );

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Automação Diária de Aniversariantes"
      onClick={() => {
        if (runningMode === 'none') onClose();
      }}
      className="fixed inset-0 z-[120] bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 text-[#147A80] flex items-center justify-center shrink-0">
              <Cake className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Automação Diária de Aniversariantes (Voucher BRT-ANIV)
              </h3>
              <p className="text-xs text-slate-500 truncate tabular-nums">
                Entrada no dia exato · Validade de {config.validityDays} dias · Disparo WhatsApp + Card no CRM
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={runningMode !== 'none'}
            onClick={onClose}
            aria-label="Fechar automação de aniversariantes"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Summary Strip + Tabs */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'config'
                  ? 'bg-[#147A80] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Configuração e Disparo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-[#147A80] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Execuções ({history.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('n8n')}
              className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'n8n'
                  ? 'bg-[#147A80] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Webhook className="w-3.5 h-3.5" />
              <span>Webhook n8n</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-600 tabular-nums">
            <span className={config.enabled ? 'font-semibold text-[#16A34A]' : 'font-semibold text-slate-500'}>
              {config.enabled ? `Agendador ativo · ${config.scheduledTime} BRT` : 'Agendador pausado'}
            </span>
            {meta.lastScheduledRunDate && (
              <span> · Último diário: {formatBirthdayYMDToBR(meta.lastScheduledRunDate)}</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-slate-50/50">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {loadingConfig && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#147A80]" />
              <span>Carregando configuração da automação diária...</span>
            </div>
          )}

          {/* TAB 1: CONFIG & MANUAL RUN */}
          {!loadingConfig && activeTab === 'config' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Agendador Diário Interno</div>
                    <p className="text-[11px] text-slate-500">
                      Verifica automaticamente todos os dias no horário de Brasília ({meta.nowTimeBR || '--:--'} agora)
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      disabled={isBusy}
                      onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                      className="rounded border-slate-300 text-[#147A80] focus:ring-[#147A80]"
                    />
                    <span>{config.enabled ? 'Ativado' : 'Desativado'}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Horário diário (BRT)
                    </label>
                    <input
                      type="time"
                      disabled={isBusy}
                      value={config.scheduledTime}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, scheduledTime: e.target.value }))
                      }
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Unidade atendida
                    </label>
                    <select
                      disabled={isBusy}
                      value={config.clinicScope}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          clinicScope: e.target.value === 'all' ? 'all' : Number(e.target.value),
                        }))
                      }
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#147A80] cursor-pointer"
                    >
                      <option value="all">Todas as Unidades</option>
                      {activeClinics.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.shortName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Validade do voucher (dias)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      disabled={isBusy}
                      value={config.validityDays}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          validityDays: Math.max(1, Math.min(30, Number(e.target.value) || 7)),
                        }))
                      }
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Descrição da cortesia (exibida na baixa de vouchers)
                  </label>
                  <input
                    type="text"
                    disabled={isBusy}
                    value={config.benefitTitle}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, benefitTitle: e.target.value }))
                    }
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-500">
                      Mensagem automática do WhatsApp
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {'{nome} · {clinica} · {voucher} · {validade}'}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    disabled={isBusy}
                    value={config.messageTemplate}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, messageTemplate: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#147A80]"
                  />
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      Prévia da mensagem (exemplo com BRT-ANIV-7K4M):
                    </span>
                    {liveMessagePreview}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={config.sendWhatsApp}
                        disabled={isBusy}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, sendWhatsApp: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-[#147A80] focus:ring-[#147A80]"
                      />
                      <span>Disparar WhatsApp (WAHA / Evolution)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={config.sendAppNotification}
                        disabled={isBusy}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, sendAppNotification: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-[#147A80] focus:ring-[#147A80]"
                      />
                      <span>Notificar também no App do Paciente</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleSaveConfig}
                    className="h-8 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingConfig ? 'Salvando...' : 'Salvar Configuração'}</span>
                  </button>
                </div>
              </div>

              {/* Execution Result / Dry-Run Preview Table */}
              {runResult && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold text-slate-900">
                      {runResult.dryRun
                        ? `Simulação de Hoje (${formatBirthdayYMDToBR(runResult.dateBR)})`
                        : `Resultado do Disparo (${formatBirthdayYMDToBR(runResult.dateBR)})`}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-600">
                      <span>Encontrados: <strong className="text-slate-900">{runResult.counts.totalFound}</strong></span>
                      <span>·</span>
                      <span>WhatsApp: <strong className="text-[#16A34A]">{runResult.counts.whatsappSent}</strong></span>
                      <span>·</span>
                      <span>Cards: <strong className="text-[#147A80]">{runResult.counts.cardsCreated}</strong></span>
                      <span>·</span>
                      <span>Já enviados: <strong>{runResult.counts.skippedAlreadySent}</strong></span>
                    </div>
                  </div>

                  {runResult.records.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">
                      Nenhum paciente aniversariante encontrado para a data de hoje ({formatBirthdayYMDToBR(runResult.dateBR)}).
                    </p>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500">
                            <th className="py-2 px-3 font-semibold">Paciente</th>
                            <th className="py-2 px-3 font-semibold">Unidade</th>
                            <th className="py-2 px-3 font-semibold">WhatsApp</th>
                            <th className="py-2 px-3 font-semibold">Voucher</th>
                            <th className="py-2 px-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {runResult.records.map((rec, i) => {
                            const st = STATUS_META[rec.status] || {
                              label: rec.status,
                              toneClass: 'text-slate-600',
                            };
                            return (
                              <tr key={`${rec.patientId}-${i}`} className="hover:bg-slate-50/70">
                                <td className="py-2 px-3 font-medium text-slate-900">
                                  {rec.patientName}
                                </td>
                                <td className="py-2 px-3 text-slate-600">{rec.clinicName}</td>
                                <td className="py-2 px-3 font-mono tabular-nums text-slate-600">
                                  {rec.patientPhone || '—'}
                                </td>
                                <td className="py-2 px-3 font-mono tabular-nums font-semibold text-[#147A80]">
                                  {rec.voucherCode}
                                </td>
                                <td className={`py-2 px-3 font-semibold ${st.toneClass}`}>
                                  {st.label}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {runResult.warnings && runResult.warnings.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-amber-800">
                      <div className="font-semibold">Avisos ({runResult.warnings.length}):</div>
                      {runResult.warnings.map((w, idx) => (
                        <div key={idx} className="font-mono text-slate-600">
                          · {w}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTORY */}
          {!loadingConfig && activeTab === 'history' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {history.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs font-semibold text-slate-700">
                    Nenhuma execução registrada ainda
                  </p>
                  <p className="text-xs text-slate-500">
                    Use Simular Hoje ou Executar Disparo de Hoje para testar agora, ou aguarde o disparo automático diário às {config.scheduledTime}.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500">
                        <th className="py-2.5 px-3 font-semibold">Data / Hora</th>
                        <th className="py-2.5 px-3 font-semibold">Origem</th>
                        <th className="py-2.5 px-3 font-semibold">Modo</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Encontrados</th>
                        <th className="py-2.5 px-3 font-semibold text-right">WhatsApp</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Cards</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Ignorados</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Falhas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 tabular-nums">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                            {new Date(item.runAt).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {TRIGGER_LABEL[item.trigger] || item.trigger}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {item.dryRun ? 'Simulação' : 'Produção'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">{item.totalFound}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#16A34A]">
                            {item.whatsappSent}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#147A80]">
                            {item.cardsCreated}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                            {item.skippedAlreadySent}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono ${
                              item.whatsappFailed > 0 ? 'font-semibold text-[#DC2626]' : 'text-slate-400'
                            }`}
                          >
                            {item.whatsappFailed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: N8N WEBHOOK GUIDE */}
          {!loadingConfig && activeTab === 'n8n' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900">
                  Garantia Diária via n8n (Redundância para Cloud Run / Servidores)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Além do agendador interno do servidor, configure um fluxo de 2 nós no seu n8n para chamar este endpoint todos os dias às{' '}
                  <span className="font-mono font-semibold">{config.scheduledTime}</span> (America/Sao_Paulo). A trava anual no banco garante zero duplicidade se ambos rodarem no mesmo dia.
                </p>
              </div>

              <div className="text-xs py-2.5 px-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <span className="text-slate-600">
                  Variável <code className="font-mono text-slate-900">BIRTHDAY_CRON_SECRET</code> no servidor:
                </span>
                <span
                  className={`font-semibold ${
                    meta.cronSecretConfigured ? 'text-[#16A34A]' : 'text-[#D97706]'
                  }`}
                >
                  {meta.cronSecretConfigured
                    ? 'Configurada e ativa'
                    : 'Pendente (definir em Secrets / .env)'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">1. URL do Nó HTTP Request (POST)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('url', webhookFullUrl)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#147A80] hover:underline cursor-pointer"
                    >
                      {copiedKey === 'url' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'url' ? 'Copiado' : 'Copiar URL'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] break-all">
                    POST {webhookFullUrl}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">2. Cabeçalho de Autenticação (Header)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('header', 'Authorization: Bearer SEU_BIRTHDAY_CRON_SECRET')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#147A80] hover:underline cursor-pointer"
                    >
                      {copiedKey === 'header' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'header' ? 'Copiado' : 'Copiar Header'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px]">
                    Authorization: Bearer SEU_BIRTHDAY_CRON_SECRET
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">3. Corpo JSON (Body)</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('body', n8nPayloadExample)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#147A80] hover:underline cursor-pointer"
                    >
                      {copiedKey === 'body' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'body' ? 'Copiado' : 'Copiar JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                    {n8nPayloadExample}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            disabled={runningMode !== 'none'}
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-40"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleRunDaily(true)}
              className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              <Eye className="w-3.5 h-3.5 text-[#147A80]" />
              <span>{runningMode === 'dry' ? 'Simulando...' : 'Simular Hoje (Dry-Run)'}</span>
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleRunDaily(false)}
              className="h-9 inline-flex items-center gap-1.5 px-4 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              {runningMode === 'live' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>
                {runningMode === 'live' ? 'Disparando...' : 'Executar Disparo de Hoje'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
