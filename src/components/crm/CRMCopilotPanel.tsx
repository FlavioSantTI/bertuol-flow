import React, { useState, useRef } from 'react';
import { CRMLabel, CRMLeadOpportunity, CRMPipeline } from '../../types/crm';
import { Clinic } from '../../types/database';
import {
  CRM_COPILOT_SCENARIOS,
  CRMCopilotMediaInput,
  CRMCopilotScenario,
  CRMCopilotSuggestion,
  MEDIA_CLASSIFICATION_LABELS,
  fileToCopilotMedia,
  requestCRMCopilotSuggestion,
} from '../../services/crmCopilotService';
import { formatYMDToBR, hasReturnedAfterEstimate } from '../../utils/crmSystemFields';
import {
  Sparkles,
  Loader2,
  Paperclip,
  X,
  AlertTriangle,
  MessageSquare,
  Calendar,
  Tag,
  FileText,
  Check,
  Copy,
} from 'lucide-react';

interface CRMCopilotPanelProps {
  mode: 'compact' | 'drawer';
  opportunity: CRMLeadOpportunity;
  clinic?: Clinic;
  pipeline?: CRMPipeline;
  labels?: CRMLabel[];
  /** Chamado em modo compact para preencher diretamente o textarea de WhatsApp */
  onApplyMessage?: (message: string, suggestedFollowUpDays?: number) => void;
  /** Chamado em modo drawer para abrir o WhatsApp com o texto sugerido */
  onOpenWhatsAppWithMessage?: (opp: CRMLeadOpportunity, message: string) => void;
  /** Ações opcionais de 1 clique no drawer */
  onSaveSummaryAsNote?: (text: string) => void;
  onApplySuggestedLabel?: (labelName: string) => void;
  onApplyFollowUpDays?: (days: number) => void;
}

export const CRMCopilotPanel: React.FC<CRMCopilotPanelProps> = ({
  mode,
  opportunity,
  clinic,
  pipeline,
  onApplyMessage,
  onOpenWhatsAppWithMessage,
  onSaveSummaryAsNote,
  onApplySuggestedLabel,
  onApplyFollowUpDays,
}) => {
  const defaultScenario: CRMCopilotScenario =
    opportunity.pipelineId === 'birthdays'
      ? 'birthday_voucher'
      : opportunity.pipelineId === 'budgets'
      ? 'budget_followup'
      : 'auto';

  const [scenario, setScenario] = useState<CRMCopilotScenario>(defaultScenario);
  const [showContextInput, setShowContextInput] = useState(mode === 'drawer');
  const [patientReplyText, setPatientReplyText] = useState('');
  const [media, setMedia] = useState<CRMCopilotMediaInput | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<CRMCopilotSuggestion | null>(null);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [labelApplied, setLabelApplied] = useState(false);
  const [followUpApplied, setFollowUpApplied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const returnedAfterBudget = hasReturnedAfterEstimate(opportunity);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMediaError(null);
    try {
      const prepared = await fileToCopilotMedia(file);
      setMedia(prepared);
      if (scenario === 'auto') {
        setScenario('analyze_media');
      }
    } catch (err: any) {
      setMediaError(err?.message || 'Não foi possível anexar o arquivo.');
    }
  };

  const handleGenerate = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg(null);
    setNoteSaved(false);
    setLabelApplied(false);
    setFollowUpApplied(false);

    const res = await requestCRMCopilotSuggestion({
      opportunity,
      clinic,
      pipeline,
      scenario,
      patientReplyText,
      media,
    });

    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Não foi possível gerar a sugestão agora.');
      return;
    }

    setResult(res);

    // Em modo compact (modal de WhatsApp), já preenche a mensagem diretamente para economizar 1 clique
    if (mode === 'compact' && onApplyMessage && res.suggestedMessage) {
      onApplyMessage(res.suggestedMessage, res.suggestedFollowUpDays);
    }
  };

  const handleCopySuggested = () => {
    if (!result?.suggestedMessage) return;
    navigator.clipboard.writeText(result.suggestedMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 1800);
  };

  const handleSaveNoteClick = () => {
    if (!result || !onSaveSummaryAsNote) return;
    const parts = [
      `[Copiloto IA] ${result.summary}`,
      result.detectedObjection && result.detectedObjection !== 'Sem objeção'
        ? `Objeção/Sinal: ${result.detectedObjection}`
        : '',
      result.transcript ? `Transcrição: "${result.transcript}"` : '',
    ].filter(Boolean);
    onSaveSummaryAsNote(parts.join(' | '));
    setNoteSaved(true);
  };

  const handleApplyLabelClick = () => {
    if (!result?.suggestedLabel || !onApplySuggestedLabel) return;
    onApplySuggestedLabel(result.suggestedLabel);
    setLabelApplied(true);
  };

  const handleApplyFollowUpClick = () => {
    if (!result || !onApplyFollowUpDays) return;
    onApplyFollowUpDays(result.suggestedFollowUpDays);
    setFollowUpApplied(true);
  };

  const formatSizeLabel = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={
        mode === 'compact'
          ? 'bg-slate-50/90 border border-slate-200 rounded-xl p-3 space-y-2.5'
          : 'space-y-4'
      }
    >
      {/* Aviso preventivo automático se paciente já voltou após o orçamento */}
      {returnedAfterBudget && (
        <div className="flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50/70 px-3 py-2 text-[11px] text-teal-900">
          <AlertTriangle className="w-3.5 h-3.5 text-[#147A80] shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong className="font-semibold">Atenção:</strong> paciente já voltou à clínica em{' '}
            <span className="font-mono tabular-nums font-semibold">
              {formatYMDToBR(opportunity.lastVisitDate)}
            </span>{' '}
            (após o orçamento de{' '}
            <span className="font-mono tabular-nums">
              {formatYMDToBR(opportunity.estimateDate)}
            </span>
            ). O Copiloto adapta o texto automaticamente para evitar cobrança indevida.
          </p>
        </div>
      )}

      {/* Controles principais: Cenário + Gerar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value as CRMCopilotScenario)}
          aria-label="Objetivo da sugestão do Copiloto"
          className="flex-1 min-w-[180px] h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#147A80] cursor-pointer"
        >
          {CRM_COPILOT_SCENARIOS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {mode === 'compact' && (
          <button
            type="button"
            onClick={() => setShowContextInput((v) => !v)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-600 inline-flex items-center gap-1 cursor-pointer transition-colors"
            title="Colar resposta ou anexar áudio/print/vídeo do paciente"
          >
            <Paperclip className="w-3 h-3 text-slate-400" />
            <span>{media ? '1 anexo' : 'Áudio / Print'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className="h-8 px-3 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{isLoading ? 'Analisando...' : 'Gerar sugestão'}</span>
        </button>
      </div>

      {/* Área opcional de resposta do paciente + anexo multimodal (em memória) */}
      {showContextInput && (
        <div className="space-y-2">
          <textarea
            rows={mode === 'drawer' ? 3 : 2}
            value={patientReplyText}
            onChange={(e) => setPatientReplyText(e.target.value)}
            placeholder="Opcional: cole aqui o que o paciente respondeu no WhatsApp ou uma observação rápida..."
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#147A80] leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,image/*,video/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:border-[#147A80]/50 hover:text-[#147A80] text-slate-600 text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Anexar áudio, print, foto ou vídeo</span>
              </button>

              {media && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1 max-w-[230px]">
                  <span className="truncate font-medium">{media.fileName}</span>
                  <span className="text-slate-400 tabular-nums shrink-0">
                    ({formatSizeLabel(media.sizeBytes)})
                  </span>
                  <button
                    type="button"
                    onClick={() => setMedia(null)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    aria-label="Remover anexo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <span className="text-[10px] text-slate-400">
              Análise em memória (máx. 15 MB · sem diagnóstico clínico)
            </span>
          </div>

          {mediaError && <p className="text-[11px] text-rose-600 font-medium">{mediaError}</p>}
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      {/* Resultado estruturado do Copiloto */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          {result.urgencyAlert && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span className="leading-snug font-medium">{result.urgencyAlert}</span>
            </div>
          )}

          {/* Resumo + sinais discretos inline */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-800">Leitura do Copiloto</span>
              {result.detectedObjection && result.detectedObjection !== 'Sem objeção' && (
                <>
                  <span>·</span>
                  <span className="text-[#147A80] font-semibold">{result.detectedObjection}</span>
                </>
              )}
              {result.mediaClassification && result.mediaClassification !== 'nenhuma' && (
                <>
                  <span>·</span>
                  <span>{MEDIA_CLASSIFICATION_LABELS[result.mediaClassification]}</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{result.summary}</p>
            {result.internalTip && (
              <p className="text-[11px] text-slate-500 leading-snug">
                <strong className="text-slate-700">Dica:</strong> {result.internalTip}
              </p>
            )}
          </div>

          {result.transcript && (
            <details className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5">
              <summary className="cursor-pointer font-semibold text-slate-700">
                Ver transcrição do áudio
              </summary>
              <p className="mt-1.5 leading-relaxed whitespace-pre-wrap text-slate-700">
                "{result.transcript}"
              </p>
            </details>
          )}

          {/* No modo drawer, exibe a mensagem sugerida + barra limpa de ações em 1 clique */}
          {mode === 'drawer' && (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Mensagem sugerida para WhatsApp
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySuggested}
                    className="text-[11px] font-semibold text-[#147A80] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedMsg ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedMsg ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {result.suggestedMessage}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {onOpenWhatsAppWithMessage && (
                  <button
                    type="button"
                    onClick={() => onOpenWhatsAppWithMessage(opportunity, result.suggestedMessage)}
                    className="h-8 px-3 rounded-lg bg-[#147A80] hover:bg-[#0f5c61] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Abrir no WhatsApp</span>
                  </button>
                )}

                {onSaveSummaryAsNote && (
                  <button
                    type="button"
                    onClick={handleSaveNoteClick}
                    disabled={noteSaved}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors disabled:text-emerald-700 disabled:border-emerald-200"
                  >
                    {noteSaved ? <Check className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    <span>{noteSaved ? 'Salvo nas notas' : 'Salvar resumo'}</span>
                  </button>
                )}

                {onApplySuggestedLabel && result.suggestedLabel && (
                  <button
                    type="button"
                    onClick={handleApplyLabelClick}
                    disabled={labelApplied}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors disabled:text-emerald-700 disabled:border-emerald-200"
                  >
                    {labelApplied ? <Check className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                    <span>
                      {labelApplied
                        ? `Rótulo "${result.suggestedLabel}" aplicado`
                        : `Rótulo: ${result.suggestedLabel}`}
                    </span>
                  </button>
                )}

                {onApplyFollowUpDays && (
                  <button
                    type="button"
                    onClick={handleApplyFollowUpClick}
                    disabled={followUpApplied}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors disabled:text-emerald-700 disabled:border-emerald-200 tabular-nums"
                  >
                    {followUpApplied ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Calendar className="w-3 h-3" />
                    )}
                    <span>
                      {followUpApplied
                        ? 'Follow-up agendado'
                        : result.suggestedFollowUpDays === 0
                        ? 'Follow-up: Hoje'
                        : `Follow-up: +${result.suggestedFollowUpDays}d`}
                    </span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* No modo compact, mostra feedback discreto de que o texto já foi preenchido abaixo */}
          {mode === 'compact' && (
            <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] text-slate-500">
              <span className="text-[#147A80] font-medium">
                Texto aplicado abaixo — revise antes de enviar.
              </span>
              {onApplyMessage && (
                <button
                  type="button"
                  onClick={() =>
                    onApplyMessage(result.suggestedMessage, result.suggestedFollowUpDays)
                  }
                  className="text-[11px] font-semibold text-slate-600 hover:text-[#147A80] cursor-pointer"
                >
                  Reaplicar
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
